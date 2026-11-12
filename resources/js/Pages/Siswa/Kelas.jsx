import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Avatar, Badge, Card, Icon, PageHeader, Progress, Tabs, cx } from '../../Components/ui';

export default function Kelas({ utama, kelas, teman }) {
    const [tab, setTab] = useState('semua');
    const list = kelas.filter((k) => tab === 'semua' || (tab === 'aktif' ? k.status === 'Aktif' : k.status === 'Selesai'));

    return (
        <>
            <Head title="Kelas Saya" />
            <PageHeader
                crumbs={[['Dashboard', '/siswa'], ['Kelas Saya']]}
                chips={
                    <>
                        <Badge tone="primary">Rombongan Belajar</Badge>
                        <Badge>T.A. 2026/2027 · Ganjil</Badge>
                    </>
                }
                title="Kelas Saya"
                desc="Kelas yang kamu ikuti di PKBM Bina Harapan Permata beserta capaian belajarmu."
            />

            <section className="relative mb-6 overflow-hidden rounded-2xl bg-primary-container p-5 text-on-primary shadow-card sm:p-7">
                <div className="pointer-events-none absolute -right-20 -bottom-24 size-96 rounded-full bg-secondary-container/10 blur-3xl" />
                <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="max-w-2xl space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded bg-secondary-container px-2 py-0.5 text-caption text-on-secondary-fixed uppercase">Kelas Utama Anda</span>
                            <span className="rounded bg-white/10 px-2 py-0.5 text-caption text-primary-fixed">Kurikulum Merdeka Kesetaraan</span>
                        </div>
                        <h2 className="text-2xl font-bold sm:text-headline-xl">
                            {utama.program} — {utama.nama}
                        </h2>
                        <p className="text-label-sm text-primary-fixed-dim">
                            {utama.tingkat} · {utama.setara} · {utama.ruang}
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-label-sm">
                            <span className="flex items-center gap-2">
                                <Avatar name={utama.wali} size="xs" />
                                Wali kelas: <b>{utama.wali}</b>
                            </span>
                            <span className="flex items-center gap-1.5 text-primary-fixed-dim">
                                <Icon n="group" className="!text-[18px] text-secondary-container" />
                                {utama.siswa} teman sekelas
                            </span>
                        </div>
                        <div className="max-w-md pt-2">
                            <div className="mb-1.5 flex justify-between text-label-sm">
                                <span className="text-primary-fixed-dim">
                                    Capaian semester ini · {utama.selesai} dari {utama.total} materi
                                </span>
                                <b className="text-secondary-container">{utama.progres}%</b>
                            </div>
                            <Progress value={utama.progres} dark />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 lg:w-72">
                        <Link href={`/kelas/${utama.id}`} className="btn btn-accent min-h-12">
                            <Icon n="login" />
                            Masuk Ruang Kelas
                        </Link>
                        <Link href="/jadwal" className="btn bg-white/10 text-on-primary hover:bg-white/15">
                            <Icon n="calendar_month" className="!text-[18px]" />
                            Jadwal Tatap Muka
                        </Link>
                        <Link href="/diskusi" className="btn text-primary-fixed-dim hover:text-on-primary">
                            <Icon n="forum" className="!text-[18px]" />
                            Forum Diskusi Kelas
                        </Link>
                    </div>
                </div>
            </section>

            <div className="grid gap-gutter lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <Tabs
                        className="mb-4 w-fit"
                        value={tab}
                        onChange={setTab}
                        tabs={[
                            ['semua', 'Semua Kelas', kelas.length],
                            ['aktif', 'Sedang Berjalan', kelas.filter((k) => k.status === 'Aktif').length],
                            ['selesai', 'Selesai', kelas.filter((k) => k.status === 'Selesai').length],
                        ]}
                    />
                    <div className="grid gap-gutter md:grid-cols-2">
                        {list.map((k) => (
                            <Card key={k.id} className={cx('card-hover flex flex-col p-5', k.peran === 'Kelas Utama' && 'ring-2 ring-primary-container')}>
                                <div className="flex items-center justify-between gap-2">
                                    <Badge tone={k.peran === 'Kelas Utama' ? 'lime' : 'neutral'}>{k.peran}</Badge>
                                    <Badge tone={k.status === 'Aktif' ? 'success' : 'neutral'} dot>
                                        {k.status === 'Aktif' ? 'Sedang berjalan' : 'Selesai'}
                                    </Badge>
                                </div>
                                <h3 className="mt-3 text-headline-md">
                                    {k.program} — {k.nama}
                                </h3>
                                <p className="mt-1 flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                                    <Icon n="person" className="!text-[16px]" />
                                    {k.wali}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {[`${k.mapel} mata pelajaran`, `${k.siswa} peserta`, k.jadwal].map((t) => (
                                        <span key={t} className="rounded bg-surface-container-low px-2 py-1 text-caption font-medium text-ink-2">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-auto pt-5">
                                    <div className="mb-1.5 flex justify-between text-label-sm">
                                        <span className="text-on-surface-variant">Progres saya</span>
                                        <b>{k.progresSaya}%</b>
                                    </div>
                                    <Progress value={k.progresSaya} />
                                    <Link href={`/kelas/${k.id}`} className="btn btn-soft mt-4 w-full">
                                        {k.status === 'Selesai' ? 'Lihat Arsip Kelas' : 'Buka Kelas'}
                                        <Icon n="arrow_forward" className="!text-[18px]" />
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <aside className="space-y-gutter lg:col-span-4">
                    <Card className="p-5">
                        <h3 className="text-headline-md">Teman Sekelas</h3>
                        <p className="text-label-sm text-on-surface-variant">
                            {utama.program} · {utama.nama}
                        </p>
                        <ul className="mt-4 space-y-3">
                            {teman.map((t) => (
                                <li key={t} className="flex items-center gap-3">
                                    <Avatar name={t} size="sm" />
                                    <span className="text-label-md font-medium">{t}</span>
                                </li>
                            ))}
                        </ul>
                        <Link href={`/kelas/${utama.id}`} className="btn btn-ghost mt-4 w-full">
                            Lihat semua ({utama.siswa})
                        </Link>
                    </Card>
                    <Card className="p-5">
                        <h3 className="flex items-center gap-2 text-headline-md">
                            <Icon n="support_agent" className="text-primary-container" />
                            Layanan Akademik
                        </h3>
                        <p className="mt-1 text-label-sm text-on-surface-variant">Butuh pindah kelas, menyesuaikan jadwal, atau konsultasi rapor?</p>
                        <div className="mt-4 flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
                            <Avatar name="Hendro Wibowo" size="sm" />
                            <div className="min-w-0 flex-1">
                                <p className="text-label-md">Hendro Wibowo, S.Pd.</p>
                                <p className="text-label-sm text-on-surface-variant">Koordinator Kurikulum</p>
                            </div>
                            <button type="button" className="btn btn-sm btn-primary">
                                Hubungi
                            </button>
                        </div>
                    </Card>
                </aside>
            </div>
        </>
    );
}
