import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        stream: path.resolve(__dirname, 'src/utils/stream-stub.ts'),
      },
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['.trycloudflare.com'],
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/tokens/**', '**/mecaerp.db', '**/mecaerp.db-*'],
      },
    },
  };
});