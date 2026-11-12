import { Head, Link } from '@inertiajs/react';
import { Avatar, Badge, Card, Empty, Icon, SectionTitle, Stat, Timeline, cx } from '../../Components/ui';

const AKSI = [
    ['person_add', 'Peserta Didik', '/admin/peserta-didik?tambah=1', 'btn-primary'],
    ['badge', 'Tutor', '/admin/tutor?tambah=1', 'btn-ghost'],
    ['domain_add', 'Kelas', '/admin/kelas?tambah=1', 'btn-ghost'],
    ['library_add', 'Mata Pelajaran', '/admin/mapel?tambah=1', 'btn-ghost'],
    ['campaign', 'Pengumuman', '/pengumuman?tambah=1', 'btn-accent'],
];
const TONE_PROGRAM = { 'Paket A': 'lime', 'Paket B': 'soft', 'Paket C': 'primary' };

function BarChart({ data }) {
    const max = Math.max(1, ...data.map(([, v]) => v));
    const peak = data.findIndex(([, v]) => v === max);
    return (
        <div role="img" aria-label={`Pengguna aktif per hari: ${data.map(([d, v]) => `${d} ${v}`).join(', ')}.`}>
            <div className="relative flex h-56 items-end gap-3 border-b border-outline-variant sm:gap-6">
                {[0.25, 0.5, 0.75, 1].map((g) => (
                    <div key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-outline-variant/80" style={{ bottom: `${g * 100}%` }} />
                ))}
                {data.map(([day, v, libur], i) => (
                    <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
                        <span className={cx('mb-1.5 text-center text-label-sm font-semibold', i === peak ? 'text-on-surface' : 'text-on-surface-variant')}>{v}</span>
                        <div className={cx('min-h-1 rounded-t-md transition group-hover:opacity-85', i === peak && v > 0 ? 'bg-secondary-container' : libur ? 'bg-secondary' : 'bg-primary-container')} style={{ height: `${(v / max) * 82}%` }} />
                    </div>
                ))}
            </div>
            <div className="mt-2 flex gap-3 sm:gap-6">
                {data.map(([day, , libur], i) => (
                    <span key={i} className={cx('flex-1 text-center text-label-sm', libur ? 'font-bold text-primary-container' : 'text-on-surface-variant')}>
                        {day}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard({ stats, perProgram, aktivitas, rentang, ujian, perhatian, terbaru, sistem }) {
    const totalProgram = perProgram.reduce((s, [, , n]) => s + n, 0);
    const puncak = aktivitas.reduce((a, b) => (b[1] > a[1] ? b : a), aktivitas[0]);
    return (
        <div className="space-y-6">
            <Head title="Dashboard Administrator" />

            <Card className="flex flex-col justify-between gap-5 p-5 sm:p-6 xl:flex-row xl:items-center">
                <div className="max-w-2xl space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded bg-primary px-2.5 py-1 text-caption tracking-wider text-on-primary uppercase">
                            <Icon n="admin_panel_settings" className="!text-[14px] text-secondary-container" />
                            Panel Administrator
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-headline-xl">Selamat Datang di PKBM BHP</h1>
                    <p className="text-on-surface-variant">Pusat kendali operasional akademik, pengelolaan rombongan belajar, dan pemantauan mutu pembelajaran kesetaraan.</p>
                </div>
                <div className="flex flex-wrap gap-2 xl:max-w-md xl:justify-end">
                    {AKSI.map(([icon, label, href, variant]) => (
                        <Link key={label} href={href} className={cx('btn', variant)}>
                            <Icon n={icon} className="!text-[18px]" />
                            {label}
                        </Link>
                    ))}
                </div>
            </Card>

            <section className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan">
                <Stat label="Total Peserta Didik" value={stats.siswa} unit="siswa" icon="groups">
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2">
                        <span className="flex items-center gap-0.5 text-label-sm font-semibold text-success-ink">
                            <Icon n="trending_up" className="!text-[16px]" />+{stats.baru} baru
                        </span>
                        <span className="flex gap-1 text-caption">
                            {perProgram.map(([p, , n]) => (
                                <span key={p} className={cx('rounded px-1.5 py-0.5', p === 'Paket C' ? 'bg-secondary-container text-on-secondary-fixed' : 'bg-surface-container-lowest')}>
                                    {p.slice(-1)}: {n}
                                </span>
                            ))}
                        </span>
                    </div>
                </Stat>
                <Stat label="Tutor Aktif" value={stats.tutor} unit="tutor" icon="co_present">
                    <div className="flex items-center justify-between text-label-sm">
                        <Link href="/admin/tutor" className="font-semibold text-primary-container hover:underline">Kelola tutor</Link>
                        <span className="rounded bg-surface-container px-2 py-0.5 text-caption">1 : {Math.round(stats.siswa / Math.max(1, stats.tutor))} rasio</span>
                    </div>
                </Stat>
                <Stat label="Kelas Aktif" value={stats.kelas} unit="rombel" icon="meeting_room">
                    <Link href="/admin/kelas" className="text-label-sm font-semibold text-primary-container hover:underline">Lihat data kelas</Link>
                </Stat>
                <Stat label="Mata Pelajaran" value={stats.mapel} unit="mapel" icon="menu_book">
                    <p className="text-label-sm text-on-surface-variant">{stats.materi} materi diterbitkan tutor</p>
                </Stat>
            </section>

            <section className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
                <Card className="p-5 sm:p-6 lg:col-span-8">
                    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                            <h2 className="text-headline-md">Aktivitas Pembelajaran</h2>
                            <p className="text-label-sm text-on-surface-variant">Pengguna yang aktif membuka materi, mengumpulkan tugas, atau mengerjakan ujian · {rentang}</p>
                        </div>
                        <div className="flex gap-4 text-label-sm text-on-surface-variant">
                            <span className="flex items-center gap-1.5">
                                <span className="size-3 rounded-sm bg-primary-container" />
                                Hari kerja
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-3 rounded-sm bg-secondary" />
                                Akhir pekan
                            </span>
                        </div>
                    </div>
                    <BarChart data={aktivitas} />
                    <div className="mt-5 flex flex-col justify-between gap-2 rounded-lg bg-surface-container-low p-3 sm:flex-row sm:items-center">
                        <p className="flex items-start gap-2 text-body-md">
                            <Icon n="lightbulb" className="text-secondary" />
                            <span>{puncak[1] > 0 ? <>Aktivitas tertinggi pada <b>{puncak[0]}</b> dengan {puncak[1]} pengguna aktif.</> : 'Belum ada aktivitas dalam 7 hari terakhir.'}</span>
                        </p>
                        <Link href="/admin/laporan" className="shrink-0 text-label-sm font-semibold text-primary-container hover:underline">
                            Lihat laporan
                        </Link>
                    </div>
                </Card>

                <Card className="flex flex-col p-5 sm:p-6 lg:col-span-4">
                    <SectionTitle title="Jadwal Ujian Mendatang" desc="Ujian terjadwal berikutnya" />
                    {ujian.length ? (
                        <ul className="flex-1 space-y-2.5">
                            {ujian.map((u, i) => (
                                <li key={i} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
                                    <span className="grid w-12 shrink-0 rounded-lg bg-surface-container-lowest py-1.5 text-center">
                                        <span className="text-caption text-on-surface-variant uppercase">{u.hari}</span>
                                        <span className="text-label-md font-bold text-primary-container">{u.tanggal}</span>
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-label-md">{u.judul}</p>
                                        <p className="truncate text-label-sm text-on-surface-variant">
                                            {u.kelas} · {u.peserta} peserta
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <Empty icon="event_available" title="Belum ada ujian terjadwal" className="flex-1 !py-6" />
                    )}
                    <Link href="/admin/ujian" className="btn btn-soft mt-4 w-full">
                        Kelola Ujian
                        <Icon n="arrow_forward" className="!text-[18px]" />
                    </Link>
                </Card>
            </section>

            <section className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
                <Card className="p-5 sm:p-6">
                    <SectionTitle title="Peserta Didik per Program" desc={`${totalProgram} peserta didik aktif`} />
                    <ul className="space-y-4">
                        {perProgram.map(([p, setara, n]) => (
                            <li key={p}>
                                <div className="mb-1.5 flex items-baseline justify-between">
                                    <span className="text-label-md">
                                        {p} <span className="font-normal text-on-surface-variant">· {setara}</span>
                                    </span>
                                    <span className="text-label-md">{n}</span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
                                    <div className="h-full rounded-full bg-primary-container" style={{ width: `${totalProgram ? (n / totalProgram) * 100 : 0}%` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="p-5 sm:p-6">
                    <SectionTitle title="Perlu Perhatian" action={perhatian.length > 0 && <Badge tone="danger">{perhatian.length} item</Badge>} />
                    {perhatian.length ? (
                        <ul className="space-y-2.5">
                            {perhatian.map((p) => (
                                <li key={p.teks}>
                                    <Link href={p.href} className="block rounded-lg border border-outline-variant/70 p-3 transition hover:border-primary-container/30 hover:bg-surface-container-low">
                                        <Badge tone={p.tone}>{p.label}</Badge>
                                        <p className="mt-2 text-label-md font-medium">{p.teks}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <Empty icon="task_alt" title="Semua beres" desc="Tidak ada tugas, presensi, atau materi yang tertunda." className="!py-6" />
                    )}
                </Card>

                <Card className="p-5 sm:p-6 md:col-span-2 xl:col-span-1">
                    <SectionTitle title="Aktivitas Tutor & Admin" />
                    {sistem.length ? <Timeline items={sistem} /> : <p className="text-label-sm text-on-surface-variant">Belum ada aktivitas.</p>}
                </Card>
            </section>

            <Card className="overflow-hidden">
                <div className="p-5 sm:p-6">
                    <h2 className="text-headline-md">Aktivitas Terbaru</h2>
                    <p className="text-label-sm text-on-surface-variant">Seluruh pengguna, diperbarui saat halaman dibuka</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left">
                        <thead>
                            <tr className="border-y border-outline-variant bg-surface-container-low/70">
                                {['Pengguna', 'Program / Peran', 'Aktivitas', 'Waktu'].map((h) => (
                                    <th key={h} className="eyebrow px-5 py-3 first:pl-6">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/70">
                            {terbaru.map((r, i) => (
                                <tr key={i} className="transition-colors hover:bg-surface/60">
                                    <td className="px-5 py-3.5 pl-6">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={r.nama} size="sm" />
                                            <div>
                                                <p className="text-label-md">{r.nama}</p>
                                                <p className="text-label-sm text-on-surface-variant">{r.sub}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <Badge tone={TONE_PROGRAM[r.program] ?? 'neutral'}>{r.program}</Badge>
                                    </td>
                                    <td className="px-5 py-3.5 text-label-md font-medium">{r.aktivitas}</td>
                                    <td className="px-5 py-3.5 text-label-sm whitespace-nowrap text-on-surface-variant">{r.waktu}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
