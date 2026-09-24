import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Type-aware linting for the source tree only. The build config and generated
 * output are excluded — linting them produces noise about Node globals that
 * says nothing about the application.
 */
export default tseslint.config(
  { ignores: ['dist/**', 'src-tauri/**', 'node_modules/**', '*.config.ts', '*.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // The codebase uses `void promise` deliberately for fire-and-forget calls
      // whose failure is handled by the query client or a snackbar.
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
