import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Avatar, Dropdown, Icon, Logo, MenuItem, cx } from '../Components/ui';

const MENU = {
    admin: [
        ['Utama', [['Dashboard', 'space_dashboard', '/admin']]],
        ['Data Master', [['Data Peserta Didik', 'groups', '/admin/peserta-didik'], ['Data Tutor', 'co_present', '/admin/tutor'], ['Program Pendidikan', 'school', '/admin/program'], ['Mata Pelajaran', 'menu_book', '/admin/mapel'], ['Data Kelas', 'meeting_room', '/admin/kelas'], ['Pengampu & Jadwal', 'calendar_month', '/admin/pengajaran']]],
        ['Pembelajaran', [['Materi Pembelajaran', 'local_library', '/admin/materi'], ['Tugas', 'assignment', '/admin/tugas'], ['Ujian', 'quiz', '/admin/ujian'], ['Bank Soal', 'inventory_2', '/admin/bank-soal'], ['Nilai dan Hasil Belajar', 'insights', '/admin/nilai']]],
        ['Administrasi', [['Pengumuman', 'campaign', '/pengumuman'], ['Kehadiran', 'event_available', '/admin/kehadiran'], ['Laporan', 'summarize', '/admin/laporan'], ['Pengaturan Sistem', 'settings', '/admin/pengaturan']]],
    ],
    tutor: [
        ['Utama', [['Dashboard', 'space_dashboard', '/tutor'], ['Kelas Saya', 'meeting_room', '/tutor/kelas'], ['Peserta Didik', 'groups', '/tutor/peserta-didik']]],
        ['Pembelajaran', [['Materi Pembelajaran', 'local_library', '/tutor/materi'], ['Tugas', 'assignment', '/tutor/tugas'], ['Ujian', 'quiz', '/tutor/ujian'], ['Bank Soal', 'inventory_2', '/tutor/bank-soal'], ['Penilaian', 'grading', '/tutor/penilaian'], ['Presensi', 'event_available', '/tutor/kehadiran'], ['Diskusi', 'forum', '/diskusi']]],
        ['Lainnya', [['Pengumuman', 'campaign', '/pengumuman'], ['Jadwal Mengajar', 'calendar_month', '/jadwal'], ['Profil Saya', 'person', '/profil']]],
    ],
    siswa: [
        ['Utama', [['Dashboard', 'space_dashboard', '/siswa'], ['Kelas Saya', 'meeting_room', '/siswa/kelas'], ['Mata Pelajaran', 'menu_book', '/siswa/mapel']]],
        ['Belajar', [['Materi Pembelajaran', 'local_library', '/siswa/materi'], ['Tugas Saya', 'assignment', '/siswa/tugas'], ['Ujian', 'quiz', '/siswa/ujian'], ['Jadwal Belajar', 'calendar_month', '/jadwal'], ['Nilai Saya', 'insights', '/siswa/nilai']]],
        ['Lainnya', [['Pengumuman', 'campaign', '/pengumuman'], ['Kehadiran', 'event_available', '/siswa/kehadiran'], ['Profil Saya', 'person', '/profil']]],
    ],
};
const BOTTOM = {
    admin: ['/admin', '/admin/peserta-didik', '/admin/kelas', '/pengumuman'],
    tutor: ['/tutor', '/tutor/kelas', '/tutor/penilaian', '/jadwal'],
    siswa: ['/siswa', '/siswa/materi', '/siswa/tugas', '/siswa/nilai'],
};
const SHORT = { Dashboard: 'Beranda', 'Data Peserta Didik': 'Siswa', 'Data Kelas': 'Kelas', 'Kelas Saya': 'Kelas', 'Materi Pembelajaran': 'Materi', 'Tugas Saya': 'Tugas', 'Nilai Saya': 'Nilai', 'Jadwal Mengajar': 'Jadwal' };
export const ROLE = { admin: 'Administrator', tutor: 'Tutor', siswa: 'Peserta Didik' };
const SEARCH = { admin: '/admin/peserta-didik', tutor: '/tutor/materi', siswa: '/siswa/materi' };

/** Menu yang aktif = href terpanjang yang cocok dengan URL. Halaman detail bersama dipetakan ke menu induknya. */
function activeHref(role, url) {
    const path = url.split('?')[0].replace(/^\/(materi|kelas)\/.*/, `/${role}/$1`).replace(/^\/presensi\/.*/, `/${role}/kehadiran`).replace(/^\/diskusi.*/, role === 'tutor' ? '/diskusi' : `/${role}/materi`);
    const hrefs = MENU[role].flatMap(([, items]) => items.map((i) => i[2]));
    return hrefs.filter((h) => path === h || path.startsWith(h + '/')).sort((a, b) => b.length - a.length)[0];
}

function Sidebar({ role, active, onNavigate }) {
    const { app } = usePage().props;
    const [ctxLabel, ctxValue] = app.konteks;
    return (
        <div className="flex h-full flex-col bg-primary-container text-on-primary">
            <Link href={`/${role}`} onClick={onNavigate} className="flex h-16 shrink-0 items-center gap-3 bg-primary px-5">
                <Logo />
                <div className="leading-none">
                    <p className="text-headline-md">PKBM BHP</p>
                    <p className="mt-1 text-caption tracking-wider text-secondary-container uppercase">Bina Harapan Permata</p>
                </div>
            </Link>
            <div className="px-4 py-3">
                <div className="flex items-center justify-between rounded-lg bg-primary px-3 py-2">
                    <span className="text-caption text-primary-fixed">{ctxLabel}</span>
                    <span className="rounded bg-secondary-container px-1.5 py-0.5 text-label-sm font-bold text-on-secondary-fixed">{ctxValue}</span>
                </div>
            </div>
            <nav aria-label="Navigasi utama" className="flex-1 space-y-5 overflow-y-auto px-4 pb-4 scrollbar-none">
                {MENU[role].map(([group, items]) => (
                    <div key={group}>
                        <p className="mb-1.5 px-3 text-caption tracking-wider text-primary-fixed-dim/70 uppercase">{group}</p>
                        <ul className="space-y-0.5">
                            {items.map(([label, icon, href]) => {
                                const on = href === active;
                                return (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            onClick={onNavigate}
                                            aria-current={on ? 'page' : undefined}
                                            className={cx(
                                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-label-md transition',
                                                on ? 'bg-secondary-container font-bold text-on-secondary-fixed shadow-sm' : 'text-primary-fixed-dim hover:bg-primary hover:text-on-primary',
                                            )}
                                        >
                                            <Icon n={icon} fill={on} />
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
            <div className="m-4 mt-0 flex items-center justify-between rounded-lg bg-primary p-3">
                <span className="flex items-center gap-2 text-caption text-on-primary">
                    <Icon n="verified" className="!text-[18px] text-secondary-container" />
                    T.A. {app.ta}
                </span>
                <span className="text-caption text-primary-fixed-dim">{app.semester}</span>
            </div>
        </div>
    );
}

function Toast() {
    const page = usePage();
    const [msg, setMsg] = useState(null);
    useEffect(() => {
        if (!page.props.flash) return;
        setMsg(page.props.flash);
        const t = setTimeout(() => setMsg(null), 4500);
        return () => clearTimeout(t);
    }, [page]);
    if (!msg) return null;
    return (
        <div role="status" className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-inverse-surface p-3.5 pr-2 text-white shadow-modal md:bottom-6">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-container text-primary-container">
                <Icon n="check" className="!text-[18px]" />
            </span>
            <p className="flex-1 text-label-md">{msg}</p>
            <button type="button" onClick={() => setMsg(null)} className="btn-icon size-8 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Tutup notifikasi">
                <Icon n="close" className="!text-[18px]" />
            </button>
        </div>
    );
}

export default function AppLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth.user;
    const role = user.role;
    const active = activeHref(role, url);
    const [drawer, setDrawer] = useState(false);
    const [q, setQ] = useState('');
    const flat = MENU[role].flatMap(([, items]) => items);

    useEffect(() => {
        if (!drawer) return;
        const esc = (e) => e.key === 'Escape' && setDrawer(false);
        document.addEventListener('keydown', esc);
        return () => document.removeEventListener('keydown', esc);
    }, [drawer]);

    return (
        <div className="min-h-dvh">
            <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-secondary-container focus:px-4 focus:py-2 focus:font-bold">
                Lewati ke konten
            </a>

            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block print:hidden">
                <Sidebar role={role} active={active} />
            </aside>

            {drawer && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
                    <div className="absolute inset-0 bg-on-surface/40" onClick={() => setDrawer(false)} />
                    <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-modal">
                        <Sidebar role={role} active={active} onNavigate={() => setDrawer(false)} />
                    </aside>
                    <button type="button" onClick={() => setDrawer(false)} className="absolute top-3 left-[min(18.5rem,calc(85vw+0.5rem))] grid size-10 place-items-center rounded-full bg-white text-on-surface shadow" aria-label="Tutup menu">
                        <Icon n="close" />
                    </button>
                </div>
            )}

            <div className="lg:pl-64 print:pl-0">
                <header className="sticky top-0 z-30 flex h-16 print:hidden items-center gap-2 border-b border-outline-variant/70 bg-surface/85 px-4 backdrop-blur-xl sm:gap-3 sm:px-6 lg:px-8">
                    <button type="button" className="btn-icon -ml-2 lg:hidden" onClick={() => setDrawer(true)} aria-label="Buka menu">
                        <Icon n="menu" />
                    </button>
                    <Link href={`/${role}`} className="flex items-center gap-2 md:hidden">
                        <Logo className="size-8" />
                        <span className="text-label-md font-bold">PKBM BHP</span>
                    </Link>
                    <form
                        className="relative hidden max-w-lg flex-1 md:block"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (q.trim()) router.get(SEARCH[role], { q: q.trim() });
                        }}
                    >
                        <Icon n="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline" />
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={role === 'admin' ? 'Cari peserta didik, NISN, atau kelas…' : 'Cari materi, tugas, atau modul…'}
                            aria-label="Pencarian"
                            className="input min-h-10 border-transparent bg-surface-container-lowest pl-10"
                        />
                    </form>

                    <div className="ml-auto flex items-center gap-1 sm:gap-2">
                        <span className="hidden items-center gap-1.5 rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-3 py-1.5 text-label-sm font-semibold xl:flex">
                            <Icon n="badge" className="!text-[18px] text-primary-container" />
                            Peran: {ROLE[role]}
                        </span>
                        <Link href="/notifikasi" className="btn-icon relative" aria-label={`Notifikasi, ${props.app.notif} belum dibaca`}>
                            <Icon n="notifications" />
                            {props.app.notif > 0 && (
                                <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">{props.app.notif > 9 ? '9+' : props.app.notif}</span>
                            )}
                        </Link>
                        <Dropdown
                            className="w-64"
                            trigger={({ toggle, open }) => (
                                <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-surface-container-lowest sm:pl-3">
                                    <span className="hidden text-right sm:block">
                                        <span className="block text-label-md leading-tight">{user.name}</span>
                                        <span className="block text-caption text-on-surface-variant">{user.info}</span>
                                    </span>
                                    {user.foto ? (
                                        <img src={user.foto} alt="" className="size-9 rounded-full object-cover ring-2 ring-secondary-container" />
                                    ) : (
                                        <span className="grid size-9 place-items-center rounded-full bg-primary-container text-xs font-bold text-on-primary ring-2 ring-secondary-container">{user.initials}</span>
                                    )}
                                </button>
                            )}
                        >
                            <div className="mb-1 flex items-center gap-3 border-b border-outline-variant/70 px-3 pt-2 pb-3">
                                <Avatar name={user.name} size="sm" />
                                <div className="min-w-0">
                                    <p className="truncate text-label-md">{user.name}</p>
                                    <p className="truncate text-label-sm text-on-surface-variant">{ROLE[role]}</p>
                                </div>
                            </div>
                            <MenuItem icon="person" href="/profil">Profil Saya</MenuItem>
                            <MenuItem icon="edit" href="/profil/edit">Edit Profil</MenuItem>
                            <MenuItem icon="manage_accounts" href="/pengaturan-akun">Pengaturan Akun</MenuItem>
                            <MenuItem icon="history" href="/riwayat-aktivitas">Riwayat Aktivitas</MenuItem>
                            <div className="my-1 border-t border-outline-variant/70" />
                            <MenuItem icon="logout" href="/logout" method="post" danger>
                                Keluar
                            </MenuItem>
                        </Dropdown>
                    </div>
                </header>

                <main id="konten" className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-28 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
                    {children}
                </main>
            </div>

            <nav aria-label="Navigasi cepat" className="fixed inset-x-0 bottom-0 z-30 print:hidden border-t border-outline-variant bg-surface-container-lowest/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
                <ul className="grid grid-cols-5">
                    {BOTTOM[role].map((href) => {
                        const [label, icon] = flat.find((i) => i[2] === href);
                        const on = href === active;
                        return (
                            <li key={href}>
                                <Link href={href} aria-current={on ? 'page' : undefined} className={cx('flex flex-col items-center gap-1 py-2 text-[11px] font-semibold', on ? 'text-primary-container' : 'text-on-surface-variant')}>
                                    <span className={cx('grid h-7 w-12 place-items-center rounded-full transition', on && 'bg-secondary-container')}>
                                        <Icon n={icon} fill={on} />
                                    </span>
                                    {SHORT[label] ?? label}
                                </Link>
                            </li>
                        );
                    })}
                    <li>
                        <button type="button" onClick={() => setDrawer(true)} className="flex w-full flex-col items-center gap-1 py-2 text-[11px] font-semibold text-on-surface-variant">
                            <span className="grid h-7 w-12 place-items-center">
                                <Icon n="apps" />
                            </span>
                            Lainnya
                        </button>
                    </li>
                </ul>
            </nav>

            <Toast />
        </div>
    );
}
