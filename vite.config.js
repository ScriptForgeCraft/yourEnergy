import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

const root = process.cwd();
const DEFAULT_OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const CLOUDFLARE_INSIGHTS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com';
const BLOG_ARTICLE_SLUGS = [
  'solar-panels-for-home-armenia',
  'solar-savings-armenia',
  'do-i-need-solar-battery',
  'how-to-size-solar-system',
  'net-metering-armenia'
];
const PROJECT_CASE_SLUGS = [
  'modern-home-yerevan',
  'country-house-kotayk',
  'office-building-yerevan',
  'education-centre-yerevan',
  'production-facility-armavir',
  'mountain-home-dilijan',
  'agricultural-site-armavir'
];
const blogArticleInputs = Object.fromEntries(
  BLOG_ARTICLE_SLUGS.flatMap((slug) => [
    [`blog-hy-${slug}`, resolve(root, `blog/${slug}/index.html`)],
    [`blog-ru-${slug}`, resolve(root, `ru/blog/${slug}/index.html`)],
    [`blog-en-${slug}`, resolve(root, `en/blog/${slug}/index.html`)]
  ])
);
const projectCaseInputs = Object.fromEntries(
  PROJECT_CASE_SLUGS.flatMap((slug) => [
    [`project-case-hy-${slug}`, resolve(root, `projects/${slug}/index.html`)],
    [`project-case-ru-${slug}`, resolve(root, `ru/projects/${slug}/index.html`)],
    [`project-case-en-${slug}`, resolve(root, `en/projects/${slug}/index.html`)]
  ])
);

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

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, root, 'VITE_');
  const mapTileUrl = publicEnv.VITE_MAP_TILE_URL?.trim() || DEFAULT_OSM_TILE_URL;
  const imageryTileUrl = publicEnv.VITE_MAP_IMAGERY_TILE_URL?.trim() || DEFAULT_SATELLITE_TILE_URL;
  const mapOrigins = [
    ...new Set([trustedMapOrigin(mapTileUrl), trustedMapOrigin(imageryTileUrl)])
  ].filter(Boolean);

  return {
    plugins: [
      {
        name: 'yourenergy-csp-allowlist',
        async closeBundle() {
          await writeFile(resolve(root, 'dist/_headers'), createHeaders(mapOrigins));
        }
      }
    ],
    build: {
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
        input: {
          hy: resolve(root, 'index.html'),
          ru: resolve(root, 'ru/index.html'),
          en: resolve(root, 'en/index.html'),
          'faq-hy': resolve(root, 'faq/index.html'),
          'faq-ru': resolve(root, 'ru/faq/index.html'),
          'faq-en': resolve(root, 'en/faq/index.html'),
          'privacy-hy': resolve(root, 'privacy/index.html'),
          'terms-hy': resolve(root, 'terms/index.html'),
          'privacy-ru': resolve(root, 'ru/privacy/index.html'),
          'terms-ru': resolve(root, 'ru/terms/index.html'),
          'privacy-en': resolve(root, 'en/privacy/index.html'),
          'terms-en': resolve(root, 'en/terms/index.html'),
          'projects-hy': resolve(root, 'projects/index.html'),
          'projects-ru': resolve(root, 'ru/projects/index.html'),
          'projects-en': resolve(root, 'en/projects/index.html'),
          'contacts-hy': resolve(root, 'contacts/index.html'),
          'contacts-ru': resolve(root, 'ru/contacts/index.html'),
          'contacts-en': resolve(root, 'en/contacts/index.html'),
          'about-hy': resolve(root, 'about/index.html'),
          'about-ru': resolve(root, 'ru/about/index.html'),
          'about-en': resolve(root, 'en/about/index.html'),
          'equipment-hy': resolve(root, 'equipment/index.html'),
          'equipment-ru': resolve(root, 'ru/equipment/index.html'),
          'equipment-en': resolve(root, 'en/equipment/index.html'),
          'blog-hy': resolve(root, 'blog/index.html'),
          'blog-ru': resolve(root, 'ru/blog/index.html'),
          'blog-en': resolve(root, 'en/blog/index.html'),
          'calculator-hy': resolve(root, 'calculator/index.html'),
          'calculator-ru': resolve(root, 'ru/calculator/index.html'),
          'calculator-en': resolve(root, 'en/calculator/index.html'),
          'calculator-refine-hy': resolve(root, 'calculator/refine/index.html'),
          'calculator-refine-ru': resolve(root, 'ru/calculator/refine/index.html'),
          'calculator-refine-en': resolve(root, 'en/calculator/refine/index.html'),
          'calculator-pro-hy': resolve(root, 'calculator/pro/index.html'),
          'calculator-pro-ru': resolve(root, 'ru/calculator/pro/index.html'),
          'calculator-pro-en': resolve(root, 'en/calculator/pro/index.html'),
          'calculator-shell-hy': resolve(root, 'calculator/pro/shell.html'),
          'calculator-shell-ru': resolve(root, 'ru/calculator/pro/shell.html'),
          'calculator-shell-en': resolve(root, 'en/calculator/pro/shell.html'),
          ...blogArticleInputs,
          ...projectCaseInputs
        }
      }
    }
  };
});
