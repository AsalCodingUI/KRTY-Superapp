import type { StorybookConfig } from '@storybook/nextjs-vite';
import { join } from 'path';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: [
    "../public"
  ],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': join(import.meta.dirname, '../src'),
          'storybook/internal/theming': join(import.meta.dirname, '../node_modules/storybook/dist/theming/index.js'),
        }
      },
      server: {
        fs: {
          strict: false
        }
      }
    });
  }
};

export default config;
