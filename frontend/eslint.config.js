import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';

import sharedConfig from '@workflow-automation/eslint-config';

export default defineConfig(
  sharedConfig,
  {
    files: ['**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
);
