// File: eslint.config.js
// Directory: ./
// Lint config used to catch undefined / unused identifiers in src/ (run: npm run lint).
import globals from 'globals';

export default [
  {
    files: ['src/**/*.js', 'tests/**/*.mjs', 'tools/**/*.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
    rules: { 'no-undef': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
  },
];
