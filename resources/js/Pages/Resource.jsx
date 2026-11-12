import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Confirm, DataTable, Dropdown, Empty, Field, FileDrop, Icon, MenuItem, Modal, PageHeader, Pagination, SearchInput, opsi, rowText } from '../Components/ui';

function Input({ field: [name, label, type, options], form, current }) {
    const err = form.errors[name] ?? Object.entries(form.errors).find(([k]) => k.startsWith(name + '.'))?.[1];
    const wide = ['textarea', 'file', 'checks'].includes(type);
    const set = (v) => form.setData(name, v);

    if (type === 'file')
        return (
            <div className="sm:col-span-2">
                <span className="label">{label}</span>
                <FileDrop name={name} onFile={set} />
                {current?._file && <p className="mt-1 text-label-sm text-on-surface-variant">Berkas saat ini: {current._file} (unggah baru untuk mengganti)</p>}
                {err && <p className="mt-1 text-label-sm font-medium text-danger-ink">{err}</p>}
            </div>
        );
    if (type === 'checks') {
        const groups = Object.groupBy ? Object.groupBy(options, (o) => o[2] ?? '') : options.reduce((a, o) => ((a[o[2] ?? ''] ??= []).push(o), a), {});
        const val = (form.data[name] ?? []).map(String);
        return (
            <fieldset className="sm:col-span-2">
                <legend className="label">
                    {label} <span className="font-normal text-on-surface-variant">· {val.length} dipilih</span>
                </legend>
                <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-outline-variant p-3">
                    {options.length === 0 && <p className="text-label-sm text-on-surface-variant">Belum ada soal. Tambahkan soal di menu Bank Soal terlebih dahulu.</p>}
                    {Object.entries(groups).map(([g, items]) => (
                        <div key={g}>
                            {g && <p className="eyebrow mb-1.5">{g}</p>}
                            {items.map(([v, l]) => (
                                <label key={v} className="flex cursor-pointer items-start gap-2.5 rounded-md p-1.5 text-label-sm hover:bg-surface-container-low">
                                    <input type="checkbox" className="mt-0.5 size-4 accent-primary-container" checked={val.includes(String(v))} onChange={(e) => set(e.target.checked ? [...val, String(v)] : val.filter((x) => x !== String(v)))} />
                                    <span>{l}</span>
                                </label>
                            ))}
                        </div>
                    ))}
                </div>
                {err && <p className="mt-1 text-label-sm font-medium text-danger-ink">{err}</p>}
            </fieldset>
        );
    }
    return (
        <Field label={label} error={err} className={wide ? 'sm:col-span-2' : ''}>
            {type === 'select' ? (
                <select value={form.data[name] ?? ''} onChange={(e) => set(e.target.value)} className="input">
                    <option value="">— Pilih —</option>
                    {options.map((o) => {
                        const [v, l] = opsi(o);
                        return (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        );
                    })}
                </select>
            ) : type === 'textarea' ? (
                <textarea rows={name === 'konten' ? 8 : 4} value={form.data[name] ?? ''} onChange={(e) => set(e.target.value)} className="input" />
            ) : (
                <input type={type} value={form.data[name] ?? ''} onChange={(e) => set(e.target.value)} className="input" autoComplete={type === 'password' ? 'new-password' : undefined} />
            )}
        </Field>
    );
}

/** Halaman data generik untuk admin & tutor. Kolom, filter, formulir, dan aturan validasi datang dari server. */
export default function Resource({ title, desc, icon, add, stats, filters, columns, rows, form: fields, edit, role, slug, imporInfo }) {
    const page = usePage();
    const base = `/${role}/${slug}`;
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const kosong = useMemo(() => Object.fromEntries(fields.map(([n, , t]) => [n, t === 'checks' ? [] : t === 'file' ? null : ''])), [fields]);
    const form = useForm(kosong);
    const [q, setQ] = useState(params.get('q') ?? '');
    const [sel, setSel] = useState(filters.map((f) => f[0]));
    const [modal, setModal] = useState(null); // { row } untuk ubah, {} untuk tambah
    const [hapus, setHapus] = useState(null);
    const [impor, setImpor] = useState(false);
    const [hasil, setHasil] = useState(null);
    const formImpor = useForm({ berkas: null, lewati: false });
    useEffect(() => {
        if (page.props.hasilImpor) setHasil(page.props.hasilImpor);
    }, [page]);

    const buka = (row = null) => {
        form.clearErrors();
        form.setData({ ...kosong, ...Object.fromEntries(Object.entries(row?._values ?? {}).filter(([k]) => k in kosong).map(([k, v]) => [k, v ?? (Array.isArray(kosong[k]) ? [] : '')])) });
        setModal({ row });
    };

    useEffect(() => {
        if (add && params.has('tambah')) buka();
    }, []);

    const texts = useMemo(() => rows.map(rowText), [rows]);
    const visible = rows.filter((_, i) => texts[i].includes(q.toLowerCase()) && sel.every((v, f) => v === filters[f][0] || texts[i].includes(v.toLowerCase())));

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, forceFormData: fields.some((f) => f[2] === 'file'), onSuccess: () => setModal(null) };
        if (modal.row) {
            form.transform((d) => ({ ...d, _method: 'put' }));
            form.post(`${base}/${modal.row.id}`, opts);
        } else {
            form.transform((d) => d);
            form.post(base, opts);
        }
    };

    return (
        <>
            <Head title={title} />
            <PageHeader
                crumbs={[['Dashboard', `/${role}`], [title]]}
                title={title}
                desc={desc}
                actions={
                    <>
                        {imporInfo && (
                            <button type="button" className="btn btn-ghost" onClick={() => { formImpor.reset(); formImpor.clearErrors(); setImpor(true); }}>
                                <Icon n="upload_file" className="!text-[18px]" />
                                Impor Excel
                            </button>
                        )}
                        {add && (
                            <button type="button" className="btn btn-primary" onClick={() => buka()}>
                                <Icon n="add" className="!text-[18px]" />
                                {add}
                            </button>
                        )}
                    </>
                }
            />

            <section className={`mb-6 grid grid-cols-2 gap-3 sm:gap-gutter ${stats.length > 3 ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`} aria-label="Ringkasan">
                {stats.map(([label, value, ic], i) => (
                    <div key={label} className={`card flex items-center gap-3 p-4 sm:gap-4 sm:p-5 ${stats.length === 3 && i === 2 ? 'col-span-2 lg:col-span-1' : ''}`}>
                        <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-surface-container-low text-primary-container sm:grid">
                            <Icon n={ic} />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-label-sm text-on-surface-variant">{label}</p>
                            <p className="text-headline-lg font-bold">{value}</p>
                        </div>
                    </div>
                ))}
            </section>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 sm:p-5 lg:flex-row lg:items-center">
                    <SearchInput value={q} onChange={setQ} placeholder={`Cari ${title.toLowerCase()}…`} className="lg:max-w-sm lg:flex-1" />
                    {filters.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            {filters.map((opts, f) => (
                                <select key={f} value={sel[f]} onChange={(e) => setSel(sel.map((v, j) => (j === f ? e.target.value : v)))} className="input min-h-10 sm:w-auto" aria-label={opts[0]}>
                                    {opts.map((o) => (
                                        <option key={o}>{o}</option>
                                    ))}
                                </select>
                            ))}
                        </div>
                    )}
                    <p className="text-label-sm text-on-surface-variant lg:ml-auto">
                        <b className="text-on-surface">{visible.length}</b> dari {rows.length}
                    </p>
                </div>

                {visible.length ? (
                    <DataTable
                        columns={columns}
                        rows={visible}
                        actions={(r) =>
                            edit ? (
                                <Dropdown
                                    className="w-44"
                                    trigger={({ toggle, open }) => (
                                        <button type="button" onClick={toggle} aria-expanded={open} className="btn-icon size-9" aria-label="Aksi baris">
                                            <Icon n="more_vert" />
                                        </button>
                                    )}
                                >
                                    {r.href && (
                                        <MenuItem icon="open_in_new" href={r.href}>
                                            {slug === 'kehadiran' ? 'Isi presensi' : slug === 'tugas' ? 'Nilai pengumpulan' : 'Lihat detail'}
                                        </MenuItem>
                                    )}
                                    <MenuItem icon="edit" onClick={() => buka(r)}>
                                        Ubah
                                    </MenuItem>
                                    <MenuItem icon="delete" danger onClick={() => setHapus(r)}>
                                        Hapus
                                    </MenuItem>
                                </Dropdown>
                            ) : (
                                r.href &&
                                (r.external ? (
                                    <a href={r.href} target="_blank" rel="noreferrer" className="btn-icon size-9" aria-label="Cetak rapor (PDF)">
                                        <Icon n="picture_as_pdf" />
                                    </a>
                                ) : (
                                    <Link href={r.href} className="btn-icon size-9" aria-label="Lihat detail">
                                        <Icon n="chevron_right" />
                                    </Link>
                                ))
                            )
                        }
                    />
                ) : rows.length ? (
                    <Empty
                        icon="search_off"
                        title="Data tidak ditemukan"
                        desc="Coba ubah kata kunci atau atur ulang filter."
                        action={
                            <button type="button" className="btn btn-ghost" onClick={() => { setQ(''); setSel(filters.map((f) => f[0])); }}>
                                Atur ulang filter
                            </button>
                        }
                    />
                ) : (
                    <Empty icon={icon} title="Belum ada data" desc={add ? `Mulai dengan menekan tombol “${add}”.` : 'Data akan muncul di sini.'} action={add && <button type="button" className="btn btn-primary" onClick={() => buka()}>{add}</button>} />
                )}
                {visible.length > 25 && <Pagination shown={visible.length} total={rows.length} />}
            </Card>

            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                icon={icon}
                title={modal?.row ? `Ubah ${title.replace(/^Data /, '')}` : add}
                desc="Kolom bertanda (opsional) boleh dikosongkan."
                size="lg"
                footer={
                    <>
                        <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
                            Batal
                        </button>
                        <button type="submit" form="form-resource" className="btn btn-primary" disabled={form.processing}>
                            <Icon n={form.processing ? 'progress_activity' : 'save'} className={`!text-[18px] ${form.processing ? 'animate-spin' : ''}`} />
                            {form.processing ? 'Menyimpan…' : 'Simpan'}
                        </button>
                    </>
                }
            >
                {modal && (
                    <form id="form-resource" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
                        {Object.keys(form.errors).length > 0 && <p className="rounded-lg bg-danger-container p-3 text-label-sm font-medium text-danger-ink sm:col-span-2" role="alert">Periksa kembali isian yang ditandai.</p>}
                        {fields.map((f) => (
                            <Input key={f[0]} field={f} form={form} current={modal.row?._values} />
                        ))}
                    </form>
                )}
            </Modal>

            {imporInfo && (
                <Modal
                    open={impor}
                    onClose={() => setImpor(false)}
                    icon="upload_file"
                    title={`Impor ${title.replace(/^Data /, '')}`}
                    desc="Tambah atau perbarui banyak data sekaligus dari Excel (.xlsx) atau CSV."
                    size="lg"
                    footer={
                        <>
                            <button type="button" className="btn btn-ghost" onClick={() => setImpor(false)}>
                                Batal
                            </button>
                            <button type="submit" form="form-impor" className="btn btn-primary" disabled={!formImpor.data.berkas || formImpor.processing}>
                                <Icon n={formImpor.processing ? 'progress_activity' : 'upload'} className={`!text-[18px] ${formImpor.processing ? 'animate-spin' : ''}`} />
                                {formImpor.processing ? 'Memproses…' : 'Impor Sekarang'}
                            </button>
                        </>
                    }
                >
                    <form
                        id="form-impor"
                        className="space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            formImpor.transform((d) => ({ ...d, lewati: d.lewati ? 1 : 0 }));
                            formImpor.post(`/impor/${slug}`, { forceFormData: true, preserveScroll: true, onSuccess: () => { setImpor(false); formImpor.reset(); } });
                        }}
                    >
                        <ol className="space-y-5">
                            <li className="flex gap-3">
                                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary-container text-label-sm font-bold">1</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-label-md">Unduh templat, lalu isi di Excel</p>
                                    <p className="text-label-sm text-on-surface-variant">Satu baris = satu data. Kolom bertanda * wajib diisi. Data lama dengan kunci yang sama akan diperbarui.</p>
                                    <a href={`/impor/${slug}/templat`} className="btn btn-sm btn-soft mt-2">
                                        <Icon n="download" className="!text-[16px]" />
                                        Unduh Templat
                                    </a>
                                    <div className="mt-3 overflow-x-auto rounded-lg border border-outline-variant">
                                        <table className="w-full text-left text-label-sm">
                                            <thead className="bg-surface-container-low">
                                                <tr>
                                                    {['Kolom', 'Contoh', 'Keterangan'].map((h) => (
                                                        <th key={h} className="eyebrow px-3 py-2">
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/70">
                                                {imporInfo.kolom.map((k) => (
                                                    <tr key={k.judul}>
                                                        <td className="px-3 py-2 font-semibold whitespace-nowrap">
                                                            {k.judul}
                                                            {k.wajib && <span className="text-danger"> *</span>}
                                                        </td>
                                                        <td className="px-3 py-2 text-on-surface-variant">{k.contoh || '—'}</td>
                                                        <td className="px-3 py-2 text-on-surface-variant">{k.ket}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {imporInfo.acuan && (
                                        <details className="mt-3 rounded-lg bg-surface-container-low p-3 text-label-sm">
                                            <summary className="cursor-pointer font-semibold">
                                                {imporInfo.acuan[0]} ({imporInfo.acuan[1].length})
                                            </summary>
                                            <ul className="mt-2 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-on-surface-variant">
                                                {imporInfo.acuan[1].map((a) => (
                                                    <li key={a}>{a}</li>
                                                ))}
                                            </ul>
                                        </details>
                                    )}
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary-container text-label-sm font-bold">2</span>
                                <div className="min-w-0 flex-1">
                                    <p className="mb-2 text-label-md">Unggah berkas yang sudah diisi</p>
                                    <FileDrop name="berkas" accept=".xlsx,.csv,.txt" hint="Excel (.xlsx) atau CSV · maksimal 5 MB, 2.000 baris" onFile={(f) => formImpor.setData('berkas', f)} />
                                    {formImpor.errors.berkas && (
                                        <p className="mt-1.5 text-label-sm font-medium text-danger-ink" role="alert">
                                            {formImpor.errors.berkas}
                                        </p>
                                    )}
                                    <label className="mt-3 flex items-start gap-2 text-label-sm">
                                        <input type="checkbox" checked={formImpor.data.lewati} onChange={(e) => formImpor.setData('lewati', e.target.checked)} className="mt-0.5 size-4 accent-primary-container" />
                                        <span>Lewati baris bermasalah dan simpan baris yang valid. Bila tidak dicentang, impor dibatalkan seluruhnya jika ada satu baris yang salah.</span>
                                    </label>
                                </div>
                            </li>
                        </ol>
                    </form>
                </Modal>
            )}

            <Modal
                open={!!hasil}
                onClose={() => setHasil(null)}
                icon={hasil?.ok ? 'task_alt' : 'error'}
                title={hasil?.ok ? 'Impor selesai' : 'Impor dibatalkan'}
                desc={hasil && (hasil.ok ? `${hasil.dibuat} ${hasil.jenis} baru · ${hasil.diperbarui} diperbarui${hasil.dilewati ? ` · ${hasil.dilewati} dilewati (sudah ada)` : ''}` : `${hasil.jumlahGalat} dari ${hasil.total} baris bermasalah. Tidak ada data yang disimpan.`)}
                size="lg"
                footer={
                    <button type="button" className="btn btn-primary" onClick={() => setHasil(null)}>
                        Tutup
                    </button>
                }
            >
                {hasil?.akun?.length > 0 && (
                    <div className="mb-5">
                        <p className="mb-2 flex items-center gap-2 rounded-lg bg-warning-container p-3 text-label-md text-warning-ink">
                            <Icon n="key" />
                            Catat atau salin sekarang — kata sandi awal ini hanya ditampilkan sekali.
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-outline-variant">
                            <table className="w-full text-left text-label-sm">
                                <thead className="bg-surface-container-low">
                                    <tr>
                                        {['Nama', 'Username', 'Kata sandi awal'].map((h) => (
                                            <th key={h} className="eyebrow px-3 py-2">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/70">
                                    {hasil.akun.map((a) => (
                                        <tr key={a.username}>
                                            <td className="px-3 py-2">{a.nama}</td>
                                            <td className="px-3 py-2 font-mono">{a.username}</td>
                                            <td className="px-3 py-2 font-mono font-bold">{a.password}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" className="btn btn-sm btn-ghost mt-2" onClick={() => navigator.clipboard?.writeText(hasil.akun.map((a) => [a.nama, a.username, a.password].join('\t')).join('\n'))}>
                            <Icon n="content_copy" className="!text-[16px]" />
                            Salin semua
                        </button>
                    </div>
                )}
                {hasil?.galat?.length > 0 && (
                    <>
                        <p className="mb-3 text-label-sm text-on-surface-variant">
                            {hasil.ok ? `${hasil.jumlahGalat} baris dilewati karena bermasalah:` : `Perbaiki baris berikut lalu unggah ulang, atau centang “Lewati baris bermasalah” untuk menyimpan ${hasil.valid} baris yang valid.`}
                        </p>
                        <ul className="max-h-80 divide-y divide-outline-variant/70 overflow-y-auto rounded-lg border border-outline-variant">
                            {hasil.galat.map((g) => (
                                <li key={g.baris} className="flex gap-3 p-3">
                                    <Badge tone="danger" className="h-fit shrink-0">
                                        Baris {g.baris}
                                    </Badge>
                                    <div className="min-w-0">
                                        <p className="text-label-md">{g.nama}</p>
                                        <p className="text-label-sm text-danger-ink">{g.pesan}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {hasil.jumlahGalat > hasil.galat.length && <p className="mt-2 text-label-sm text-on-surface-variant">…dan {hasil.jumlahGalat - hasil.galat.length} baris lainnya.</p>}
                    </>
                )}
                {hasil?.ok && !hasil.galat?.length && !hasil.akun?.length && <p className="text-body-md">Semua baris berhasil diproses.</p>}
            </Modal>

            <Confirm
                open={!!hapus}
                onClose={() => setHapus(null)}
                danger
                icon="delete"
                title="Hapus data ini?"
                desc="Data yang dihapus beserta data turunannya (mis. pengumpulan, nilai) tidak dapat dikembalikan."
                confirmLabel="Ya, Hapus"
                onConfirm={() => router.delete(`${base}/${hapus.id}`, { preserveScroll: true, onFinish: () => setHapus(null) })}
            />
        </>
    );
}
