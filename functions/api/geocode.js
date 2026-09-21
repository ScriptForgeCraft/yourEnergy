import { createGeocodingAdapter, validateGeocodeInput } from '../_lib/geocoding.js';
import { handlePost, readJsonBody } from '../_lib/http.js';

const transliteration = {
  sh: 'շ',
  zh: 'ժ',
  ch: 'չ',
  kh: 'խ',
  ts: 'ց',
  dz: 'ձ',
  gh: 'ղ',
  a: 'ա',
  b: 'բ',
  g: 'գ',
  d: 'դ',
  e: 'ե',
  z: 'զ',
  i: 'ի',
  l: 'լ',
  k: 'կ',
  h: 'հ',
  m: 'մ',
  y: 'յ',
  n: 'ն',
  o: 'ո',
  p: 'պ',
  j: 'ջ',
  r: 'ր',
  s: 'ս',
  v: 'վ',
  t: 'տ',
  f: 'ֆ'
};

const isMostlyLatin = (text) => {
  const letters = text.match(/\p{L}/gu) ?? [];
  const latinLetters = text.match(/\p{Script=Latin}/gu) ?? [];
  return latinLetters.length > letters.length / 2;
};

const transliterateLatinToArmenian = (text) =>
  text.replace(
    /sh|zh|ch|kh|ts|dz|gh|[a-z]/gi,
    (part) => transliteration[part.toLowerCase()] ?? part
  );

const stripApartment = (query) => {
  const withoutExplicitApartment = query.replace(
    /(?:,\s*|\s+)(?:բնակարան|բն\.?|квартира|кв\.?|apartment|apt\.?)\s*#?\s*\d+\s*$/iu,
    ''
  );
  if (withoutExplicitApartment !== query) return withoutExplicitApartment.trim();

  const implicitApartment = query.match(/^(.*?)(?:,\s*|\s+)(\d+(?:\/\d+)?)\s*,\s*\d+\s*$/u);
  if (!implicitApartment || !/\p{L}/u.test(implicitApartment[1])) return null;
  return `${implicitApartment[1].replace(/,\s*$/u, '').trim()} ${implicitApartment[2]}`;
};

export const geocode = async ({ request, env, fetchImpl }) => {
  const input = validateGeocodeInput(await readJsonBody(request));
  const adapter = createGeocodingAdapter(env, { fetchImpl });
  const search = (query) => adapter.search({ ...input, query }, { signal: request.signal });
  let location = await search(input.query);
  const isNominatim =
    location.source.provider.toLowerCase() === 'nominatim' ||
    new URL(env.GEOCODING_ENDPOINT).hostname === 'nominatim.openstreetmap.org';
  if (location.candidates.length || !isNominatim) return { location };

  const buildingAddress = stripApartment(input.query);
  if (buildingAddress) {
    location = await search(buildingAddress);
    if (location.candidates.length) return { location };
  }

  const latinQuery = buildingAddress ?? input.query;
  if (isMostlyLatin(latinQuery)) {
    const armenianQuery = transliterateLatinToArmenian(latinQuery);
    if (armenianQuery !== latinQuery) location = await search(armenianQuery);
  }
  return { location };
};

export const onRequest = (context) => handlePost(context, geocode);
