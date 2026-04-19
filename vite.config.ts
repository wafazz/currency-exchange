import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.scss', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        tsconfigPaths(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null,
            outDir: 'public',
            filename: 'sw.js',
            manifestFilename: 'manifest.webmanifest',
            manifest: {
                name: 'Money Exchange',
                short_name: 'MoneyEx',
                description: 'Live currency exchange rates display and management.',
                theme_color: '#0d6efd',
                background_color: '#0b1220',
                display: 'standalone',
                orientation: 'any',
                start_url: '/display',
                scope: '/',
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: null,
                runtimeCaching: [
                    {
                        urlPattern: /\/api\/rates/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'api-rates',
                            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
                        },
                    },
                    {
                        urlPattern: /\/storage\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'storage-assets',
                            expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                        },
                    },
                ],
            },
        }),
    ],
    server: {
        host: 'localhost',
        hmr: { host: 'localhost' },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
                silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
            },
        },
    },
});
