import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    publicDir: [
      {
        name: path.join(
          __dirname,
          './',
          // Please replace this with your actual Lynx project name
          'analysis',
          'dist'
        ),
      },
    ],
  },
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
});
