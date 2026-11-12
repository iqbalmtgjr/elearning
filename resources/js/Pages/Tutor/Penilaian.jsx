import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Avatar, Badge, Card, Empty, Field, Icon, PageHeader, Tabs, cx } from '../../Components/ui';

function PanelTugas({ s }) {
    const form = useForm({ nilai: s.nilai ?? '', umpan_balik: s.umpan ?? '' });
    return (
        <>
            <div className="flex flex-col gap-4 border-b border-outline-variant/70 p-5 sm:flex-row sm:items-center sm:p-6">
                <Avatar name={s.nama} size="md" />
                <div className="min-w-0 flex-1">
                    <h2 className="text-headline-md">{s.nama}</h2>
                    <p className="text-label-sm text-on-surface-variant">
                        {s.kelas} · {s.tugas}
                    </p>
                </div>
                <Badge tone={s.terlambat ? 'danger' : 'success'} dot>
                    {s.terlambat ? 'Dikumpulkan terlambat' : 'Tepat waktu'}
                </Badge>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-3 rounded-xl border border-outline-variant/70 p-3">
                    <span className="grid size-11 place-items-center rounded-lg bg-danger-container text-danger-ink">
                        <Icon n="description" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-label-md">{s.file ?? 'Tanpa berkas'}</p>
                        <p className="text-label-sm text-on-surface-variant">{[s.ukuran, s.waktu].filter(Boolean).join(' · ')}</p>
                    </div>
                    {s.url && (
                        <>
                            <a href={s.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">
                                <Icon n="visibility" className="!text-[16px]" />
                                <span className="hidden sm:inline">Buka</span>
                            </a>
                            <a href={`${s.url}?unduh=1`} className="btn-icon size-9" aria-label="Unduh berkas">
                                <Icon n="download" />
                            </a>
                        </>
                    )}
                </div>
                {s.catatan && (
                    <div className="rounded-xl bg-surface-container-low p-4">
                        <p className="eyebrow mb-1">Catatan peserta didik</p>
                        <p className="text-body-md">“{s.catatan}”</p>
                    </div>
                )}
                <form
                    className="space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(`/tutor/penilaian/${s.id}`, { preserveScroll: true });
                    }}
                >
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                        <Field label="Nilai (0–100)" error={form.errors.nilai}>
                            <input type="number" min={0} max={100} value={form.data.nilai} onChange={(e) => form.setData('nilai', e.target.value)} className="input text-headline-md" placeholder="—" />
                        </Field>
                        <Field label="Umpan balik untuk peserta didik" error={form.errors.umpan_balik}>
                            <textarea rows={4} value={form.data.umpan_balik} onChange={(e) => form.setData('umpan_balik', e.target.value)} className="input" placeholder="Sampaikan kelebihan dan hal yang perlu diperbaiki…" />
                        </Field>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" className="btn btn-ghost" disabled={form.processing} onClick={() => router.post(`/tutor/penilaian/${s.id}/revisi`, { umpan_balik: form.data.umpan_balik }, { preserveScroll: true })}>
                            <Icon n="replay" className="!text-[18px]" />
                            Minta Revisi
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={form.processing}>
                            <Icon n="send" className="!text-[18px]" />
                            {s.status === 'dinilai' ? 'Perbarui Nilai' : 'Simpan & Kirim Nilai'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

function PanelEsai({ s }) {
    const form = useForm({ nilai: Object.fromEntries(s.soal.map((q) => [q.id, q.nilai ?? ''])) });
    return (
        <>
            <div className="flex flex-col gap-4 border-b border-outline-variant/70 p-5 sm:flex-row sm:items-center sm:p-6">
                <Avatar name={s.nama} size="md" />
                <div className="min-w-0 flex-1">
                    <h2 className="text-headline-md">{s.nama}</h2>
                    <p className="text-label-sm text-on-surface-variant">
                        {s.kelas} · {s.ujian} · {s.waktu}
                    </p>
                </div>
                {s.nilai !== null && <Badge tone="success">Nilai akhir {s.nilai}</Badge>}
            </div>
            <form
                className="space-y-5 p-5 sm:p-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(`/tutor/esai/${s.id}`, { preserveScroll: true });
                }}
            >
                <p className="rounded-lg bg-surface-container-low p-3 text-label-sm text-on-surface-variant">
                    <Icon n="info" className="mr-1 !text-[16px] text-primary-container" />
                    Soal pilihan ganda sudah dinilai otomatis. Beri skor 0–100 untuk setiap jawaban esai; nilai akhir dihitung setelah semua esai dinilai.
                </p>
                {s.soal.map((q, i) => (
                    <div key={q.id} className="rounded-xl border border-outline-variant/70 p-4">
                        <p className="eyebrow">Esai {i + 1}</p>
                        <p className="mt-1 text-label-md text-[14px]">{q.pertanyaan}</p>
                        {q.pedoman && <p className="mt-1 text-label-sm text-on-surface-variant">Pedoman: {q.pedoman}</p>}
                        <div className="mt-3 rounded-lg bg-surface-container-low p-3 text-body-md whitespace-pre-line">{q.jawaban || <i className="text-on-surface-variant">Tidak dijawab</i>}</div>
                        <Field label="Skor (0–100)" error={form.errors[`nilai.${q.id}`]} className="mt-3 max-w-40">
                            <input type="number" min={0} max={100} value={form.data.nilai[q.id]} onChange={(e) => form.setData('nilai', { ...form.data.nilai, [q.id]: e.target.value })} className="input" />
                        </Field>
                    </div>
                ))}
                <div className="flex justify-end">
                    <button type="submit" className="btn btn-primary" disabled={form.processing}>
                        <Icon n="send" className="!text-[18px]" />
                        Simpan Nilai Esai
                    </button>
                </div>
            </form>
        </>
    );
}

export default function Penilaian({ items, esai, filterTugas, tab: tabAwal }) {
    const [jenis, setJenis] = useState(tabAwal);
    const [status, setStatus] = useState('menunggu');
    const sumber = jenis === 'esai' ? esai : items;
    const list = sumber.filter((i) => i.status === status);
    const [pilih, setPilih] = useState(null);
    const s = list.find((i) => i.id === pilih) ?? list[0];

    const buka = (it) => {
        setPilih(it.id);
        if (window.innerWidth < 1024) setTimeout(() => document.getElementById('panel-nilai')?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    return (
        <>
            <Head title="Penilaian" />
            <PageHeader crumbs={[['Dashboard', '/tutor'], ['Penilaian']]} title="Penilaian" desc="Periksa pengumpulan tugas dan jawaban esai ujian, beri nilai, dan tuliskan umpan balik yang membangun." />

            {filterTugas && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-secondary-container/40 p-3 text-label-md">
                    <Icon n="filter_alt" className="text-primary-container" />
                    <span className="flex-1">Menampilkan pengumpulan untuk: {filterTugas}</span>
                    <Link href="/tutor/penilaian" className="btn btn-sm btn-ghost">
                        Tampilkan semua
                    </Link>
                </div>
            )}

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <Tabs value={jenis} onChange={(t) => { setJenis(t); setPilih(null); }} tabs={[['tugas', 'Tugas', items.filter((i) => i.status === 'menunggu').length], ['esai', 'Esai Ujian', esai.filter((i) => i.status === 'menunggu').length]]} className="w-fit" />
                <Tabs value={status} onChange={(t) => { setStatus(t); setPilih(null); }} tabs={[['menunggu', 'Menunggu'], ['dinilai', 'Sudah Dinilai']]} className="w-fit" />
            </div>

            <div className="grid items-start gap-gutter lg:grid-cols-[380px_1fr]">
                <Card as="ul" className="divide-y divide-outline-variant/70 overflow-hidden">
                    {list.length === 0 && <li className="p-6 text-center text-label-sm text-on-surface-variant">Tidak ada data.</li>}
                    {list.map((it) => (
                        <li key={it.id}>
                            <button type="button" onClick={() => buka(it)} aria-current={s?.id === it.id} className={cx('flex w-full items-start gap-3 p-4 text-left transition', s?.id === it.id ? 'bg-secondary-container/30' : 'hover:bg-surface-container-low')}>
                                <Avatar name={it.nama} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-label-md">{it.nama}</p>
                                        {it.nilai !== null && it.nilai !== undefined ? <span className="text-label-md text-primary-container">{it.nilai}</span> : it.terlambat && <Badge tone="danger">Terlambat</Badge>}
                                    </div>
                                    <p className="truncate text-label-sm text-on-surface-variant">{it.tugas ?? it.ujian}</p>
                                    <p className="mt-0.5 text-caption text-on-surface-variant">
                                        {it.kelas} · {it.waktu}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </Card>

                <Card id="panel-nilai" className="scroll-mt-20">
                    {s ? (
                        jenis === 'esai' ? <PanelEsai key={`e${s.id}`} s={s} /> : <PanelTugas key={`t${s.id}`} s={s} />
                    ) : (
                        <Empty icon="task_alt" title={status === 'menunggu' ? 'Tidak ada yang perlu dinilai' : 'Belum ada yang dinilai'} desc={status === 'menunggu' ? 'Semua pekerjaan pada kategori ini sudah dinilai. Kerja bagus!' : 'Hasil penilaian akan muncul di sini.'} />
                    )}
                </Card>
            </div>
        </>
    );
}
