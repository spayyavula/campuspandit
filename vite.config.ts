import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\/api\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'CampusPandit - Smart Learning Platform',
        short_name: 'CampusPandit',
        description: 'Interactive learning platform with gamified education for Physics, Math, and Chemistry',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }

          // Router
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }

          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }

          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }

          // Rich text editors and heavy components
          if (id.includes('node_modules/react-quill') ||
              id.includes('node_modules/quill') ||
              id.includes('node_modules/react-katex') ||
              id.includes('node_modules/katex')) {
            return 'vendor-editors';
          }

          // Markdown and rendering
          if (id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/remark') ||
              id.includes('node_modules/rehype')) {
            return 'vendor-markdown';
          }

          // Utilities
          if (id.includes('node_modules/date-fns') ||
              id.includes('node_modules/uuid') ||
              id.includes('node_modules/crypto-js')) {
            return 'vendor-utils';
          }

          // CSV and data processing
          if (id.includes('node_modules/csv-parse') ||
              id.includes('node_modules/csv-parser') ||
              id.includes('node_modules/csv-stringify')) {
            return 'vendor-csv';
          }

          // CRM components
          if (id.includes('/src/components/crm/')) {
            return 'crm-modules';
          }

          // Learning components
          if (id.includes('/src/components/learning/')) {
            return 'learning-modules';
          }

          // Tutoring components
          if (id.includes('/src/components/tutoring/')) {
            return 'tutoring-modules';
          }

          // Admin components
          if (id.includes('/src/components/admin/')) {
            return 'admin-modules';
          }

          // Payment components
          if (id.includes('/src/components/payment/')) {
            return 'payment-modules';
          }

          // Messaging
          if (id.includes('/src/components/messaging/')) {
            return 'messaging-modules';
          }

          // Course components
          if (id.includes('/src/components/courses/')) {
            return 'courses-modules';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit since we're now splitting properly
    chunkSizeWarningLimit: 500,
    // Enable source maps for better debugging (disable in production)
    sourcemap: false
  }
});