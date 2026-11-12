import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Badge, Card, Icon, PageHeader, SectionTitle, cx } from '../../Components/ui';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const JENIS = { Ujian: 'danger', Tugas: 'warning', Kegiatan: 'lime' };
const TITIK = { Ujian: 'bg-danger', Tugas: 'bg-warning', Kegiatan: 'bg-secondary' };

function Sesi({ s }) {
    return (
        <div className={cx('rounded-lg border-l-4 p-3', s.mode === 'Daring' ? 'border-secondary bg-secondary-container/25' : 'border-primary-container bg-primary-container/5')}>
            <p className="text-label-sm font-semibold text-primary-container">{s.jam}</p>
            <p className="mt-0.5 text-label-md">{s.judul}</p>
            <p className="text-label-sm text-on-surface-variant">{s.kelas}</p>
            <p className="mt-1.5 flex items-center gap-1 text-caption text-on-surface-variant">
                <Icon n={s.mode === 'Daring' ? 'videocam' : 'location_on'} className="!text-[14px]" />
                {s.tempat}
            </p>
        </div>
    );
}

export default function Jadwal({ sesi, hariIni, minggu, ujian, agenda, kalender }) {
    const TGL = minggu.tanggal;
    const { role } = usePage().props.auth.user;
    const [hari, setHari] = useState(hariIni);
    const judul = role === 'tutor' ? 'Jadwal Mengajar' : 'Jadwal Belajar';
    const cells = [...Array(kalender.offset).fill(null), ...Array.from({ length: kalender.hari }, (_, n) => n + 1)];
    const tandai = kalender.tanda;

    return (
        <>
            <Head title={judul} />
            <PageHeader
                crumbs={[['Dashboard', `/${role}`], [judul]]}
                title={judul}
                desc={role === 'tutor' ? 'Sesi tutorial tatap muka dan kelas daring yang Anda ampu.' : 'Jadwal kelas, tutorial tatap muka, ujian, dan kegiatan akademik.'}
                actions={
                    <div className="flex gap-3 text-label-sm text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded-sm bg-primary-container" />
                            Tatap muka
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded-sm bg-secondary" />
                            Daring
                        </span>
                    </div>
                }
            />

            <Card className="mb-6 overflow-hidden">
                <div className="flex items-center justify-between border-b border-outline-variant/70 p-4 sm:p-5">
                    <h2 className="text-headline-md">Pekan Ini · {minggu.label}</h2>
                    {sesi.length === 0 && <span className="text-label-sm text-on-surface-variant">Belum ada jadwal tetap</span>}
                </div>

                {/* Desktop: grid 7 hari */}
                <div className="hidden grid-cols-7 divide-x divide-outline-variant/70 lg:grid">
                    {HARI.map((h, d) => (
                        <div key={h} className={cx('min-h-64 p-3', d === hariIni && 'bg-secondary-container/10')}>
                            <div className="mb-3 text-center">
                                <p className="text-caption text-on-surface-variant uppercase">{h.slice(0, 3)}</p>
                                <p className={cx('mx-auto mt-1 grid size-9 place-items-center rounded-full text-label-md', d === hariIni && 'bg-primary-container text-secondary-container')}>{TGL[d]}</p>
                            </div>
                            <div className="space-y-2">
                                {sesi
                                    .filter((s) => s.hari === d)
                                    .map((s) => (
                                        <Sesi key={s.jam + s.judul} s={s} />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ponsel & tablet: pilih hari */}
                <div className="lg:hidden">
                    <div className="flex gap-1 overflow-x-auto p-3 scrollbar-none" role="tablist">
                        {HARI.map((h, d) => (
                            <button key={h} type="button" role="tab" aria-selected={hari === d} onClick={() => setHari(d)} className={cx('flex min-w-12 flex-1 flex-col items-center rounded-xl py-2', hari === d ? 'bg-primary-container text-on-primary' : 'hover:bg-surface-container-low')}>
                                <span className="text-caption uppercase opacity-80">{h.slice(0, 3)}</span>
                                <span className="text-label-md">{TGL[d]}</span>
                                {sesi.some((s) => s.hari === d) && <span className={cx('mt-1 size-1.5 rounded-full', hari === d ? 'bg-secondary-container' : 'bg-primary-container')} />}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2 p-4 pt-1">
                        {sesi.filter((s) => s.hari === hari).length ? (
                            sesi.filter((s) => s.hari === hari).map((s) => <Sesi key={s.jam + s.judul} s={s} />)
                        ) : (
                            <p className="py-8 text-center text-on-surface-variant">Tidak ada jadwal pada hari {HARI[hari]}.</p>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid gap-gutter lg:grid-cols-12">
                <Card className="p-5 sm:p-6 lg:col-span-5">
                    <SectionTitle title="Kalender Akademik" desc={kalender.label} icon="calendar_month" />
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {HARI.map((h) => (
                            <span key={h} className="pb-1 text-caption text-on-surface-variant uppercase">
                                {h.slice(0, 2)}
                            </span>
                        ))}
                        {cells.map((d, n) =>
                            d ? (
                                <span key={n} className={cx('relative grid aspect-square place-items-center rounded-lg text-label-sm', d === kalender.hariIni ? 'bg-primary-container font-bold text-secondary-container' : tandai[d] ? 'bg-surface-container-low font-semibold' : 'text-on-surface-variant')}>
                                    {d}
                                    {tandai[d] && <span className={cx('absolute bottom-1 size-1.5 rounded-full', TITIK[tandai[d]] ?? 'bg-outline')} />}
                                </span>
                            ) : (
                                <span key={n} />
                            ),
                        )}
                    </div>
                </Card>

                <Card className="p-5 sm:p-6 lg:col-span-4">
                    <SectionTitle title="Kegiatan Mendatang" icon="event_upcoming" />
                    {agenda.length === 0 && <p className="text-label-sm text-on-surface-variant">Tidak ada ujian atau tenggat tugas dalam 30 hari ke depan.</p>}
                    <ul className="space-y-3">
                        {agenda.map((a, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <span className="grid w-12 shrink-0 rounded-lg bg-surface-container-low py-1.5 text-center">
                                    <span className="text-label-md font-bold text-primary-container">{a.tgl}</span>
                                    <span className="text-caption text-on-surface-variant">{a.bulan}</span>
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-label-md">{a.judul}</p>
                                    <Badge tone={JENIS[a.jenis]} className="mt-1">
                                        {a.jenis}
                                    </Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="p-5 sm:p-6 lg:col-span-3">
                    <SectionTitle title="Jadwal Ujian" icon="quiz" />
                    {ujian.length === 0 && <p className="text-label-sm text-on-surface-variant">Belum ada ujian terjadwal.</p>}
                    <ul className="space-y-3">
                        {ujian.map((u) => (
                            <li key={u.id} className="rounded-lg bg-surface-container-low p-3">
                                <p className="text-label-md">{u.judul}</p>
                                <p className="mt-0.5 text-label-sm text-on-surface-variant">{u.jadwal}</p>
                                <p className="text-label-sm text-on-surface-variant">
                                    {u.durasi} menit · {u.soal} soal
                                </p>
                            </li>
                        ))}
                    </ul>
                    {role === 'siswa' && (
                        <Link href="/siswa/ujian" className="btn btn-soft mt-4 w-full">
                            Lihat Ujian
                        </Link>
                    )}
                </Card>
            </div>
        </>
    );
}
