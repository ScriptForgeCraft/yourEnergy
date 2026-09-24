import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', '.generated/**', 'reports/**', '.codex/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
];
