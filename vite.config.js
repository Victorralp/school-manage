
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    proxy: {
      '/monnify-proxy': {
        target: 'https://sandbox.monnify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/monnify-proxy/, '')
      },
      '/monnify-prod-proxy': {
        target: 'https://api.monnify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/monnify-prod-proxy/, '')
      }
    }
  }
});





