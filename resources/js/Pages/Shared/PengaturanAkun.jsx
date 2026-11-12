import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card, Confirm, Field, Icon, PageHeader } from '../../Components/ui';

export default function PengaturanAkun({ sesi }) {
    const [lihat, setLihat] = useState(false);
    const [keluar, setKeluar] = useState(false);
    const form = useForm({ current_password: '', password: '', password_confirmation: '' });
    const kuat = [form.data.password.length >= 8, /\d/.test(form.data.password), /[A-Z]/.test(form.data.password)];
    const tipe = lihat ? 'text' : 'password';

    return (
        <>
            <Head title="Pengaturan Akun" />
            <PageHeader crumbs={[['Profil Saya', '/profil'], ['Pengaturan Akun']]} title="Pengaturan Akun" desc="Kelola keamanan akun dan perangkat yang sedang masuk." />

            <div className="grid max-w-5xl gap-gutter lg:grid-cols-5">
                <Card className="p-5 sm:p-6 lg:col-span-3">
                    <h2 className="text-headline-md">Ubah Kata Sandi</h2>
                    <p className="mb-5 text-label-sm text-on-surface-variant">Gunakan kata sandi yang tidak dipakai di layanan lain.</p>
                    <form
                        className="grid gap-4 sm:grid-cols-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put('/pengaturan-akun/password', { preserveScroll: true, onSuccess: () => form.reset() });
                        }}
                    >
                        <Field label="Kata sandi saat ini" error={form.errors.current_password} className="sm:col-span-2">
                            <input type={tipe} autoComplete="current-password" value={form.data.current_password} onChange={(e) => form.setData('current_password', e.target.value)} className="input" />
                        </Field>
                        <Field label="Kata sandi baru" error={form.errors.password}>
                            <input type={tipe} autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className="input" />
                        </Field>
                        <Field label="Ulangi kata sandi baru" error={form.errors.password_confirmation}>
                            <input type={tipe} autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} className="input" />
                        </Field>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-label-sm sm:col-span-2">
                            {['Minimal 8 karakter', 'Mengandung angka', 'Mengandung huruf kapital (disarankan)'].map((t, i) => (
                                <li key={t} className={kuat[i] ? 'text-success-ink' : 'text-on-surface-variant'}>
                                    <Icon n={kuat[i] ? 'check_circle' : 'radio_button_unchecked'} className="mr-1 !text-[16px]" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                            <label className="flex items-center gap-2 text-label-sm">
                                <input type="checkbox" checked={lihat} onChange={(e) => setLihat(e.target.checked)} className="size-4 accent-primary-container" />
                                Tampilkan kata sandi
                            </label>
                            <button type="submit" className="btn btn-primary" disabled={form.processing}>
                                Perbarui Kata Sandi
                            </button>
                        </div>
                    </form>
                </Card>

                <Card className="p-5 sm:p-6 lg:col-span-2">
                    <h2 className="text-headline-md">Perangkat yang Masuk</h2>
                    <ul className="mt-4 space-y-3">
                        {sesi.map((s, i) => (
                            <li key={i} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
                                <Icon n={/Android|iPhone/.test(s.perangkat) ? 'smartphone' : 'laptop'} className="text-primary-container" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-label-md">{s.perangkat}</p>
                                    <p className="text-label-sm text-on-surface-variant">
                                        {s.ip} · {s.kini ? 'Aktif sekarang' : s.waktu}
                                    </p>
                                </div>
                                {s.kini && <span className="text-label-sm font-semibold text-success-ink">Perangkat ini</span>}
                            </li>
                        ))}
                    </ul>
                    <button type="button" className="btn btn-ghost mt-4 w-full text-danger-ink" onClick={() => setKeluar(true)} disabled={sesi.length < 2}>
                        <Icon n="logout" className="!text-[18px]" />
                        Keluar dari perangkat lain
                    </button>
                </Card>
            </div>

            <Confirm
                open={keluar}
                onClose={() => setKeluar(false)}
                danger
                icon="logout"
                title="Keluar dari perangkat lain?"
                desc="Semua sesi selain perangkat ini akan diakhiri. Anda perlu masuk kembali di perangkat tersebut."
                confirmLabel="Ya, Keluarkan"
                onConfirm={() => router.post('/pengaturan-akun/keluar-lainnya', {}, { preserveScroll: true, onFinish: () => setKeluar(false) })}
            />
        </>
    );
}
