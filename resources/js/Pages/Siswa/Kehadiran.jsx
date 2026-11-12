import { Head } from '@inertiajs/react';
import { Badge, Card, DataTable, Icon, PageHeader, SectionTitle, cx } from '../../Components/ui';

const KODE = {
    h: ['Hadir', 'bg-primary-container text-on-primary'],
    i: ['Izin', 'bg-warning-container text-warning-ink'],
    s: ['Sakit', 'bg-secondary-container text-on-secondary-fixed'],
    a: ['Alpa', 'bg-danger text-white'],
    l: ['Libur', 'bg-surface-container-highest text-ink-2'],
};
const TONE = { Hadir: 'success', Izin: 'warning', Sakit: 'lime', Alpa: 'danger', Libur: 'neutral' };

export default function Kehadiran({ ringkas, sesi, kalender, bulan }) {
    const total = ringkas.hadir + ringkas.izin + ringkas.sakit + ringkas.alpa;
    const persen = total ? Math.round((ringkas.hadir / total) * 100) : 0;
    const cells = [...Array(bulan.offset).fill(null), ...Array.from({ length: bulan.hari }, (_, n) => n + 1)];

    return (
        <>
            <Head title="Kehadiran" />
            <PageHeader crumbs={[['Dashboard', '/siswa'], ['Kehadiran']]} title="Kehadiran" desc="Rekap presensi tutorial tatap muka dan kelas daring. Batas minimal kehadiran untuk mengikuti ujian akhir adalah 75%." />

            <div className="mb-6 grid gap-gutter lg:grid-cols-12">
                <Card className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:p-6 lg:col-span-7">
                    <div className="grid size-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#005840 ${persen}%, #e8eeec 0)` }} role="img" aria-label={`Kehadiran ${persen} persen`}>
                        <div className="grid size-28 place-items-center rounded-full bg-surface-container-lowest text-center">
                            <div>
                                <p className="text-headline-xl">{persen}%</p>
                                <p className="text-caption text-on-surface-variant uppercase">Kehadiran</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex-1">
                        <p className="text-headline-md">Rekap Kehadiran</p>
                        <p className="mb-4 text-label-sm text-on-surface-variant">{total} sesi tercatat</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                                ['Hadir', ringkas.hadir, 'success'],
                                ['Izin', ringkas.izin, 'warning'],
                                ['Sakit', ringkas.sakit, 'lime'],
                                ['Alpa', ringkas.alpa, 'danger'],
                            ].map(([l, v, t]) => (
                                <div key={l} className="rounded-lg bg-surface-container-low p-3">
                                    <Badge tone={t}>{l}</Badge>
                                    <p className="mt-2 text-headline-lg font-bold">{v}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="p-5 sm:p-6 lg:col-span-5">
                    <SectionTitle title={bulan.label} icon="calendar_month" />
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
                            <span key={d} className="pb-1 text-caption text-on-surface-variant uppercase">
                                {d}
                            </span>
                        ))}
                        {cells.map((d, n) =>
                            d ? (
                                <span key={n} title={kalender[d] ? KODE[kalender[d]][0] : undefined} className={cx('grid aspect-square place-items-center rounded-lg text-label-sm font-semibold', kalender[d] ? KODE[kalender[d]][1] : d === bulan.hariIni ? 'ring-2 ring-secondary-container' : 'text-on-surface-variant')}>
                                    {d}
                                </span>
                            ) : (
                                <span key={n} />
                            ),
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-label-sm text-on-surface-variant">
                        {Object.values(KODE).map(([l, c]) => (
                            <span key={l} className="flex items-center gap-1.5">
                                <span className={cx('size-3 rounded', c)} />
                                {l}
                            </span>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col justify-between gap-2 p-5 sm:flex-row sm:items-center sm:p-6">
                    <h2 className="text-headline-md">Riwayat Presensi</h2>
                    <p className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                        <Icon n="info" className="!text-[16px]" />
                        Ajukan izin melalui wali kelas paling lambat sebelum sesi dimulai.
                    </p>
                </div>
                <DataTable
                    columns={[
                        ['tanggal', 'Tanggal'],
                        ['mapel', 'Mata Pelajaran'],
                        ['mode', 'Moda'],
                        ['jam', 'Jam Masuk'],
                        ['status', 'Status'],
                    ]}
                    rows={sesi.map((s) => ({ ...s, tanggal: { text: s.tanggal }, status: { badge: s.status, tone: TONE[s.status] } }))}
                />
            </Card>
        </>
    );
}
