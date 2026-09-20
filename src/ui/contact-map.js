const importLeaflet = () =>
  Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(
    ([{ default: L }]) => L
  );

const getOfficeData = (card) => {
  const latitude = Number(card.dataset.officeMapLat);
  const longitude = Number(card.dataset.officeMapLng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    card,
    coordinates: [latitude, longitude],
    title: card.dataset.officeMapTitle?.trim() ?? '',
    address: card.dataset.officeMapAddress?.trim() ?? ''
  };
};

const createPopupContent = ({ title, address }) => {
  const content = document.createElement('div');
  content.className = 'office-map__popup';
  const heading = document.createElement('strong');
  heading.textContent = title;
  const copy = document.createElement('p');
  copy.textContent = address;
  content.append(heading, copy);
  return content;
};

const setActiveOffice = ({ map, buttons, activeButton, markers }) => {
  const marker = markers.get(activeButton);
  if (!marker) return;

  map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.35 });
  marker.openPopup();
  buttons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
    button.closest('[data-office-card]')?.classList.toggle('is-active', isActive);
  });
};

export const initContactMap = async () => {
  const root = document.querySelector('[data-office-map]');
  const canvas = root?.querySelector('[data-office-map-canvas]');
  const buttons = [...(root?.querySelectorAll('[data-office-map-option]') ?? [])];
  const offices = [...(root?.querySelectorAll('[data-office-card]') ?? [])]
    .map(getOfficeData)
    .filter(Boolean);

  if (
    !root ||
    !canvas ||
    !buttons.length ||
    !offices.length ||
    root.dataset.mapInitialized === 'true'
  ) {
    return;
  }
  root.dataset.mapInitialized = 'true';

  const L = await importLeaflet();
  const map = L.map(canvas, {
    attributionControl: true,
    zoomControl: true,
    scrollWheelZoom: false,
    minZoom: 3,
    maxZoom: 19
  });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    crossOrigin: true
  }).addTo(map);

  const markers = new Map();
  offices.forEach((office, index) => {
    const icon = L.divIcon({
      className: `office-map__marker office-map__marker--${index + 1}`,
      html: '<span aria-hidden="true"></span>',
      iconSize: [32, 38],
      iconAnchor: [16, 38],
      popupAnchor: [0, -36]
    });
    const marker = L.marker(office.coordinates, { icon, keyboard: true, title: office.title })
      .bindPopup(createPopupContent(office))
      .addTo(map);
    const button = office.card.querySelector('[data-office-map-option]');
    if (button) markers.set(button, marker);
  });

  const fitOffices = () => {
    const bounds = L.latLngBounds(offices.map(({ coordinates }) => coordinates));
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    map.fitBounds(bounds, {
      paddingTopLeft: [36, isMobile ? 82 : 72],
      paddingBottomRight: [36, isMobile ? 250 : 220],
      maxZoom: 13
    });
  };
  fitOffices();
  requestAnimationFrame(() => {
    map.invalidateSize({ pan: false });
    fitOffices();
  });

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveOffice({ map, buttons, activeButton: button, markers });
    });
  });
};
