import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/screenshots': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        // Clean up stale caches from old deployments immediately
        cleanupOutdatedCaches: true,
        // Skip waiting so new SW activates immediately without requiring tab close
        skipWaiting: true,
        clientsClaim: true,
        // Don't cache API routes
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Rate My UX — AI UX Evaluator',
        short_name: 'Rate My UX',
        description: 'AI-powered UX evaluation tool. Audit websites, Figma prototypes, and mobile apps for usability, accessibility & conversion issues.',
        theme_color: '#0a0a1a',
        background_color: '#0a0a1a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
