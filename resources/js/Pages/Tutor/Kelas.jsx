import { Head, Link } from '@inertiajs/react';
import { Badge, Card, Icon, PageHeader, Progress } from '../../Components/ui';

export default function Kelas({ kelas }) {
    return (
        <>
            <Head title="Kelas Saya" />
            <PageHeader crumbs={[['Dashboard', '/tutor'], ['Kelas Saya']]} title="Kelas Saya" desc="Kelas dan mata pelajaran yang Anda ampu pada semester ini." />
            <div className="grid gap-gutter md:grid-cols-2">
                {kelas.map((k) => (
                    <Card key={k.id} className="card-hover flex flex-col overflow-hidden">
                        <div className="flex items-start justify-between gap-3 p-5">
                            <div className="min-w-0">
                                <div className="flex flex-wrap gap-1.5">
                                    <Badge tone={k.program === 'Paket C' ? 'primary' : 'soft'}>{k.program}</Badge>
                                    <Badge>{k.setara}</Badge>
                                </div>
                                <h2 className="mt-3 text-headline-md">{k.nama}</h2>
                                <p className="text-label-sm text-on-surface-variant">
                                    {k.mapel} · {k.tingkat} · Wali: {k.wali}
                                </p>
                            </div>
                            {k.menunggu > 0 && (
                                <Badge tone="warning" className="shrink-0">
                                    {k.menunggu} perlu dinilai
                                </Badge>
                            )}
                        </div>
                        <div className="grid grid-cols-3 border-y border-outline-variant/70 text-center">
                            {[
                                ['groups', `${k.siswa}`, 'Peserta'],
                                ['library_books', `${k.materi}`, 'Materi'],
                                ['event', k.sesi.split(' · ')[0], k.sesi.split(' · ')[1]],
                            ].map(([icon, v, l]) => (
                                <div key={l} className="border-r border-outline-variant/70 px-2 py-3 last:border-0">
                                    <Icon n={icon} className="text-primary-container" />
                                    <p className="mt-1 text-label-md">{v}</p>
                                    <p className="text-caption text-on-surface-variant">{l}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 space-y-1.5 p-5">
                            <div className="flex justify-between text-label-sm">
                                <span className="text-on-surface-variant">Rata-rata penyelesaian materi</span>
                                <b>{k.progres}%</b>
                            </div>
                            <Progress value={k.progres} />
                        </div>
                        <div className="flex gap-2 bg-surface-container-low/60 p-4">
                            <Link href={`/kelas/${k.id}`} className="btn btn-primary flex-1">
                                Buka Kelas
                                <Icon n="arrow_forward" className="!text-[18px]" />
                            </Link>
                            <Link href="/tutor/kehadiran?tambah=1" className="btn btn-ghost">
                                <Icon n="fact_check" className="!text-[18px]" />
                                <span className="hidden sm:inline">Presensi</span>
                            </Link>
                            <Link href="/tutor/penilaian" className="btn btn-ghost" aria-label="Penilaian">
                                <Icon n="grading" className="!text-[18px]" />
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}
