import { Head, Link, usePage } from '@inertiajs/react';
import { Card, Icon, PageHeader } from '../../Components/ui';
import { ROLE } from '../../Layouts/AppLayout';

export default function Profil({ detail, ringkas }) {
    const { user } = usePage().props.auth;
    return (
        <>
            <Head title="Profil Saya" />
            <PageHeader crumbs={[['Dashboard', `/${user.role}`], ['Profil Saya']]} title="Profil Saya" />

            <div className="grid items-start gap-gutter lg:grid-cols-12">
                <div className="space-y-gutter lg:col-span-4">
                    <Card className="overflow-hidden text-center">
                        <div className="h-24 bg-primary-container bg-[radial-gradient(circle_at_80%_20%,rgb(209_248_67/0.25),transparent_50%)]" />
                        <div className="-mt-12 px-5 pb-6">
                            {user.foto ? (
                                <img src={user.foto} alt="Foto profil" className="mx-auto size-24 rounded-full object-cover ring-4 ring-surface-container-lowest" />
                            ) : (
                                <span className="mx-auto grid size-24 place-items-center rounded-full bg-secondary-container text-3xl font-bold text-primary-container ring-4 ring-surface-container-lowest">{user.initials}</span>
                            )}
                            <h2 className="mt-3 text-headline-lg font-bold">{user.name}</h2>
                            <p className="text-label-sm text-on-surface-variant">
                                {ROLE[user.role]} · {user.info}
                            </p>
                            <p className="mt-1 text-label-sm text-on-surface-variant">{user.email}</p>
                            <div className="mt-5 flex gap-2">
                                <Link href="/profil/edit" className="btn btn-primary flex-1">
                                    <Icon n="edit" className="!text-[18px]" />
                                    Edit Profil
                                </Link>
                                <Link href="/pengaturan-akun" className="btn btn-ghost" aria-label="Pengaturan akun">
                                    <Icon n="settings" className="!text-[18px]" />
                                </Link>
                            </div>
                        </div>
                        <dl className="grid grid-cols-3 border-t border-outline-variant/70">
                            {ringkas.map(([l, v]) => (
                                <div key={l} className="border-r border-outline-variant/70 p-3 last:border-0">
                                    <dd className="text-headline-md font-bold">{v}</dd>
                                    <dt className="text-caption text-on-surface-variant">{l}</dt>
                                </div>
                            ))}
                        </dl>
                    </Card>
                </div>

                <div className="space-y-gutter lg:col-span-8">
                    <Card>
                        <div className="flex items-center justify-between border-b border-outline-variant/70 p-5">
                            <h2 className="text-headline-md">Informasi Pribadi</h2>
                            <Link href="/profil/edit" className="text-label-sm font-semibold text-primary-container hover:underline">
                                Ubah
                            </Link>
                        </div>
                        <dl className="grid sm:grid-cols-2">
                            {[['Nama Lengkap', user.name], ['Email', user.email ?? '—'], ...Object.entries(detail)].map(([l, v]) => (
                                <div key={l} className="border-b border-outline-variant/70 px-5 py-4 sm:odd:border-r">
                                    <dt className="text-label-sm text-on-surface-variant">{l}</dt>
                                    <dd className="mt-0.5 text-label-md">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </Card>
                    <div className="grid gap-gutter sm:grid-cols-2">
                        {[
                            ['history', 'Riwayat Aktivitas', 'Lihat aktivitas belajar dan masuk akun', '/riwayat-aktivitas'],
                            ['notifications', 'Pusat Notifikasi', 'Pengingat, nilai, dan pengumuman', '/notifikasi'],
                        ].map(([icon, t, d, href]) => (
                            <Link key={href} href={href} className="card card-hover flex items-center gap-4 p-5">
                                <span className="grid size-11 place-items-center rounded-xl bg-surface-container-low text-primary-container">
                                    <Icon n={icon} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-label-md">{t}</p>
                                    <p className="text-label-sm text-on-surface-variant">{d}</p>
                                </div>
                                <Icon n="chevron_right" className="text-outline" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
