import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Badge, Card, Empty, Field, FileDrop, Icon, Modal, PageHeader, SearchInput, Tabs, cx } from '../../Components/ui';

export const KATEGORI = { Akademik: 'primary', Kegiatan: 'lime', Administrasi: 'warning', Sistem: 'neutral' };
const TARGET = { semua: 'Semua pengguna & Beranda Publik', siswa: 'Peserta didik', tutor: 'Tutor' };

/** Modal buat/ubah pengumuman (dipakai di daftar & detail). */
export function FormPengumuman({ open, onClose, data }) {
    const form = useForm({ judul: '', kategori: 'Akademik', target: 'semua', isi: '', penting: false, lampiran: null });
    useEffect(() => {
        if (open) {
            form.clearErrors();
            form.setData(data ? { judul: data.judul, kategori: data.kategori, target: data.target, isi: Array.isArray(data.isi) ? data.isi.join('\n\n') : data.isi, penting: data.penting, lampiran: null } : { judul: '', kategori: 'Akademik', target: 'semua', isi: '', penting: false, lampiran: null });
        }
    }, [open]);
    const submit = (e) => {
        e.preventDefault();
        form.transform((d) => ({ ...d, penting: d.penting ? 1 : 0 }));
        form.post(data ? `/pengumuman/${data.id}` : '/pengumuman', { forceFormData: true, preserveScroll: true, onSuccess: onClose });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            icon="campaign"
            title={data ? 'Ubah Pengumuman' : 'Buat Pengumuman'}
            desc={data ? undefined : 'Pengumuman dari Administrator untuk semua pengguna otomatis tampil di Beranda Publik (Landing Page), dashboard, dan notifikasi.'}
            size="lg"
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Batal
                    </button>
                    <button type="submit" form="form-pengumuman" className="btn btn-primary" disabled={form.processing}>
                        <Icon n="send" className="!text-[18px]" />
                        {data ? 'Simpan Perubahan' : 'Terbitkan'}
                    </button>
                </>
            }
        >
            <form id="form-pengumuman" className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                <Field label="Judul" error={form.errors.judul} className="sm:col-span-2">
                    <input value={form.data.judul} onChange={(e) => form.setData('judul', e.target.value)} className="input" placeholder="Contoh: Jadwal Penilaian Akhir Semester" />
                </Field>
                <Field label="Kategori" error={form.errors.kategori}>
                    <select value={form.data.kategori} onChange={(e) => form.setData('kategori', e.target.value)} className="input">
                        {Object.keys(KATEGORI).map((k) => (
                            <option key={k}>{k}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Ditujukan untuk" error={form.errors.target}>
                    <select value={form.data.target} onChange={(e) => form.setData('target', e.target.value)} className="input">
                        {Object.entries(TARGET).map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Isi pengumuman" hint="Pisahkan paragraf dengan baris kosong." error={form.errors.isi} className="sm:col-span-2">
                    <textarea rows={7} value={form.data.isi} onChange={(e) => form.setData('isi', e.target.value)} className="input" />
                </Field>
                <div className="sm:col-span-2">
                    <span className="label">Lampiran (opsional)</span>
                    <FileDrop name="lampiran" hint="PDF, JPG, PNG, atau DOCX · maksimal 10 MB" onFile={(f) => form.setData('lampiran', f)} />
                    {data?.lampiran?.[0] && <p className="mt-1 text-label-sm text-on-surface-variant">Lampiran saat ini: {data.lampiran[0].nama}</p>}
                    {form.errors.lampiran && <p className="mt-1 text-label-sm text-danger-ink">{form.errors.lampiran}</p>}
                </div>
                <label className="flex items-center gap-2 text-label-md sm:col-span-2">
                    <input type="checkbox" checked={!!form.data.penting} onChange={(e) => form.setData('penting', e.target.checked)} className="size-4 accent-primary-container" />
                    Tandai sebagai pengumuman penting
                </label>
            </form>
        </Modal>
    );
}

export default function Pengumuman({ items }) {
    const { role } = usePage().props.auth.user;
    const [kat, setKat] = useState('semua');
    const [q, setQ] = useState('');
    const [buat, setBuat] = useState(false);
    const list = items.filter((p) => (kat === 'semua' || p.kategori === kat) && `${p.judul} ${p.ringkas}`.toLowerCase().includes(q.toLowerCase()));

    useEffect(() => {
        if (role !== 'siswa' && new URLSearchParams(window.location.search).has('tambah')) setBuat(true);
    }, []);

    return (
        <>
            <Head title="Pengumuman" />
            <PageHeader
                crumbs={[['Dashboard', `/${role}`], ['Pengumuman']]}
                title="Pengumuman"
                desc="Informasi resmi PKBM Bina Harapan Permata untuk peserta didik dan tutor."
                actions={
                    role !== 'siswa' && (
                        <button type="button" className="btn btn-primary" onClick={() => setBuat(true)}>
                            <Icon n="campaign" className="!text-[18px]" />
                            Buat Pengumuman
                        </button>
                    )
                }
            />

            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
                <Tabs value={kat} onChange={setKat} tabs={[['semua', 'Semua', items.length], ...Object.keys(KATEGORI).map((k) => [k, k, items.filter((p) => p.kategori === k).length])]} />
                <SearchInput value={q} onChange={setQ} placeholder="Cari pengumuman…" className="md:ml-auto md:w-72" />
            </div>

            {list.length ? (
                <div className="space-y-3">
                    {list.map((p) => (
                        <Link key={p.id} href={`/pengumuman/${p.id}`} className={cx('card card-hover flex gap-4 p-4 sm:p-5', p.baru && 'border-l-4 border-l-secondary-container')}>
                            <span className={cx('hidden size-12 shrink-0 place-items-center rounded-xl sm:grid', p.penting ? 'bg-primary-container text-secondary-container' : 'bg-surface-container-low text-primary-container')}>
                                <Icon n={p.penting ? 'priority_high' : 'campaign'} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge tone={KATEGORI[p.kategori]}>{p.kategori}</Badge>
                                    {p.baru && (
                                        <Badge tone="lime" dot>
                                            Terbaru
                                        </Badge>
                                    )}
                                    {p.penting && <Badge tone="danger">Penting</Badge>}
                                    {role === 'admin' && p.target !== 'semua' && <Badge>Untuk {TARGET[p.target].toLowerCase()}</Badge>}
                                    <span className="text-label-sm text-on-surface-variant sm:ml-auto">{p.tanggal}</span>
                                </div>
                                <h2 className="mt-2 text-label-md text-[15px]">{p.judul}</h2>
                                <p className="mt-1 line-clamp-2 text-body-md text-on-surface-variant">{p.ringkas}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-label-sm text-on-surface-variant">
                                    <span className="flex items-center gap-1">
                                        <Icon n="person" className="!text-[16px]" />
                                        {p.penulis}
                                    </span>
                                    {p.lampiran.length > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Icon n="attach_file" className="!text-[16px]" />
                                            {p.lampiran.length} lampiran
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card>
                    <Empty icon="campaign" title="Belum ada pengumuman" desc="Tidak ada pengumuman yang cocok dengan filter yang dipilih." />
                </Card>
            )}

            {role !== 'siswa' && <FormPengumuman open={buat} onClose={() => setBuat(false)} />}
        </>
    );
}
