import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = process.cwd();

export default defineConfig({
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
        'soon-en': resolve(root, 'en/soon/index.html')
      }
    }
  }
});
