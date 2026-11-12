import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card, Field, Icon, PageHeader, cx } from '../../Components/ui';

const TABS = [
    ['lembaga', 'Identitas Lembaga', 'apartment'],
    ['akademik', 'Tahun Ajaran', 'calendar_month'],
    ['penilaian', 'Penilaian', 'grading'],
];

function Section({ title, desc, children }) {
    return (
        <div className="grid gap-4 border-b border-outline-variant/70 py-6 first:pt-0 last:border-0 last:pb-0 lg:grid-cols-3 lg:gap-8">
            <div>
                <h3 className="text-label-md text-[15px]">{title}</h3>
                {desc && <p className="mt-1 text-label-sm text-on-surface-variant">{desc}</p>}
            </div>
            <div className="lg:col-span-2">{children}</div>
        </div>
    );
}

export default function Pengaturan({ pengaturan }) {
    const [tab, setTab] = useState('lembaga');
    const form = useForm(pengaturan);
    const input = (name, props = {}) => <input {...props} value={form.data[name] ?? ''} onChange={(e) => form.setData(name, e.target.value)} className="input" />;
    const salahTab = (t) => ({ lembaga: ['nama_lembaga', 'nama_singkat', 'kepala', 'npsn', 'email', 'telepon', 'alamat'], akademik: ['tahun_ajaran', 'semester', 'mulai', 'selesai'], penilaian: ['kkm', 'bobot_tugas'] })[t].some((k) => form.errors[k]);

    return (
        <>
            <Head title="Pengaturan Sistem" />
            <PageHeader crumbs={[['Dashboard', '/admin'], ['Pengaturan Sistem']]} title="Pengaturan Sistem" desc="Atur identitas lembaga, periode akademik, dan aturan penilaian yang dipakai di seluruh aplikasi." />

            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <nav aria-label="Kategori pengaturan" className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
                    {TABS.map(([k, label, icon]) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setTab(k)}
                            aria-current={tab === k ? 'true' : undefined}
                            className={cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-label-md whitespace-nowrap transition', tab === k ? 'bg-surface-container-lowest text-primary-container shadow-card ring-1 ring-outline-variant' : 'text-on-surface-variant hover:bg-surface-container-lowest/60')}
                        >
                            <Icon n={icon} fill={tab === k} />
                            {label}
                            {salahTab(k) && <span className="size-2 rounded-full bg-danger" aria-label="ada kesalahan" />}
                        </button>
                    ))}
                </nav>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post('/admin/pengaturan', { preserveScroll: true });
                    }}
                >
                    <Card className="p-5 sm:p-6">
                        {tab === 'lembaga' && (
                            <Section title="Profil Lembaga" desc="Dipakai pada laporan dan informasi lembaga.">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Nama Lembaga" error={form.errors.nama_lembaga} className="sm:col-span-2">{input('nama_lembaga')}</Field>
                                    <Field label="Nama Singkat" error={form.errors.nama_singkat}>{input('nama_singkat')}</Field>
                                    <Field label="NPSN" error={form.errors.npsn}>{input('npsn')}</Field>
                                        <Field label="Nama Kepala Lembaga" hint="Tampil di kolom tanda tangan laporan dan rapor." error={form.errors.kepala}>{input('kepala')}</Field>
                                    <Field label="Email Resmi" error={form.errors.email}>{input('email', { type: 'email' })}</Field>
                                    <Field label="Telepon" error={form.errors.telepon}>{input('telepon', { type: 'tel' })}</Field>
                                    <Field label="Alamat" error={form.errors.alamat} className="sm:col-span-2">
                                        <textarea rows={3} value={form.data.alamat ?? ''} onChange={(e) => form.setData('alamat', e.target.value)} className="input" />
                                    </Field>
                                </div>
                            </Section>
                        )}

                        {tab === 'akademik' && (
                            <Section title="Periode Akademik" desc="Tampil di sidebar dan laporan seluruh pengguna.">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Tahun Ajaran" hint="Contoh: 2026/2027" error={form.errors.tahun_ajaran}>{input('tahun_ajaran')}</Field>
                                    <Field label="Semester" error={form.errors.semester}>
                                        <select value={form.data.semester} onChange={(e) => form.setData('semester', e.target.value)} className="input">
                                            <option>Ganjil</option>
                                            <option>Genap</option>
                                        </select>
                                    </Field>
                                    <Field label="Tanggal Mulai" error={form.errors.mulai}>{input('mulai', { type: 'date' })}</Field>
                                    <Field label="Tanggal Selesai" error={form.errors.selesai}>{input('selesai', { type: 'date' })}</Field>
                                </div>
                            </Section>
                        )}

                        {tab === 'penilaian' && (
                            <>
                                <Section title="Kriteria Ketuntasan Minimal" desc="Nilai akhir minimal agar peserta didik dinyatakan tuntas.">
                                    <Field label="KKM" error={form.errors.kkm} className="max-w-48">{input('kkm', { type: 'number', min: 0, max: 100 })}</Field>
                                </Section>
                                <Section title="Bobot Nilai Akhir" desc="Nilai akhir = bobot tugas × rata-rata tugas + bobot ujian × rata-rata ujian.">
                                    <input type="range" min={0} max={100} step={5} value={form.data.bobot_tugas} onChange={(e) => form.setData('bobot_tugas', e.target.value)} className="w-full accent-primary-container" aria-label="Bobot tugas" />
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-surface-container-low p-3">
                                            <p className="text-label-sm text-on-surface-variant">Tugas</p>
                                            <p className="text-headline-lg font-bold">{form.data.bobot_tugas}%</p>
                                        </div>
                                        <div className="rounded-lg bg-surface-container-low p-3">
                                            <p className="text-label-sm text-on-surface-variant">Ujian</p>
                                            <p className="text-headline-lg font-bold">{100 - form.data.bobot_tugas}%</p>
                                        </div>
                                    </div>
                                </Section>
                            </>
                        )}
                    </Card>
                    <div className="sticky bottom-20 mt-4 flex justify-end gap-2 md:bottom-4">
                        <button type="button" className="btn btn-ghost" onClick={() => form.reset()} disabled={!form.isDirty}>
                            Batalkan
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={form.processing}>
                            <Icon n="save" className="!text-[18px]" />
                            Simpan Pengaturan
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
