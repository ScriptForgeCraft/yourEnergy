const YEREVAN_OVERVIEW = Object.freeze([40.1792, 44.4991]);
const EARTH_RADIUS_METERS = 6_371_008.8;

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
  maxZoom: 21
};

/**
 * Geographic Leaflet map used after explicit user intent. It never performs
 * geocoding itself and keeps the location/roof selection in browser memory.
 */
export const createPropertyMap = async ({
  container,
  tileUrl = '',
  tileAttribution = '',
  roofPointLabel = (index) => `Roof point ${index + 1}`,
  onLocationChange = () => {},
  onRoofChange = () => {}
} = {}) => {
  if (!container) return null;

  const L = await importLeaflet();
  const map = L.map(container, mapOptions).setView(YEREVAN_OVERVIEW, 11);
  let locationMarker = null;
  let roofPolygon = null;
  let roofMarkers = [];
  let roofPoints = [];
  let selectedPointIndex = -1;
  let mode = 'location';

  if (tileUrl) {
    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 21,
      crossOrigin: true
    }).addTo(map);
  }

  const emitRoof = () => {
    const points = roofPoints.map(normalizePoint);
    onRoofChange({
      points,
      areaSqm: calculatePreliminaryPolygonArea(points),
      selectedPointIndex,
      complete: points.length >= 3
    });
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
        draggable: true,
        keyboard: true,
        title: roofPointLabel(index)
      }).addTo(map);
      marker.on('click', () => {
        selectedPointIndex = index;
        emitRoof();
      });
      marker.on('dragend', () => {
        roofPoints[index] = normalizePoint(marker.getLatLng());
        selectedPointIndex = index;
        drawRoof();
        emitRoof();
      });
      return marker;
    });
  };

  const addRoofPoint = (point) => {
    if (!isFinitePoint(point)) return false;
    roofPoints.push(normalizePoint(point));
    selectedPointIndex = roofPoints.length - 1;
    drawRoof();
    emitRoof();
    return true;
  };

  const setLocation = (candidate, { fit = true, notify = true } = {}) => {
    if (!isFinitePoint(candidate)) return false;
    const location = normalizePoint(candidate);
    locationMarker?.remove();
    locationMarker = L.marker(location, { keyboard: true }).addTo(map);
    if (fit) map.setView(location, Math.max(map.getZoom(), 18), { animate: false });
    if (notify) onLocationChange(location);
    return true;
  };

  const setRoofPoints = (points, { fit = false } = {}) => {
    roofPoints = points.filter(isFinitePoint).map(normalizePoint);
    selectedPointIndex = roofPoints.length ? roofPoints.length - 1 : -1;
    drawRoof();
    if (fit && roofPoints.length >= 2)
      map.fitBounds(L.latLngBounds(roofPoints), { padding: [28, 28] });
    emitRoof();
  };

  map.on('click', (event) => {
    if (mode === 'roof') {
      addRoofPoint(event.latlng);
      return;
    }
    setLocation(event.latlng);
  });

  return {
    map,
    hasTiles: Boolean(tileUrl),
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
        selectedPointIndex,
        complete: roofPoints.length >= 3
      };
    },
    selectPoint(index) {
      if (!Number.isInteger(index) || !roofPoints[index]) return false;
      selectedPointIndex = index;
      roofMarkers[index]?.openPopup?.();
      emitRoof();
      return true;
    },
    nudgeSelected({ north = 0, east = 0 } = {}) {
      if (!roofPoints[selectedPointIndex]) return false;
      const latitude = roofPoints[selectedPointIndex].lat;
      const latitudeDelta = Number(north) / 111_320;
      const longitudeDelta = Number(east) / (111_320 * Math.cos((latitude * Math.PI) / 180));
      roofPoints[selectedPointIndex] = {
        lat: latitude + latitudeDelta,
        lng: roofPoints[selectedPointIndex].lng + longitudeDelta
      };
      drawRoof();
      emitRoof();
      return true;
    },
    undo() {
      if (!roofPoints.length) return false;
      roofPoints.pop();
      selectedPointIndex = roofPoints.length - 1;
      drawRoof();
      emitRoof();
      return true;
    },
    removeSelected() {
      if (!roofPoints[selectedPointIndex]) return false;
      roofPoints.splice(selectedPointIndex, 1);
      selectedPointIndex = Math.min(selectedPointIndex, roofPoints.length - 1);
      drawRoof();
      emitRoof();
      return true;
    },
    resetRoof() {
      setRoofPoints([]);
    },
    resize() {
      map.invalidateSize();
    },
    destroy() {
      map.remove();
    }
  };
};
