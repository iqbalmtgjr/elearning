import { Head, Link, useForm } from '@inertiajs/react';
import { Field, Icon } from '../../Components/ui';
import { AuthAside } from './Login';

export default function ResetPassword({ token, email }) {
    const form = useForm({ token, email, password: '', password_confirmation: '' });

    return (
        <div className="grid min-h-dvh bg-surface-container-lowest lg:grid-cols-12">
            <Head title="Atur Ulang Kata Sandi" />
            <div className="hidden lg:col-span-5 lg:block">
                <div className="sticky top-0 h-dvh [&>div]:h-full">
                    <AuthAside />
                </div>
            </div>
            <div className="flex flex-col px-5 py-8 sm:px-10 lg:col-span-7">
                <div className="mx-auto my-auto w-full max-w-md">
                    <span className="mb-5 grid size-12 place-items-center rounded-xl bg-secondary-container text-primary-container">
                        <Icon n="password" />
                    </span>
                    <h1 className="text-headline-lg font-bold">Buat Kata Sandi Baru</h1>
                    <p className="mt-1 text-on-surface-variant">Gunakan minimal 8 karakter yang mudah Anda ingat namun sulit ditebak orang lain.</p>
                    <form
                        className="mt-8 space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post('/reset-password');
                        }}
                    >
                        <Field label="Email" error={form.errors.email}>
                            <input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="input" autoComplete="email" />
                        </Field>
                        <Field label="Kata sandi baru" error={form.errors.password}>
                            <input type="password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className="input" autoComplete="new-password" />
                        </Field>
                        <Field label="Ulangi kata sandi baru" error={form.errors.password_confirmation}>
                            <input type="password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} className="input" autoComplete="new-password" />
                        </Field>
                        <button type="submit" disabled={form.processing} className="btn btn-primary min-h-12 w-full">
                            Simpan Kata Sandi
                        </button>
                        <Link href="/lupa-password" className="block text-center text-label-sm text-primary-container hover:underline">
                            Minta tautan baru
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}
