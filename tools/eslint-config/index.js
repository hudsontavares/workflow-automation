import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.angular/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'import-x': importX },
    settings: {
      'import-x/internal-regex': '^@workflow-automation/',
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal', 'parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
  prettier,
);
