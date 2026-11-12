import { Head, Link, useForm } from '@inertiajs/react';
import { Avatar, Badge, Breadcrumb, Card, Empty, Icon, cx } from '../../Components/ui';

const STATUS = [
    ['Hadir', 'bg-success text-white', 'check'],
    ['Izin', 'bg-warning text-on-surface', 'event_busy'],
    ['Sakit', 'bg-secondary-container text-on-secondary-fixed', 'sick'],
    ['Alpa', 'bg-danger text-white', 'close'],
];

export default function Presensi({ sesi, siswa, kembali }) {
    const form = useForm({ status: Object.fromEntries(siswa.map((s) => [s.id, s.status ?? 'Hadir'])) });
    const set = (id, v) => form.setData('status', { ...form.data.status, [id]: v });
    const hitung = (v) => Object.values(form.data.status).filter((x) => x === v).length;

    return (
        <>
            <Head title="Isi Presensi" />
            <div className="mb-3">
                <Breadcrumb items={[['Kehadiran', kembali], [sesi.tanggal]]} />
            </div>
            <Card className="mb-6 p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex flex-wrap gap-2">
                            <Badge tone="primary">{sesi.kelas}</Badge>
                            <Badge tone={sesi.mode === 'Daring' ? 'lime' : 'soft'}>{sesi.mode}</Badge>
                            {sesi.tercatat && <Badge tone="success">Sudah tercatat</Badge>}
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-headline-xl">Presensi {sesi.mapel}</h1>
                        <p className="text-on-surface-variant">
                            {sesi.tanggal} · {sesi.tutor}
                            {sesi.topik ? ` · ${sesi.topik}` : ''}
                        </p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                        {STATUS.map(([v]) => (
                            <div key={v} className="rounded-lg bg-surface-container-low px-3 py-2">
                                <p className="text-headline-md font-bold">{hitung(v)}</p>
                                <p className="text-caption text-on-surface-variant">{v}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(`/presensi/${sesi.id}`);
                }}
            >
                <Card className="overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-outline-variant/70 p-4 sm:px-5">
                        <p className="text-label-md">{siswa.length} peserta didik</p>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => form.setData('status', Object.fromEntries(siswa.map((s) => [s.id, 'Hadir'])))}>
                            <Icon n="done_all" className="!text-[16px]" />
                            Tandai semua hadir
                        </button>
                    </div>
                    {siswa.length === 0 ? (
                        <Empty icon="group_off" title="Belum ada peserta didik di kelas ini" />
                    ) : (
                        <ul className="divide-y divide-outline-variant/70">
                            {siswa.map((s) => (
                                <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <Avatar name={s.nama} size="sm" />
                                        <div className="min-w-0">
                                            <p className="truncate text-label-md">{s.nama}</p>
                                            <p className="text-label-sm text-on-surface-variant">NISN {s.nisn}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5 sm:flex" role="radiogroup" aria-label={`Status kehadiran ${s.nama}`}>
                                        {STATUS.map(([v, aktif, icon]) => {
                                            const on = form.data.status[s.id] === v;
                                            return (
                                                <button key={v} type="button" role="radio" aria-checked={on} onClick={() => set(s.id, v)} className={cx('flex min-h-10 items-center justify-center gap-1 rounded-lg px-3 text-label-sm font-semibold transition', on ? aktif : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low')}>
                                                    <Icon n={icon} className="!text-[16px]" />
                                                    {v}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
                {form.errors.status && <p className="mt-2 text-label-sm text-danger-ink">{form.errors.status}</p>}
                <div className="sticky bottom-20 mt-4 flex justify-end gap-2 md:bottom-4">
                    <Link href={kembali} className="btn btn-ghost">
                        Batal
                    </Link>
                    <button type="submit" className="btn btn-primary" disabled={form.processing || siswa.length === 0}>
                        <Icon n="save" className="!text-[18px]" />
                        Simpan Presensi
                    </button>
                </div>
            </form>
        </>
    );
}
