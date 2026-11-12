import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Card, Field, Icon, PageHeader } from '../../Components/ui';

export default function ProfilEdit({ data }) {
    const { user } = usePage().props.auth;
    const siswa = user.role === 'siswa';
    const form = useForm({ ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])), foto: null });
    const [pratinjau, setPratinjau] = useState(user.foto);
    const set = (k) => (e) => form.setData(k, e.target.value);

    return (
        <>
            <Head title="Edit Profil" />
            <PageHeader crumbs={[['Profil Saya', '/profil'], ['Edit Profil']]} title="Edit Profil" desc="Pastikan data diri sesuai dokumen resmi agar tidak terjadi kesalahan pada rapor dan ijazah." />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post('/profil', { forceFormData: true, preserveScroll: true });
                }}
                className="grid max-w-5xl items-start gap-gutter lg:grid-cols-3"
            >
                <Card className="p-5 text-center">
                    {pratinjau ? (
                        <img src={pratinjau} alt="Foto profil" className="mx-auto size-28 rounded-full object-cover" />
                    ) : (
                        <span className="mx-auto grid size-28 place-items-center rounded-full bg-secondary-container text-4xl font-bold text-primary-container">{user.initials}</span>
                    )}
                    <label className="btn btn-ghost mt-4 cursor-pointer">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(e) => {
                                const f = e.target.files[0];
                                if (!f) return;
                                form.setData('foto', f);
                                setPratinjau(URL.createObjectURL(f));
                            }}
                        />
                        <Icon n="photo_camera" className="!text-[18px]" />
                        Ganti Foto
                    </label>
                    <p className="mt-2 text-label-sm text-on-surface-variant">JPG, PNG, atau WEBP, maksimal 2 MB.</p>
                    {form.errors.foto && <p className="mt-1 text-label-sm text-danger-ink">{form.errors.foto}</p>}
                </Card>

                <Card className="p-5 sm:p-6 lg:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nama Lengkap" className="sm:col-span-2" hint={siswa ? 'Perubahan nama peserta didik dilakukan Tata Usaha sesuai dokumen resmi.' : undefined} error={form.errors.name}>
                            <input value={form.data.name} onChange={set('name')} disabled={siswa} className="input disabled:bg-surface-container-low disabled:text-on-surface-variant" />
                        </Field>
                        <Field label="Email" hint="Dipakai untuk masuk dan mengatur ulang kata sandi." error={form.errors.email}>
                            <input type="email" value={form.data.email} onChange={set('email')} className="input" />
                        </Field>
                        <Field label="Nomor Telepon / WhatsApp" error={form.errors.telepon}>
                            <input type="tel" value={form.data.telepon} onChange={set('telepon')} className="input" placeholder="08xx-xxxx-xxxx" />
                        </Field>
                        <Field label="Tanggal Lahir" error={form.errors.tanggal_lahir}>
                            <input type="date" value={form.data.tanggal_lahir} onChange={set('tanggal_lahir')} className="input" />
                        </Field>
                        <Field label="Jenis Kelamin" error={form.errors.jenis_kelamin}>
                            <select value={form.data.jenis_kelamin} onChange={set('jenis_kelamin')} className="input">
                                <option value="">— Pilih —</option>
                                <option>Laki-laki</option>
                                <option>Perempuan</option>
                            </select>
                        </Field>
                        <Field label="Alamat" className="sm:col-span-2" error={form.errors.alamat}>
                            <textarea rows={3} value={form.data.alamat} onChange={set('alamat')} className="input" />
                        </Field>
                    </div>
                    <div className="mt-6 flex flex-col-reverse gap-2 border-t border-outline-variant/70 pt-5 sm:flex-row sm:justify-end">
                        <Link href="/profil" className="btn btn-ghost">
                            Batal
                        </Link>
                        <button type="submit" disabled={form.processing} className="btn btn-primary">
                            <Icon n="save" className="!text-[18px]" />
                            Simpan Perubahan
                        </button>
                    </div>
                </Card>
            </form>
        </>
    );
}
