import { Head, usePage } from '@inertiajs/react';
import { Avatar, Badge, Card, DataTable, Empty, Icon, PageHeader, SectionTitle, Stat, cx } from '../../Components/ui';

const predikat = (n, kkm) => (n >= 90 ? 'A' : n >= 80 ? 'B' : n >= kkm ? 'C' : 'D');
const id = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 }));

export default function Nilai({ mapel, kkm, tren, jumlah, riwayat, umpan }) {
    const { user } = usePage().props.auth;
    const ada = mapel.filter((m) => m.akhir !== null);
    const rata = ada.length ? ada.reduce((s, m) => s + m.akhir, 0) / ada.length : null;
    const tuntas = ada.filter((m) => m.akhir >= kkm).length;
    const lemah = ada.filter((m) => m.akhir < kkm + 5).sort((a, b) => a.akhir - b.akhir).slice(0, 2).map((m) => m.mapel);

    const rows = mapel.map((m) => ({
        mapel: { text: m.mapel, sub: m.tutor },
        tugas: id(m.tugas),
        ujian: id(m.ujian),
        akhir: { text: id(m.akhir) },
        predikat: m.akhir === null ? '—' : { badge: predikat(m.akhir, kkm), tone: m.akhir >= 90 ? 'primary' : m.akhir >= 80 ? 'soft' : m.akhir >= kkm ? 'lime' : 'danger' },
        status: m.akhir === null ? { badge: 'Belum ada nilai', tone: 'neutral' } : { badge: m.akhir >= kkm ? 'Tuntas' : 'Belum Tuntas', tone: m.akhir >= kkm ? 'success' : 'danger' },
    }));

    return (
        <>
            <Head title="Nilai Saya" />
            <PageHeader
                crumbs={[['Dashboard', '/siswa'], ['Nilai Saya']]}
                title="Nilai Saya"
                desc={`Rekap nilai Semester Ganjil 2026/2027. Nilai akhir = 40% tugas + 60% ujian. KKM ${kkm}.`}
                actions={
                    <a href={`/rapor/${user.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
                        <Icon n="picture_as_pdf" className="!text-[18px]" />
                        Rapor Sementara (PDF)
                    </a>
                }
            />

            <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-gutter xl:grid-cols-4">
                <Stat label="Rata-rata Nilai Akhir" value={id(rata)} icon="insights">
                    <p className="text-label-sm text-on-surface-variant">KKM {kkm}</p>
                </Stat>
                <Stat label="Mencapai KKM" value={`${tuntas}/${mapel.length}`} unit="mapel" icon="verified" />
                <Stat label="Tugas Dinilai" value={jumlah.tugas} icon="assignment_turned_in" />
                <Stat label="Ujian Dinilai" value={jumlah.ujian} icon="quiz" />
            </section>

            <div className="mb-6 grid gap-gutter lg:grid-cols-12">
                <Card className="p-5 sm:p-6 lg:col-span-7">
                    <SectionTitle title="Nilai Akhir per Mata Pelajaran" desc="Garis putus-putus menunjukkan batas KKM" />
                    <ul className="space-y-3.5" aria-label="Grafik nilai akhir per mata pelajaran">
                        {mapel.map((m) => (
                            <li key={m.mapel} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 sm:grid-cols-[150px_1fr_44px]">
                                <span className="truncate text-label-sm">{m.mapel}</span>
                                <div className="relative h-3 rounded-full bg-surface-container">
                                    <div className={cx('h-full rounded-full', m.akhir >= kkm ? 'bg-primary-container' : 'bg-warning')} style={{ width: `${m.akhir ?? 0}%` }} />
                                    <span className="absolute -top-1 -bottom-1 border-l-2 border-dashed border-on-surface/40" style={{ left: `${kkm}%` }} aria-hidden="true" />
                                </div>
                                <span className="text-right text-label-md">{id(m.akhir)}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
                <Card className="flex flex-col p-5 sm:p-6 lg:col-span-5">
                    <SectionTitle title="Perkembangan Belajar" desc="Rata-rata nilai per bulan" />
                    <div className="flex flex-1 items-end gap-3" role="img" aria-label={`Rata-rata nilai: ${tren.map(([b, v]) => `${b} ${v}`).join(', ')}`}>
                        {tren.map(([b, v], n) => (
                            <div key={b} className="flex h-44 flex-1 flex-col justify-end text-center">
                                <span className="mb-1 text-label-sm font-semibold">{v ?? '—'}</span>
                                <div className={cx('rounded-t-md', n === tren.length - 1 ? 'bg-secondary-container' : 'bg-primary-container/80')} style={{ height: v ? `${Math.max(4, ((v - 50) / 50) * 100)}%` : 0 }} />
                                <span className="mt-2 text-label-sm text-on-surface-variant">{b}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-label-sm">
                        <Icon n="lightbulb" className="mr-1 !text-[16px] text-secondary" />
                        {lemah.length ? <>Fokuskan latihan pada <b>{lemah.join(' dan ')}</b> yang masih di bawah atau mendekati KKM.</> : ada.length ? 'Semua mata pelajaran sudah melampaui KKM. Pertahankan!' : 'Nilai akan muncul setelah tutor menilai tugas atau ujianmu.'}
                    </p>
                </Card>
            </div>

            <Card className="mb-6 overflow-hidden">
                <div className="p-5 sm:p-6">
                    <h2 className="text-headline-md">Rincian Nilai</h2>
                </div>
                <DataTable
                    columns={[
                        ['mapel', 'Mata Pelajaran'],
                        ['tugas', 'Rata-rata Tugas'],
                        ['ujian', 'Rata-rata Ujian'],
                        ['akhir', 'Nilai Akhir'],
                        ['predikat', 'Predikat'],
                        ['status', 'Ketuntasan'],
                    ]}
                    rows={rows}
                />
            </Card>

            <div className="grid gap-gutter lg:grid-cols-2">
                <Card className="p-5 sm:p-6">
                    <SectionTitle title="Riwayat Penilaian" />
                    {riwayat.length === 0 && <Empty icon="grading" title="Belum ada penilaian" className="!py-6" />}
                    <ul className="divide-y divide-outline-variant/70">
                        {riwayat.map((r, i) => (
                            <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-container-low text-primary-container">
                                    <Icon n={r.jenis === 'Ujian' ? 'quiz' : 'assignment'} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-label-md">{r.judul}</p>
                                    <p className="text-label-sm text-on-surface-variant">
                                        {r.jenis} · {r.mapel} · {r.tanggal}
                                    </p>
                                </div>
                                <Badge tone={r.nilai >= kkm ? 'success' : 'danger'} className="text-label-md">
                                    {r.nilai}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </Card>
                <Card className="p-5 sm:p-6">
                    <SectionTitle title="Umpan Balik Tutor" />
                    {umpan.length === 0 && <p className="text-label-sm text-on-surface-variant">Belum ada umpan balik dari tutor.</p>}
                    <ul className="space-y-4">
                        {umpan.map((u, i) => (
                            <li key={i} className="flex gap-3">
                                <Avatar name={u.tutor} size="sm" />
                                <div className="flex-1 rounded-xl rounded-tl-none bg-surface-container-low p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-label-md">{u.tutor}</p>
                                        <span className="text-caption text-on-surface-variant">
                                            {u.mapel} · {u.tanggal}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-body-md">{u.teks}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </>
    );
}
