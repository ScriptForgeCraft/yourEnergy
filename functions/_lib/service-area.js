import { ApiError } from './http.js';

// A deliberately simplified, vendored service polygon for the Republic of
// Armenia. It is a service boundary (not a cadastral or legal-border data
// source), used only to prevent the Armenia-specific price/tariff flow from
// being applied to clearly foreign coordinates. Border cases should be routed
// to an engineer instead of being interpreted as a location decision.
const ARMENIA_SERVICE_POLYGON = Object.freeze([
  [40.62, 43.45],
  [40.94, 43.56],
  [41.2, 43.85],
  [41.45, 44.38],
  [41.55, 44.74],
  [41.34, 45.04],
  [41.21, 45.65],
  [40.97, 46.61],
  [40.73, 46.76],
  [40.4, 46.5],
  [40.14, 46.62],
  [39.83, 46.28],
  [39.61, 46.37],
  [39.4, 46.09],
  [39.28, 45.47],
  [39.46, 45.04],
  [39.31, 44.67],
  [39.45, 44.16],
  [39.7, 43.8],
  [40.08, 43.46]
]);

const finiteCoordinate = (value, minimum, maximum) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
};

const pointInPolygon = (latitude, longitude, polygon) => {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [currentLatitude, currentLongitude] = polygon[index];
    const [previousLatitude, previousLongitude] = polygon[previous];
    const crossesLatitude =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude;
    if (crossesLatitude) inside = !inside;
  }
  return inside;
};

export const isWithinArmeniaServiceArea = ({ latitude, longitude } = {}) => {
  const lat = finiteCoordinate(latitude, -90, 90);
  const lng = finiteCoordinate(longitude, -180, 180);
  if (lat === null || lng === null) return false;
  return pointInPolygon(lat, lng, ARMENIA_SERVICE_POLYGON);
};

export const assertArmeniaServiceArea = (coordinates) => {
  if (!isWithinArmeniaServiceArea(coordinates)) {
    throw new ApiError('OUTSIDE_SERVICE_AREA');
  }
};

export { ARMENIA_SERVICE_POLYGON };
