import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge, Card, Empty, Icon, Modal, PageHeader, cx } from '../../Components/ui';

const STATUS = { tersedia: ['Dapat dikerjakan', 'lime'], mendatang: ['Terjadwal', 'neutral'], selesai: ['Selesai', 'success'] };
const ATURAN = ['Pastikan koneksi internet stabil dan baterai perangkat cukup.', 'Waktu terus berjalan sejak ujian dimulai dan tidak dapat dijeda.', 'Jawaban tersimpan otomatis setiap kali kamu memilih atau mengetik.', 'Ujian berakhir otomatis saat waktu habis.'];

export default function Ujian({ ujian }) {
    const [mulai, setMulai] = useState(null);
    if (!ujian.length) return (<><Head title="Ujian" /><PageHeader crumbs={[['Dashboard', '/siswa'], ['Ujian']]} title="Ujian" /><Card><Empty icon="quiz" title="Belum ada ujian" desc="Ujian dari tutor akan muncul di sini." /></Card></>);
    const sections = [
        ['Dapat Dikerjakan Sekarang', ujian.filter((u) => u.status === 'tersedia')],
        ['Ujian Mendatang', ujian.filter((u) => u.status === 'mendatang')],
        ['Riwayat Ujian', ujian.filter((u) => u.status === 'selesai')],
    ];

    return (
        <>
            <Head title="Ujian" />
            <PageHeader crumbs={[['Dashboard', '/siswa'], ['Ujian']]} title="Ujian" desc="Kerjakan kuis dan ujian berbasis komputer sesuai jadwal. Siapkan dirimu sebelum menekan tombol mulai." />

            <div className="space-y-8">
                {sections.map(
                    ([judul, list]) =>
                        list.length > 0 && (
                            <section key={judul}>
                                <h2 className="mb-3 text-headline-md">{judul}</h2>
                                <div className="grid gap-gutter md:grid-cols-2 xl:grid-cols-3">
                                    {list.map((u) => {
                                        const [label, tone] = STATUS[u.status];
                                        return (
                                            <Card key={u.id} className={cx('flex flex-col p-5', u.status === 'tersedia' && 'ring-2 ring-secondary-container')}>
                                                <div className="flex items-center justify-between">
                                                    <Badge tone={tone} dot={u.status === 'tersedia'}>
                                                        {label}
                                                    </Badge>
                                                    <span className="text-label-sm text-on-surface-variant">{u.mapel}</span>
                                                </div>
                                                <h3 className="mt-3 text-headline-md">{u.judul}</h3>
                                                <p className="mt-0.5 text-label-sm text-on-surface-variant">{u.tutor}</p>
                                                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-center">
                                                    {[
                                                        ['Jadwal', u.jadwal.split(' · ')[0]],
                                                        ['Durasi', `${u.durasi} mnt`],
                                                        ['Soal', u.soal],
                                                    ].map(([l, v]) => (
                                                        <div key={l}>
                                                            <dt className="text-caption text-on-surface-variant uppercase">{l}</dt>
                                                            <dd className="mt-0.5 text-label-md">{v}</dd>
                                                        </div>
                                                    ))}
                                                </dl>
                                                <div className="mt-auto pt-4">
                                                    {u.status === 'tersedia' && (
                                                        <button type="button" className="btn btn-accent min-h-11 w-full" onClick={() => (u.dilanjutkan ? router.visit(`/siswa/ujian/${u.id}/kerjakan`) : setMulai(u))}>
                                                            <Icon n="play_arrow" fill />
                                                            {u.dilanjutkan ? 'Lanjutkan Ujian' : 'Mulai Ujian'}
                                                        </button>
                                                    )}
                                                    {u.status === 'mendatang' && (
                                                        <p className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                                                            <Icon n="lock_clock" className="!text-[18px]" />
                                                            Dibuka {u.jadwal}
                                                        </p>
                                                    )}
                                                    {u.status === 'selesai' && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-label-sm text-on-surface-variant">{u.menunggu ? 'Menunggu penilaian esai' : 'Nilai kamu'}</span>
                                                            <span className="text-headline-lg font-bold text-primary-container">{u.nilai ?? '—'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </section>
                        ),
                )}
            </div>

            <Modal
                open={!!mulai}
                onClose={() => setMulai(null)}
                icon="quiz"
                title={mulai?.judul}
                desc={mulai && `${mulai.mapel} · ${mulai.soal} soal · ${mulai.durasi} menit`}
                footer={
                    <>
                        <button type="button" className="btn btn-ghost" onClick={() => setMulai(null)}>
                            Nanti Saja
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => router.visit(`/siswa/ujian/${mulai.id}/kerjakan`)}>
                            Saya Siap, Mulai
                            <Icon n="arrow_forward" className="!text-[18px] text-secondary-container" />
                        </button>
                    </>
                }
            >
                <p className="label">Sebelum mulai, perhatikan:</p>
                <ul className="space-y-2.5">
                    {ATURAN.map((a) => (
                        <li key={a} className="flex gap-2.5 text-body-md">
                            <Icon n="check_circle" className="text-success" />
                            {a}
                        </li>
                    ))}
                </ul>
            </Modal>
        </>
    );
}
