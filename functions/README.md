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

### `POST /api/potential`

Request:

```json
{
  "property": { "latitude": 40.2, "longitude": 44.5, "confirmed": true }
}
```

This is the fast, location-level PVGIS step. It returns
`data.potential.annualYieldKwhPerKwp`, a 12-month 1 kWp yield profile and the
PVGIS optimum fixed tilt/orientation for a free-standing system at the confirmed
point. The Function fixes the query at 1 kWp and 14% system losses, sends
`optimalangles=1`, and never accepts a client roof angle or system price.

The response is deliberately not a roof survey: it contains no roof area,
panel layout, system size, savings, price or shading claim. The browser must
say that the PVGIS optimum is a free-standing benchmark; the real roof face,
usable area, obstacles, shading and structural suitability need the detailed
workflow and an engineer.

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
  "tariff": { "rateAmdPerKwh": 45 },
  "roof": {
    "areaSqm": 70,
    "polygonComplete": true,
    "tiltDegrees": 30,
    "azimuthDegrees": 180
  },
  "system": { "capacityKwp": 1, "lossPercent": 14 }
}
```

`tariff` is optional. Its rate is treated as user-provided and is recorded as
such in the source ledger; without it (or a future approved tariff registry),
savings, payback and the financial timeline remain unavailable. `azimuthDegrees`
is compass bearing (0 north, 180 south). The function converts it to PVGIS
aspect and returns `data.analysis`: a P1 domain analysis with PVGIS generation,
the confirmed property/roof/consumption ledger, tariff state, confidence and
assumptions.

The server independently selects the active dated YOURENERGY PriceBook for a
standard grid-tied residential preliminary budget. That temporary price range
is not an offer and is returned only while the price book is active; it may be
shown even when no tariff is present, while savings/payback stay hidden. Client
`capex`, price, price-book version or other commercial fields are ignored. The
browser requests a transparent `1 kWp` PVGIS yield, then the server scales that
provider result from confirmed consumption. The endpoint accepts only that
`1 kWp` / `14%` loss normalization query, so a caller cannot distort the
specific-yield calculation. The loss assumption appears in the visible Passport
ledger.

For a preliminary physical fit limit, the server uses 70% of the manually
outlined roof area plus a 580 W / 2 m² module assumption. It may limit the
preliminary system capacity, but it is not a panel layout or engineering survey;
the visible ledger must disclose both assumptions.

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

| Binding                                                                    | Required for      | Notes                                                                                                                                               |
| -------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GEOCODING_ENDPOINT`                                                       | `/api/geocode`    | HTTPS provider endpoint. It receives `q`, `language`, and `limit` by default; `{query}` and `{locale}` placeholders are supported.                  |
| `GEOCODING_PROVIDER`                                                       | Optional          | A human-readable source name returned to the browser.                                                                                               |
| `GEOCODING_API_KEY`                                                        | Optional          | Sent in a header, never as a browser value.                                                                                                         |
| `GEOCODING_API_KEY_HEADER` / `GEOCODING_API_KEY_PREFIX`                    | Optional          | Header defaults to `authorization`; use prefix such as `Bearer `.                                                                                   |
| `GEOCODING_QUERY_PARAM`, `GEOCODING_LOCALE_PARAM`, `GEOCODING_LIMIT_PARAM` | Optional          | Use only for a provider with matching query parameter names.                                                                                        |
| `PVGIS_ENDPOINT`                                                           | Optional override | HTTPS PVGIS `PVcalc` endpoint. If absent, the Function uses the documented public PVGIS endpoint server-side; no URL or key is sent by the browser. |
| `CRM_ENDPOINT`                                                             | `/api/lead`       | HTTPS CRM/webhook endpoint. A missing value produces `CRM_NOT_CONFIGURED`, never a false success.                                                   |
| `CRM_API_KEY`                                                              | Optional          | Sent server-to-server using `CRM_API_KEY_HEADER` / `CRM_API_KEY_PREFIX`.                                                                            |
| `TURNSTILE_SECRET_KEY`                                                     | Optional          | Enables server verification. When set, a token is required for each lead.                                                                           |
| `LEAD_REQUIRE_TURNSTILE`                                                   | Optional          | Set to `true` to reject leads until Turnstile is configured. Default is `false`.                                                                    |
| `API_FETCH_TIMEOUT_MS`                                                     | Optional          | Server fetch timeout, clamped to 1–20 seconds; default 8 seconds.                                                                                   |
| `ALLOW_INSECURE_PROVIDER_URLS`                                             | Local dev only    | Set `true` only for `http://localhost`, `127.0.0.1` or `[::1]` test adapters.                                                                       |

The generic geocoder normalizes GeoJSON `features`, Nominatim-style arrays, and
objects with `results` or `data` arrays. A provider with another wire format
needs a small adapter change in `functions/_lib/geocoding.js`, not client-side
parsing or a browser secret.

## Error codes

Shared validation: `METHOD_NOT_ALLOWED`, `INVALID_CONTENT_TYPE`, `INVALID_JSON`,
`PAYLOAD_TOO_LARGE`, `INVALID_INPUT`, `REQUEST_ABORTED`, `INTERNAL`.

Geocode: `GEOCODER_NOT_CONFIGURED`, `GEOCODER_TIMEOUT`,
`GEOCODER_UNAVAILABLE`, `GEOCODER_RESPONSE_INVALID`.

Potential and analysis: `PVGIS_NOT_CONFIGURED`, `PVGIS_TIMEOUT`,
`PVGIS_UNAVAILABLE`, `PVGIS_RESPONSE_INVALID`.

Lead: `CRM_NOT_CONFIGURED`, `CRM_TIMEOUT`, `CRM_UNAVAILABLE`, `CRM_REJECTED`,
`TURNSTILE_NOT_CONFIGURED`, `BOT_VERIFICATION_REQUIRED`,
`BOT_VERIFICATION_FAILED`, `BOT_VERIFICATION_UNAVAILABLE`.

## Local testability

The handlers export pure validation, URL construction, response normalization and
adapter factories. Unit tests can import them directly and inject `fetchImpl`;
no network call or Cloudflare account is needed. For an end-to-end Pages test,
provide non-production `.dev.vars` values locally and keep that file ignored.
