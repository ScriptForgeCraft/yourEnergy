YOURENERGY Contacts map update (no API key)

This overlay contains only files related to the Contacts office map.

What changed:
- Removed the VITE_GOOGLE_MAPS_API_KEY configuration.
- Removed Maps JavaScript API / Geocoding usage from Contacts.
- Replaced the JS map canvas with a no-key Google Maps iframe, matching the approach used in Harmony Flowers.
- Added "show on map" controls for both offices. Clicking one switches the iframe to that office.
- Kept the existing Google Maps directions links.
- Tightened CSP again: Google is allowed only as an iframe source for Contacts, not as a JavaScript API source.
- Updated build verification so the old SVG/JS-API map cannot silently return.

After extracting over the project root:
1. Remove VITE_GOOGLE_MAPS_API_KEY from Cloudflare Pages Variables and Secrets.
2. Run: npm run content:generate
3. Run: npm run build
4. Run: git status

The tracked generated contacts/index.html is included so the repository stays synchronized.
