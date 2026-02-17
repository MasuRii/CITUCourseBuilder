import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

// Preserved logic files that should not be modified or linted (CRITICAL constraints C1-C4)
const preservedFiles = [
  '**/course-scheduler-web/src/utils/parseSchedule.js',
  '**/course-scheduler-web/src/utils/parseRawData.js',
  '**/course-scheduler-web/src/utils/generateIcs.js',
  '**/course-scheduler-web/src/utils/convertToRawData.js',
];

export default [
  // Global ignores - standalone object with ONLY ignores key
  // These files/directories will be completely ignored by ESLint
  {
    ignores: [
      // Build outputs
      '**/dist/**',
      '**/node_modules/**',
      '**/.astro/**',
      '**/coverage/**',
      // IDE/editor files
      '**/.opencode/**',
      // Preserved logic files (CRITICAL: must not be modified)
      ...preservedFiles,
    ],
  },

  // JavaScript files (.js, .jsx)
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },

  // React JSX files
  {
    files: ['**/*.jsx'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // TypeScript files - spread recommended configs
  ...tseslint.configs.recommended,

  // TypeScript-specific overrides
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // React TSX files
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Astro files - spread recommended configs
  ...eslintPluginAstro.configs['flat/recommended'],

  // Astro-specific overrides
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
  },
];
