import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from '@tailwindcss/vite';

// // @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [tailwindcss(), sveltekit()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      '/proxy/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/anthropic/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying Anthropic request:', req.url);
          });
        }
      },
      '/proxy/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/openai/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying OpenAI request:', req.url);
          });
        }
      },
      '/proxy/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/openrouter/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying OpenRouter request:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🔄 OpenRouter response status:', proxyRes.statusCode);
          });
        }
      }
    }
  },
}));
