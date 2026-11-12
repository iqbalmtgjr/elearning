import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Avatar, Badge, Card, Empty, Field, Icon, Modal, PageHeader, SearchInput, cx } from '../../Components/ui';
import { Komentar } from './MateriDetail';

export default function Diskusi({ topik, pengajaran }) {
    const { role } = usePage().props.auth.user;
    const [pilih, setPilih] = useState(topik[0]?.id);
    const [q, setQ] = useState('');
    const [baru, setBaru] = useState(false);
    const form = useForm({ pengajaran_id: pengajaran[0]?.[0] ?? '', judul: '', isi: '' });
    const t = topik.find((x) => x.id === pilih) ?? topik[0];
    const list = topik.filter((x) => `${x.judul} ${x.mapel} ${x.kelas}`.toLowerCase().includes(q.toLowerCase()));

    return (
        <>
            <Head title="Forum Diskusi" />
            <PageHeader
                crumbs={[['Dashboard', `/${role}`], ['Forum Diskusi']]}
                title="Forum Diskusi"
                desc="Ruang tanya jawab antara peserta didik dan tutor. Gunakan bahasa yang santun dan jelas."
                actions={
                    pengajaran.length > 0 && (
                        <button type="button" className="btn btn-primary" onClick={() => setBaru(true)}>
                            <Icon n="add_comment" className="!text-[18px]" />
                            Topik Baru
                        </button>
                    )
                }
            />

            {topik.length === 0 ? (
                <Card>
                    <Empty icon="forum" title="Belum ada diskusi" desc="Mulai topik baru untuk bertanya atau berbagi dengan kelas." />
                </Card>
            ) : (
                <div className="grid items-start gap-gutter lg:grid-cols-[360px_1fr]">
                    <Card className="overflow-hidden">
                        <div className="border-b border-outline-variant/70 p-3">
                            <SearchInput value={q} onChange={setQ} placeholder="Cari topik…" />
                        </div>
                        <ul className="divide-y divide-outline-variant/70">
                            {list.map((x) => (
                                <li key={x.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPilih(x.id);
                                            if (window.innerWidth < 1024) setTimeout(() => document.getElementById('utas')?.scrollIntoView({ behavior: 'smooth' }), 50);
                                        }}
                                        aria-current={x.id === t.id}
                                        className={cx('w-full p-4 text-left transition', x.id === t.id ? 'bg-secondary-container/30' : 'hover:bg-surface-container-low')}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge tone={x.status === 'Terjawab' ? 'success' : 'warning'}>{x.status}</Badge>
                                            <span className="text-caption text-on-surface-variant">{x.waktu}</span>
                                        </div>
                                        <p className="mt-2 text-label-md">{x.judul}</p>
                                        <p className="mt-1 flex items-center gap-3 text-label-sm text-on-surface-variant">
                                            <span>
                                                {x.mapel} · {x.kelas}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Icon n="chat_bubble" className="!text-[14px]" />
                                                {x.balasan}
                                            </span>
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card id="utas" className="scroll-mt-20 p-5 sm:p-6">
                        <div className="flex items-start gap-3 border-b border-outline-variant/70 pb-5">
                            <Avatar name={t.penulis} />
                            <div className="min-w-0 flex-1">
                                <h2 className="text-headline-md">{t.judul}</h2>
                                <p className="text-label-sm text-on-surface-variant">
                                    {t.penulis} · {t.mapel} · {t.kelas} · {t.waktu}
                                </p>
                                <p className="mt-3 text-body-lg font-normal whitespace-pre-line">{t.isi}</p>
                            </div>
                        </div>
                        <div className="pt-5">
                            <Komentar key={t.id} items={t.pesan.map((p, i) => ({ ...p, id: i }))} action={`/diskusi/${t.id}/balas`} bisaBalas={false} placeholder={role === 'tutor' ? 'Tulis jawaban untuk peserta didik…' : 'Tulis balasanmu…'} />
                        </div>
                    </Card>
                </div>
            )}

            <Modal
                open={baru}
                onClose={() => setBaru(false)}
                icon="add_comment"
                title="Buat Topik Diskusi"
                footer={
                    <>
                        <button type="button" className="btn btn-ghost" onClick={() => setBaru(false)}>
                            Batal
                        </button>
                        <button type="submit" form="form-topik" className="btn btn-primary" disabled={form.processing}>
                            Kirim Topik
                        </button>
                    </>
                }
            >
                <form
                    id="form-topik"
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post('/diskusi', { preserveScroll: true, onSuccess: () => { setBaru(false); form.reset('judul', 'isi'); } });
                    }}
                >
                    <Field label="Mata pelajaran & kelas" error={form.errors.pengajaran_id}>
                        <select value={form.data.pengajaran_id} onChange={(e) => form.setData('pengajaran_id', e.target.value)} className="input">
                            {pengajaran.map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Judul pertanyaan" error={form.errors.judul}>
                        <input value={form.data.judul} onChange={(e) => form.setData('judul', e.target.value)} className="input" placeholder="Tuliskan pertanyaan secara singkat" />
                    </Field>
                    <Field label="Penjelasan" error={form.errors.isi}>
                        <textarea rows={5} value={form.data.isi} onChange={(e) => form.setData('isi', e.target.value)} className="input" />
                    </Field>
                </form>
            </Modal>
        </>
    );
}
