const GOOGLE_MAPS_SCRIPT_ID = 'yourenergy-google-maps';
const DEFAULT_CENTER = Object.freeze({ lat: 40.1872, lng: 44.5152 });
const GOOGLE_MAPS_API_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

let googleMapsPromise = null;

const browserLanguage = (locale) => String(locale || 'en').split('-')[0].toLowerCase();

const loadGoogleMaps = ({ apiKey, locale }) => {
  if (window.google?.maps?.Map && window.google?.maps?.Geocoder) {
    return Promise.resolve(window.google.maps);
  }
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__yourEnergyGoogleMapsReady';
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    const finish = () => {
      delete window[callbackName];
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps API did not initialize.'));
      }
    };

    window[callbackName] = finish;

    if (existing) {
      existing.addEventListener('error', () => reject(new Error('Google Maps API failed to load.')), {
        once: true
      });
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      loading: 'async',
      callback: callbackName,
      libraries: 'geocoding',
      language: browserLanguage(locale),
      region: 'AM',
      v: 'weekly'
    });
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.addEventListener(
      'error',
      () => reject(new Error('Google Maps API failed to load.')),
      { once: true }
    );
    document.head.append(script);
  });

  return googleMapsPromise;
};

const geocodeOffice = async (geocoder, office) => {
  const query = /armenia/i.test(office.mapQuery)
    ? office.mapQuery
    : `${office.mapQuery}, Armenia`;
  const response = await geocoder.geocode({ address: query, region: 'AM' });
  const result = response.results?.[0];
  return result?.geometry?.location ?? null;
};

const renderOfficeMap = async ({ root, canvas, config }) => {
  const apiKey = GOOGLE_MAPS_API_KEY;
  const offices = Array.isArray(config.offices) ? config.offices : [];

  if (!apiKey || !offices.length) {
    root.dataset.mapStatus = 'unavailable';
    return;
  }

  root.dataset.mapStatus = 'loading';

  try {
    const maps = await loadGoogleMaps({ apiKey, locale: config.locale });
    const map = new maps.Map(canvas, {
      center: DEFAULT_CENTER,
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative'
    });
    const geocoder = new maps.Geocoder();
    const bounds = new maps.LatLngBounds();
    let markerCount = 0;

    const locations = await Promise.all(
      offices.map(async (office) => {
        try {
          const position = await geocodeOffice(geocoder, office);
          return position ? { office, position } : null;
        } catch {
          return null;
        }
      })
    );

    locations.filter(Boolean).forEach(({ office, position }) => {
      new maps.Marker({
        map,
        position,
        title: office.title
      });
      bounds.extend(position);
      markerCount += 1;
    });

    if (markerCount > 1) {
      map.fitBounds(bounds, 70);
    } else if (markerCount === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(15);
    }

    root.dataset.mapStatus = markerCount ? 'ready' : 'unavailable';
  } catch (error) {
    root.dataset.mapStatus = 'unavailable';
    console.error('YOURENERGY office map failed to initialize.', error);
  }
};

export const initContactMap = ({ config = {} } = {}) => {
  const root = document.querySelector('[data-office-map]');
  const canvas = root?.querySelector('[data-office-map-canvas]');
  if (!root || !canvas) return;

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    void renderOfficeMap({ root, canvas, config });
  };

  if (typeof IntersectionObserver === 'undefined') {
    start();
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      start();
    },
    { rootMargin: '500px 0px' }
  );
  observer.observe(root);
};
