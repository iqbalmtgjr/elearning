import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Avatar, Badge, Card, Confirm, Empty, Field, FileDrop, Icon, PageHeader, TUGAS, cx } from '../../Components/ui';

const LANGKAH = ['Diberikan', 'Dikerjakan', 'Dikumpulkan', 'Dinilai'];
const POSISI = { belum: 0, proses: 1, terlambat: 1, dikumpulkan: 2, dinilai: 3 };

export default function TugasDetail({ tugas: t }) {
    const [konfirmasi, setKonfirmasi] = useState(false);
    const [batal, setBatal] = useState(false);
    const form = useForm({ berkas: null, catatan: t.catatan ?? '', aksi: 'draf' });
    const [label, tone] = TUGAS[t.status];
    const bisaKumpul = ['belum', 'proses', 'terlambat'].includes(t.status);
    const kirim = (aksi) => {
        form.transform((d) => ({ ...d, aksi }));
        form.post(`/siswa/tugas/${t.id}`, { forceFormData: true, preserveScroll: true, onSuccess: () => { setKonfirmasi(false); form.setData('berkas', null); }, onError: () => setKonfirmasi(false) });
    };

    return (
        <>
            <Head title={t.judul} />
            <PageHeader
                crumbs={[['Tugas Saya', '/siswa/tugas'], [t.mapel]]}
                chips={
                    <>
                        <Badge tone="primary">{t.mapel}</Badge>
                        <Badge tone={tone} dot>
                            {label}
                        </Badge>
                    </>
                }
                title={t.judul}
            />

            <Card className="mb-6 grid grid-cols-2 divide-outline-variant/70 lg:grid-cols-4 lg:divide-x">
                {[
                    ['person', 'Tutor', t.tutor],
                    ['event_note', 'Tanggal diberikan', t.diberikan],
                    ['alarm', 'Batas pengumpulan', t.tenggat],
                    ['hourglass_bottom', 'Keterangan', t.sisa],
                ].map(([icon, l, v]) => (
                    <div key={l} className="flex items-start gap-3 p-4 sm:p-5">
                        <Icon n={icon} className={cx('mt-0.5', l === 'Keterangan' && t.status === 'terlambat' ? 'text-danger' : 'text-primary-container')} />
                        <div className="min-w-0">
                            <p className="text-label-sm text-on-surface-variant">{l}</p>
                            <p className="text-label-md">{v}</p>
                        </div>
                    </div>
                ))}
            </Card>

            <div className="grid items-start gap-gutter lg:grid-cols-12">
                <div className="space-y-gutter lg:col-span-8">
                    <Card className="p-5 sm:p-6">
                        <h2 className="mb-4 text-headline-md">Instruksi Pengerjaan</h2>
                        <ol className="space-y-3">
                            {t.instruksi.map((s, i) => (
                                <li key={i} className="flex gap-3 text-body-lg font-normal">
                                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary-container text-label-sm font-bold text-on-secondary-fixed">{i + 1}</span>
                                    <span className="pt-0.5">{s}</span>
                                </li>
                            ))}
                        </ol>
                        <p className="mt-5 flex items-center gap-2 text-label-sm text-on-surface-variant">
                            <Icon n="info" className="!text-[16px]" />
                            {t.bobot}
                        </p>
                        {t.lampiran.length > 0 && (
                            <div className="mt-5 border-t border-outline-variant/70 pt-5">
                                <p className="label">Lampiran dari tutor</p>
                                {t.lampiran.map((l) => (
                                    <div key={l.url} className="flex items-center gap-3 rounded-xl border border-outline-variant/70 p-3">
                                        <span className="grid size-10 place-items-center rounded-lg bg-danger-container text-danger-ink">
                                            <Icon n="attach_file" />
                                        </span>
                                        <p className="min-w-0 flex-1 truncate text-label-md">{l.nama}</p>
                                        <a href={l.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">
                                            Buka
                                        </a>
                                        <a href={`${l.url}?unduh=1`} className="btn btn-sm btn-ghost">
                                            <Icon n="download" className="!text-[16px]" />
                                            Unduh
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {bisaKumpul && (
                        <Card className="p-5 sm:p-6">
                            <h2 className="text-headline-md">Kumpulkan Tugas</h2>
                            <p className="mb-4 text-label-sm text-on-surface-variant">Unggah hasil pekerjaanmu. Kamu masih dapat mengganti berkas sebelum tugas dinilai.</p>
                            {t.status === 'terlambat' && (
                                <div className="mb-4 flex gap-3 rounded-lg border border-danger/20 bg-danger-container p-3.5 text-label-md text-danger-ink" role="alert">
                                    <Icon n="warning" />
                                    <p>Batas waktu sudah lewat. Tugas tetap dapat dikumpulkan, tetapi akan ditandai terlambat.</p>
                                </div>
                            )}
                            {t.draf && (
                                <div className="mb-4 flex items-center gap-3 rounded-lg bg-warning-container p-3.5 text-label-md text-warning-ink">
                                    <Icon n="draft" />
                                    <p className="flex-1">Draf tersimpan: {t.draf}</p>
                                </div>
                            )}
                            <FileDrop name="berkas" onFile={(f) => form.setData('berkas', f)} />
                            {form.errors.berkas && <p className="mt-1.5 text-label-sm font-medium text-danger-ink">{form.errors.berkas}</p>}
                            <Field label="Catatan untuk tutor (opsional)" error={form.errors.catatan} className="mt-4">
                                <textarea rows={3} value={form.data.catatan} onChange={(e) => form.setData('catatan', e.target.value)} className="input" placeholder="Contoh: Saya memilih fenomena banjir rob di pesisir utara." />
                            </Field>
                            {form.progress && <progress value={form.progress.percentage} max="100" className="mt-3 h-2 w-full accent-primary-container" />}
                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button type="button" className="btn btn-ghost" disabled={form.processing} onClick={() => kirim('draf')}>
                                    <Icon n="save" className="!text-[18px]" />
                                    Simpan Draf
                                </button>
                                <button type="button" className="btn btn-accent min-h-11" disabled={form.processing || (!form.data.berkas && !t.draf)} onClick={() => setKonfirmasi(true)}>
                                    <Icon n="send" className="!text-[18px]" />
                                    Kumpulkan Tugas
                                </button>
                            </div>
                        </Card>
                    )}

                    {t.status === 'dikumpulkan' && (
                        <Card className="p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <span className="grid size-11 place-items-center rounded-full bg-success-container text-success-ink">
                                    <Icon n="task_alt" />
                                </span>
                                <div className="flex-1">
                                    <h2 className="text-headline-md">Tugas sudah dikumpulkan</h2>
                                    <p className="text-label-sm text-on-surface-variant">Tutor akan memeriksa dan memberikan nilai. Kamu akan menerima notifikasi saat nilai terbit.</p>
                                </div>
                            </div>
                            <button type="button" className="btn btn-ghost mt-4" onClick={() => setBatal(true)}>
                                <Icon n="undo" className="!text-[18px]" />
                                Batalkan Pengumpulan
                            </button>
                        </Card>
                    )}
                </div>

                <aside className="space-y-gutter lg:col-span-4">
                    {t.nilai !== null && (
                        <Card className="overflow-hidden">
                            <div className="bg-primary-container p-5 text-center text-on-primary">
                                <p className="eyebrow !text-primary-fixed-dim">Nilai Tugas</p>
                                <p className="mt-1 text-[48px] leading-none font-bold text-secondary-container">{t.nilai}</p>
                                <p className="mt-1 text-label-sm text-primary-fixed-dim">dari 100</p>
                            </div>
                        </Card>
                    )}
                    {t.umpan_balik && (
                        <Card className="p-5">
                            <p className="label">Umpan balik tutor</p>
                            <div className="flex gap-3">
                                <Avatar name={t.tutor} size="sm" />
                                <div className="rounded-xl rounded-tl-none bg-surface-container-low p-3.5">
                                    <p className="text-label-md">{t.tutor}</p>
                                    <p className="mt-1 text-body-md">{t.umpan_balik}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card className="p-5">
                        <h3 className="mb-4 text-headline-md">Status Pengerjaan</h3>
                        <ol className="space-y-3">
                            {LANGKAH.map((l, i) => {
                                const done = i <= POSISI[t.status];
                                return (
                                    <li key={l} className="flex items-center gap-3">
                                        <span className={cx('grid size-7 place-items-center rounded-full', done ? 'bg-primary-container text-secondary-container' : 'border-2 border-outline-variant text-outline')}>
                                            <Icon n={done ? 'check' : 'circle'} className="!text-[16px]" />
                                        </span>
                                        <span className={cx('text-label-md', !done && 'font-medium text-on-surface-variant')}>{l}</span>
                                    </li>
                                );
                            })}
                        </ol>
                    </Card>

                    <Card className="p-5">
                        <h3 className="mb-3 text-headline-md">Riwayat Pengumpulan</h3>
                        {t.riwayat.length ? (
                            <ul className="space-y-3">
                                {t.riwayat.map((r, i) => (
                                    <li key={i} className="rounded-lg bg-surface-container-low p-3">
                                        <p className="text-label-md">{r.aksi}</p>
                                        <p className="text-label-sm text-on-surface-variant">{r.waktu}</p>
                                        {r.file && (
                                            <a href={r.url ?? '#'} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1 text-label-sm text-primary-container hover:underline">
                                                <Icon n="attach_file" className="!text-[16px]" />
                                                {r.file}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Empty icon="history" title="Belum ada riwayat" desc="Riwayat muncul setelah kamu menyimpan draf atau mengumpulkan tugas." className="!py-6" />
                        )}
                    </Card>

                    <Link href="/diskusi" className="card card-hover flex items-center gap-3 p-4">
                        <Icon n="forum" className="text-primary-container" />
                        <span className="flex-1 text-label-md">Tanya tutor di forum diskusi</span>
                        <Icon n="chevron_right" className="text-outline" />
                    </Link>
                </aside>
            </div>

            <Confirm
                open={konfirmasi}
                onClose={() => setKonfirmasi(false)}
                icon="send"
                title="Kumpulkan tugas sekarang?"
                desc={`${form.data.berkas ? `Berkas “${form.data.berkas.name}”` : `Draf “${t.draf}”`} akan dikirim ke ${t.tutor}. Kamu masih bisa membatalkan selama tugas belum dinilai.`}
                confirmLabel={form.processing ? 'Mengirim…' : 'Ya, Kumpulkan'}
                onConfirm={() => kirim('kumpul')}
            />
            <Confirm
                open={batal}
                onClose={() => setBatal(false)}
                icon="undo"
                title="Batalkan pengumpulan?"
                desc="Tugas kembali menjadi draf. Jangan lupa mengumpulkan ulang sebelum tenggat."
                confirmLabel="Ya, Batalkan"
                onConfirm={() => router.delete(`/siswa/tugas/${t.id}/pengumpulan`, { preserveScroll: true, onFinish: () => setBatal(false) })}
            />
        </>
    );
}
