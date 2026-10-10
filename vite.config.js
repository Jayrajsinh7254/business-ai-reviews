import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    // Disable source maps in production to prevent source code exposure
    sourcemap: false,
    minify: 'oxc',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('qrcode') || id.includes('canvas-confetti')) {
              return 'vendor-utils';
            }
            return 'vendor-other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
