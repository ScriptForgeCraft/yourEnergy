const YEREVAN_OVERVIEW = Object.freeze([40.1792, 44.4991]);
const EARTH_RADIUS_METERS = 6_371_008.8;
// Standard OSM raster tiles are reliably available through zoom 19. This is
// the most detailed practical starting view without requesting unavailable
// tiles or pretending that OSM is an aerial roof survey.
const ROOF_EDIT_ZOOM = 19;

const clampLatitude = (latitude) => Math.max(-85, Math.min(85, Number(latitude)));

const normalizePoint = (point) => ({
  lat: clampLatitude(point.lat),
  lng: Number(point.lng)
});

const isFinitePoint = (point) =>
  Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng));

/**
 * A lightweight local projection suitable for a clearly marked preliminary
 * roof area. It is deliberately not presented as an engineering survey.
 */
export const calculatePreliminaryPolygonArea = (rawPoints) => {
  const points = rawPoints.filter(isFinitePoint).map(normalizePoint);
  if (points.length < 3) return 0;

  const averageLatitude = points.reduce((total, point) => total + point.lat, 0) / points.length;
  const latitudeScale = (Math.PI / 180) * EARTH_RADIUS_METERS;
  const longitudeScale = latitudeScale * Math.cos((averageLatitude * Math.PI) / 180);
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const currentX = current.lng * longitudeScale;
    const currentY = current.lat * latitudeScale;
    const nextX = next.lng * longitudeScale;
    const nextY = next.lat * latitudeScale;
    area += currentX * nextY - nextX * currentY;
  }

  return Math.abs(area / 2);
};

const importLeaflet = () =>
  Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(
    ([{ default: L }]) => L
  );

const mapOptions = {
  attributionControl: true,
  zoomControl: true,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  keyboard: true,
  minZoom: 3,
  maxZoom: ROOF_EDIT_ZOOM
};

/**
 * Geographic Leaflet map used after explicit user intent. It never performs
 * geocoding itself and keeps the location/roof selection in browser memory.
 */
export const createPropertyMap = async ({
  container,
  tileUrl = '',
  tileAttribution = '',
  locationPointLabel = 'Selected property point',
  roofPointLabel = (index) => `Roof point ${index + 1}`,
  onLocationChange = () => {},
  onRoofChange = () => {}
} = {}) => {
  if (!container) return null;

  const L = await importLeaflet();
  const map = L.map(container, mapOptions).setView(YEREVAN_OVERVIEW, 11);
  let currentContainer = container;
  let locationMarker = null;
  let roofPolygon = null;
  let roofMarkers = [];
  let roofPoints = [];
  let roofFinished = false;
  let mode = 'location';
  let resizeFrame = null;
  let resizeObserver = null;
  let destroyed = false;

  // Leaflet's default icon points at marker-icon-2x.png relative to the
  // current document. Vite does not emit that URL, so use tiny local HTML/CSS
  // markers instead of a fragile image asset.
  const locationIcon = L.divIcon({
    className: 'property-map__marker property-map__marker--location',
    html: '<span aria-hidden="true"></span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
  const roofPointIcon = (index) =>
    L.divIcon({
      className: 'property-map__marker property-map__marker--roof',
      html: `<span aria-hidden="true">${index + 1}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

  const invalidateSizeAfterLayout = () => {
    if (destroyed) return;
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    // The map is revealed by changing both `hidden` and its parent's visual
    // layer. Two frames let CSS calculate the final desktop width before
    // Leaflet reads it; ResizeObserver covers later grid/layout changes.
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        if (!destroyed) map.invalidateSize({ pan: false, debounceMoveend: true });
      });
    });
  };

  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.contentRect.width > 0 && entry.contentRect.height > 0)) {
        invalidateSizeAfterLayout();
      }
    });
    resizeObserver.observe(currentContainer);
  }
  map.whenReady(invalidateSizeAfterLayout);

  if (tileUrl) {
    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: ROOF_EDIT_ZOOM,
      crossOrigin: true
    }).addTo(map);
  }

  const emitRoof = () => {
    const points = roofPoints.map(normalizePoint);
    onRoofChange({
      points,
      areaSqm: calculatePreliminaryPolygonArea(points),
      complete: roofFinished && points.length >= 3
    });
  };

  const removeRoofPoint = (index) => {
    if (!Number.isInteger(index) || !roofPoints[index]) return false;
    // Removing or moving a point makes a previously finished outline editable
    // again. The visitor must explicitly finish the corrected outline.
    roofFinished = false;
    roofPoints.splice(index, 1);
    drawRoof();
    emitRoof();
    return true;
  };

  const drawRoof = () => {
    roofPolygon?.remove();
    roofMarkers.forEach((marker) => marker.remove());
    roofMarkers = [];

    if (roofPoints.length >= 2) {
      roofPolygon = L.polygon(roofPoints, {
        color: '#f5bd18',
        weight: 3,
        fillColor: '#f5bd18',
        fillOpacity: 0.12
      }).addTo(map);
    } else {
      roofPolygon = null;
    }

    roofMarkers = roofPoints.map((point, index) => {
      const marker = L.marker(point, {
        icon: roofPointIcon(index),
        draggable: true,
        keyboard: true,
        title: roofPointLabel(index),
        alt: roofPointLabel(index)
      }).addTo(map);
      marker.on('click', (event) => {
        // A marker represents one existing vertex. Clicking it removes that
        // vertex instead of creating a duplicate point underneath it.
        L.DomEvent.stop(event);
        removeRoofPoint(index);
      });
      marker.on('dragstart', () => {
        // Moving a vertex reopens the outline: it must be finished again
        // before the browser can send the polygon as a completed roof input.
        roofFinished = false;
      });
      marker.on('dragend', () => {
        roofPoints[index] = normalizePoint(marker.getLatLng());
        drawRoof();
        emitRoof();
      });
      return marker;
    });
  };

  const addRoofPoint = (point) => {
    if (!isFinitePoint(point)) return false;
    roofFinished = false;
    roofPoints.push(normalizePoint(point));
    drawRoof();
    emitRoof();
    return true;
  };

  const setLocation = (candidate, { fit = true, notify = true } = {}) => {
    if (!isFinitePoint(candidate)) return false;
    const location = normalizePoint(candidate);
    locationMarker?.remove();
    locationMarker = L.marker(location, {
      icon: locationIcon,
      keyboard: true,
      title: locationPointLabel,
      alt: locationPointLabel
    }).addTo(map);
    if (fit) map.setView(location, ROOF_EDIT_ZOOM, { animate: false });
    if (notify) onLocationChange(location);
    return true;
  };

  const setRoofPoints = (points, { fit = false } = {}) => {
    roofPoints = points.filter(isFinitePoint).map(normalizePoint);
    roofFinished = false;
    drawRoof();
    if (fit && roofPoints.length >= 2)
      map.fitBounds(L.latLngBounds(roofPoints), { padding: [28, 28] });
    emitRoof();
  };

  map.on('click', (event) => {
    if (mode === 'roof') {
      if (roofFinished) return;
      addRoofPoint(event.latlng);
      return;
    }
    setLocation(event.latlng);
  });

  return {
    map,
    hasTiles: Boolean(tileUrl),
    /**
     * The wizard has a location map and a roof map in different steps. Moving
     * the same Leaflet element keeps the selected point and lazy-loaded tiles
     * intact while making the active map an ordinary in-flow element.
     */
    mount(nextContainer) {
      if (!nextContainer || nextContainer === currentContainer) {
        invalidateSizeAfterLayout();
        return false;
      }
      resizeObserver?.unobserve(currentContainer);
      nextContainer.append(container);
      currentContainer = nextContainer;
      resizeObserver?.observe(currentContainer);
      invalidateSizeAfterLayout();
      return true;
    },
    setLocation,
    setMode(nextMode) {
      mode = nextMode === 'roof' ? 'roof' : 'location';
      container.dataset.mode = mode;
    },
    setRoofPoints,
    setLocationAtCenter() {
      if (mode !== 'location') return false;
      // Leaflet's canvas is not a practical way to choose a point with a
      // keyboard alone. The visible map centre is an equivalent, clearly
      // manual choice; the surrounding UI still requires confirmation.
      return setLocation(map.getCenter());
    },
    addPointAtCenter() {
      if (mode !== 'roof') return false;
      // Keyboard users need a meaningful starting polygon too. Repeating the
      // exact centre would create a zero-area polygon, so seed consecutive
      // points around it (roughly three metres apart). The outline remains a
      // preliminary estimate and can be refined with the nudge controls.
      const centre = map.getCenter();
      const offsets = [
        { north: 3, east: -3 },
        { north: -3, east: -3 },
        { north: -3, east: 3 },
        { north: 3, east: 3 }
      ];
      const offset = offsets[roofPoints.length % offsets.length];
      const latitudeDelta = offset.north / 111_320;
      const longitudeDelta = offset.east / (111_320 * Math.cos((centre.lat * Math.PI) / 180));
      return addRoofPoint({
        lat: centre.lat + latitudeDelta,
        lng: centre.lng + longitudeDelta
      });
    },
    getRoof() {
      return {
        points: roofPoints.map(normalizePoint),
        areaSqm: calculatePreliminaryPolygonArea(roofPoints),
        complete: roofFinished && roofPoints.length >= 3
      };
    },
    undo() {
      if (!roofPoints.length) return false;
      roofFinished = false;
      roofPoints.pop();
      drawRoof();
      emitRoof();
      return true;
    },
    resetRoof() {
      setRoofPoints([]);
    },
    finishRoof() {
      if (roofPoints.length < 3) return false;
      roofFinished = true;
      emitRoof();
      return true;
    },
    resize() {
      invalidateSizeAfterLayout();
    },
    destroy() {
      destroyed = true;
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      map.remove();
    }
  };
};
