import { Head, Link, usePage } from '@inertiajs/react';
import { Badge, Card, Empty, Icon, MAPEL_TONE, Progress, SectionTitle, TUGAS, Timeline, cx } from '../../Components/ui';

/** Kartu mata pelajaran: ilustrasi, tutor, jumlah materi, progres, tombol lanjutkan. */
export function SubjectCard({ m, children }) {
    return (
        <Card className="card-hover group flex flex-col overflow-hidden !rounded-2xl">
            <div className={cx('relative h-24 overflow-hidden', MAPEL_TONE[m.tone])}>
                <span className="absolute -top-6 -right-6 size-28 rounded-full bg-current opacity-10" />
                <span className="absolute -bottom-10 left-16 size-24 rounded-full bg-current opacity-10" />
                <Icon n={m.icon} className="absolute right-5 bottom-3 !text-[52px] opacity-90 transition group-hover:scale-110" />
                <span className="absolute top-3 left-4 rounded bg-white/90 px-2 py-0.5 text-caption text-primary-container">{m.program ?? 'Paket C'}</span>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-headline-md leading-snug">{m.nama}</h3>
                <p className="mt-0.5 text-label-sm text-on-surface-variant">{m.tutor}</p>
                <p className="mt-3 flex items-center gap-1.5 rounded-md bg-surface-container-low px-2.5 py-1.5 text-label-sm text-ink-2">
                    <Icon n="folder" className="!text-[16px]" />
                    {m.materi} materi · {m.tugas} tugas
                </p>
                {children}
                <div className="mt-auto pt-4">
                    <div className="mb-1.5 flex justify-between text-label-sm">
                        <span className="text-on-surface-variant">Progres belajar</span>
                        <b>{m.progres}%</b>
                    </div>
                    <Progress value={m.progres} />
                    <Link href="/siswa/materi" data={{ mapel: m.nama }} className="btn btn-soft mt-4 w-full group-hover:bg-primary-container group-hover:text-on-primary">
                        {m.progres >= 100 ? 'Tinjau Materi' : 'Lanjutkan Belajar'}
                        <Icon n="arrow_forward" className="!text-[18px]" />
                    </Link>
                </div>
            </div>
        </Card>
    );
}

export default function Dashboard({ profil, lanjutkan, mapel, tugas, ujian, pengumuman, riwayat, nilai }) {
    const { user } = usePage().props.auth;
    return (
        <div className="space-y-6 lg:space-y-8">
            <Head title="Dashboard" />

            <section className="relative overflow-hidden rounded-xl bg-primary-container p-5 text-on-primary shadow-card sm:p-6">
                <div className="pointer-events-none absolute -top-20 -right-16 size-80 rounded-full bg-secondary-container/10 blur-3xl" />
                <div className="pointer-events-none absolute right-1/3 -bottom-24 size-60 rounded-full bg-primary/30 blur-2xl" />
                <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="max-w-2xl space-y-2">
                        <span className="inline-flex items-center gap-1.5 rounded bg-primary px-2.5 py-1 text-caption tracking-wider text-secondary-container uppercase">
                            <span className="size-1.5 animate-pulse rounded-full bg-secondary-container" />
                            Semester Ganjil 2026/2027
                        </span>
                        <h1 className="text-2xl font-bold sm:text-headline-xl">Halo, {user.name}!</h1>
                        <p className="text-headline-md font-normal text-primary-fixed-dim sm:text-headline-lg sm:font-normal">Tetap konsisten, setiap langkah kecil membawamu lebih dekat ke ijazah.</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-label-sm text-on-primary-container">
                            <span className="inline-flex items-center gap-1 font-semibold text-on-primary">
                                <Icon n="school" className="!text-[16px] text-secondary-container" />
                                {profil.program} · Kelas {profil.kelas}
                            </span>
                            <span>
                                NISN <b className="text-on-primary">{profil.nisn}</b>
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Icon n="supervisor_account" className="!text-[16px] text-secondary-container" />
                                Wali kelas <b className="text-on-primary">{profil.wali}</b>
                            </span>
                        </div>
                    </div>
                    <div className="w-full space-y-2.5 rounded-lg bg-primary p-4 lg:w-80">
                        <div className="flex items-center justify-between">
                            <span className="text-label-sm text-primary-fixed">Progres Belajar Semester</span>
                            <span className="text-headline-md font-bold text-secondary-container">{profil.progres}%</span>
                        </div>
                        <Progress value={profil.progres} dark />
                        <div className="flex justify-between text-caption text-on-primary-container">
                            <span>{profil.modul}</span>
                            <Link href="/siswa/nilai" className="text-secondary-container hover:underline">
                                Detail
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {lanjutkan ? (
            <Card className="card-hover p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-surface-container px-2.5 py-0.5 text-caption tracking-wider text-ink-2 uppercase">Lanjutkan Pembelajaran</span>
                            <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                                <Icon n="schedule" className="!text-[14px]" />
                                {lanjutkan.waktu}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-headline-lg font-bold text-primary-container">
                                {lanjutkan.mapel} — {lanjutkan.modul}: {lanjutkan.judul}
                            </h2>
                            <p className="mt-1 text-on-surface-variant">
                                Tutor: <b className="text-on-surface">{lanjutkan.tutor}</b>
                            </p>
                        </div>
                        <div className="max-w-xl rounded-lg bg-surface-container-low p-3.5">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2 text-label-md">
                                    <Icon n="play_circle" className="text-primary-container" />
                                    Video konseptual &amp; uraian materi
                                </span>
                                <span className="text-label-sm font-semibold text-on-surface-variant">{lanjutkan.progres}% selesai</span>
                            </div>
                            <Progress value={lanjutkan.progres} size="sm" />
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 md:items-end">
                        <Link href={`/materi/${lanjutkan.id}`} className="btn btn-primary min-h-12 px-6">
                            Lanjutkan Belajar
                            <Icon n="arrow_forward" className="text-secondary-container" />
                        </Link>
                        <span className="text-center text-label-sm text-on-surface-variant">{lanjutkan.meta}</span>
                    </div>
                </div>
            </Card>
            ) : (
                <Card>
                    <Empty icon="auto_stories" title={mapel.length ? 'Semua materi sudah selesai' : 'Belum ada materi'} desc={mapel.length ? 'Hebat! Tinjau kembali materi atau kerjakan tugas yang tersisa.' : 'Materi akan muncul setelah tutor menerbitkannya.'} className="!py-8" />
                </Card>
            )}

            <section>
                <SectionTitle
                    title="Mata Pelajaran Aktif"
                    desc="Kurikulum Kesetaraan Paket C · Kelas XII"
                    action={
                        <Link href="/siswa/mapel" className="flex items-center gap-0.5 text-label-sm font-semibold whitespace-nowrap text-primary-container hover:underline">
                            Lihat semua
                            <Icon n="chevron_right" className="!text-[18px]" />
                        </Link>
                    }
                />
                {mapel.length === 0 && <Card><Empty icon="menu_book" title="Belum ada mata pelajaran" desc="Hubungi Tata Usaha bila kamu belum terdaftar di kelas." className="!py-8" /></Card>}
                <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
                    {mapel.map((m) => (
                        <SubjectCard key={m.id} m={m} />
                    ))}
                </div>
            </section>

            <section className="grid gap-gutter lg:grid-cols-12">
                <Card className="p-5 sm:p-6 lg:col-span-7">
                    <SectionTitle title="Tugas yang Harus Diselesaikan" desc={`${tugas.length} tugas memerlukan perhatianmu`} icon="assignment" action={<Link href="/siswa/tugas" className="text-label-sm font-semibold whitespace-nowrap text-primary-container hover:underline">Semua tugas</Link>} />
                    {tugas.length === 0 && <Empty icon="task_alt" title="Tidak ada tugas tertunda" desc="Semua tugas sudah dikerjakan." className="!py-6" />}
                    <ul className="space-y-3">
                        {tugas.map((t) => {
                            const [label, tone] = TUGAS[t.status];
                            return (
                                <li key={t.id} className="flex flex-col justify-between gap-3 rounded-lg bg-surface-container-low p-4 sm:flex-row sm:items-center">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge tone={t.status === 'terlambat' ? 'danger' : t.sisa.startsWith('Besok') ? 'warning' : 'neutral'}>{t.sisa}</Badge>
                                            <span className="text-label-sm text-on-surface-variant">{t.mapel}</span>
                                        </div>
                                        <p className="mt-1.5 text-label-md text-[14px]">{t.judul}</p>
                                        <p className="mt-0.5 text-label-sm text-on-surface-variant">Status: {label}</p>
                                    </div>
                                    <Link href={`/siswa/tugas/${t.id}`} className={cx('btn btn-sm shrink-0', t.status === 'proses' ? 'btn-accent' : 'btn-primary')}>
                                        {t.status === 'proses' ? 'Lanjutkan' : 'Kerjakan'}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </Card>

                <div className="space-y-gutter lg:col-span-5">
                    <Card className="p-5 sm:p-6">
                        <SectionTitle title="Jadwal Ujian" icon="event" action={<Link href="/siswa/ujian" className="text-label-sm font-semibold text-primary-container hover:underline">Semua</Link>} />
                        {ujian.length === 0 && <p className="text-label-sm text-on-surface-variant">Belum ada ujian terjadwal.</p>}
                        <ul className="space-y-3">
                            {ujian.map((u) => (
                                <li key={u.id} className="flex items-center gap-3">
                                    <span className={cx('grid size-11 shrink-0 place-items-center rounded-lg', u.status === 'tersedia' ? 'bg-secondary-container text-primary-container' : 'bg-surface-container-low text-on-surface-variant')}>
                                        <Icon n={u.status === 'tersedia' ? 'play_arrow' : 'event'} fill={u.status === 'tersedia'} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-label-md">{u.judul}</p>
                                        <p className="text-label-sm text-on-surface-variant">
                                            {u.jadwal} · {u.durasi} menit
                                        </p>
                                    </div>
                                    {u.status === 'tersedia' && (
                                        <Link href="/siswa/ujian" className="btn btn-sm btn-accent">
                                            Mulai
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Card>
                    <Card className="p-5 sm:p-6">
                        <SectionTitle title="Pengumuman Terbaru" icon="campaign" />
                        <ul className="space-y-2.5">
                            {pengumuman.map((p) => (
                                <li key={p.id}>
                                    <Link href={`/pengumuman/${p.id}`} className="block rounded-lg bg-surface-container-low p-3.5 transition hover:bg-surface-container">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge tone={p.penting ? 'primary' : 'neutral'}>{p.penting ? 'Penting' : p.kategori}</Badge>
                                            <span className="text-caption text-on-surface-variant">{p.tanggal}</span>
                                        </div>
                                        <p className="mt-2 text-label-md">{p.judul}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </section>

            <section className="grid gap-gutter md:grid-cols-2">
                <Card className="p-5 sm:p-6">
                    <SectionTitle title="Ringkasan Nilai" action={<Link href="/siswa/nilai" className="text-label-sm font-semibold text-primary-container hover:underline">Detail nilai</Link>} />
                    <div className="flex items-center gap-5">
                        <div className="grid size-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#005840 ${nilai.rata ?? 0}%, #e8eeec 0)` }}>
                            <div className="grid size-[76px] place-items-center rounded-full bg-surface-container-lowest">
                                <span className="text-headline-lg font-bold">{nilai.rata === null ? '—' : nilai.rata.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-label-md">Rata-rata nilai akhir</p>
                            <p className="text-label-sm text-on-surface-variant">{nilai.tren}</p>
                            <p className="text-label-sm text-on-surface-variant">
                                {nilai.tuntas} dari {nilai.total} mata pelajaran mencapai KKM
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 sm:p-6">
                    <SectionTitle title="Riwayat Aktivitas Belajar" action={<Link href="/riwayat-aktivitas" className="text-label-sm font-semibold text-primary-container hover:underline">Semua</Link>} />
                    {riwayat.length ? <Timeline items={riwayat} /> : <p className="text-label-sm text-on-surface-variant">Belum ada aktivitas.</p>}
                </Card>
            </section>
        </div>
    );
}
