import { Head, router, useRemember } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Confirm, Icon, Logo, cx, kirimJson } from '../../Components/ui';

const HURUF = ['A', 'B', 'C', 'D', 'E'];
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Mode ujian tanpa sidebar. Waktu dari server; jawaban disimpan otomatis ke server setiap ada perubahan. */
export default function UjianKerjakan({ ujian, soal, jawaban, sisa: sisaAwal }) {
    const [jawab, setJawab] = useState(jawaban ?? {});
    const [tanda, setTanda] = useRemember([], `ujian-${ujian.id}-tanda`);
    const [i, setI] = useState(0);
    const [sisa, setSisa] = useState(sisaAwal);
    const [konfirmasi, setKonfirmasi] = useState(false);
    const [daftar, setDaftar] = useState(false);
    const [simpan, setSimpan] = useState('tersimpan'); // tersimpan | menyimpan | gagal
    const terkirim = useRef(false);
    const pertama = useRef(true);

    const s = soal[i];
    const isAnswered = (q) => (jawab[q.id] ?? '').toString().trim() !== '';
    const terjawab = soal.filter(isAnswered).length;

    const kumpulkan = () => {
        terkirim.current = true;
        router.post(`/siswa/ujian/${ujian.id}/kumpul`, { jawaban: jawab }, { onError: () => (terkirim.current = false) });
    };

    // Simpan otomatis 1,5 detik setelah perubahan terakhir.
    useEffect(() => {
        if (pertama.current) return void (pertama.current = false);
        setSimpan('menyimpan');
        const t = setTimeout(() => kirimJson(`/siswa/ujian/${ujian.id}/jawab`, { jawaban: jawab }).then((r) => setSimpan(r.ok ? 'tersimpan' : 'gagal')).catch(() => setSimpan('gagal')), 1500);
        return () => clearTimeout(t);
    }, [jawab]);

    useEffect(() => {
        const t = setInterval(() => setSisa((v) => Math.max(0, v - 1)), 1000);
        return () => clearInterval(t);
    }, []);
    useEffect(() => {
        if (sisa === 0 && !terkirim.current) kumpulkan();
    }, [sisa]);
    useEffect(() => {
        const warn = (e) => !terkirim.current && e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, []);

    const pergi = (n) => {
        setI(n);
        setDaftar(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const Navigasi = (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <p className="text-label-md">Navigasi Soal</p>
                <p className="text-label-sm text-on-surface-variant">
                    {terjawab}/{soal.length} dijawab
                </p>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {soal.map((q, n) => (
                    <button
                        key={q.id}
                        type="button"
                        onClick={() => pergi(n)}
                        aria-label={`Soal ${n + 1}${isAnswered(q) ? ', sudah dijawab' : ''}${tanda.includes(q.id) ? ', ditandai' : ''}`}
                        aria-current={n === i ? 'step' : undefined}
                        className={cx(
                            'relative grid aspect-square place-items-center rounded-lg text-label-md transition',
                            isAnswered(q) ? 'bg-primary-container text-on-primary' : 'border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low',
                            n === i && 'ring-2 ring-secondary-container ring-offset-2',
                        )}
                    >
                        {n + 1}
                        {tanda.includes(q.id) && <span className="absolute -top-1 -right-1 size-3 rounded-full bg-warning ring-2 ring-white" />}
                    </button>
                ))}
            </div>
            <ul className="mt-4 space-y-1.5 text-label-sm text-on-surface-variant">
                <li className="flex items-center gap-2"><span className="size-3 rounded bg-primary-container" /> Sudah dijawab</li>
                <li className="flex items-center gap-2"><span className="size-3 rounded border border-outline-variant" /> Belum dijawab</li>
                <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-warning" /> Ditandai untuk ditinjau</li>
            </ul>
            <p className={cx('mt-4 flex items-center gap-1.5 text-label-sm', simpan === 'gagal' ? 'text-danger-ink' : 'text-on-surface-variant')} role="status">
                <Icon n={simpan === 'gagal' ? 'cloud_off' : simpan === 'menyimpan' ? 'cloud_sync' : 'cloud_done'} className="!text-[16px]" />
                {simpan === 'gagal' ? 'Gagal menyimpan — periksa koneksi' : simpan === 'menyimpan' ? 'Menyimpan…' : 'Jawaban tersimpan'}
            </p>
        </div>
    );

    if (!s) return <p className="p-8 text-center">Ujian ini belum memiliki soal.</p>;

    return (
        <div className="min-h-dvh bg-surface pb-24 lg:pb-0">
            <Head title={ujian.judul} />
            <header className="sticky top-0 z-30 border-b border-outline-variant/70 bg-surface-container-lowest">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
                    <Logo className="hidden size-8 sm:grid" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-label-md">{ujian.judul}</p>
                        <p className="truncate text-label-sm text-on-surface-variant">{ujian.mapel}</p>
                    </div>
                    <div role="timer" aria-label={`Sisa waktu ${fmt(sisa)}`} className={cx('flex items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-[15px] font-bold tabular-nums', sisa < 300 ? 'animate-pulse bg-danger-container text-danger-ink' : 'bg-primary-container text-secondary-container')}>
                        <Icon n="timer" className="!text-[18px]" />
                        {fmt(sisa)}
                    </div>
                    <button type="button" className="btn btn-primary hidden sm:inline-flex" onClick={() => setKonfirmasi(true)}>
                        Selesai Ujian
                    </button>
                </div>
                <div className="h-1 bg-surface-container">
                    <div className="h-full bg-secondary-container transition-[width]" style={{ width: `${(terjawab / soal.length) * 100}%` }} />
                </div>
            </header>

            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_280px] lg:py-8">
                <main>
                    <div className="card p-5 sm:p-8">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-label-md text-primary-container">
                                Soal {i + 1} <span className="font-medium text-on-surface-variant">dari {soal.length}</span>
                            </p>
                            <button
                                type="button"
                                onClick={() => setTanda(tanda.includes(s.id) ? tanda.filter((n) => n !== s.id) : [...tanda, s.id])}
                                aria-pressed={tanda.includes(s.id)}
                                className={cx('btn btn-sm', tanda.includes(s.id) ? 'bg-warning-container text-warning-ink' : 'btn-ghost')}
                            >
                                <Icon n="flag" fill={tanda.includes(s.id)} className="!text-[16px]" />
                                {tanda.includes(s.id) ? 'Ditandai' : 'Tandai soal'}
                            </button>
                        </div>
                        <span className="mt-4 inline-block rounded bg-surface-container px-2 py-0.5 text-caption text-ink-2 uppercase">{s.tipe === 'pg' ? 'Pilihan ganda' : 'Esai'}</span>
                        <h1 className="mt-3 text-[17px] leading-relaxed font-semibold whitespace-pre-line sm:text-headline-md">{s.teks}</h1>

                        {s.tipe === 'pg' ? (
                            <fieldset className="mt-6 space-y-2.5">
                                <legend className="sr-only">Pilihan jawaban</legend>
                                {(s.opsi ?? []).map((o, n) => {
                                    const on = jawab[s.id] !== undefined && jawab[s.id] !== '' && Number(jawab[s.id]) === n;
                                    return (
                                        <label key={n} className={cx('flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition', on ? 'border-primary-container bg-primary-container/5' : 'border-outline-variant hover:border-primary-container/40')}>
                                            <input type="radio" name={`soal-${s.id}`} checked={on} onChange={() => setJawab({ ...jawab, [s.id]: n })} className="sr-only" />
                                            <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg text-label-md', on ? 'bg-primary-container text-secondary-container' : 'bg-surface-container-low')}>{HURUF[n]}</span>
                                            <span className="text-body-lg font-normal">{o}</span>
                                        </label>
                                    );
                                })}
                            </fieldset>
                        ) : (
                            <div className="mt-6">
                                <textarea rows={8} value={jawab[s.id] ?? ''} onChange={(e) => setJawab({ ...jawab, [s.id]: e.target.value })} className="input text-body-lg font-normal" placeholder="Tulis jawabanmu di sini…" aria-label="Jawaban esai" />
                                <p className="mt-1.5 text-right text-label-sm text-on-surface-variant">{String(jawab[s.id] ?? '').trim().split(/\s+/).filter(Boolean).length} kata · tersimpan otomatis</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                        <button type="button" className="btn btn-ghost min-h-11" disabled={i === 0} onClick={() => pergi(i - 1)}>
                            <Icon n="arrow_back" className="!text-[18px]" />
                            Sebelumnya
                        </button>
                        {i < soal.length - 1 ? (
                            <button type="button" className="btn btn-primary min-h-11" onClick={() => pergi(i + 1)}>
                                Berikutnya
                                <Icon n="arrow_forward" className="!text-[18px]" />
                            </button>
                        ) : (
                            <button type="button" className="btn btn-accent min-h-11" onClick={() => setKonfirmasi(true)}>
                                Selesai Ujian
                                <Icon n="done_all" className="!text-[18px]" />
                            </button>
                        )}
                    </div>
                </main>

                <aside className="hidden lg:block">
                    <div className="card sticky top-24 p-5">{Navigasi}</div>
                </aside>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-outline-variant bg-surface-container-lowest p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setDaftar(true)}>
                    <Icon n="grid_view" className="!text-[18px]" />
                    Daftar Soal ({terjawab}/{soal.length})
                </button>
                <button type="button" className="btn btn-primary flex-1" onClick={() => setKonfirmasi(true)}>
                    Selesai Ujian
                </button>
            </div>
            {daftar && (
                <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Daftar soal">
                    <div className="absolute inset-0 bg-on-surface/40" onClick={() => setDaftar(false)} />
                    <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface-container-lowest p-5 pb-8 shadow-modal">
                        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-surface-container-highest" />
                        {Navigasi}
                    </div>
                </div>
            )}

            <Confirm
                open={konfirmasi}
                onClose={() => setKonfirmasi(false)}
                icon="assignment_turned_in"
                title="Kumpulkan jawaban ujian?"
                desc={
                    terjawab < soal.length
                        ? `Masih ada ${soal.length - terjawab} soal yang belum dijawab${tanda.length ? ` dan ${tanda.length} soal ditandai` : ''}. Jawaban tidak dapat diubah setelah dikumpulkan.`
                        : `Semua ${soal.length} soal sudah dijawab${tanda.length ? `, ${tanda.length} masih ditandai untuk ditinjau` : ''}. Jawaban tidak dapat diubah setelah dikumpulkan.`
                }
                confirmLabel="Ya, Kumpulkan"
                onConfirm={kumpulkan}
            />
        </div>
    );
}
