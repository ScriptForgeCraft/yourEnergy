const YEREVAN_OVERVIEW = Object.freeze([40.1792, 44.4991]);
const EARTH_RADIUS_METERS = 6_371_008.8;
// Begin with a useful roof overview. Higher levels are fetched progressively;
// an unavailable level leaves the last successful imagery in place.
const ROOF_INITIAL_ZOOM = 18;
const ROOF_EDIT_ZOOM = 23;
const REFINEMENT_IDLE_DELAY = 320;
const REFINEMENT_RETRY_DELAY = 90_000;
const MIN_ARCGIS_REFINEMENT_BYTES = 4_096;

const isArcGisWorldImagery = (tileUrl) =>
  /arcgisonline\.com\/arcgis\/rest\/services\/world_imagery/i.test(tileUrl);

const refinementAreaKey = (center) =>
  `${Math.round(Number(center.lat) * 500) / 500}:${Math.round(Number(center.lng) * 500) / 500}`;

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
  scrollWheelZoom: true,
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
  imageryTileUrl = '',
  imageryTileAttribution = '',
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
  let centerFrame = null;
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
      iconSize: [24, 24],
      iconAnchor: [12, 12]
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

  const centerAfterLayout = (candidate) => {
    if (!isFinitePoint(candidate) || destroyed) return false;
    const location = normalizePoint(candidate);
    if (centerFrame) cancelAnimationFrame(centerFrame);
    // The roof step has a different-sized map host. Recenter only after that
    // host has its final dimensions, otherwise Leaflet retains the old view's
    // pixel offset and can leave the selected property off-screen.
    centerFrame = requestAnimationFrame(() => {
      centerFrame = requestAnimationFrame(() => {
        centerFrame = null;
        if (destroyed) return;
        map.invalidateSize({ pan: false, debounceMoveend: true });
        map.setView(location, map.getZoom(), { animate: false });
      });
    });
    return true;
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

  const createTileLayer = (source, nativeZoom, { opacity = 1 } = {}) =>
    L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: ROOF_EDIT_ZOOM,
      maxNativeZoom: nativeZoom,
      crossOrigin: true,
      opacity,
      updateWhenIdle: true,
      updateWhenZooming: false,
      updateInterval: REFINEMENT_IDLE_DELAY,
      keepBuffer: 2
    });

  const createRefinementTileLayer = (source, targetZoom) => {
    const layer = createTileLayer(source, targetZoom, { opacity: 0 });
    if (!source.validateTilePayload || typeof fetch !== 'function') return layer;

    // The World Imagery service can return a small JPEG that says “Map data
    // not yet available” with HTTP 200. Validate the payload before allowing
    // that tile to replace the last successful image.
    layer.createTile = (coords, done) => {
      const tile = document.createElement('img');
      const controller = new AbortController();
      let objectUrl = '';
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        // A later zoom can remove this hidden candidate while its request is
        // still in flight. Its eventual response is no longer relevant.
        if (!layer._map) return;
        done(error, tile);
      };

      tile.alt = '';
      tile.crossOrigin = 'anonymous';
      tile._abortRefinementRequest = () => controller.abort();
      tile.onload = () => finish(null);
      tile.onerror = () => finish(new Error('Unable to load map tile'));

      fetch(layer.getTileUrl(coords), { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`Map tile request failed: ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          if (!blob.type.startsWith('image/') || blob.size < MIN_ARCGIS_REFINEMENT_BYTES)
            throw new Error('Map tile has no usable imagery');
          objectUrl = URL.createObjectURL(blob);
          tile.src = objectUrl;
        })
        .catch((error) => finish(error));

      return tile;
    };
    return layer;
  };

  const createTileSource = (url, attribution) => {
    const source = {
      url,
      attribution,
      nativeZoom: ROOF_INITIAL_ZOOM,
      layer: null,
      candidate: null,
      timer: null,
      failedRefinements: new Map(),
      validateTilePayload: isArcGisWorldImagery(url)
    };
    source.layer = createTileLayer(source, source.nativeZoom);
    return source;
  };

  const tileSources = {};
  if (tileUrl) tileSources.map = createTileSource(tileUrl, tileAttribution);
  if (imageryTileUrl)
    tileSources.satellite = createTileSource(imageryTileUrl, imageryTileAttribution);

  let activeTileSource = null;

  const removeCandidate = (source) => {
    if (source.timer !== null) clearTimeout(source.timer);
    source.timer = null;
    if (!source.candidate) return;
    Object.values(source.candidate._tiles).forEach(({ el }) => el._abortRefinementRequest?.());
    map.removeLayer(source.candidate);
    source.candidate = null;
  };

  const startRefinement = (source, targetZoom, areaKey) => {
    if (destroyed || source !== activeTileSource || targetZoom <= source.nativeZoom) return;

    const candidate = createRefinementTileLayer(source, targetZoom);
    let failed = false;
    source.candidate = candidate;
    candidate.on('tileerror', () => {
      failed = true;
    });
    candidate.once('load', () => {
      // Leaflet emits `load` from inside its own tile-completion handler.
      // Defer changing layers until that handler has released its map object.
      setTimeout(() => {
        if (source.candidate !== candidate || source !== activeTileSource) return;
        source.candidate = null;
        if (failed) {
          source.failedRefinements.set(areaKey, { targetZoom, at: Date.now() });
          map.removeLayer(candidate);
          return;
        }

        const previousLayer = source.layer;
        source.layer = candidate;
        source.nativeZoom = targetZoom;
        candidate.setOpacity(1);
        map.removeLayer(previousLayer);
      }, 0);
    });
    candidate.addTo(map);
  };

  const scheduleRefinement = () => {
    const source = activeTileSource;
    if (!source || destroyed) return;
    const targetZoom = Math.round(map.getZoom());
    if (targetZoom <= source.nativeZoom) return;

    const areaKey = refinementAreaKey(map.getCenter());
    const failedAt = source.failedRefinements.get(areaKey);
    if (
      failedAt &&
      targetZoom >= failedAt.targetZoom &&
      Date.now() - failedAt.at < REFINEMENT_RETRY_DELAY
    )
      return;

    removeCandidate(source);
    source.timer = setTimeout(() => {
      source.timer = null;
      startRefinement(source, targetZoom, areaKey);
    }, REFINEMENT_IDLE_DELAY);
  };

  const setLayer = (nextLayer) => {
    const next = tileSources[nextLayer] ?? tileSources.map ?? tileSources.satellite;
    if (!next) return false;
    if (activeTileSource === next) return true;
    if (activeTileSource) {
      removeCandidate(activeTileSource);
      map.removeLayer(activeTileSource.layer);
    }
    activeTileSource = next;
    if (!map.hasLayer(next.layer)) next.layer.addTo(map);
    scheduleRefinement();
    return true;
  };

  map.on('movestart', () => {
    if (activeTileSource) removeCandidate(activeTileSource);
  });
  map.on('moveend zoomend', scheduleRefinement);
  setLayer('satellite');

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
    if (fit) map.setView(location, ROOF_INITIAL_ZOOM, { animate: false });
    if (notify) onLocationChange(location);
    return true;
  };

  const focusLocation = (candidate, { zoom = 11 } = {}) => {
    if (!isFinitePoint(candidate)) return false;
    map.setView(normalizePoint(candidate), zoom, { animate: false });
    return true;
  };

  const clearLocation = () => {
    locationMarker?.remove();
    locationMarker = null;
  };

  const setRoofPoints = (points, { fit = false, complete = false } = {}) => {
    roofPoints = points.filter(isFinitePoint).map(normalizePoint);
    roofFinished = Boolean(complete) && roofPoints.length >= 3;
    drawRoof();
    if (fit && roofPoints.length >= 2)
      map.fitBounds(L.latLngBounds(roofPoints), { padding: [28, 28] });
    emitRoof();
  };

  map.on('click', (event) => {
    if (mode === 'roof') {
      if (roofFinished) return;
      // Leaflet emits a click for each half of a double-click. The second
      // click is the user's finish gesture, not another roof vertex.
      if (event.originalEvent?.detail > 1) return;
      addRoofPoint(event.latlng);
      return;
    }
    setLocation(event.latlng);
  });

  map.on('dblclick', (event) => {
    if (mode !== 'roof' || roofFinished || roofPoints.length < 3) return;
    event.originalEvent?.preventDefault();
    event.originalEvent?.stopPropagation();
    roofFinished = true;
    emitRoof();
  });

  return {
    map,
    hasTiles: Boolean(tileUrl || imageryTileUrl),
    setLayer,
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
    focusLocation,
    centerAfterLayout,
    clearLocation,
    setMode(nextMode) {
      mode = nextMode === 'roof' ? 'roof' : 'location';
      container.dataset.mode = mode;
      if (mode === 'roof') map.doubleClickZoom.disable();
      else map.doubleClickZoom.enable();
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
      const pointForOffset = (offset) => ({
        lat: centre.lat + offset.north / 111_320,
        lng: centre.lng + offset.east / (111_320 * Math.cos((centre.lat * Math.PI) / 180))
      });
      const candidate = offsets
        .map(pointForOffset)
        .find(
          (point) =>
            !roofPoints.some(
              (existing) =>
                Math.abs(existing.lat - point.lat) < 0.00000001 &&
                Math.abs(existing.lng - point.lng) < 0.00000001
            )
        );

      if (candidate) return addRoofPoint(candidate);

      // Once all four keyboard starter points exist, grow a new square around
      // them instead of cycling back to an existing vertex after undo/delete.
      const ring = Math.floor(roofPoints.length / offsets.length) + 1;
      return addRoofPoint(pointForOffset({ north: 3 * ring, east: 3 * ring }));
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
      if (centerFrame) cancelAnimationFrame(centerFrame);
      resizeObserver?.disconnect();
      Object.values(tileSources).forEach(removeCandidate);
      map.remove();
    }
  };
};
