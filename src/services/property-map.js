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

const GEOMETRY_EPSILON = 1e-12;

const crossProduct = (start, end, point) =>
  (end.lng - start.lng) * (point.lat - start.lat) - (end.lat - start.lat) * (point.lng - start.lng);

const pointOnSegment = (start, end, point) =>
  Math.abs(crossProduct(start, end, point)) <= GEOMETRY_EPSILON &&
  point.lat >= Math.min(start.lat, end.lat) - GEOMETRY_EPSILON &&
  point.lat <= Math.max(start.lat, end.lat) + GEOMETRY_EPSILON &&
  point.lng >= Math.min(start.lng, end.lng) - GEOMETRY_EPSILON &&
  point.lng <= Math.max(start.lng, end.lng) + GEOMETRY_EPSILON;

const segmentsIntersect = (firstStart, firstEnd, secondStart, secondEnd) => {
  const firstA = crossProduct(firstStart, firstEnd, secondStart);
  const firstB = crossProduct(firstStart, firstEnd, secondEnd);
  const secondA = crossProduct(secondStart, secondEnd, firstStart);
  const secondB = crossProduct(secondStart, secondEnd, firstEnd);
  const properIntersection =
    ((firstA > GEOMETRY_EPSILON && firstB < -GEOMETRY_EPSILON) ||
      (firstA < -GEOMETRY_EPSILON && firstB > GEOMETRY_EPSILON)) &&
    ((secondA > GEOMETRY_EPSILON && secondB < -GEOMETRY_EPSILON) ||
      (secondA < -GEOMETRY_EPSILON && secondB > GEOMETRY_EPSILON));
  return (
    properIntersection ||
    pointOnSegment(firstStart, firstEnd, secondStart) ||
    pointOnSegment(firstStart, firstEnd, secondEnd) ||
    pointOnSegment(secondStart, secondEnd, firstStart) ||
    pointOnSegment(secondStart, secondEnd, firstEnd)
  );
};

/**
 * Rejects self-crossing, degenerate and repeated-point roof outlines before
 * they can be treated as a physical area. Adjacent edges share a vertex by
 * definition, so only non-adjacent intersections are invalid.
 */
export const isSimplePolygon = (rawPoints) => {
  const points = Array.isArray(rawPoints)
    ? rawPoints.filter(isFinitePoint).map(normalizePoint)
    : [];
  if (points.length < 3 || points.length !== rawPoints.length) return false;

  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (
      Math.abs(current.lat - next.lat) <= GEOMETRY_EPSILON &&
      Math.abs(current.lng - next.lng) <= GEOMETRY_EPSILON
    )
      return false;
    twiceArea += current.lng * next.lat - next.lng * current.lat;
  }
  if (Math.abs(twiceArea) <= GEOMETRY_EPSILON) return false;

  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length;
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length;
      const adjacent = first === second || firstNext === second || secondNext === first;
      if (adjacent) continue;
      if (segmentsIntersect(points[first], points[firstNext], points[second], points[secondNext]))
        return false;
    }
  }
  return true;
};

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

export const getRoofOutlineState = (rawPoints) => {
  const points = Array.isArray(rawPoints)
    ? rawPoints.filter(isFinitePoint).map(normalizePoint)
    : [];
  const simplePolygon = isSimplePolygon(points);

  return {
    points,
    areaSqm: calculatePreliminaryPolygonArea(points),
    simplePolygon,
    // Leaflet already renders the closing segment. For the calculator, a
    // non-self-crossing outline with at least three vertices is complete; a
    // separate double-click flag must not invalidate the same geometry.
    complete: simplePolygon
  };
};

// A genuine double-click fires two click events at effectively the same map
// point. MouseEvent.detail can also be greater than one while a visitor is
// quickly clicking different roof corners, so detail alone must not discard
// those vertices.
export const isRepeatedRoofFinishClick = ({ detail, distanceMeters } = {}) =>
  Number(detail) > 1 && Number.isFinite(Number(distanceMeters)) && Number(distanceMeters) < 0.75;

export const shouldFinishRoofOnDoubleClick = ({ pointCount, repeatedClick } = {}) =>
  Number(pointCount) >= 3 && repeatedClick === true;

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
  let roofFinishClickCandidate = false;
  let roofLineWeight = 3;
  let roofPointRadius = 10;
  let roofPointNumbersVisible = true;
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
  const roofPointIcon = (index) => {
    const diameter = roofPointRadius * 2;
    const pointNumber = roofPointNumbersVisible ? index + 1 : '';
    return L.divIcon({
      className: 'property-map__marker property-map__marker--roof',
      html: `<span aria-hidden="true" style="--roof-point-diameter: ${diameter}px">${pointNumber}</span>`,
      iconSize: [diameter, diameter],
      iconAnchor: [roofPointRadius, roofPointRadius]
    });
  };

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
    onRoofChange(getRoofOutlineState(roofPoints));
  };

  const removeRoofPoint = (index) => {
    if (!Number.isInteger(index) || !roofPoints[index]) return false;
    // Removing or moving a point makes a previously finished outline editable
    // again. Its geometry determines whether it remains a valid outline.
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
        weight: roofLineWeight,
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
        // Moving a vertex reopens the outline while it is being edited.
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

  const setRoofPoints = (points, { fit = false, complete = false, notify = true } = {}) => {
    roofPoints = points.filter(isFinitePoint).map(normalizePoint);
    roofFinished = Boolean(complete) && isSimplePolygon(roofPoints);
    drawRoof();
    if (fit && roofPoints.length >= 2)
      map.fitBounds(L.latLngBounds(roofPoints), { padding: [28, 28] });
    if (notify) emitRoof();
  };

  map.on('click', (event) => {
    if (mode === 'roof') {
      // A restored or double-click-finished outline is still editable. A map
      // click expresses clear intent to add another corner, so reopen it
      // instead of silently ignoring the visitor until a marker is removed.
      if (roofFinished) roofFinished = false;
      const lastPoint = roofPoints.at(-1);
      const distanceFromLastPoint = lastPoint ? map.distance(lastPoint, event.latlng) : null;
      // Ignore only the repeated click at the same vertex used to finish an
      // outline. Fast clicks on different corners are all real roof points.
      roofFinishClickCandidate = isRepeatedRoofFinishClick({
        detail: event.originalEvent?.detail,
        distanceMeters: distanceFromLastPoint
      });
      if (roofFinishClickCandidate) return;
      addRoofPoint(event.latlng);
      return;
    }
    setLocation(event.latlng);
  });

  map.on('dblclick', (event) => {
    if (mode !== 'roof' || roofFinished || roofPoints.length < 3) return;
    // Browsers can emit dblclick when two rapid clicks land on different map
    // coordinates because the DOM target is still the same Leaflet canvas.
    // Remember whether its second click repeated the last vertex; measuring
    // here would always see zero because a distinct second point is already
    // part of the outline by the time this event fires.
    if (
      !shouldFinishRoofOnDoubleClick({
        pointCount: roofPoints.length,
        repeatedClick: roofFinishClickCandidate
      })
    ) {
      roofFinishClickCandidate = false;
      return;
    }
    roofFinishClickCandidate = false;
    event.originalEvent?.preventDefault();
    event.originalEvent?.stopPropagation();
    roofFinished = isSimplePolygon(roofPoints);
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
    setRoofLineWeight(value) {
      const next = Math.max(1, Math.min(8, Math.round(Number(value) || 3)));
      if (next === roofLineWeight) return false;
      roofLineWeight = next;
      drawRoof();
      return true;
    },
    setRoofPointRadius(value) {
      const next = Math.max(6, Math.min(18, Math.round(Number(value) || 10)));
      if (next === roofPointRadius) return false;
      roofPointRadius = next;
      drawRoof();
      return true;
    },
    setRoofPointNumbers(visible) {
      const next = Boolean(visible);
      if (next === roofPointNumbersVisible) return false;
      roofPointNumbersVisible = next;
      drawRoof();
      return true;
    },
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
      return getRoofOutlineState(roofPoints);
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
      roofFinished = isSimplePolygon(roofPoints);
      emitRoof();
      return roofFinished;
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
