import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import AppLayout from './Layouts/AppLayout';

const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
// Halaman tanpa sidebar: beranda publik, autentikasi, mode ujian, dan dokumentasi design system.
const bare = /^(Landing|Auth\/|Siswa\/UjianKerjakan|DesignSystem)/;

createInertiaApp({
    title: (title) => (title ? `${title} · PKBM BHP` : 'PKBM BHP'),
    resolve: (name) => {
        const page = pages[`./Pages/${name}.jsx`];
        if (!page) throw new Error(`Halaman tidak ditemukan: ${name}`);
        page.default.layout ??= bare.test(name) ? undefined : (p) => <AppLayout>{p}</AppLayout>;
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#D1F843' },
});
