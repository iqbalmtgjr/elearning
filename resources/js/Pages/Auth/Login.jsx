import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Icon, Logo, Progress, cx } from '../../Components/ui';

const DEMO = [
    ['admin', 'Admin', 'admin_panel_settings'],
    ['tutor', 'Tutor', 'co_present'],
    ['siswa', 'Peserta Didik', 'person'],
];

export function AuthAside() {
    return (
        <div className="relative flex flex-col justify-between overflow-hidden bg-primary-container p-6 text-on-primary sm:p-8 lg:p-12">
            <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-secondary-container/15 blur-3xl" />
            <div className="pointer-events-none absolute top-16 right-10 size-40 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute top-28 right-24 size-20 rounded-full bg-primary-fixed/10" />

            <div className="relative flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl bg-white p-1.5 shadow-sm">
                    <Logo className="size-full" />
                </span>
                <div>
                    <p className="text-headline-md leading-tight">PKBM BHP</p>
                    <p className="text-caption tracking-wider text-on-primary-container uppercase">Bina Harapan Permata</p>
                </div>
            </div>

            <div className="relative my-8 max-w-md lg:my-0">
                <span className="mb-5 hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-label-sm text-secondary-container sm:inline-flex">
                    <Icon n="verified" className="!text-[16px]" />
                    Lembaga Terdaftar &amp; Terakreditasi
                </span>
                <h1 className="text-2xl leading-tight font-bold sm:text-[34px] sm:leading-[42px]">Selamat Datang di PKBM Bina Harapan Permata</h1>
                <p className="mt-4 text-body-lg font-normal text-primary-fixed/85">Platform pembelajaran digital untuk mendukung pendidikan yang inklusif, fleksibel, dan berkualitas.</p>

                {/* Ilustrasi: pratinjau ringkas pengalaman belajar */}
                <div className="relative mt-10 hidden lg:block" aria-hidden="true">
                    <div className="w-80 rounded-2xl bg-white p-5 text-on-surface shadow-modal">
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl bg-secondary-container text-primary-container">
                                <Icon n="menu_book" />
                            </span>
                            <div>
                                <p className="text-label-md">Bahasa Indonesia</p>
                                <p className="text-label-sm text-on-surface-variant">Modul 3 · Teks Eksplanasi</p>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-between text-label-sm">
                            <span className="text-on-surface-variant">Progres belajar</span>
                            <b>72%</b>
                        </div>
                        <Progress value={72} className="mt-1.5" />
                    </div>
                    <div className="absolute top-20 left-56 flex items-center gap-2 rounded-xl bg-primary p-3 pr-4 shadow-pop">
                        <span className="grid size-8 place-items-center rounded-full bg-secondary-container text-primary-container">
                            <Icon n="task_alt" className="!text-[18px]" />
                        </span>
                        <div>
                            <p className="text-label-sm font-semibold">Tugas dikumpulkan</p>
                            <p className="text-caption text-primary-fixed-dim">Baru saja</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative hidden flex-wrap gap-x-6 gap-y-2 text-label-sm text-white/75 sm:flex">
                {[['school', 'Paket A, B, dan C'], ['schedule', 'Belajar kapan saja'], ['devices', 'Ponsel & komputer']].map(([i, t]) => (
                    <span key={t} className="flex items-center gap-1.5">
                        <Icon n={i} className="!text-[18px] text-secondary-container" />
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function Login({ demo }) {
    const { flash } = usePage().props;
    const [show, setShow] = useState(false);
    const form = useForm({ login: '', password: '', remember: false });
    const submit = (e) => {
        e.preventDefault();
        form.post('/login', { onFinish: () => form.reset('password') });
    };

    return (
        <div className="grid min-h-dvh bg-surface-container-lowest lg:grid-cols-12">
            <Head title="Masuk" />
            <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-0 lg:h-dvh [&>div]:h-full">
                    <AuthAside />
                </div>
            </div>

            <div className="flex flex-col px-5 py-8 sm:px-10 lg:col-span-7 lg:py-10">
                <div className="mx-auto w-full max-w-md">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-label-sm font-semibold text-on-surface-variant transition hover:text-primary-container">
                        <Icon n="arrow_back" className="!text-[16px]" />
                        Kembali ke Beranda
                    </Link>
                </div>
                <div className="mx-auto my-auto w-full max-w-md">
                    <h2 className="text-headline-lg font-bold">Masuk ke Akun Anda</h2>
                    <p className="mt-1 text-on-surface-variant">Silakan masukkan username atau email dan kata sandi yang telah terdaftar.</p>

                    {flash && (
                        <p className="mt-6 flex items-center gap-2 rounded-lg bg-success-container p-3 text-label-md text-success-ink" role="status">
                            <Icon n="check_circle" />
                            {flash}
                        </p>
                    )}
                    <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                        <div>
                            <label htmlFor="login" className="label">
                                Username atau Email
                            </label>
                            <div className="relative">
                                <Icon n="alternate_email" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant" />
                                <input
                                    id="login"
                                    autoComplete="username"
                                    autoFocus
                                    value={form.data.login}
                                    onChange={(e) => form.setData('login', e.target.value)}
                                    placeholder="contoh: budi.santoso@pkbmbhp.sch.id"
                                    aria-invalid={!!form.errors.login}
                                    className={cx('input pl-10', form.errors.login && 'border-danger')}
                                />
                            </div>
                            {form.errors.login && (
                                <p className="mt-1.5 flex items-center gap-1 text-label-sm font-medium text-danger-ink" role="alert">
                                    <Icon n="error" className="!text-[16px]" />
                                    {form.errors.login}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <Icon n="lock" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant" />
                                <input
                                    id="password"
                                    type={show ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    placeholder="Masukkan kata sandi"
                                    className="input px-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-md text-on-surface-variant hover:text-on-surface"
                                    aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                >
                                    <Icon n={show ? 'visibility_off' : 'visibility'} />
                                </button>
                            </div>
                            {form.errors.password && <p className="mt-1.5 text-label-sm font-medium text-danger-ink">{form.errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input type="checkbox" checked={form.data.remember} onChange={(e) => form.setData('remember', e.target.checked)} className="size-4 accent-primary-container" />
                                <span className="text-label-sm text-on-surface-variant">Ingat saya</span>
                            </label>
                            <Link href="/lupa-password" className="text-label-sm font-semibold text-primary-container hover:underline">
                                Lupa password?
                            </Link>
                        </div>

                        <button type="submit" disabled={form.processing} className="btn btn-primary min-h-12 w-full">
                            {form.processing ? (
                                <>
                                    <Icon n="progress_activity" className="animate-spin !text-[18px]" />
                                    Memverifikasi…
                                </>
                            ) : (
                                <>
                                    Masuk
                                    <Icon n="arrow_forward" className="!text-[18px] text-secondary-container" />
                                </>
                            )}
                        </button>
                    </form>

                    {demo && (<>
                        <div className="my-7 flex items-center gap-3">
                            <div className="h-px flex-1 bg-outline-variant" />
                            <span className="eyebrow">Akun demonstrasi</span>
                            <div className="h-px flex-1 bg-outline-variant" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {DEMO.map(([u, label, icon]) => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => form.setData({ ...form.data, login: u, password: 'password' })}
                                    className={cx('group flex flex-col items-center gap-1 rounded-lg border px-2 py-3 transition', form.data.login === u ? 'border-primary-container bg-primary-container/5' : 'border-outline-variant hover:bg-surface-container-low')}
                                >
                                    <Icon n={icon} className="text-primary-container transition group-hover:scale-110" />
                                    <span className="text-label-sm font-semibold">{label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="mt-3 text-center text-label-sm text-on-surface-variant">Pilih peran untuk mengisi akun demo, lalu tekan Masuk.</p>
                    </>)}
                </div>

                <p className="mt-10 text-center text-caption font-medium text-on-surface-variant">
                    © 2026 PKBM Bina Harapan Permata. Seluruh hak cipta dilindungi. ·{' '}
                    <Link href="/design-system" className="underline-offset-2 hover:underline">
                        Sistem Desain
                    </Link>
                </p>
            </div>
        </div>
    );
}
