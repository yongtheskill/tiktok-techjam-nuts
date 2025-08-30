import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import wasm from 'vite-plugin-wasm';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    exclude: ['@lynx-js/web-core', '@lynx-js/web-mainthread-apis'],
  },
  publicDir: './analysis/dist',
  plugins: [
    wasm(),
    react(),
    // The code below enables dev tools like taking screenshots of your site
    // while it is being developed on chef.convex.dev.
    // Feel free to remove this code if you're no longer developing your app with Chef.
    mode === 'development'
      ? {
          name: 'inject-chef-dev',
          transform(code: string, id: string) {
            if (id.includes('main.tsx')) {
              return {
                code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
    // End of code for taking screenshots on chef.convex.dev.
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
