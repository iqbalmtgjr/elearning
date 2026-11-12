import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Avatar, Badge, Breadcrumb, Card, Icon, Konten, Modal, Progress, cx } from '../../Components/ui';
import { STATUS_MATERI, TIPE } from '../Siswa/Materi';

/** Daftar komentar + formulir. `action(parentId)` = URL kirim; balasan bertingkat bila `bisaBalas`. */
export function Komentar({ items, action, bisaBalas = true, placeholder = 'Tulis pertanyaan atau tanggapanmu…' }) {
    const { user } = usePage().props.auth;
    const form = useForm({ isi: '', parent_id: null });
    const [balas, setBalas] = useState(null);
    const kirim = (e) => {
        e.preventDefault();
        if (!form.data.isi.trim()) return;
        form.post(action, { preserveScroll: true, onSuccess: () => { form.reset(); setBalas(null); } });
    };
    const Formulir = ({ kecil }) => (
        <form className="flex gap-3" onSubmit={kirim}>
            <Avatar name={user.name} size={kecil ? 'xs' : 'sm'} />
            <div className="flex-1">
                <textarea autoFocus={kecil} value={form.data.isi} onChange={(e) => form.setData('isi', e.target.value)} rows={kecil ? 2 : 3} className="input" placeholder={kecil ? 'Tulis balasan…' : placeholder} aria-label="Tulis komentar" />
                {form.errors.isi && <p className="mt-1 text-label-sm text-danger-ink">{form.errors.isi}</p>}
                <div className="mt-2 flex justify-end gap-2">
                    {kecil && <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setBalas(null); form.reset(); }}>Batal</button>}
                    <button type="submit" disabled={!form.data.isi.trim() || form.processing} className="btn btn-sm btn-primary">
                        <Icon n="send" className="!text-[16px]" />
                        Kirim
                    </button>
                </div>
            </div>
        </form>
    );
    return (
        <>
            {balas === null && Formulir({})}
            {items.length === 0 && <p className="mt-6 text-center text-label-sm text-on-surface-variant">Belum ada diskusi. Jadilah yang pertama bertanya.</p>}
            <ul className="mt-6 space-y-5">
                {items.map((k) => (
                    <li key={k.id ?? k.teks} className="flex gap-3">
                        <Avatar name={k.nama} size="sm" />
                        <div className="min-w-0 flex-1">
                            <div className="rounded-xl rounded-tl-none bg-surface-container-low p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-label-md">{k.nama}</p>
                                    {k.tutor && <Badge tone="primary">Tutor</Badge>}
                                    <span className="text-caption text-on-surface-variant">{k.waktu}</span>
                                </div>
                                <p className="mt-1.5 text-body-md whitespace-pre-line">{k.teks}</p>
                            </div>
                            {k.balasan?.map((b) => (
                                <div key={b.id} className="mt-3 flex gap-3 pl-2 sm:pl-6">
                                    <Avatar name={b.nama} size="xs" />
                                    <div className="flex-1 rounded-xl rounded-tl-none border border-outline-variant/70 bg-surface-container-lowest p-3.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-label-md">{b.nama}</p>
                                            {b.tutor && <Badge tone="primary">Tutor</Badge>}
                                            <span className="text-caption text-on-surface-variant">{b.waktu}</span>
                                        </div>
                                        <p className="mt-1.5 text-body-md whitespace-pre-line">{b.teks}</p>
                                    </div>
                                </div>
                            ))}
                            {bisaBalas && (balas === k.id ? (
                                <div className="mt-3 pl-2 sm:pl-6">{Formulir({ kecil: true })}</div>
                            ) : (
                                <button type="button" onClick={() => { setBalas(k.id); form.setData({ isi: '', parent_id: k.id }); }} className="mt-1.5 ml-2 flex items-center gap-1 text-label-sm font-semibold text-primary-container hover:underline">
                                    <Icon n="reply" className="!text-[16px]" />
                                    Balas
                                </button>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}

export default function MateriDetail({ materi: m, daftar, sebelumnya, berikutnya, komentar }) {
    const { role } = usePage().props.auth.user;
    const [pdf, setPdf] = useState(false);
    const selesai = m.status === 'selesai';
    const posisi = daftar.findIndex((d) => d.id === m.id);
    const progresModul = daftar.length ? Math.round((daftar.filter((d) => d.status === 'selesai').length / daftar.length) * 100) : 0;

    return (
        <>
            <Head title={m.judul} />
            <div className="mb-3">
                <Breadcrumb items={[['Materi', `/${role}/materi`], [m.mapel, `/${role}/materi`], [m.modul.split(' · ')[0]], [m.judul]]} />
            </div>

            <Card className="mb-6 flex flex-col justify-between gap-4 p-5 sm:p-6 xl:flex-row xl:items-center">
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <Badge tone="lime">{m.kelas}</Badge>
                        <Badge>{m.mapel}</Badge>
                        {m.durasi && (
                            <Badge tone="soft">
                                <Icon n="timer" className="!text-[14px]" />
                                {m.durasi}
                            </Badge>
                        )}
                        {role !== 'siswa' && <Badge tone={m.status === 'Terbit' ? 'success' : 'warning'}>{m.status}</Badge>}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-headline-xl">{m.judul}</h1>
                    {m.deskripsi && <p className="max-w-3xl text-on-surface-variant">{m.deskripsi}</p>}
                </div>
                <div className="flex flex-wrap gap-2 xl:shrink-0">
                    {m.file && (
                        <a href={`${m.file.url}?unduh=1`} className="btn btn-ghost">
                            <Icon n="download" className="!text-[18px]" />
                            Unduh Materi
                        </a>
                    )}
                    {role === 'siswa' ? (
                        <button type="button" aria-pressed={selesai} onClick={() => router.post(`/materi/${m.id}/selesai`, {}, { preserveScroll: true })} className={cx('btn', selesai ? 'bg-success text-white hover:bg-success-ink' : 'btn-accent')}>
                            <Icon n={selesai ? 'task_alt' : 'check_circle'} fill={selesai} className="!text-[18px]" />
                            {selesai ? 'Sudah Selesai' : 'Tandai Selesai'}
                        </button>
                    ) : (
                        m.bisaUbah && (
                            <Link href={`/${role}/materi`} className="btn btn-primary">
                                <Icon n="edit" className="!text-[18px]" />
                                Kelola Materi
                            </Link>
                        )
                    )}
                </div>
            </Card>

            <div className="grid items-start gap-gutter lg:grid-cols-12">
                <div className="min-w-0 space-y-gutter lg:col-span-8 xl:col-span-9">
                    {m.video && (
                        <Card className="overflow-hidden">
                            {m.video.embed ? (
                                <iframe src={m.video.embed} title={`Video: ${m.judul}`} className="aspect-video w-full bg-inverse-surface" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
                            ) : (
                                <a href={m.video.url} target="_blank" rel="noreferrer" className="grid aspect-video w-full place-items-center bg-primary-container text-on-primary">
                                    <span className="flex flex-col items-center gap-3">
                                        <span className="grid size-16 place-items-center rounded-full bg-secondary-container text-on-secondary-fixed">
                                            <Icon n="play_arrow" fill className="!text-[36px]" />
                                        </span>
                                        Buka video pembelajaran
                                    </span>
                                </a>
                            )}
                            <p className="flex items-center gap-2 bg-surface-container-low p-3.5 text-label-md font-medium">
                                <Icon n="smart_display" className="text-primary-container" />
                                Tonton video hingga selesai, lalu tandai materi sebagai selesai.
                            </p>
                        </Card>
                    )}

                    {m.konten && (
                        <Card as="article" className="p-5 sm:p-8 lg:p-10">
                            <span className="mb-6 block text-caption tracking-widest text-primary-container uppercase">Uraian Materi</span>
                            <div className="mx-auto max-w-3xl">
                                <Konten teks={m.konten} />
                            </div>
                        </Card>
                    )}

                    {m.file && (
                        <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                            <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-danger-container text-danger-ink">
                                <Icon n={m.file.pdf ? 'picture_as_pdf' : 'description'} className="!text-[32px]" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="eyebrow">Dokumen Pembelajaran</p>
                                <p className="mt-1 text-label-md text-[15px] break-all">{m.file.nama}</p>
                                {m.file.ukuran && <p className="text-label-sm text-on-surface-variant">{m.file.ukuran}</p>}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {m.file.pdf && (
                                        <button type="button" className="btn btn-ghost" onClick={() => setPdf(true)}>
                                            <Icon n="visibility" className="!text-[18px]" />
                                            Pratinjau
                                        </button>
                                    )}
                                    <a href={`${m.file.url}?unduh=1`} className="btn btn-primary">
                                        <Icon n="download" className="!text-[18px]" />
                                        Unduh Dokumen
                                    </a>
                                </div>
                            </div>
                        </Card>
                    )}

                    {!m.video && !m.konten && !m.file && (
                        <Card className="p-8 text-center text-on-surface-variant">Isi materi belum ditambahkan oleh tutor.</Card>
                    )}

                    <nav className="grid gap-3 sm:grid-cols-2" aria-label="Navigasi materi">
                        {sebelumnya ? (
                            <Link href={`/materi/${sebelumnya.id}`} className="card card-hover flex items-center gap-3 p-4">
                                <Icon n="arrow_back" className="text-primary-container" />
                                <div className="min-w-0">
                                    <p className="eyebrow">Materi sebelumnya</p>
                                    <p className="truncate text-label-md">{sebelumnya.judul}</p>
                                </div>
                            </Link>
                        ) : (
                            <span />
                        )}
                        {berikutnya && (
                            <Link href={`/materi/${berikutnya.id}`} className="flex items-center justify-end gap-3 rounded-xl bg-primary-container p-4 text-right text-on-primary shadow-card transition hover:bg-primary">
                                <div className="min-w-0">
                                    <p className="text-caption tracking-wider text-secondary-container uppercase">Materi berikutnya</p>
                                    <p className="truncate text-label-md">{berikutnya.judul}</p>
                                </div>
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary-container text-primary-container">
                                    <Icon n="arrow_forward" />
                                </span>
                            </Link>
                        )}
                    </nav>

                    <Card className="p-5 sm:p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-headline-md">
                                    <Icon n="forum" className="text-primary-container" />
                                    Diskusi &amp; Tanya Tutor
                                </h2>
                                <p className="text-label-sm text-on-surface-variant">Tanyakan bagian yang belum dipahami kepada tutor dan teman sekelas.</p>
                            </div>
                            <Badge tone="soft">{komentar.length} diskusi</Badge>
                        </div>
                        <Komentar items={komentar} action={`/materi/${m.id}/komentar`} />
                    </Card>
                </div>

                <aside className="space-y-gutter lg:sticky lg:top-24 lg:col-span-4 xl:col-span-3">
                    {role === 'siswa' && (
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <p className="eyebrow">Kemajuan Modul</p>
                                <p className="text-headline-md text-primary-container">{progresModul}%</p>
                            </div>
                            <Progress value={progresModul} className="mt-3" />
                        </Card>
                    )}
                    <Card className="p-5">
                        <p className="text-headline-md">Daftar Isi</p>
                        <p className="mb-3 text-label-sm text-on-surface-variant">{m.modul}</p>
                        <ol className="space-y-1.5">
                            {daftar.map((d, n) => {
                                const aktif = d.id === m.id;
                                return (
                                    <li key={d.id}>
                                        <Link href={`/materi/${d.id}`} aria-current={aktif ? 'page' : undefined} className={cx('flex items-start gap-2.5 rounded-lg p-2.5 transition', aktif ? 'bg-secondary-container/40 ring-1 ring-secondary/30' : 'hover:bg-surface-container-low')}>
                                            <Icon n={STATUS_MATERI[d.status][2]} fill={d.status === 'selesai'} className={cx('!text-[18px]', d.status === 'selesai' ? 'text-success' : 'text-primary-container')} />
                                            <div className="min-w-0">
                                                <p className={cx('text-label-sm', aktif ? 'font-bold' : 'font-medium')}>{d.judul}</p>
                                                <p className="mt-0.5 flex items-center gap-1 text-caption text-on-surface-variant">
                                                    <Icon n={TIPE[d.tipe]} className="!text-[13px]" />
                                                    Materi {n + 1} · {d.durasi}
                                                </p>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                        <p className="mt-3 text-caption text-on-surface-variant">
                            Materi {posisi + 1} dari {daftar.length}
                        </p>
                    </Card>
                    <Card className="p-5 text-center">
                        <p className="eyebrow mb-3">Tutor Pengampu</p>
                        <Avatar name={m.tutor} size="lg" className="mx-auto" />
                        <p className="mt-3 text-label-md">{m.tutor}</p>
                        <p className="text-label-sm text-on-surface-variant">{m.mapel}</p>
                        <Link href="/diskusi" className="btn btn-ghost mt-4 w-full">
                            <Icon n="chat" className="!text-[18px]" />
                            Tanya di Forum
                        </Link>
                    </Card>
                </aside>
            </div>

            {m.file?.pdf && (
                <Modal open={pdf} onClose={() => setPdf(false)} icon="picture_as_pdf" title={m.file.nama} desc={m.file.ukuran} size="lg" footer={<><button type="button" className="btn btn-ghost" onClick={() => setPdf(false)}>Tutup</button><a href={`${m.file.url}?unduh=1`} className="btn btn-primary"><Icon n="download" className="!text-[18px]" />Unduh PDF</a></>}>
                    <iframe src={m.file.url} title={m.file.nama} className="h-[65dvh] w-full rounded-lg border border-outline-variant" />
                </Modal>
            )}
        </>
    );
}
