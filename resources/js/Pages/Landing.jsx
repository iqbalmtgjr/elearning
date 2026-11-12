import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Badge, Icon, Logo, Modal, Progress, SearchInput, cx } from '../Components/ui';

const KATEGORI_TONE = {
    Akademik: 'primary',
    Kegiatan: 'lime',
    Administrasi: 'warning',
    Sistem: 'neutral',
};

const PROGRAM_META = {
    'Paket A': {
        badge: 'Setara SD / MI',
        icon: 'child_care',
        tone: 'from-emerald-900 to-primary-container',
        accent: 'bg-secondary-container text-primary-container',
        sasaran: 'Usia sekolah maupun dewasa yang ingin menuntaskan pendidikan dasar.',
        jadwal: 'Sabtu / Minggu pagi & modul mandiri fleksibel',
        targetLulusan: 'Penguasaan literasi, numerasi dasar, karakter, dan kesiapan melanjutkan ke Paket B / SMP.',
    },
    'Paket B': {
        badge: 'Setara SMP / MTs',
        icon: 'menu_book',
        tone: 'from-primary-container to-primary',
        accent: 'bg-primary-fixed text-primary-container',
        sasaran: 'Lulusan SD/MI atau Paket A yang ingin meraih ijazah setara SMP.',
        jadwal: ' Akhir pekan tatap muka & sesi daring malam hari',
        targetLulusan: 'Penguatan sains, bahasa, teknologi informasi dasar, serta kesiapan ke jenjang menengah atas.',
    },
    'Paket C': {
        badge: 'Setara SMA / MA',
        icon: 'workspace_premium',
        tone: 'from-inverse-surface to-primary-container',
        accent: 'bg-secondary-container text-on-secondary-fixed',
        sasaran: 'Peserta usia sekolah, pekerja, dan masyarakat umum menuju jenjang perguruan tinggi atau karier.',
        jadwal: 'Tatap muka akhir pekan & kelas daring interaktif malam hari',
        targetLulusan: 'Ijazah resmi negara untuk melanjutkan ke Perguruan Tinggi (PTN/PTS), kenaikan karier, dan wirausaha.',
    },
};

const KEUNGGULAN = [
    {
        icon: 'devices',
        title: 'Learning Management System (LMS) Terpadu',
        desc: 'Akses modul bacaan, video pembelajaran, dokumen PDF, hingga pengumpulan tugas langsung dari ponsel atau laptop kapan saja.',
        tag: 'Akses 24/7',
        span: 'lg:col-span-7',
        highlight: true,
    },
    {
        icon: 'schedule',
        title: 'Waktu Belajar Fleksibel (Blended Learning)',
        desc: 'Kombinasi tutorial tatap muka di akhir pekan dan kelas daring pada malam hari yang dirancang ramah bagi peserta didik yang sambil bekerja.',
        tag: 'Tatap Muka & Daring',
        span: 'lg:col-span-5',
    },
    {
        icon: 'quiz',
        title: 'Ujian Berbasis Komputer (CBT) Transparan',
        desc: 'Soal pilihan ganda dinilai otomatis detik itu juga, sedangkan soal esai dikoreksi langsung oleh tutor pengampu disertai umpan balik.',
        tag: 'Evaluasi Akurat',
        span: 'lg:col-span-4',
    },
    {
        icon: 'forum',
        title: 'Diskusi Interaktif & Pendampingan Wali Kelas',
        desc: 'Tanyakan materi yang belum dipahami langsung pada kolom diskusi tiap modul dan pantau perkembangan bersama wali kelas.',
        tag: 'Pendampingan Aktif',
        span: 'lg:col-span-4',
    },
    {
        icon: 'verified',
        title: 'Rapor Digital & Ijazah Resmi Negara',
        desc: 'Rekapitulasi nilai tugas, ujian, dan presensi tercatat rapi menjadi rapor resmi serta ijazah kesetaraan yang diakui secara nasional.',
        tag: 'Terdaftar & Resmi',
        span: 'lg:col-span-4',
    },
];

const ALUR = [
    {
        no: '01',
        icon: 'how_to_reg',
        title: 'Pendaftaran & Verifikasi',
        desc: 'Calon peserta didik mendaftar melalui Tata Usaha PKBM BHP dengan menyerahkan dokumen identitas dan ijazah terakhir.',
    },
    {
        no: '02',
        icon: 'badge',
        title: 'Aktivasi Akun NISN',
        desc: 'Peserta didik ditempatkan sesuai program (Paket A/B/C) dan menerima akun login portal pembelajaran menggunakan NISN.',
    },
    {
        no: '03',
        icon: 'local_library',
        title: 'Pembelajaran Terjadwal & Mandiri',
        desc: 'Mengikuti sesi tatap muka/daring bersama tutor, mempelajari modul digital, berdiskusi, dan mengumpulkan tugas tepat waktu.',
    },
    {
        no: '04',
        icon: 'school',
        title: 'Evaluasi CBT, Rapor & Kelulusan',
        desc: 'Mengikuti ujian tengah/akhir semester melalui CBT, memantau capaian KKM pada rapor digital, hingga kelulusan resmi.',
    },
];

const FAQ = [
    {
        q: 'Apakah ijazah PKBM Bina Harapan Permata diakui untuk melamar kerja dan daftar kuliah?',
        a: 'Ya, 100% diakui secara resmi oleh negara. Ijazah Program Paket A setara SD/MI, Paket B setara SMP/MTs, dan Paket C setara SMA/MA sehingga memiliki hak eligibilitas yang sama untuk mendaftar ke Perguruan Tinggi Negeri/Swasta maupun melamar pekerjaan di instansi pemerintah dan swasta.',
    },
    {
        q: 'Bagaimana jika saya bekerja di hari biasa? Apakah tetap bisa mengikuti pelajaran?',
        a: 'Sangat bisa. PKBM BHP menerapkan metode Blended Learning: pertemuan tatap muka dilaksanakan pada akhir pekan (Sabtu/Minggu) dan sesi daring dilaksanakan pada malam hari, ditambah modul mandiri di portal ini yang dapat diakses 24 jam.',
    },
    {
        q: 'Bagaimana cara masuk (login) bagi peserta didik dan tutor?',
        a: 'Klik tombol "Masuk Portal Belajar" di pojok kanan atas. Peserta didik dapat masuk menggunakan NISN atau email terdaftar (kata sandi awal adalah NISN), sedangkan tutor dan administrator masuk menggunakan username atau email resmi.',
    },
    {
        q: 'Di mana saya bisa melihat pengumuman resmi terkait jadwal ujian atau libur akademik?',
        a: 'Seluruh pengumuman resmi yang diterbitkan oleh Super Admin dapat dilihat langsung pada bagian "Papan Pengumuman Resmi" di halaman depan ini maupun di menu Pengumuman setelah Anda masuk ke dashboard.',
    },
    {
        q: 'Apakah pembelajaran dan ujian bisa diakses lewat ponsel (HP)?',
        a: 'Tentu. Seluruh tampilan portal PKBM BHP telah dioptimalkan untuk layar ponsel Android/iPhone, tablet, maupun komputer dengan penggunaan kuota data yang ringan.',
    },
];

/** Animasi angka naik saat elemen masuk ke layar. */
function AnimatedNumber({ value, suffix = '' }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let frame;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                obs.disconnect();
                const target = Number(value) || 0;
                if (target === 0) {
                    setDisplay(0);
                    return;
                }
                const start = performance.now();
                const duration = 1100;
                const tick = (now) => {
                    const p = Math.min(1, (now - start) / duration);
                    const eased = 1 - Math.pow(1 - p, 3);
                    setDisplay(Math.round(eased * target));
                    if (p < 1) frame = requestAnimationFrame(tick);
                };
                frame = requestAnimationFrame(tick);
            },
            { threshold: 0.25 },
        );
        obs.observe(el);
        return () => {
            obs.disconnect();
            if (frame) cancelAnimationFrame(frame);
        };
    }, [value]);

    return (
        <span ref={ref}>
            {display}
            {suffix}
        </span>
    );
}

export default function Landing({ lembaga = {}, statistik = {}, pengumuman = [], program = [], tutor = [] }) {
    const user = usePage().props.auth?.user;
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [kat, setKat] = useState('semua');
    const [cari, setCari] = useState('');
    const [detailPengumuman, setDetailPengumuman] = useState(null);
    const [programAktif, setProgramAktif] = useState(program[2]?.nama || program[0]?.nama || 'Paket C');
    const [faqTerbuka, setFaqTerbuka] = useState(0);

    const namaLembaga = lembaga.nama_lembaga || 'PKBM Bina Harapan Permata';
    const namaSingkat = lembaga.nama_singkat || 'PKBM BHP';
    const tahunAjaran = lembaga.tahun_ajaran || '2026/2027';
    const semester = lembaga.semester || 'Ganjil';
    const alamat = lembaga.alamat || 'Jl. Pendidikan Kesetaraan No. 18, Bojonggede, Kabupaten Bogor, Jawa Barat';
    const telepon = lembaga.telepon || '(0251) 855-2410 · 0812-8890-1123';
    const email = lembaga.email || 'info@pkbmbhp.sch.id';
    const npsn = lembaga.npsn || 'P2964018';

    // Pantau scroll untuk efek navbar kaca & reveal elemen
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const els = document.querySelectorAll('.reveal:not([data-revealed="1"])');
        if (!('IntersectionObserver' in window)) {
            els.forEach((el) => el.setAttribute('data-revealed', '1'));
            return;
        }
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.setAttribute('data-revealed', '1');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -20px 0px' },
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, [kat, cari]);

    const pengumumanPenting = useMemo(() => pengumuman.find((p) => p.penting) || pengumuman[0] || null, [pengumuman]);

    const daftarPengumuman = useMemo(
        () =>
            pengumuman.filter(
                (p) =>
                    (kat === 'semua' || p.kategori === kat) &&
                    `${p.judul} ${p.ringkas} ${p.kategori}`.toLowerCase().includes(cari.trim().toLowerCase()),
            ),
        [pengumuman, kat, cari],
    );

    const kategoriTabs = useMemo(
        () => [
            ['semua', 'Semua', pengumuman.length],
            ...Object.keys(KATEGORI_TONE).map((k) => [k, k, pengumuman.filter((p) => p.kategori === k).length]),
        ],
        [pengumuman],
    );

    const navItems = [
        ['#pengumuman', 'Pengumuman', pengumuman.length ? pengumuman.length : null],
        ['#program', 'Program'],
        ['#keunggulan', 'Keunggulan'],
        ['#alur', 'Alur Belajar'],
        ['#tutor', 'Tim Tutor'],
        ['#faq', 'FAQ'],
    ];

    const dashboardUrl = user ? `/${user.role}` : '/login';

    return (
        <div className="min-h-dvh bg-surface text-on-surface selection:bg-secondary-container selection:text-on-secondary-fixed">
            <Head title={`Beranda Resmi · ${namaLembaga}`} />

            {/* ── Top Bar Pengumuman Penting dari Super Admin ─────────────────── */}
            {pengumumanPenting && (
                <div className="relative z-40 border-b border-white/10 bg-inverse-surface px-4 py-2 text-white">
                    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-label-sm">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-0.5 text-caption font-bold text-on-secondary-fixed">
                                <span className="size-1.5 animate-ping rounded-full bg-primary-container" />
                                {pengumumanPenting.penting ? 'INFO PENTING' : 'PENGUMUMAN TERBARU'}
                            </span>
                            <p className="truncate font-medium text-white/90">{pengumumanPenting.judul}</p>
                            <span className="hidden text-white/50 sm:inline">· {pengumumanPenting.tanggal}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDetailPengumuman(pengumumanPenting)}
                            className="inline-flex shrink-0 items-center gap-1 font-semibold text-secondary-container transition hover:underline"
                        >
                            Baca Selengkapnya
                            <Icon n="arrow_forward" className="!text-[15px]" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Navigasi Utama (Sticky Glassmorphism) ───────────────────────── */}
            <header
                className={cx(
                    'sticky top-0 z-30 transition-all duration-300',
                    scrolled
                        ? 'border-b border-outline-variant/80 bg-surface-container-lowest/90 py-3 shadow-card backdrop-blur-xl'
                        : 'bg-primary-container py-4 text-on-primary',
                )}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <a href="#beranda" className="flex items-center gap-3">
                        <span
                            className={cx(
                                'grid size-11 place-items-center rounded-xl p-1.5 shadow-sm transition',
                                scrolled ? 'bg-primary-container text-secondary-container' : 'bg-white text-primary-container',
                            )}
                        >
                            <Logo className="size-full" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-headline-md leading-tight font-bold tracking-tight">{namaSingkat}</span>
                                <span
                                    className={cx(
                                        'hidden rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase sm:inline-block',
                                        scrolled ? 'bg-primary-container/10 text-primary-container' : 'bg-white/15 text-secondary-container',
                                    )}
                                >
                                    NPSN {npsn}
                                </span>
                            </div>
                            <p className={cx('text-caption tracking-wider uppercase', scrolled ? 'text-on-surface-variant' : 'text-on-primary-container')}>
                                {namaLembaga}
                            </p>
                        </div>
                    </a>

                    <nav aria-label="Navigasi Beranda" className="hidden items-center gap-1 lg:flex">
                        {navItems.map(([href, label, badge]) => (
                            <a
                                key={href}
                                href={href}
                                className={cx(
                                    ' inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-label-md transition',
                                    scrolled
                                        ? 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container'
                                        : 'text-white/85 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                {label}
                                {badge != null && (
                                    <span
                                        className={cx(
                                            'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                                            scrolled ? 'bg-secondary-container text-on-secondary-fixed' : 'bg-secondary-container text-primary-container',
                                        )}
                                    >
                                        {badge}
                                    </span>
                                )}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-2.5 sm:flex">
                        <a
                            href="#pengumuman"
                            className={cx(
                                'btn btn-sm',
                                scrolled ? 'btn-soft' : 'border border-white/20 bg-white/10 text-white hover:bg-white/20',
                            )}
                        >
                            <Icon n="campaign" className="!text-[17px]" />
                            Pengumuman
                        </a>
                        <Link href={dashboardUrl} className={cx('btn', scrolled ? 'btn-primary' : 'btn-accent')}>
                            <Icon n={user ? 'space_dashboard' : 'login'} className="!text-[18px]" />
                            {user ? 'Buka Dashboard' : 'Masuk Portal'}
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileMenu(!mobileMenu)}
                        aria-label="Menu navigasi"
                        className={cx(
                            'grid size-10 place-items-center rounded-lg lg:hidden',
                            scrolled ? 'text-on-surface hover:bg-surface-container-low' : 'text-white hover:bg-white/10',
                        )}
                    >
                        <Icon n={mobileMenu ? 'close' : 'menu'} />
                    </button>
                </div>

                {/* Menu Mobile */}
                {mobileMenu && (
                    <div className="border-t border-outline-variant/60 bg-surface-container-lowest px-4 pt-3 pb-5 text-on-surface shadow-pop lg:hidden">
                        <div className="flex flex-col gap-1">
                            {navItems.map(([href, label, badge]) => (
                                <a
                                    key={href}
                                    href={href}
                                    onClick={() => setMobileMenu(false)}
                                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-label-md hover:bg-surface-container-low"
                                >
                                    <span>{label}</span>
                                    {badge != null && <Badge tone="lime">{badge} info</Badge>}
                                </a>
                            ))}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-outline-variant/60 pt-4">
                            <a href="#pengumuman" onClick={() => setMobileMenu(false)} className="btn btn-soft">
                                <Icon n="campaign" className="!text-[18px]" />
                                Pengumuman
                            </a>
                            <Link href={dashboardUrl} className="btn btn-primary">
                                <Icon n={user ? 'space_dashboard' : 'login'} className="!text-[18px]" />
                                {user ? 'Dashboard' : 'Masuk Portal'}
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* ── Hero Section ────────────────────────────────────────────────── */}
            <section id="beranda" className="relative overflow-hidden bg-primary-container pt-8 pb-20 text-on-primary sm:pt-14 lg:pt-16 lg:pb-28">
                {/* Dekorasi Latar & Cahaya */}
                <div className="animate-pulse-glow pointer-events-none absolute -top-28 -left-28 size-[420px] rounded-full bg-secondary-container/15 blur-3xl" />
                <div className="animate-pulse-glow pointer-events-none absolute right-0 bottom-0 size-[480px] rounded-full bg-primary-fixed/15 blur-3xl" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
                        {/* Kolom Kiri: Copywriting Utama */}
                        <div className="lg:col-span-7">
                            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-label-sm backdrop-blur-sm">
                                <span className="inline-flex items-center gap-1 font-bold text-secondary-container">
                                    <Icon n="verified" fill className="!text-[16px]" />
                                    Terakreditasi Resmi
                                </span>
                                <span className="text-white/40">·</span>
                                <span className="text-white/90">
                                    Tahun Ajaran {tahunAjaran} ({semester})
                                </span>
                            </div>

                            <h1 className="mt-6 text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl sm:leading-[1.12] lg:text-[50px]">
                                Pendidikan Kesetaraan{' '}
                                <span className="relative inline-block text-secondary-container">
                                    Berkualitas, Fleksibel,
                                    <svg
                                        className="pointer-events-none absolute -bottom-1.5 left-0 w-full text-secondary-container/45"
                                        viewBox="0 0 300 12"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 9C75 3 225 3 297 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                    </svg>
                                </span>{' '}
                                dan Terintegrasi Digital
                            </h1>

                            <p className="mt-6 max-w-2xl text-base leading-relaxed text-primary-fixed/90 sm:text-lg">
                                {namaLembaga} menyelenggarakan pendidikan kesetaraan <b>Paket A (Setara SD)</b>, <b>Paket B (Setara SMP)</b>, dan{' '}
                                <b>Paket C (Setara SMA)</b> dengan dukungan Learning Management System (LMS) modern, ujian berbasis komputer, serta jadwal yang
                                ramah bagi peserta usia sekolah maupun pekerja.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3.5">
                                <Link href={dashboardUrl} className="btn btn-accent min-h-12 px-6 text-body-md shadow-pop">
                                    <Icon n={user ? 'space_dashboard' : 'login'} className="!text-[20px]" />
                                    {user ? `Masuk ke Dashboard (${user.name})` : 'Masuk Portal Belajar'}
                                    <Icon n="arrow_forward" className="!text-[18px]" />
                                </Link>
                                <a
                                    href="#pengumuman"
                                    className="btn min-h-12 border border-white/20 bg-white/10 px-5 text-body-md text-white backdrop-blur-sm hover:bg-white/20"
                                >
                                    <Icon n="campaign" className="!text-[20px] text-secondary-container" />
                                    Papan Pengumuman
                                    {pengumuman.length > 0 && (
                                        <span className="ml-1 rounded-full bg-secondary-container px-2 py-0.5 text-caption font-bold text-primary-container">
                                            {pengumuman.length}
                                        </span>
                                    )}
                                </a>
                            </div>

                            <div className="mt-9 grid grid-cols-3 gap-4 border-t border-white/15 pt-7 sm:flex sm:flex-wrap sm:items-center sm:gap-8">
                                {[
                                    ['workspace_premium', 'Ijazah Resmi Negara', 'Diakui kuliah & kerja'],
                                    ['laptop_chromebook', 'Blended Learning', 'Tatap muka & daring'],
                                    ['fact_check', 'CBT & Rapor Digital', 'Transparan & terukur'],
                                ].map(([ic, title, sub]) => (
                                    <div key={title} className="flex items-start gap-2.5">
                                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-secondary-container">
                                            <Icon n={ic} className="!text-[18px]" />
                                        </span>
                                        <div>
                                            <p className="text-label-md font-bold text-white">{title}</p>
                                            <p className="text-caption text-primary-fixed/75">{sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Kolom Kanan: Pratinjau Interaktif & Animasi Melayang */}
                        <div className="relative lg:col-span-5">
                            <div className="relative mx-auto max-w-md lg:max-w-none">
                                {/* Kartu Utama Pratinjau LMS */}
                                <div className="relative z-10 rounded-2xl border border-white/20 bg-surface-container-lowest p-5 text-on-surface shadow-modal sm:p-6">
                                    <div className="flex items-center justify-between border-b border-outline-variant/70 pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-10 place-items-center rounded-xl bg-primary-container text-secondary-container">
                                                <Icon n="school" fill />
                                            </span>
                                            <div>
                                                <p className="text-label-md font-bold">Portal Akademik {namaSingkat}</p>
                                                <p className="text-label-sm text-on-surface-variant">Pantauan Belajar Real-Time</p>
                                            </div>
                                        </div>
                                        <Badge tone="lime" dot>
                                            Aktif
                                        </Badge>
                                    </div>

                                    {/* Simulasi Progres Kelas */}
                                    <div className="mt-4 rounded-xl bg-surface-container-low p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <span className="eyebrow">Paket C · Setara SMA</span>
                                                <p className="mt-0.5 text-label-md font-bold">Bahasa Indonesia — Modul 3</p>
                                            </div>
                                            <span className="rounded-lg bg-primary-container px-2.5 py-1 text-label-sm font-bold text-secondary-container">
                                                85%
                                            </span>
                                        </div>
                                        <Progress value={85} className="mt-3" />
                                        <div className="mt-3 flex items-center justify-between text-label-sm text-on-surface-variant">
                                            <span className="flex items-center gap-1">
                                                <Icon n="check_circle" className="!text-[16px] text-success" />
                                                12 dari 14 materi tuntas
                                            </span>
                                            <span>KKM {lembaga.kkm || 75}</span>
                                        </div>
                                    </div>

                                    {/* Daftar Fitur Mini */}
                                    <div className="mt-4 space-y-2.5">
                                        {[
                                            ['play_circle', 'Video & Modul Interaktif', 'Tersedia di setiap mata pelajaran', 'bg-secondary-container/40 text-primary-container'],
                                            ['quiz', 'Ujian CBT Terjadwal', 'Penilaian otomatis & rekap nilai langsung', 'bg-primary-container/10 text-primary-container'],
                                        ].map(([ic, t, s, cls]) => (
                                            <div key={t} className="flex items-center gap-3 rounded-xl border border-outline-variant/60 p-3">
                                                <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg', cls)}>
                                                    <Icon n={ic} className="!text-[19px]" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-label-md font-semibold">{t}</p>
                                                    <p className="truncate text-label-sm text-on-surface-variant">{s}</p>
                                                </div>
                                                <Icon n="verified" className="!text-[18px] text-success" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Cuplikan Pengumuman Langsung di Kartu Hero */}
                                    {pengumumanPenting && (
                                        <button
                                            type="button"
                                            onClick={() => setDetailPengumuman(pengumumanPenting)}
                                            className="mt-4 flex w-full items-start gap-3 rounded-xl border border-primary-container/20 bg-primary-container/5 p-3.5 text-left transition hover:bg-primary-container/10"
                                        >
                                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-container text-secondary-container">
                                                <Icon n="campaign" className="!text-[18px]" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-caption font-bold text-primary-container uppercase">Pengumuman Super Admin</span>
                                                    <span className="text-caption text-on-surface-variant">· {pengumumanPenting.tanggal}</span>
                                                </div>
                                                <p className="mt-0.5 truncate text-label-md font-bold text-on-surface">{pengumumanPenting.judul}</p>
                                            </div>
                                        </button>
                                    )}
                                </div>

                                {/* Kartu Melayang 1 (Kiri Atas) */}
                                <div className="animate-float-slow pointer-events-none absolute -top-6 -left-6 z-20 hidden items-center gap-2.5 rounded-xl border border-white/15 bg-inverse-surface/95 px-4 py-3 text-white shadow-pop backdrop-blur-md sm:flex">
                                    <span className="grid size-9 place-items-center rounded-full bg-secondary-container text-primary-container">
                                        <Icon n="task_alt" className="!text-[18px]" />
                                    </span>
                                    <div>
                                        <p className="text-label-sm font-bold">Presensi & Rapor Resmi</p>
                                        <p className="text-caption text-primary-fixed">Terintegrasi Satu Pintu</p>
                                    </div>
                                </div>

                                {/* Kartu Melayang 2 (Kanan Bawah) */}
                                <div className="animate-float-delayed pointer-events-none absolute -right-4 -bottom-6 z-20 hidden items-center gap-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface shadow-pop sm:flex">
                                    <span className="grid size-9 place-items-center rounded-full bg-success-container text-success-ink">
                                        <Icon n="co_present" className="!text-[18px]" />
                                    </span>
                                    <div>
                                        <p className="text-label-sm font-bold">{statistik.tutor || 8}+ Tutor Berpengalaman</p>
                                        <p className="text-caption text-on-surface-variant">Siap membimbing setiap kelas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Baris Statistik (Animated Counters) */}
                    <div className="reveal mt-14 grid grid-cols-2 gap-3 sm:mt-16 sm:grid-cols-4 sm:gap-5">
                        {[
                            ['groups', statistik.siswa || 48, '+', 'Peserta Didik Aktif', 'Paket A, Paket B & Paket C'],
                            ['co_present', statistik.tutor || 8, '', 'Tutor Pendamping', 'Pendidik profesional & tersertifikasi'],
                            ['meeting_room', statistik.kelas || 6, '', 'Rombongan Belajar', 'Tatap muka akhir pekan & daring'],
                            ['library_books', statistik.materi || 24, '+', 'Modul & Materi Digital', 'Dilengkapi latihan & evaluasi CBT'],
                        ].map(([ic, val, suf, label, sub]) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm transition hover:border-secondary-container/40 hover:bg-white/12 sm:p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-extrabold text-secondary-container sm:text-3xl">
                                        <AnimatedNumber value={val} suffix={suf} />
                                    </span>
                                    <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-primary-fixed">
                                        <Icon n={ic} className="!text-[20px]" />
                                    </span>
                                </div>
                                <p className="mt-2 text-label-md font-bold text-white">{label}</p>
                                <p className="mt-0.5 text-caption text-primary-fixed/75">{sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Bagian Pengumuman Resmi Super Admin ─────────────────────────── */}
            <section id="pengumuman" className="scroll-mt-20 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="reveal flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/10 px-3.5 py-1 text-caption font-bold text-primary-container uppercase">
                                <Icon n="campaign" className="!text-[16px]" />
                                Informasi Resmi Super Admin
                            </div>
                            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                                Papan Pengumuman &amp; Informasi Akademik
                            </h2>
                            <p className="mt-2 max-w-2xl text-body-lg text-on-surface-variant">
                                Seluruh pengumuman resmi terkait jadwal ujian, kegiatan akademik, hingga administrasi ijazah diterbitkan langsung oleh
                                Administrator {namaLembaga}.
                            </p>
                        </div>

                        {user?.role === 'admin' ? (
                            <Link href="/pengumuman?tambah=1" className="btn btn-primary self-start lg:self-auto">
                                <Icon n="add_circle" className="!text-[18px]" />
                                Kelola / Tambah Pengumuman
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2 self-start rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2 text-label-sm text-on-surface-variant lg:self-auto">
                                <span className="size-2 rounded-full bg-success" />
                                Terhubung langsung dengan pusat informasi {namaSingkat}
                            </div>
                        )}
                    </div>

                    {/* Filter Kategori & Pencarian Pengumuman */}
                    <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div
                            role="tablist"
                            aria-label="Filter kategori pengumuman"
                            className="flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-1.5 shadow-card scrollbar-none"
                        >
                            {kategoriTabs.map(([k, label, count]) => {
                                const active = kat === k;
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => setKat(k)}
                                        className={cx(
                                            'flex items-center gap-2 rounded-lg px-3.5 py-2 text-label-md whitespace-nowrap transition',
                                            active
                                                ? 'bg-primary-container text-on-primary shadow-sm'
                                                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                                        )}
                                    >
                                        {label}
                                        <span
                                            className={cx(
                                                'rounded-full px-1.5 py-0.2 text-caption',
                                                active ? 'bg-secondary-container text-on-secondary-fixed' : 'bg-surface-container text-on-surface-variant',
                                            )}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <SearchInput
                            value={cari}
                            onChange={setCari}
                            placeholder="Cari pengumuman resmi…"
                            className="sm:w-72"
                        />
                    </div>

                    {/* Daftar Kartu Pengumuman */}
                    {daftarPengumuman.length > 0 ? (
                        <div className="mt-7 grid gap-5 lg:grid-cols-12">
                            {/* Sorotan Utama (Pengumuman Pertama) */}
                            {(() => {
                                const utama = daftarPengumuman[0];
                                const sisanya = daftarPengumuman.slice(1, 7);
                                return (
                                    <>
                                        <article
                                            onClick={() => setDetailPengumuman(utama)}
                                            className={cx(
                                                'reveal group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-primary-container p-6 text-on-primary shadow-pop transition hover:-translate-y-0.5 hover:shadow-modal sm:p-8',
                                                sisanya.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12',
                                            )}
                                        >
                                            <div className="pointer-events-none absolute -right-16 -bottom-16 size-64 rounded-full bg-secondary-container/10 blur-2xl transition group-hover:bg-secondary-container/20" />

                                            <div className="relative">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary-container px-2.5 py-1 text-label-sm font-bold text-on-secondary-fixed">
                                                        <Icon n={utama.penting ? 'priority_high' : 'campaign'} className="!text-[15px]" />
                                                        {utama.penting ? 'Pengumuman Penting' : utama.kategori}
                                                    </span>
                                                    {utama.penting && (
                                                        <span className="rounded-md bg-white/15 px-2.5 py-1 text-label-sm font-semibold text-white">
                                                            {utama.kategori}
                                                        </span>
                                                    )}
                                                    {utama.baru && (
                                                        <span className="rounded-md bg-white/15 px-2.5 py-1 text-label-sm font-semibold text-secondary-container">
                                                            Terbaru
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="mt-5 text-xl leading-snug font-bold text-white group-hover:text-secondary-container sm:text-2xl">
                                                    {utama.judul}
                                                </h3>

                                                <p className="mt-3 line-clamp-4 text-body-lg leading-relaxed text-primary-fixed/90">
                                                    {utama.ringkas}
                                                </p>
                                            </div>

                                            <div className="relative mt-8 border-t border-white/15 pt-5">
                                                <div className="flex flex-wrap items-center justify-between gap-3 text-label-sm text-primary-fixed">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="grid size-8 place-items-center rounded-full bg-white/15 text-secondary-container">
                                                            <Icon n="verified_user" className="!text-[16px]" />
                                                        </span>
                                                        <div>
                                                            <p className="font-semibold text-white">{utama.penulis}</p>
                                                            <p className="text-caption text-primary-fixed/80">
                                                                {utama.jabatan} · {utama.tanggal}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span className="inline-flex items-center gap-1 font-bold text-secondary-container group-hover:translate-x-1">
                                                        Baca Detail
                                                        <Icon n="arrow_forward" className="!text-[16px]" />
                                                    </span>
                                                </div>

                                                {utama.lampiran && (
                                                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-caption text-white">
                                                        <Icon n="attach_file" className="!text-[15px] text-secondary-container" />
                                                        Lampiran: {utama.lampiran.nama}
                                                    </div>
                                                )}
                                            </div>
                                        </article>

                                        {/* Daftar Pengumuman Lainnya */}
                                        {sisanya.length > 0 && (
                                            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                                                {sisanya.map((p) => (
                                                    <article
                                                        key={p.id}
                                                        onClick={() => setDetailPengumuman(p)}
                                                        className={cx(
                                                            'reveal card card-hover group flex cursor-pointer flex-col justify-between p-5 transition hover:-translate-y-0.5',
                                                            p.penting && 'border-l-4 border-l-danger',
                                                            !p.penting && p.baru && 'border-l-4 border-l-secondary-container',
                                                        )}
                                                    >
                                                        <div>
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <Badge tone={KATEGORI_TONE[p.kategori] || 'neutral'}>{p.kategori}</Badge>
                                                                    {p.penting && <Badge tone="danger">Penting</Badge>}
                                                                    {p.baru && !p.penting && (
                                                                        <Badge tone="lime" dot>
                                                                            Baru
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-caption text-on-surface-variant">{p.tanggal}</span>
                                                            </div>

                                                            <h3 className="mt-3 line-clamp-2 text-headline-md leading-snug text-on-surface transition group-hover:text-primary-container">
                                                                {p.judul}
                                                            </h3>

                                                            <p className="mt-2 line-clamp-3 text-body-md text-on-surface-variant">{p.ringkas}</p>
                                                        </div>

                                                        <div className="mt-5 flex items-center justify-between border-t border-outline-variant/60 pt-3.5 text-label-sm">
                                                            <span className="flex items-center gap-1.5 text-on-surface-variant">
                                                                <Icon n="admin_panel_settings" className="!text-[16px] text-primary-container" />
                                                                <span className="truncate">{p.penulis}</span>
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 font-semibold text-primary-container">
                                                                {p.lampiran && <Icon n="attach_file" className="!text-[15px]" />}
                                                                Detail
                                                                <Icon n="chevron_right" className="!text-[16px] transition group-hover:translate-x-0.5" />
                                                            </span>
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="card mt-7 p-12 text-center">
                            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface-container-low text-primary-container">
                                <Icon n="campaign" className="!text-[28px]" />
                            </span>
                            <p className="mt-4 text-headline-md font-bold">Belum ada pengumuman yang sesuai</p>
                            <p className="mt-1 text-on-surface-variant">Coba pilih kategori lain atau hapus kata kunci pencarian di atas.</p>
                            {(kat !== 'semua' || cari) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKat('semua');
                                        setCari('');
                                    }}
                                    className="btn btn-soft mt-4"
                                >
                                    Tampilkan Semua Pengumuman
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Program Pendidikan Kesetaraan (Paket A, B, C) ───────────────── */}
            <section id="program" className="scroll-mt-20 bg-surface-container-lowest py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="reveal text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3.5 py-1 text-caption font-bold text-on-secondary-fixed uppercase">
                            <Icon n="school" className="!text-[16px]" />
                            Jenjang Pendidikan Resmi
                        </span>
                        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">
                            Program Pendidikan Kesetaraan
                        </h2>
                        <p className="mx-auto mt-2 max-w-2xl text-body-lg text-on-surface-variant">
                            Pilih jenjang pendidikan yang sesuai dengan kebutuhan Anda. Seluruh kurikulum disusun mengacu pada standar nasional pendidikan.
                        </p>
                    </div>

                    <div className="reveal mt-10 grid gap-6 lg:grid-cols-3">
                        {(program.length
                            ? program
                            : [
                                { id: 1, nama: 'Paket A', setara: 'Setara SD / MI', tingkat: 'Tingkat I–III', kelas_count: 2, mapel_count: 6, mapel: [] },
                                { id: 2, nama: 'Paket B', setara: 'Setara SMP / MTs', tingkat: 'Tingkat IV', kelas_count: 2, mapel_count: 7, mapel: [] },
                                { id: 3, nama: 'Paket C', setara: 'Setara SMA / MA', tingkat: 'Tingkat V–VI', kelas_count: 2, mapel_count: 7, mapel: [] },
                            ]
                        ).map((p) => {
                            const meta = PROGRAM_META[p.nama] || PROGRAM_META['Paket C'];
                            const dipilih = programAktif === p.nama;
                            return (
                                <div
                                    key={p.id || p.nama}
                                    onClick={() => setProgramAktif(p.nama)}
                                    className={cx(
                                        'flex cursor-pointer flex-col justify-between rounded-2xl border p-6 transition duration-300 sm:p-7',
                                        dipilih
                                            ? 'border-primary-container bg-surface-container-lowest shadow-modal ring-2 ring-primary-container/15'
                                            : 'border-outline-variant/80 bg-surface-container-low/50 hover:border-primary-container/40 hover:bg-surface-container-lowest hover:shadow-hover',
                                    )}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <span className={cx('grid size-12 place-items-center rounded-2xl shadow-sm', meta.accent)}>
                                                <Icon n={meta.icon} className="!text-[24px]" />
                                            </span>
                                            <Badge tone={p.nama === 'Paket C' ? 'primary' : p.nama === 'Paket B' ? 'soft' : 'lime'}>
                                                {p.setara || meta.badge}
                                            </Badge>
                                        </div>

                                        <h3 className="mt-5 text-2xl font-extrabold text-on-surface">
                                            Program {p.nama}
                                        </h3>
                                        <p className="mt-1 text-label-sm font-semibold text-primary-container">
                                            {p.tingkat || 'Pendidikan Kesetaraan Terstruktur'} · {p.kelas_count || 2} Rombel Aktif
                                        </p>

                                        <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
                                            {p.deskripsi || meta.sasaran}
                                        </p>

                                        <div className="mt-5 space-y-2.5 border-t border-outline-variant/70 pt-4 text-label-sm">
                                            <div className="flex items-start gap-2">
                                                <Icon n="schedule" className="mt-0.5 !text-[16px] text-primary-container" />
                                                <span>
                                                    <b className="text-on-surface">Jadwal:</b> {meta.jadwal}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Icon n="verified" className="mt-0.5 !text-[16px] text-primary-container" />
                                                <span>
                                                    <b className="text-on-surface">Capaian:</b> {meta.targetLulusan}
                                                </span>
                                            </div>
                                        </div>

                                        {p.mapel?.length > 0 && (
                                            <div className="mt-5">
                                                <p className="eyebrow mb-2">Mata Pelajaran ({p.mapel.length})</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {p.mapel.map((m) => (
                                                        <span
                                                            key={m.nama}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-2.5 py-1 text-caption font-semibold text-on-surface"
                                                        >
                                                            <Icon n={m.icon || 'menu_book'} className="!text-[14px] text-primary-container" />
                                                            {m.nama}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4">
                                        <Link
                                            href={dashboardUrl}
                                            className={cx('btn w-full', dipilih ? 'btn-primary' : 'btn-ghost')}
                                        >
                                            <span>{user ? 'Buka Ruang Kelas' : `Masuk Kelas ${p.nama}`}</span>
                                            <Icon n="arrow_forward" className="!text-[17px]" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Bento Grid Keunggulan & Ekosistem Digital ───────────────────── */}
            <section id="keunggulan" className="scroll-mt-20 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="reveal flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <span className="eyebrow font-bold text-primary-container">Mengapa Memilih {namaSingkat}?</span>
                            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                                Ekosistem Pembelajaran Modern &amp; Inklusif
                            </h2>
                        </div>
                        <p className="max-w-xl text-body-lg text-on-surface-variant">
                            Dirancang dengan standar kenyamanan pengguna agar setiap peserta didik dapat belajar secara mandiri maupun terbimbing tanpa hambatan
                            teknis.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-5 lg:grid-cols-12">
                        {KEUNGGULAN.map((item) => (
                            <div
                                key={item.title}
                                className={cx(
                                    'reveal rounded-2xl border p-6 transition duration-300 hover:-translate-y-0.5 sm:p-7',
                                    item.span,
                                    item.highlight
                                        ? 'border-primary-container bg-primary-container text-on-primary shadow-pop'
                                        : 'border-outline-variant/80 bg-surface-container-lowest text-on-surface shadow-card hover:shadow-hover',
                                )}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span
                                        className={cx(
                                            'grid size-12 place-items-center rounded-2xl',
                                            item.highlight ? 'bg-secondary-container text-primary-container' : 'bg-surface-container-low text-primary-container',
                                        )}
                                    >
                                        <Icon n={item.icon} className="!text-[24px]" />
                                    </span>
                                    <span
                                        className={cx(
                                            'rounded-full px-3 py-1 text-caption font-bold',
                                            item.highlight ? 'bg-white/15 text-secondary-container' : 'bg-surface-container-low text-primary-container',
                                        )}
                                    >
                                        {item.tag}
                                    </span>
                                </div>
                                <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                                <p className={cx('mt-2 text-body-lg leading-relaxed', item.highlight ? 'text-primary-fixed/90' : 'text-on-surface-variant')}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Alur Pembelajaran Terpadu ───────────────────────────────────── */}
            <section id="alur" className="scroll-mt-20 bg-inverse-surface py-16 text-white sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="reveal text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-caption font-bold text-secondary-container uppercase">
                            <Icon n="route" className="!text-[16px]" />
                            Langkah demi Langkah
                        </span>
                        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">
                            Alur Belajar di {namaLembaga}
                        </h2>
                        <p className="mx-auto mt-2 max-w-2xl text-body-lg text-white/70">
                            Proses belajar yang jelas, terarah, dan dapat dipantau kemajuannya sejak hari pertama terdaftar hingga menerima ijazah.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {ALUR.map((s) => (
                            <div
                                key={s.no}
                                className="reveal relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-secondary-container/50 hover:bg-white/8"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-extrabold text-secondary-container">{s.no}</span>
                                        <span className="grid size-11 place-items-center rounded-xl bg-primary-container text-secondary-container">
                                            <Icon n={s.icon} />
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-headline-md font-bold text-white">{s.title}</h3>
                                    <p className="mt-2 text-body-md leading-relaxed text-white/75">{s.desc}</p>
                                </div>
                                <div className="mt-6 h-1 w-12 rounded-full bg-secondary-container/60" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Tim Pendidik & Tutor ────────────────────────────────────────── */}
            {tutor.length > 0 && (
                <section id="tutor" className="scroll-mt-20 py-16 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="reveal flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                            <div>
                                <span className="eyebrow font-bold text-primary-container">Tenaga Pendidik</span>
                                <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                                    Dibimbing oleh Tutor Berpengalaman
                                </h2>
                            </div>
                            <p className="max-w-xl text-body-lg text-on-surface-variant">
                                Para pendidik dan wali kelas yang berdedikasi mendampingi ketuntasan belajar setiap peserta didik secara humanis.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {tutor.map((t) => (
                                <div key={t.id} className="reveal card card-hover flex flex-col justify-between p-5">
                                    <div>
                                        <div className="flex items-center gap-3.5">
                                            <Avatar name={t.nama} size="md" />
                                            <div className="min-w-0">
                                                <h3 className="truncate text-label-md font-bold text-on-surface">{t.nama}</h3>
                                                <p className="truncate text-label-sm text-primary-container">{t.jabatan}</p>
                                            </div>
                                        </div>
                                        {t.pendidikan && (
                                            <p className="mt-3 flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                                                <Icon n="school" className="!text-[16px] text-outline" />
                                                <span className="truncate">{t.pendidikan}</span>
                                            </p>
                                        )}
                                    </div>
                                    {t.mapel?.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-1 border-t border-outline-variant/60 pt-3">
                                            {t.mapel.map((m) => (
                                                <Badge key={m} tone="soft">
                                                    {m}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Pertanyaan yang Sering Diajukan (FAQ) ───────────────────────── */}
            <section id="faq" className="scroll-mt-20 bg-surface-container-lowest py-16 sm:py-24">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="reveal text-center">
                        <span className="eyebrow font-bold text-primary-container">Pusat Bantuan</span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                            Pertanyaan yang Sering Diajukan
                        </h2>
                        <p className="mt-2 text-body-lg text-on-surface-variant">
                            Jawaban cepat seputar legalitas ijazah, jadwal belajar, dan penggunaan portal akademik {namaSingkat}.
                        </p>
                    </div>

                    <div className="reveal mt-10 space-y-3">
                        {FAQ.map((item, idx) => {
                            const open = faqTerbuka === idx;
                            return (
                                <div
                                    key={item.q}
                                    className={cx(
                                        'overflow-hidden rounded-2xl border transition',
                                        open ? 'border-primary-container bg-surface-container-low/50 shadow-card' : 'border-outline-variant bg-surface-container-lowest',
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setFaqTerbuka(open ? -1 : idx)}
                                        aria-expanded={open}
                                        className="flex w-full items-center justify-between gap-4 p-5 text-left"
                                    >
                                        <span className="text-headline-md font-bold text-on-surface">{item.q}</span>
                                        <span
                                            className={cx(
                                                'grid size-8 shrink-0 place-items-center rounded-full transition duration-300',
                                                open ? 'rotate-180 bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant',
                                            )}
                                        >
                                            <Icon n="expand_more" />
                                        </span>
                                    </button>
                                    {open && (
                                        <div className="border-t border-outline-variant/60 px-5 pt-3 pb-5 text-body-lg leading-relaxed text-on-surface-variant">
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Banner Ajakan Penutup (CTA) ─────────────────────────────────── */}
            <section className="py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="reveal relative overflow-hidden rounded-3xl bg-primary-container p-8 text-on-primary shadow-modal sm:p-12 lg:p-14">
                        <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-secondary-container/20 blur-3xl" />
                        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                            <div className="max-w-2xl">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-label-sm font-semibold text-secondary-container">
                                    <Icon n="rocket_launch" className="!text-[16px]" />
                                    Siap Belajar Hari Ini?
                                </span>
                                <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">
                                    Akses Ruang Belajar Digital {namaLembaga}
                                </h2>
                                <p className="mt-3 text-body-lg text-primary-fixed/90">
                                    Masuk menggunakan akun NISN (untuk Peserta Didik) atau akun resmi Tutor &amp; Administrator untuk mengakses materi, tugas,
                                    ujian CBT, serta pengumuman akademik terbaru.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href={dashboardUrl} className="btn btn-accent min-h-12 px-6 text-body-md">
                                    <Icon n={user ? 'space_dashboard' : 'login'} className="!text-[20px]" />
                                    {user ? 'Buka Dashboard Saya' : 'Masuk Portal Belajar'}
                                </Link>
                                <a
                                    href="#pengumuman"
                                    className="btn min-h-12 border border-white/25 bg-white/10 px-5 text-body-md text-white hover:bg-white/20"
                                >
                                    Lihat Pengumuman
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer Resmi Lembaga ────────────────────────────────────────── */}
            <footer className="border-t border-outline-variant bg-surface-container-lowest pt-14 pb-10 text-on-surface-variant">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-10 lg:grid-cols-12">
                        <div className="lg:col-span-5">
                            <div className="flex items-center gap-3">
                                <span className="grid size-11 place-items-center rounded-xl bg-primary-container p-1.5 text-secondary-container">
                                    <Logo className="size-full" />
                                </span>
                                <div>
                                    <p className="text-headline-md font-bold text-on-surface">{namaLembaga}</p>
                                    <p className="text-caption tracking-wider text-primary-container uppercase">
                                        NPSN {npsn} · Tahun Ajaran {tahunAjaran}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 max-w-md text-body-md leading-relaxed">
                                Lembaga pendidikan nonformal penyelenggara Program Pendidikan Kesetaraan Paket A (Setara SD), Paket B (Setara SMP), dan Paket C
                                (Setara SMA) berbasis teknologi pembelajaran terpadu.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
                            <div>
                                <p className="eyebrow font-bold text-on-surface">Navigasi</p>
                                <ul className="mt-3 space-y-2 text-label-md">
                                    {navItems.map(([href, label]) => (
                                        <li key={href}>
                                            <a href={href} className="transition hover:text-primary-container">
                                                {label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <p className="eyebrow font-bold text-on-surface">Layanan Portal</p>
                                <ul className="mt-3 space-y-2 text-label-md">
                                    <li>
                                        <Link href="/login" className="transition hover:text-primary-container">
                                            Login Peserta Didik
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/login" className="transition hover:text-primary-container">
                                            Login Tutor &amp; Wali Kelas
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/login" className="transition hover:text-primary-container">
                                            Login Administrator
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/lupa-password" className="transition hover:text-primary-container">
                                            Pemulihan Kata Sandi
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <p className="eyebrow font-bold text-on-surface">Kontak &amp; Sekretariat</p>
                                <ul className="mt-3 space-y-2.5 text-label-sm">
                                    <li className="flex items-start gap-2">
                                        <Icon n="location_on" className="mt-0.5 !text-[16px] text-primary-container" />
                                        <span>{alamat}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Icon n="call" className="!text-[16px] text-primary-container" />
                                        <span>{telepon}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Icon n="mail" className="!text-[16px] text-primary-container" />
                                        <span>{email}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-outline-variant/70 pt-6 text-caption sm:flex-row">
                        <p>© {new Date().getFullYear()} {namaLembaga}. Seluruh hak cipta dilindungi.</p>
                        <div className="flex items-center gap-4">
                            <Link href="/design-system" className="hover:text-primary-container hover:underline">
                                Sistem Desain
                            </Link>
                            <span>·</span>
                            <Link href={dashboardUrl} className="font-bold text-primary-container hover:underline">
                                {user ? 'Dashboard Akademik' : 'Portal Login'}
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ── Modal Baca Detail Pengumuman Resmi ──────────────────────────── */}
            <Modal
                open={!!detailPengumuman}
                onClose={() => setDetailPengumuman(null)}
                icon="campaign"
                title={detailPengumuman?.judul || 'Detail Pengumuman'}
                desc={detailPengumuman ? `Diterbitkan oleh ${detailPengumuman.penulis} (${detailPengumuman.jabatan}) · ${detailPengumuman.tanggal}` : ''}
                size="lg"
                footer={
                    <>
                        {detailPengumuman?.lampiran && (
                            <a href={detailPengumuman.lampiran.url} className="btn btn-soft mr-auto">
                                <Icon n="download" className="!text-[18px]" />
                                Unduh Lampiran ({detailPengumuman.lampiran.nama})
                            </a>
                        )}
                        <button type="button" className="btn btn-primary" onClick={() => setDetailPengumuman(null)}>
                            Tutup
                        </button>
                    </>
                }
            >
                {detailPengumuman && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={KATEGORI_TONE[detailPengumuman.kategori] || 'neutral'}>{detailPengumuman.kategori}</Badge>
                            {detailPengumuman.penting && <Badge tone="danger">Pengumuman Penting</Badge>}
                            {detailPengumuman.baru && (
                                <Badge tone="lime" dot>
                                    Terbaru ({detailPengumuman.waktu})
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-3 rounded-xl bg-surface-container-low p-4 text-body-lg leading-relaxed text-on-surface sm:p-5">
                            {(detailPengumuman.isi?.length ? detailPengumuman.isi : [detailPengumuman.ringkas]).map((paragraf, idx) => (
                                <p key={idx}>{paragraf}</p>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

