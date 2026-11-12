import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Avatar, Badge, Breadcrumb, Card, Confirm, Icon } from '../../Components/ui';
import { FormPengumuman, KATEGORI } from './Pengumuman';

export default function PengumumanDetail({ pengumuman: p, lainnya }) {
    const { user } = usePage().props.auth;
    const bisaUbah = user.role === 'admin' || p.penulis_id === user.id;
    const [ubah, setUbah] = useState(false);
    const [hapus, setHapus] = useState(false);

    return (
        <>
            <Head title={p.judul} />
            <div className="mb-4">
                <Breadcrumb items={[['Pengumuman', '/pengumuman'], [p.kategori]]} />
            </div>

            <div className="grid items-start gap-gutter lg:grid-cols-12">
                <Card as="article" className="p-5 sm:p-8 lg:col-span-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                            <Badge tone={KATEGORI[p.kategori]}>{p.kategori}</Badge>
                            {p.baru && (
                                <Badge tone="lime" dot>
                                    Terbaru
                                </Badge>
                            )}
                            {p.penting && <Badge tone="danger">Penting</Badge>}
                        </div>
                        {bisaUbah && (
                            <div className="flex gap-1">
                                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setUbah(true)}>
                                    <Icon n="edit" className="!text-[16px]" />
                                    Ubah
                                </button>
                                <button type="button" className="btn-icon size-8 text-danger-ink" onClick={() => setHapus(true)} aria-label="Hapus pengumuman">
                                    <Icon n="delete" className="!text-[18px]" />
                                </button>
                            </div>
                        )}
                    </div>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-headline-xl">{p.judul}</h1>
                    <div className="mt-4 flex items-center gap-3 border-b border-outline-variant/70 pb-5">
                        <Avatar name={p.penulis} size="sm" />
                        <div>
                            <p className="text-label-md">{p.penulis}</p>
                            <p className="text-label-sm text-on-surface-variant">Diterbitkan {p.tanggal}</p>
                        </div>
                    </div>
                    <div className="mt-6 max-w-3xl space-y-4 text-body-lg leading-relaxed font-normal">
                        {p.isi.map((t, i) => (
                            <p key={i} className="whitespace-pre-line">
                                {t}
                            </p>
                        ))}
                    </div>
                    {p.lampiran.length > 0 && (
                        <div className="mt-8">
                            <p className="label">Lampiran</p>
                            <div className="space-y-2">
                                {p.lampiran.map((l) => (
                                    <div key={l.url} className="flex items-center gap-3 rounded-xl border border-outline-variant/70 p-3">
                                        <span className="grid size-10 place-items-center rounded-lg bg-surface-container-low text-primary-container">
                                            <Icon n={l.nama?.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'attach_file'} />
                                        </span>
                                        <p className="min-w-0 flex-1 truncate text-label-md">{l.nama}</p>
                                        <a href={l.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">
                                            Buka
                                        </a>
                                        <a href={`${l.url}?unduh=1`} className="btn btn-sm btn-ghost">
                                            <Icon n="download" className="!text-[16px]" />
                                            Unduh
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <Link href="/pengumuman" className="btn btn-ghost mt-8">
                        <Icon n="arrow_back" className="!text-[18px]" />
                        Kembali ke Pengumuman
                    </Link>
                </Card>

                <aside className="lg:col-span-4">
                    <Card className="p-5">
                        <h2 className="mb-3 text-headline-md">Pengumuman Lainnya</h2>
                        {lainnya.length === 0 && <p className="text-label-sm text-on-surface-variant">Tidak ada pengumuman lain.</p>}
                        <ul className="space-y-2">
                            {lainnya.map((l) => (
                                <li key={l.id}>
                                    <Link href={`/pengumuman/${l.id}`} className="block rounded-lg p-3 transition hover:bg-surface-container-low">
                                        <p className="text-caption text-on-surface-variant">
                                            {l.kategori} · {l.tanggal}
                                        </p>
                                        <p className="mt-0.5 text-label-md">{l.judul}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </aside>
            </div>

            {bisaUbah && <FormPengumuman open={ubah} onClose={() => setUbah(false)} data={p} />}
            <Confirm open={hapus} onClose={() => setHapus(false)} danger icon="delete" title="Hapus pengumuman ini?" desc="Pengumuman dan lampirannya akan dihapus permanen." confirmLabel="Ya, Hapus" onConfirm={() => router.delete(`/pengumuman/${p.id}`)} />
        </>
    );
}
