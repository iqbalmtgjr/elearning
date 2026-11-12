import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Icon, cx } from '../../Components/ui';
import { AuthAside } from './Login';

export default function ForgotPassword() {
    const { flash } = usePage().props;
    const form = useForm({ email: '' });

    return (
        <div className="grid min-h-dvh bg-surface-container-lowest lg:grid-cols-12">
            <Head title="Lupa Kata Sandi" />
            <div className="hidden lg:col-span-5 lg:block">
                <div className="sticky top-0 h-dvh [&>div]:h-full">
                    <AuthAside />
                </div>
            </div>

            <div className="flex flex-col px-5 py-8 sm:px-10 lg:col-span-7">
                <div className="mx-auto my-auto w-full max-w-md">
                    <Link href="/login" className="mb-8 inline-flex items-center gap-1 text-label-md text-primary-container hover:underline">
                        <Icon n="arrow_back" className="!text-[18px]" />
                        Kembali ke halaman masuk
                    </Link>
                    <span className="mb-5 grid size-12 place-items-center rounded-xl bg-secondary-container text-primary-container">
                        <Icon n="lock_reset" />
                    </span>
                    <h1 className="text-headline-lg font-bold">Lupa Kata Sandi?</h1>
                    <p className="mt-1 text-on-surface-variant">Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk membuat kata sandi baru.</p>

                    {flash ? (
                        <div className="mt-8 rounded-xl border border-success/30 bg-success-container p-5" role="status">
                            <p className="flex items-center gap-2 text-label-md text-success-ink">
                                <Icon n="mark_email_read" />
                                Periksa kotak masuk email Anda
                            </p>
                            <p className="mt-2 text-label-sm text-ink-2">{flash} Tautan berlaku selama 60 menit. Periksa juga folder spam.</p>
                            <Link href="/login" className="btn btn-primary mt-4 w-full">
                                Kembali Masuk
                            </Link>
                        </div>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post('/lupa-password');
                            }}
                            className="mt-8 space-y-5"
                            noValidate
                        >
                            <div>
                                <label htmlFor="email" className="label">
                                    Email terdaftar
                                </label>
                                <div className="relative">
                                    <Icon n="mail" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant" />
                                    <input id="email" type="email" autoComplete="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} placeholder="nama@pkbmbhp.sch.id" className={cx('input pl-10', form.errors.email && 'border-danger')} />
                                </div>
                                {form.errors.email && <p className="mt-1.5 text-label-sm font-medium text-danger-ink">{form.errors.email}</p>}
                            </div>
                            <button type="submit" disabled={form.processing} className="btn btn-primary min-h-12 w-full">
                                Kirim Tautan Atur Ulang
                            </button>
                            <p className="rounded-lg bg-surface-container-low p-3 text-label-sm text-on-surface-variant">
                                <Icon n="info" className="mr-1 !text-[16px] text-primary-container" />
                                Tidak memiliki email? Hubungi wali kelas atau Tata Usaha untuk mengatur ulang kata sandi secara langsung.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
