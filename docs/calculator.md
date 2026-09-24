# Calculator behavior

Each locale has one indexable `/calculator/` entry. Quick opens with a region and average bill or kWh. Bill conversion requires an explicit usable tariff. `/api/quick-analysis` uses a versioned regional PVGIS benchmark and labels the result regional/preliminary.

Professional mode (`?mode=pro`) fetches its shell on demand and presents Location, Consumption, Roof and Results. Historic `/calculator/pro/` and `/calculator/refine/` migrate to that mode while retaining compatible session inputs. `LEGACY_SESSION_VERSIONS`, scoped-result migrations and input identity checks are intentional compatibility behavior.

The controller owns one wizard state, request lifecycle and temporary session. `src/ui/calculator/results-view.js` renders results and the Solar Passport from that state. It does not fetch providers or own another session. The selected panel, inverter, mounting and optional battery recommendations use the calculation catalog; showroom records provide localized presentation.

Address searches require an explicit choice and map confirmation. A map outline is preliminary projected area; measured roof-plane area is a distinct input. `/api/potential` is a 1 kWp site benchmark, while `/api/analysis` obtains provider yield for the chosen configuration and uses the existing pure domain formulas. Provider failures remain errors, never fabricated analysis.

Financial results retain tariff provenance, surplus economics and the server-selected versioned PriceBook. Expired/unavailable commercial data suppress pricing. Proposal/Offer checks use the same validity rules. Uploaded bill files stay in memory and are not serialized into sessions or lead payloads.

Functions, PVGIS cache binding/secret, geocoding configuration and lead channels are documented in [functions.md](functions.md). Production smoke checks are in [deployment.md](deployment.md).
