import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Avatar, Badge, Card, Icon, MAPEL_TONE, Progress, Tabs, Timeline, cx } from '../../Components/ui';
import { STATUS_MATERI, TIPE } from '../Siswa/Materi';

export default function KelasDetail({ kelas: k, mapel, modul, peserta, aktivitas, bisaRapor }) {
    const { role } = usePage().props.auth.user;
    const [tab, setTab] = useState('materi');
    const [buka, setBuka] = useState(0);
    const induk = { admin: ['Data Kelas', '/admin/kelas'], tutor: ['Kelas Saya', '/tutor/kelas'], siswa: ['Kelas Saya', '/siswa/kelas'] }[role];

    return (
        <>
            <Head title={`${k.program} — ${k.nama}`} />

            <section className="mb-6 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card ring-1 ring-outline-variant/70">
                <div className="relative bg-primary-container p-5 text-on-primary sm:p-7">
                    <div className="pointer-events-none absolute -top-16 -right-10 size-72 rounded-full bg-secondary-container/10 blur-2xl" />
                    <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div className="max-w-3xl space-y-2">
                            <Link href={induk[1]} className="inline-flex items-center gap-1 text-label-sm text-primary-fixed-dim hover:text-on-primary">
                                <Icon n="arrow_back" className="!text-[16px]" />
                                {induk[0]}
                            </Link>
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded bg-secondary-container px-2 py-0.5 text-caption text-on-secondary-fixed uppercase">{k.program}</span>
                                <span className="rounded bg-white/10 px-2 py-0.5 text-caption text-primary-fixed">
                                    {k.setara} · {k.tingkat}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold sm:text-headline-xl">{k.nama}</h1>
                            <p className="text-primary-fixed-dim">{k.deskripsi}</p>
                        </div>
                        <div className="w-full shrink-0 rounded-lg bg-primary p-4 lg:w-72">
                            <div className="flex justify-between text-label-sm">
                                <span className="text-primary-fixed">Progres pembelajaran kelas</span>
                                <b className="text-secondary-container">{k.progres ?? k.progresSaya}%</b>
                            </div>
                            <Progress value={k.progres ?? k.progresSaya} dark className="mt-2" />
                        </div>
                    </div>
                </div>
                <dl className="grid grid-cols-2 divide-outline-variant/70 sm:grid-cols-4 sm:divide-x">
                    {[
                        ['person', 'Wali Kelas', k.wali],
                        ['groups', 'Peserta Didik', `${k.siswa} orang`],
                        ['menu_book', 'Mata Pelajaran', `${k.mapel} mapel`],
                        ['schedule', 'Jadwal Tatap Muka', k.jadwal],
                    ].map(([icon, l, v]) => (
                        <div key={l} className="flex items-start gap-3 p-4 sm:p-5">
                            <Icon n={icon} className="mt-0.5 text-primary-container" />
                            <div className="min-w-0">
                                <dt className="text-label-sm text-on-surface-variant">{l}</dt>
                                <dd className="text-label-md">{v}</dd>
                            </div>
                        </div>
                    ))}
                </dl>
            </section>

            <Tabs
                className="mb-5 w-fit max-w-full"
                value={tab}
                onChange={setTab}
                tabs={[
                    ['materi', 'Modul & Materi', modul.length],
                    ['mapel', 'Mata Pelajaran', mapel.length],
                    ['peserta', 'Peserta Didik', k.siswa],
                    ['aktivitas', 'Aktivitas Kelas'],
                ]}
            />

            {tab === 'materi' && (
                <div className="space-y-3">
                    {modul.map((g, n) => (
                        <Card key={g.modul} className="overflow-hidden">
                            <button type="button" onClick={() => setBuka(buka === n ? -1 : n)} aria-expanded={buka === n} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
                                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-container-low text-primary-container">
                                    <Icon n="folder_open" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="eyebrow">{g.mapel}</p>
                                    <p className="text-label-md text-[15px]">{g.modul}</p>
                                </div>
                                <span className="hidden text-label-sm text-on-surface-variant sm:block">{g.items.length} materi</span>
                                <Icon n="expand_more" className={cx('transition', buka === n && 'rotate-180')} />
                            </button>
                            {buka === n && (
                                <ul className="divide-y divide-outline-variant/70 border-t border-outline-variant/70">
                                    {g.items.map((it) => (
                                        <li key={it.id}>
                                            <Link href={`/materi/${it.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-container-low sm:px-5 sm:pl-[76px]">
                                                <Icon n={TIPE[it.tipe]} className="text-on-surface-variant" />
                                                <span className="min-w-0 flex-1 text-label-md font-medium">{it.judul}</span>
                                                <span className="hidden text-label-sm text-on-surface-variant sm:block">{it.durasi}</span>
                                                {role === 'siswa' && <Badge tone={STATUS_MATERI[it.status][1]}>{STATUS_MATERI[it.status][0]}</Badge>}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {tab === 'mapel' && (
                <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-3">
                    {mapel.map((m) => (
                        <Card key={m.id} className="flex items-center gap-4 p-4">
                            <span className={cx('grid size-12 shrink-0 place-items-center rounded-xl', MAPEL_TONE[m.tone])}>
                                <Icon n={m.icon} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-label-md text-[15px]">{m.nama}</p>
                                <p className="truncate text-label-sm text-on-surface-variant">{m.tutor}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <Progress value={m.progres} size="sm" />
                                    <span className="text-label-sm font-semibold">{m.progres}%</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {tab === 'peserta' && (
                <Card className="overflow-hidden">
                    <ul className="divide-y divide-outline-variant/70">
                        {peserta.map((p) => (
                            <li key={p.nisn} className="flex items-center gap-3 p-4 sm:px-5">
                                <Avatar name={p.nama} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-label-md">{p.nama}</p>
                                    <p className="text-label-sm text-on-surface-variant">NISN {p.nisn}</p>
                                </div>
                                {role !== 'siswa' && (
                                    <div className="hidden w-40 items-center gap-2 sm:flex">
                                        <Progress value={p.progres} size="sm" />
                                        <span className="text-label-sm font-semibold">{p.progres}%</span>
                                    </div>
                                )}
                                {bisaRapor && (
                                    <a href={`/rapor/${p.id}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" aria-label={`Rapor ${p.nama}`}>
                                        <Icon n="picture_as_pdf" className="!text-[16px] text-danger" />
                                        <span className="hidden sm:inline">Rapor</span>
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                    <p className="border-t border-outline-variant/70 p-4 text-center text-label-sm text-on-surface-variant">
                        Menampilkan {peserta.length} dari {k.siswa} peserta didik
                    </p>
                </Card>
            )}

            {tab === 'aktivitas' && (
                <Card className="max-w-3xl p-5 sm:p-6">
                    <Timeline items={aktivitas} />
                </Card>
            )}
        </>
    );
}
