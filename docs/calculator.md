# Calculator behavior

Each locale has one indexable `/calculator/` entry. Quick opens with only a region and average bill or kWh. Known kWh automatically resolves the standard residential bracket. A bill is converted into a clearly labelled preliminary estimate using the standard residential daytime reference rate; discontinuities between brackets snap deterministically to the nearest valid boundary. `/api/quick-analysis` performs that authoritative tariff resolution on the server, uses a versioned regional PVGIS benchmark and labels the result regional/preliminary.

Professional mode (`?mode=pro`) fetches its shell on demand and presents Location, Consumption, Roof and Results. Its Consumption step uses the same automatic residential flow; an optional collapsed effective-rate field accepts one average AMD/kWh value when the homeowner knows it from a bill. Historic `/calculator/pro/` and `/calculator/refine/` migrate to that mode while retaining only safe legacy custom-rate overrides. `LEGACY_SESSION_VERSIONS`, scoped-result migrations and input identity checks are intentional compatibility behavior.

The controller owns one wizard state, request lifecycle and temporary session. `src/ui/calculator/results-view.js` renders results and the Solar Passport from that state. It does not fetch providers or own another session. The selected panel, inverter, mounting and optional battery recommendations use the calculation catalog; showroom records provide localized presentation.

Address searches require an explicit choice and map confirmation. A map outline is preliminary projected area; measured roof-plane area is a distinct input. `/api/potential` is a 1 kWp site benchmark, while `/api/analysis` obtains provider yield for the chosen configuration and uses the existing pure domain formulas. Provider failures remain errors, never fabricated analysis.

Financial results distinguish automatic standard residential tariffs, user-provided effective tariffs, and consumption estimated from a monthly bill. Day/night remains regulatory source data but is not a consumer-facing choice. Expired/unavailable commercial data suppress pricing. Proposal/Offer checks use the same validity rules. Uploaded bill files stay in memory and are not serialized into sessions or lead payloads.

Functions, PVGIS cache binding/secret, geocoding configuration and lead channels are documented in [functions.md](functions.md). Production smoke checks are in [deployment.md](deployment.md).
