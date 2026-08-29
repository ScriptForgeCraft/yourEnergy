# YOURENERGY Pages Functions

These Cloudflare Pages Functions are an honest server boundary for address lookup,
PVGIS yield data and lead delivery. They do not log request payloads, fabricate a
location, fabricate a solar result, or acknowledge a lead before the configured
CRM accepts it.

They are intentionally independent of Vite. `vite dev` does not execute Pages
Functions; use `wrangler pages dev` (or the Cloudflare deployment preview) when
testing the API locally.

## Routes and response envelope

Every successful response is `{ "ok": true, "data": ... }`; every failure is:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "One or more request fields are invalid.",
    "retryable": false
  }
}
```

All routes accept `POST` with `Content-Type: application/json`, return
`Cache-Control: no-store`, and are same-origin only (no permissive CORS header).

### `POST /api/geocode`

Request:

```json
{ "query": "26/33 Zovuni, Yerevan", "locale": "en" }
```

`address` is accepted as a backward-compatible alias for `query`. The response
contains `data.location.candidates` (provider-returned label, latitude,
longitude and optional provider confidence), `selectionRequired: true`, and a
source ledger.
The browser must show the candidates and require the user to select or manually
place a point; it must not treat a text query as a confirmed property.

### `POST /api/analysis`

Request (PVGIS numeric inputs are deliberately required; the rest becomes the
transparent source ledger):

```json
{
  "property": {
    "address": "26/33 Zovuni, Yerevan",
    "latitude": 40.2,
    "longitude": 44.5,
    "confirmed": true,
    "source": "manual"
  },
  "consumption": { "averageMonthlyKwh": 1000 },
  "roof": {
    "areaSqm": 70,
    "polygonComplete": true,
    "tiltDegrees": 30,
    "azimuthDegrees": 180
  },
  "system": { "capacityKwp": 1, "lossPercent": 14 }
}
```

`azimuthDegrees` is compass bearing (0 north, 180 south). The function converts
it to PVGIS aspect and returns `data.analysis`: a P0 domain analysis with
PVGIS generation, the confirmed property/roof/consumption ledger, tariff state,
confidence and assumptions. It deliberately returns no tariff savings, price,
payback or quote until a dated verified tariff and capex source exist. The P0
browser requests a transparent `1 kWp` PVGIS yield, then the server scales that
provider result from confirmed consumption. The endpoint accepts only that
`1 kWp` / `14%` loss normalization query, so a caller cannot distort the
specific-yield calculation. The loss assumption appears in the visible Passport
ledger.

### `POST /api/lead`

Request:

```json
{
  "name": "Anna Example",
  "phone": "+374 91 000 000",
  "email": "anna@example.com",
  "message": "Optional note",
  "locale": "en",
  "analysisId": "optional-safe-id",
  "turnstileToken": "required when Turnstile is configured"
}
```

The response contains `{ "data": { "accepted": true, "delivery": "crm",
"leadId": null | "crm-id" } }` only after the configured CRM has returned a
successful HTTP status. `leadId` is `null` unless the CRM explicitly returns a
safe `id` or `leadId`; it is never generated in the function. No submitted
name, phone, email, message, coordinates or provider URL is echoed back.

## Cloudflare configuration

Set these in the Cloudflare dashboard / `wrangler secret put`, never in
`VITE_*` variables or committed files:

| Binding                                                                    | Required for    | Notes                                                                                                                              |
| -------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GEOCODING_ENDPOINT`                                                       | `/api/geocode`  | HTTPS provider endpoint. It receives `q`, `language`, and `limit` by default; `{query}` and `{locale}` placeholders are supported. |
| `GEOCODING_PROVIDER`                                                       | Optional        | A human-readable source name returned to the browser.                                                                              |
| `GEOCODING_API_KEY`                                                        | Optional        | Sent in a header, never as a browser value.                                                                                        |
| `GEOCODING_API_KEY_HEADER` / `GEOCODING_API_KEY_PREFIX`                    | Optional        | Header defaults to `authorization`; use prefix such as `Bearer `.                                                                  |
| `GEOCODING_QUERY_PARAM`, `GEOCODING_LOCALE_PARAM`, `GEOCODING_LIMIT_PARAM` | Optional        | Use only for a provider with matching query parameter names.                                                                       |
| `PVGIS_ENDPOINT`                                                           | `/api/analysis` | HTTPS PVGIS `PVcalc` endpoint; keep it server-configured even if the public endpoint needs no API key.                             |
| `CRM_ENDPOINT`                                                             | `/api/lead`     | HTTPS CRM/webhook endpoint. A missing value produces `CRM_NOT_CONFIGURED`, never a false success.                                  |
| `CRM_API_KEY`                                                              | Optional        | Sent server-to-server using `CRM_API_KEY_HEADER` / `CRM_API_KEY_PREFIX`.                                                           |
| `TURNSTILE_SECRET_KEY`                                                     | Optional        | Enables server verification. When set, a token is required for each lead.                                                          |
| `LEAD_REQUIRE_TURNSTILE`                                                   | Optional        | Set to `true` to reject leads until Turnstile is configured. Default is `false`.                                                   |
| `API_FETCH_TIMEOUT_MS`                                                     | Optional        | Server fetch timeout, clamped to 1–20 seconds; default 8 seconds.                                                                  |
| `ALLOW_INSECURE_PROVIDER_URLS`                                             | Local dev only  | Set `true` only for `http://localhost`, `127.0.0.1` or `[::1]` test adapters.                                                      |

The generic geocoder normalizes GeoJSON `features`, Nominatim-style arrays, and
objects with `results` or `data` arrays. A provider with another wire format
needs a small adapter change in `functions/_lib/geocoding.js`, not client-side
parsing or a browser secret.

## Error codes

Shared validation: `METHOD_NOT_ALLOWED`, `INVALID_CONTENT_TYPE`, `INVALID_JSON`,
`PAYLOAD_TOO_LARGE`, `INVALID_INPUT`, `REQUEST_ABORTED`, `INTERNAL`.

Geocode: `GEOCODER_NOT_CONFIGURED`, `GEOCODER_TIMEOUT`,
`GEOCODER_UNAVAILABLE`, `GEOCODER_RESPONSE_INVALID`.

Analysis: `PVGIS_NOT_CONFIGURED`, `PVGIS_TIMEOUT`, `PVGIS_UNAVAILABLE`,
`PVGIS_RESPONSE_INVALID`.

Lead: `CRM_NOT_CONFIGURED`, `CRM_TIMEOUT`, `CRM_UNAVAILABLE`, `CRM_REJECTED`,
`TURNSTILE_NOT_CONFIGURED`, `BOT_VERIFICATION_REQUIRED`,
`BOT_VERIFICATION_FAILED`, `BOT_VERIFICATION_UNAVAILABLE`.

## Local testability

The handlers export pure validation, URL construction, response normalization and
adapter factories. Unit tests can import them directly and inject `fetchImpl`;
no network call or Cloudflare account is needed. For an end-to-end Pages test,
provide non-production `.dev.vars` values locally and keep that file ignored.
