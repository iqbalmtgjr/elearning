import { Head, Link, usePage } from '@inertiajs/react';
import { Avatar, Badge, Card, Icon, Progress, SectionTitle, Stat, cx } from '../../Components/ui';

export const sapaan = () => {
    const h = new Date().getHours();
    return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
};
const TONE = { Menunggu: 'warning', Terlambat: 'danger', Dinilai: 'success' };

export default function Dashboard({ stats, jadwal, pengumpulan, perkembangan, perhatian }) {
    const { user } = usePage().props.auth;
    return (
        <div className="space-y-6">
            <Head title="Dashboard Tutor" />

            <section className="relative overflow-hidden rounded-xl bg-primary-container p-5 text-on-primary shadow-card sm:p-6">
                <div className="pointer-events-none absolute -top-20 -right-16 size-80 rounded-full bg-secondary-container/10 blur-3xl" />
                <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 rounded bg-primary px-2.5 py-1 text-caption tracking-wider text-secondary-container uppercase">
                            <span className="size-1.5 animate-pulse rounded-full bg-secondary-container" />
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <h1 className="text-2xl font-bold sm:text-headline-xl">
                            {sapaan()}, {user.name.split(',')[0]}
                        </h1>
                        <p className="text-primary-fixed-dim">
                            Ada <b className="text-secondary-container">{stats.menunggu} pekerjaan</b> menunggu penilaian{jadwal[0] ? <> · sesi berikutnya {jadwal[0].status.toLowerCase()}, {jadwal[0].judul}</> : ''}.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/tutor/penilaian" className="btn btn-accent">
                            <Icon n="grading" className="!text-[18px]" />
                            Mulai Menilai
                        </Link>
                        <Link href="/tutor/materi?tambah=1" className="btn bg-white/10 text-on-primary hover:bg-white/15">
                            <Icon n="library_add" className="!text-[18px]" />
                            Materi
                        </Link>
                        <Link href="/tutor/tugas?tambah=1" className="btn bg-white/10 text-on-primary hover:bg-white/15">
                            <Icon n="assignment_add" className="!text-[18px]" />
                            Tugas
                        </Link>
                        <Link href="/tutor/ujian?tambah=1" className="btn bg-white/10 text-on-primary hover:bg-white/15">
                            <Icon n="quiz" className="!text-[18px]" />
                            Ujian
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:gap-gutter xl:grid-cols-4" aria-label="Ringkasan">
                <Stat label="Kelas Diampu" value={stats.kelas} unit="kelas" icon="meeting_room" />
                <Stat label="Peserta Didik" value={stats.siswa} unit="siswa" icon="groups" />
                <Stat label="Tugas Aktif" value={stats.aktif} unit="tugas" icon="assignment" />
                <Stat label="Menunggu Penilaian" value={stats.menunggu} unit="tugas" icon="pending_actions" className="ring-2 ring-secondary-container" />
            </section>

            <section className="grid gap-gutter lg:grid-cols-12">
                <Card className="overflow-hidden lg:col-span-8">
                    <div className="flex items-center justify-between p-5 sm:p-6">
                        <div>
                            <h2 className="text-headline-md">Pengumpulan Tugas Terbaru</h2>
                            <p className="text-label-sm text-on-surface-variant">Dari seluruh kelas yang Anda ampu</p>
                        </div>
                        <Link href="/tutor/penilaian" className="btn btn-sm btn-ghost">
                            Semua
                        </Link>
                    </div>
                    {pengumpulan.length === 0 && <p className="border-t border-outline-variant/70 p-6 text-center text-label-sm text-on-surface-variant">Belum ada pengumpulan tugas.</p>}
                    <ul className="divide-y divide-outline-variant/70 border-t border-outline-variant/70">
                        {pengumpulan.map((p, i) => (
                            <li key={i} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                                <Avatar name={p.nama} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-label-md">{p.nama}</p>
                                    <p className="truncate text-label-sm text-on-surface-variant">
                                        {p.tugas} · {p.kelas}
                                    </p>
                                </div>
                                <span className="hidden text-label-sm text-on-surface-variant sm:block">{p.waktu}</span>
                                <Badge tone={TONE[p.status]}>{p.status}</Badge>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="p-5 sm:p-6 lg:col-span-4">
                    <SectionTitle title="Jadwal Mengajar" icon="calendar_month" action={<Link href="/jadwal" className="text-label-sm font-semibold text-primary-container hover:underline">Lihat semua</Link>} />
                    {jadwal.length === 0 && <p className="text-label-sm text-on-surface-variant">Belum ada jadwal tetap. Hubungi admin untuk mengatur jadwal.</p>}
                    <ul className="space-y-2.5">
                        {jadwal.map((j, i) => (
                            <li key={j.judul} className={cx('rounded-lg p-3.5', i === 0 ? 'bg-secondary-container/40 ring-1 ring-secondary/20' : 'bg-surface-container-low')}>
                                <div className="flex items-center justify-between text-label-sm">
                                    <span className="font-semibold text-primary-container">{j.jam}</span>
                                    <span className="text-on-surface-variant">{j.status}</span>
                                </div>
                                <p className="mt-1 text-label-md">{j.judul}</p>
                                <p className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
                                    <Icon n={j.mode === 'Daring' ? 'videocam' : 'location_on'} className="!text-[16px]" />
                                    {j.tempat}
                                </p>
                                {j.tautan && (
                                    <a href={j.tautan} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary mt-3 w-full">
                                        <Icon n="videocam" className="!text-[16px]" />
                                        Buka Ruang Daring
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </Card>
            </section>

            <section className="grid gap-gutter md:grid-cols-2">
                <Card className="p-5 sm:p-6">
                    <SectionTitle title="Perkembangan Peserta Didik" desc="Rata-rata penyelesaian materi per kelas" />
                    <ul className="space-y-4">
                        {perkembangan.map(([k, v]) => (
                            <li key={k}>
                                <div className="mb-1.5 flex justify-between text-label-md">
                                    <span>{k}</span>
                                    <span>{v}%</span>
                                </div>
                                <Progress value={v} />
                            </li>
                        ))}
                    </ul>
                </Card>
                <Card className="p-5 sm:p-6">
                    <SectionTitle title="Perlu Pendampingan" desc="Peserta didik dengan keaktifan menurun" action={<Badge tone="warning">{perhatian.length}</Badge>} />
                    {perhatian.length === 0 && <p className="text-label-sm text-on-surface-variant">Semua peserta didik aktif belajar.</p>}
                    <ul className="space-y-2.5">
                        {perhatian.map((p) => (
                            <li key={p.nama} className="flex items-center gap-3 rounded-lg border border-outline-variant/70 p-3">
                                <Avatar name={p.nama} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-label-md">
                                        {p.nama} <span className="font-normal text-on-surface-variant">· {p.kelas}</span>
                                    </p>
                                    <p className="text-label-sm text-on-surface-variant">{p.alasan}</p>
                                </div>
                                <button type="button" className="btn-icon size-9 text-primary-container" aria-label={`Kirim pesan ke ${p.nama}`}>
                                    <Icon n="chat" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <Link href="/tutor/peserta-didik" className="btn btn-soft mt-4 w-full">
                        Lihat Semua Peserta Didik
                    </Link>
                </Card>
            </section>
        </div>
    );
}
