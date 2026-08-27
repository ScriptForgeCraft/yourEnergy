/**
 * Optional visual enhancement for the static Roof Scan figure. It uses an
 * imageOverlay plus CRS.Simple, so it never requests tiles, keys, or a map API.
 */
export const enhanceRoofMap = async (container, { image = '/images/roof-scan-1200.webp' } = {}) => {
  if (!container || container.dataset.enhanced === 'true') {
    return null;
  }

  const [{ default: L }] = await Promise.all([
    import('leaflet'),
    import('leaflet/dist/leaflet.css')
  ]);
  container.hidden = false;
  container.dataset.enhanced = 'true';
  container.parentElement?.classList.add('has-map');

  const bounds = [
    [0, 0],
    [100, 150]
  ];
  const map = L.map(container, {
    attributionControl: false,
    zoomControl: true,
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2,
    zoomSnap: 0.25,
    scrollWheelZoom: false
  });

  L.imageOverlay(image, bounds).addTo(map);
  const roof = L.polygon(
    [
      [20, 36],
      [31, 104],
      [76, 92],
      [63, 25]
    ],
    { color: '#f5bd18', weight: 2, fillColor: '#f5bd18', fillOpacity: 0.08 }
  ).addTo(map);
  const panels = L.layerGroup().addTo(map);

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const south = 29 + row * 10;
      const west = 40 + column * 12 + row * 2.6;
      L.rectangle(
        [
          [south, west],
          [south + 7.2, west + 9.4]
        ],
        { color: '#dcecff', weight: 1, fillColor: '#0b3962', fillOpacity: 0.72, interactive: false }
      ).addTo(panels);
    }
  }

  const marker = L.circleMarker([55, 77], {
    radius: 6,
    color: '#fff',
    weight: 2,
    fillColor: '#f5bd18',
    fillOpacity: 1
  }).addTo(map);
  map.fitBounds(bounds, { padding: [8, 8], animate: false });

  return {
    update(analysis) {
      const healthy = analysis?.coverage >= 85;
      roof.setStyle({ color: healthy ? '#f5bd18' : '#f8c55c' });
      marker.setStyle({ fillColor: healthy ? '#f5bd18' : '#f8c55c' });
    },
    destroy() {
      map.remove();
      container.hidden = true;
      container.parentElement?.classList.remove('has-map');
      delete container.dataset.enhanced;
    }
  };
};
