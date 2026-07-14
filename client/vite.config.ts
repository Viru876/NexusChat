import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  define: {
    // simple-peer expects a global object in some environments
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['simple-peer'],
  },
});
