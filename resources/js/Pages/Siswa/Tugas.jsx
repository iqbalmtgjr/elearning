import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Badge, Card, Empty, Icon, PageHeader, TUGAS, Tabs, cx } from '../../Components/ui';

export default function Tugas({ tugas }) {
    const [tab, setTab] = useState('aktif');
    const groups = { aktif: ['belum', 'proses', 'terlambat'], dikumpulkan: ['dikumpulkan'], dinilai: ['dinilai'] };
    const list = tugas.filter((t) => groups[tab].includes(t.status));

    return (
        <>
            <Head title="Tugas Saya" />
            <PageHeader crumbs={[['Dashboard', '/siswa'], ['Tugas Saya']]} title="Tugas Saya" desc="Kerjakan dan kumpulkan tugas sebelum batas waktu. Tugas yang terlambat tetap dapat dikumpulkan dengan catatan." />

            <div className="mb-5 flex flex-wrap gap-2" aria-label="Keterangan status">
                {Object.entries(TUGAS).map(([k, [label, tone, icon]]) => (
                    <Badge key={k} tone={tone}>
                        <Icon n={icon} className="!text-[14px]" />
                        {label} · {tugas.filter((t) => t.status === k).length}
                    </Badge>
                ))}
            </div>

            <Tabs
                className="mb-4 w-fit"
                value={tab}
                onChange={setTab}
                tabs={[
                    ['aktif', 'Perlu Dikerjakan', tugas.filter((t) => groups.aktif.includes(t.status)).length],
                    ['dikumpulkan', 'Dikumpulkan', tugas.filter((t) => t.status === 'dikumpulkan').length],
                    ['dinilai', 'Sudah Dinilai', tugas.filter((t) => t.status === 'dinilai').length],
                ]}
            />

            {list.length ? (
                <div className="grid gap-3">
                    {list.map((t) => {
                        const [label, tone, icon] = TUGAS[t.status];
                        return (
                            <Link key={t.id} href={`/siswa/tugas/${t.id}`} className="card card-hover flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                                <span className={cx('hidden size-12 shrink-0 place-items-center rounded-xl sm:grid', t.status === 'terlambat' ? 'bg-danger-container text-danger-ink' : t.status === 'dinilai' ? 'bg-success-container text-success-ink' : 'bg-surface-container-low text-primary-container')}>
                                    <Icon n={icon} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-label-sm font-semibold text-primary-container">{t.mapel}</span>
                                        <span className="text-label-sm text-on-surface-variant">· {t.tutor}</span>
                                    </div>
                                    <h2 className="mt-1 text-label-md text-[15px]">{t.judul}</h2>
                                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-label-sm text-on-surface-variant">
                                        <span className="flex items-center gap-1">
                                            <Icon n="event" className="!text-[16px]" />
                                            Tenggat {t.tenggat}
                                        </span>
                                        <span className={cx('flex items-center gap-1', t.status === 'terlambat' && 'font-semibold text-danger-ink', t.sisa.startsWith('Besok') && 'font-semibold text-warning-ink')}>
                                            <Icon n="hourglass_bottom" className="!text-[16px]" />
                                            {t.sisa}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                                    <Badge tone={tone}>{label}</Badge>
                                    {t.nilai && (
                                        <span className="text-headline-lg font-bold text-primary-container">
                                            {t.nilai}
                                            <span className="text-label-sm font-normal text-on-surface-variant">/100</span>
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <Empty icon="task_alt" title="Tidak ada tugas di sini" desc="Semua tugas pada kategori ini sudah beres. Pertahankan!" />
                </Card>
            )}
        </>
    );
}
