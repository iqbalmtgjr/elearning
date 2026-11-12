import { Head } from '@inertiajs/react';
import { Card, Icon, PageHeader, Progress } from '../../Components/ui';

export default function Laporan({ periode, kkm, ringkas, jenis }) {
    return (
        <>
            <Head title="Laporan Akademik" />
            <PageHeader
                crumbs={[['Dashboard', '/admin'], ['Laporan']]}
                title="Laporan Akademik"
                desc="Unduh rekap nilai, kehadiran, dan progres pembelajaran. PDF dibuka sebagai halaman cetak resmi berkop lembaga; Excel berupa berkas CSV."
                actions={
                    <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                        <Icon n="print" className="!text-[18px]" />
                        Cetak Ringkasan
                    </button>
                }
            />

            <Card className="mb-6 overflow-hidden">
                <div className="border-b border-outline-variant/70 p-5 sm:p-6">
                    <h2 className="text-headline-md">Ringkasan Akademik per Program</h2>
                    <p className="text-label-sm text-on-surface-variant">
                        {periode} · KKM {kkm}
                    </p>
                </div>
                <div className="grid divide-y divide-outline-variant/70 md:grid-cols-3 md:divide-x md:divide-y-0">
                    {ringkas.map((r) => (
                        <div key={r.program} className="space-y-4 p-5 sm:p-6">
                            <div className="flex items-center justify-between">
                                <p className="text-headline-md">{r.program}</p>
                                <span className="text-label-sm text-on-surface-variant">{r.siswa} peserta didik</span>
                            </div>
                            <p>
                                <span className="text-headline-xl">{r.nilai === null ? '—' : r.nilai.toLocaleString('id-ID')}</span>
                                <span className="ml-1.5 text-label-sm text-on-surface-variant">rata-rata nilai akhir</span>
                            </p>
                            {[
                                ['Kehadiran', r.hadir],
                                ['Ketuntasan KKM', r.tuntas],
                            ].map(([l, v]) => (
                                <div key={l}>
                                    <div className="mb-1 flex justify-between text-label-sm">
                                        <span className="text-on-surface-variant">{l}</span>
                                        <b>{v}%</b>
                                    </div>
                                    <Progress value={v} size="sm" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </Card>

            <h2 className="mb-4 text-headline-md print:hidden">Unduh Laporan</h2>
            <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-3 print:hidden">
                {jenis.map((j) => (
                    <Card key={j.kunci} className="card-hover flex flex-col p-5">
                        <div className="flex items-start gap-3">
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary-container text-primary-container">
                                <Icon n={j.icon} />
                            </span>
                            <div>
                                <h3 className="text-label-md text-[15px]">{j.judul}</h3>
                                <p className="mt-1 text-label-sm text-on-surface-variant">{j.teks}</p>
                            </div>
                        </div>
                        <div className="mt-auto flex justify-end gap-2 border-t border-outline-variant/70 pt-4">
                            <a href={`/admin/laporan/${j.kunci}/cetak`} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost mt-4">
                                <Icon n="picture_as_pdf" className="!text-[16px] text-danger" />
                                PDF / Cetak
                            </a>
                            <a href={`/admin/laporan/${j.kunci}`} className="btn btn-sm btn-ghost mt-4">
                                <Icon n="table_view" className="!text-[16px] text-success" />
                                Excel
                            </a>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}
