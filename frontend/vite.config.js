import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Indian Stock News',
        short_name: 'StockNews',
        description: 'Real-time Indian stock news with sentiment analysis and narrative intelligence',
        theme_color: '#1e40af',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/indian-stock-news-app\.onrender\.com\/api\/stocks\/list/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'stocks-list',
              expiration: { maxAgeSeconds: 86400 }, // 24h — stock list rarely changes
            },
          },
          {
            urlPattern: /^https:\/\/indian-stock-news-app\.onrender\.com\/api\/stock-news/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'stock-news',
              expiration: { maxAgeSeconds: 1800 }, // 30min — matches backend cache TTL
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
