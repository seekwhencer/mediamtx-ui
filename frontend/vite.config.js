import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist'
  },
  plugins: [react()],
  appType: 'custom',
  server: {
    middlewareMode: true,
    allowedHosts: true,
    configure(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        );
        next();
      });
    },
    ws: {
      host: process.env.VITE_WS_HOST || 'localhost', 
      port: process.env.VITE_WS_PORT || 3000,
      protocol: 'ws'
    }
  }
});

console.log('>>>>', process.env.VITE_WS_PORT);
