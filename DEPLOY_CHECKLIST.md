# YOURENERGY production checklist

Run these checks in the Cloudflare Pages dashboard and on the deployed custom
domain. Do not put any secret, KV identifier, CRM credential or provider key in
the repository or a `VITE_*` variable.

## PVGIS cache

- [ ] Bind the production Cloudflare KV namespace to Pages Functions as
      `PVGIS_CACHE`.
- [ ] Add a non-empty encrypted Pages secret named `PVGIS_CACHE_SALT`.
- [ ] Confirm the binding and secret are configured for the production
      environment, not only Preview.
- [ ] Confirm Pages Functions are enabled for the same deployment that serves
      `yourenergy.am`.

## Live calculator checks

- [ ] On `/calculator/`, select a region and enter either monthly kWh or a
      bill with the tariff shown on that bill. Confirm the Quick request returns a
      regional preliminary result.
- [ ] If the cache binding or salt is absent, confirm the page says analysis is
      unavailable and does not show example PVGIS figures.
- [ ] Continue to `/calculator/refine/`, select a point or enter coordinates,
      set an outlined or measured roof area, and confirm the roof-specific request
      works.
- [ ] Check `/calculator/pro/` with the same session values and confirm its
      result remains preliminary rather than claiming an automatic roof survey.

## Optional lead delivery

- [ ] Before enabling the Quick “Get a proposal” form for real leads, configure
      an HTTPS `CRM_ENDPOINT` and test that it accepts a lead.
- [ ] If Turnstile is required, configure both its public integration and the
      server-side secret before setting `LEAD_REQUIRE_TURNSTILE=true`.
- [ ] Verify the CRM receives only the lead contact details and the permitted
      calculation summary; it must not receive an address, coordinates, roof
      polygon, tariff or uploaded bill file.

## Final browser check

- [ ] Confirm `https://yourenergy.am/` responds with the generated `_headers`.
- [ ] Confirm Web Analytics loads without a CSP error and that
      `www.yourenergy.am` redirects to the canonical non-`www` domain.
