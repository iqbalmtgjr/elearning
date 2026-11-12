import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Badge, Card, Empty, Icon, PageHeader, Progress, SearchInput, Tabs, cx } from '../../Components/ui';

export const TIPE = { Teks: 'article', Video: 'smart_display', PDF: 'picture_as_pdf' };
export const STATUS_MATERI = { selesai: ['Selesai', 'success', 'check_circle'], sedang: ['Sedang dipelajari', 'lime', 'play_circle'], belum: ['Belum dibuka', 'neutral', 'radio_button_unchecked'] };

export default function Materi({ modul }) {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const [q, setQ] = useState(params.get('q') ?? '');
    const mapelList = [...new Set(modul.map((m) => m.mapel))];
    const [mapel, setMapel] = useState(mapelList.includes(params.get('mapel')) ? params.get('mapel') : 'semua');

    const groups = modul
        .filter((g) => mapel === 'semua' || g.mapel === mapel)
        .map((g) => ({ ...g, items: g.items.filter((i) => i.judul.toLowerCase().includes(q.toLowerCase())) }))
        .filter((g) => g.items.length);

    return (
        <>
            <Head title="Materi Pembelajaran" />
            <PageHeader crumbs={[['Dashboard', '/siswa'], ['Materi Pembelajaran']]} title="Materi Pembelajaran" desc="Pelajari materi secara berurutan. Tandai selesai setelah memahami isi materi agar progresmu tercatat." />

            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                <Tabs className="lg:max-w-[60%]" value={mapel} onChange={setMapel} tabs={[['semua', 'Semua'], ...mapelList.map((m) => [m, m])]} />
                <SearchInput value={q} onChange={setQ} placeholder="Cari judul materi…" className="lg:ml-auto lg:w-72" />
            </div>

            {groups.length ? (
                <div className="space-y-gutter">
                    {groups.map((g) => {
                        const selesai = g.items.filter((i) => i.status === 'selesai').length;
                        return (
                            <Card key={g.modul} className="overflow-hidden">
                                <div className="flex flex-col justify-between gap-3 border-b border-outline-variant/70 p-5 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="eyebrow">{g.mapel}</p>
                                        <h2 className="mt-0.5 text-headline-md">{g.modul}</h2>
                                    </div>
                                    <div className="flex items-center gap-3 sm:w-56">
                                        <Progress value={Math.round((selesai / g.items.length) * 100)} size="sm" />
                                        <span className="text-label-sm whitespace-nowrap text-on-surface-variant">
                                            {selesai}/{g.items.length} selesai
                                        </span>
                                    </div>
                                </div>
                                <ol className="divide-y divide-outline-variant/70">
                                    {g.items.map((it, n) => {
                                        const [label, tone, icon] = STATUS_MATERI[it.status];
                                        return (
                                            <li key={it.id}>
                                                <Link href={`/materi/${it.id}`} className={cx('flex items-center gap-4 p-4 transition hover:bg-surface-container-low sm:px-5', it.status === 'sedang' && 'bg-secondary-container/15')}>
                                                    <span className={cx('grid size-11 shrink-0 place-items-center rounded-xl', it.status === 'selesai' ? 'bg-success-container text-success-ink' : 'bg-surface-container-low text-primary-container')}>
                                                        <Icon n={it.status === 'selesai' ? 'check' : TIPE[it.tipe]} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-caption text-on-surface-variant">Materi {n + 1}</p>
                                                        <p className="text-label-md text-[14px]">{it.judul}</p>
                                                        <p className="mt-0.5 flex items-center gap-3 text-label-sm text-on-surface-variant">
                                                            <span className="flex items-center gap-1">
                                                                <Icon n={TIPE[it.tipe]} className="!text-[16px]" />
                                                                {it.tipe}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Icon n="schedule" className="!text-[16px]" />
                                                                {it.durasi}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <Badge tone={tone} className="hidden sm:inline-flex">
                                                        <Icon n={icon} className="!text-[14px]" />
                                                        {label}
                                                    </Badge>
                                                    <Icon n="chevron_right" className="text-outline" />
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <Empty icon="search_off" title="Materi tidak ditemukan" desc="Coba kata kunci lain atau pilih mata pelajaran berbeda." action={<button type="button" className="btn btn-ghost" onClick={() => { setQ(''); setMapel('semua'); }}>Tampilkan semua materi</button>} />
                </Card>
            )}
        </>
    );
}
