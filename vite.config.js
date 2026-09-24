import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPageRegistry } from './src/config/routes.js';
import { projectRoot as root, siteRoot, publicRoot, distRoot } from './scripts/build/paths.mjs';
import { defineConfig, loadEnv } from 'vite';

const DEFAULT_OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const CLOUDFLARE_INSIGHTS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com';
const trustedMapOrigin = (tileUrl) => {
  if (!tileUrl) return '';
  try {
    const url = new URL(tileUrl);
    return url.protocol === 'https:' ? url.origin : '';
  } catch {
    return '';
  }
};

const createHeaders = (mapOrigins) => `/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' ${CLOUDFLARE_INSIGHTS_SCRIPT_ORIGIN}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:${mapOrigins.map((value) => ` ${value}`).join('')}; font-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(self), gyroscope=(), microphone=(), payment=(), usb=()
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

export default defineConfig(async ({ mode }) => {
  const pages = await createPageRegistry();
  const publicEnv = loadEnv(mode, root, 'VITE_');
  const mapTileUrl = publicEnv.VITE_MAP_TILE_URL?.trim() || DEFAULT_OSM_TILE_URL;
  const imageryTileUrl = publicEnv.VITE_MAP_IMAGERY_TILE_URL?.trim() || DEFAULT_SATELLITE_TILE_URL;
  const mapOrigins = [
    ...new Set([trustedMapOrigin(mapTileUrl), trustedMapOrigin(imageryTileUrl)])
  ].filter(Boolean);

  return {
    root: siteRoot,
    publicDir: publicRoot,
    envDir: root,
    cacheDir: resolve(root, 'node_modules/.vite'),
    resolve: { alias: { '/src': resolve(root, 'src') } },
    server: { fs: { allow: [root] } },
    plugins: [
      {
        name: 'yourenergy-csp-allowlist',
        async closeBundle() {
          await writeFile(resolve(distRoot, '_headers'), createHeaders(mapOrigins));
        }
      }
    ],
    build: {
      outDir: distRoot,
      emptyOutDir: true,
      // Use Terser deliberately for production artefacts rather than relying
      // on Vite's default. It makes the minification policy visible, strips
      // debug-only code, and runs an additional compression pass.
      minify: 'terser',
      cssMinify: true,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2
        },
        format: {
          comments: false
        }
      },
      rollupOptions: {
        input: Object.fromEntries(pages.map(({ file }) => [file, resolve(siteRoot, file)]))
      }
    }
  };
});
