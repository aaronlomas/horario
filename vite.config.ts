import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'assets/margarita.jpeg'],
      manifest: {
        name: 'Galaxy Schedule Planner',
        short_name: 'Horario',
        description: 'Gestor de horarios optimizado para Galaxy A05',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'assets/margarita.jpeg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'assets/margarita.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: 'assets/margarita.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
