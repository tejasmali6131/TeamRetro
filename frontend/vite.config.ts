import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@/components': '/src/components',
      '@/pages': '/src/pages',
      '@/hooks': '/src/hooks',
      '@/utils': '/src/utils',
      '@/services': '/src/services',
      '@/types': '/src/types',
      '@/context': '/src/context',
    },
  },
  build: {
    // Build output to backend's public folder for single server deployment
    outDir: path.resolve(__dirname, '../backend/public'),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', () => {
            // Suppress WebSocket proxy errors (e.g., ECONNABORTED on disconnect)
          });
        },
      },
    },
  },
});
