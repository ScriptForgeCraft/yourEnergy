import { createGeocodingAdapter, validateGeocodeInput } from '../_lib/geocoding.js';
import { handlePost, readJsonBody } from '../_lib/http.js';

export const geocode = async ({ request, env, fetchImpl }) => {
  const input = validateGeocodeInput(await readJsonBody(request));
  const adapter = createGeocodingAdapter(env, { fetchImpl });
  return { location: await adapter.search(input, { signal: request.signal }) };
};

export const onRequest = (context) => handlePost(context, geocode);
