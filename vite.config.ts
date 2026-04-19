import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.scss', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        tsconfigPaths(),
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
