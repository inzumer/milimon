// @ts-check
// Mirrors @inzumer/eslint-config (ui-library: base + react + testing), updated for ESLint 10.
// Plugins that don't support ESLint 10 are replaced by their maintained successors
// (see docs/adr/0002-tooling-versions.md):
//   eslint-plugin-react    → @eslint-react/eslint-plugin
//   eslint-plugin-jsx-a11y → eslint-plugin-jsx-a11y-x
import eslintReact from '@eslint-react/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import astro from 'eslint-plugin-astro';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', '.astro/**', 'coverage/**', 'node_modules/**', 'public/**']),

  // Base (all JS/TS)
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,astro}'],
    extends: [tseslint.configs.recommended],
    plugins: {
      'import-x': importX,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      // Import order is Prettier's job (@ianvs/prettier-plugin-sort-imports).
      'import-x/no-duplicates': 'error',
      // Relative imports only inside the same folder; anything else goes through an alias.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\.\\./(?!.*__tests__)',
              message: 'Use a path alias (@components, @utils, …) instead of ../',
            },
          ],
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
    },
  },

  // A unit's own tests import that exact unit relatively (../unit), same as ui-library.
  {
    files: ['**/__tests__/**'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // React (islands and components)
  {
    files: ['**/*.tsx'],
    extends: [
      eslintReact.configs['recommended-typescript'],
      reactHooks.configs.flat['recommended-latest'],
      jsxA11y.configs.recommended,
    ],
  },

  // Astro
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],

  // Tests
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    extends: [vitest.configs.recommended],
    languageOptions: { globals: vitest.environments.env.globals },
    rules: {
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-have-length': 'error',
    },
  },
]);
