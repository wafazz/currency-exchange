import '../css/app.scss';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import NProgress from 'nprogress';

const appName = import.meta.env.VITE_APP_NAME || 'Money Exchange';

router.on('start', () => NProgress.start());
router.on('finish', (event) => {
    if (event.detail.visit.completed) NProgress.done();
    else if (event.detail.visit.interrupted) NProgress.set(0);
    else if (event.detail.visit.cancelled) NProgress.done();
});

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: false,
});
