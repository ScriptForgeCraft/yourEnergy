import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

const root = process.cwd();
const DEFAULT_OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const trustedMapOrigin = (tileUrl) => {
  if (!tileUrl) return '';
  try {
    const url = new URL(tileUrl);
    return url.protocol === 'https:' ? url.origin : '';
  } catch {
    return '';
  }
};

const createHeaders = (mapOrigin) => `/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:${mapOrigin ? ` ${mapOrigin}` : ''}; font-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, root, 'VITE_');
  const mapTileUrl = publicEnv.VITE_MAP_TILE_URL?.trim() || DEFAULT_OSM_TILE_URL;
  const mapOrigin = trustedMapOrigin(mapTileUrl);

  return {
    plugins: [
      {
        name: 'yourenergy-csp-allowlist',
        async closeBundle() {
          await writeFile(resolve(root, 'dist/_headers'), createHeaders(mapOrigin));
        }
      }
    ],
    build: {
      rollupOptions: {
        input: {
          hy: resolve(root, 'index.html'),
          ru: resolve(root, 'ru/index.html'),
          en: resolve(root, 'en/index.html'),
          'privacy-hy': resolve(root, 'privacy/index.html'),
          'terms-hy': resolve(root, 'terms/index.html'),
          'soon-hy': resolve(root, 'soon/index.html'),
          'privacy-ru': resolve(root, 'ru/privacy/index.html'),
          'terms-ru': resolve(root, 'ru/terms/index.html'),
          'soon-ru': resolve(root, 'ru/soon/index.html'),
          'privacy-en': resolve(root, 'en/privacy/index.html'),
          'terms-en': resolve(root, 'en/terms/index.html'),
          'soon-en': resolve(root, 'en/soon/index.html'),
          'calculator-hy': resolve(root, 'calculator/index.html'),
          'calculator-ru': resolve(root, 'ru/calculator/index.html'),
          'calculator-en': resolve(root, 'en/calculator/index.html'),
          'offer-checker-hy': resolve(root, 'offer-checker/index.html'),
          'offer-checker-ru': resolve(root, 'ru/offer-checker/index.html'),
          'offer-checker-en': resolve(root, 'en/offer-checker/index.html')
        }
      }
    }
  };
});
