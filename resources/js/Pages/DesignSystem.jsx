import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Badge, Breadcrumb, Card, Confirm, DataTable, Empty, Field, FileDrop, Icon, Logo, Modal, Pagination, Progress, SearchInput, Skeleton, Stat, TUGAS, Tabs, Toggle } from '../Components/ui';
import { SubjectCard } from './Siswa/Dashboard';

const WARNA = [
    ['Primary · Deep Green', '#005840', 'Sidebar, tombol utama, identitas', 'bg-primary-container text-white'],
    ['Accent · Lime Green', '#D1F843', 'Status aktif, progres, highlight', 'bg-secondary-container text-on-surface'],
    ['Background · Soft Gray', '#ECF0EF', 'Latar halaman dan area kerja', 'bg-surface text-on-surface ring-1 ring-outline-variant'],
];
const PENDUKUNG = [['Putih', '#FFFFFF'], ['Teks utama', '#1E293B'], ['Teks sekunder', '#64748B'], ['Success', '#16A34A'], ['Warning', '#F59E0B'], ['Danger', '#DC2626']];
const TIPO = [
    ['Headline XL', 'text-headline-xl', '28/36 · Bold'],
    ['Headline LG', 'text-headline-lg', '22/30 · Semibold'],
    ['Headline MD', 'text-headline-md', '18/26 · Semibold'],
    ['Body LG', 'text-body-lg', '15/24 · Medium'],
    ['Body MD', 'text-body-md', '14/22 · Regular'],
    ['Label MD', 'text-label-md', '13/18 · Semibold'],
    ['Label SM', 'text-label-sm', '12/16 · Medium'],
    ['Caption', 'eyebrow', '11/14 · Semibold · Kapital'],
];

function Blok({ id, judul, desc, children }) {
    return (
        <section id={id} className="scroll-mt-24">
            <h2 className="text-headline-lg font-bold">{judul}</h2>
            {desc && <p className="mt-1 mb-5 max-w-2xl text-on-surface-variant">{desc}</p>}
            {children}
        </section>
    );
}

export default function DesignSystem() {
    const [tab, setTab] = useState('a');
    const [modal, setModal] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [toast, setToast] = useState(false);

    return (
        <div className="min-h-dvh">
            <Head title="Sistem Desain" />
            <header className="sticky top-0 z-30 border-b border-outline-variant/70 bg-surface/85 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
                    <Logo />
                    <div className="leading-none">
                        <p className="text-headline-md">PKBM BHP</p>
                        <p className="text-caption tracking-wider text-on-surface-variant uppercase">Sistem Desain v1.0</p>
                    </div>
                    <Link href="/login" className="btn btn-primary ml-auto">
                        Buka Aplikasi
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6">
                <div>
                    <Badge tone="lime">Modern Educational Technology</Badge>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">Bersih, elegan, dan fokus pada pembelajaran.</h1>
                    <p className="mt-3 max-w-2xl text-body-lg font-normal text-on-surface-variant">Fondasi visual PKBM BHP: warna resmi, tipografi Plus Jakarta Sans, ikon Material Symbols bergaya garis, dan komponen yang dipakai ulang di seluruh halaman.</p>
                </div>

                <Blok id="warna" judul="Warna Resmi" desc="Tiga warna identitas tidak boleh diubah. Lime hanya sebagai aksen, selalu dipasangkan dengan teks gelap.">
                    <div className="grid gap-gutter md:grid-cols-3">
                        {WARNA.map(([n, hex, guna, cls]) => (
                            <Card key={hex} className="overflow-hidden">
                                <div className={`flex h-32 items-end p-4 ${cls}`}>
                                    <span className="font-mono text-headline-md">{hex}</span>
                                </div>
                                <div className="p-4">
                                    <p className="text-label-md">{n}</p>
                                    <p className="text-label-sm text-on-surface-variant">{guna}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <div className="mt-gutter grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {PENDUKUNG.map(([n, hex]) => (
                            <div key={hex}>
                                <div className="h-14 rounded-lg ring-1 ring-outline-variant" style={{ background: hex }} />
                                <p className="mt-1.5 text-label-sm">{n}</p>
                                <p className="font-mono text-caption text-on-surface-variant">{hex}</p>
                            </div>
                        ))}
                    </div>
                </Blok>

                <Blok id="tipografi" judul="Tipografi" desc="Plus Jakarta Sans untuk seluruh hierarki. Inter sebagai cadangan.">
                    <Card className="divide-y divide-outline-variant/70">
                        {TIPO.map(([n, cls, spec]) => (
                            <div key={n} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6">
                                <span className="w-40 shrink-0 text-label-sm text-on-surface-variant">
                                    {n} · {spec}
                                </span>
                                <span className={cls}>Belajar fleksibel untuk masa depan</span>
                            </div>
                        ))}
                    </Card>
                </Blok>

                <Blok id="ikon" judul="Ikon" desc="Material Symbols Outlined 20 px, varian terisi untuk status aktif.">
                    <Card className="flex flex-wrap gap-3 p-5">
                        {['space_dashboard', 'meeting_room', 'menu_book', 'local_library', 'assignment', 'quiz', 'insights', 'calendar_month', 'campaign', 'event_available', 'forum', 'grading', 'settings', 'notifications', 'person'].map((i) => (
                            <span key={i} title={i} className="grid size-12 place-items-center rounded-xl bg-surface-container-low text-primary-container">
                                <Icon n={i} />
                            </span>
                        ))}
                    </Card>
                </Blok>

                <Blok id="tombol" judul="Tombol & Formulir">
                    <div className="grid gap-gutter lg:grid-cols-2">
                        <Card className="space-y-4 p-5">
                            <div className="flex flex-wrap gap-2">
                                <button type="button" className="btn btn-primary">Tombol Utama</button>
                                <button type="button" className="btn btn-accent">Kumpulkan</button>
                                <button type="button" className="btn btn-soft">Sekunder</button>
                                <button type="button" className="btn btn-ghost">Garis</button>
                                <button type="button" className="btn btn-danger">Hapus</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" className="btn btn-sm btn-primary">
                                    <Icon n="add" className="!text-[16px]" />
                                    Kecil
                                </button>
                                <button type="button" className="btn btn-primary" disabled>
                                    Nonaktif
                                </button>
                                <button type="button" className="btn btn-primary">
                                    <Icon n="progress_activity" className="animate-spin !text-[18px]" />
                                    Memuat…
                                </button>
                            </div>
                            <Toggle label="Sakelar" desc="Untuk preferensi on/off" defaultChecked />
                        </Card>
                        <Card className="grid gap-4 p-5 sm:grid-cols-2">
                            <Field label="Input teks">
                                <input className="input" placeholder="Nama lengkap" />
                            </Field>
                            <Field label="Dropdown">
                                <select className="input">
                                    <option>Paket C</option>
                                    <option>Paket B</option>
                                </select>
                            </Field>
                            <Field label="Status galat" error="NISN harus 10 digit.">
                                <input className="input border-danger" defaultValue="00812" />
                            </Field>
                            <div>
                                <span className="label">Pencarian</span>
                                <SearchInput value="" onChange={() => {}} placeholder="Cari materi…" />
                            </div>
                            <div className="sm:col-span-2">
                                <FileDrop />
                            </div>
                        </Card>
                    </div>
                </Blok>

                <Blok id="status" judul="Status, Progres & Navigasi">
                    <Card className="space-y-6 p-5">
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(TUGAS).map(([k, [l, t, i]]) => (
                                <Badge key={k} tone={t}>
                                    <Icon n={i} className="!text-[14px]" />
                                    {l}
                                </Badge>
                            ))}
                            <Badge tone="primary">Paket C</Badge>
                            <Badge tone="lime">Paket A</Badge>
                            <Badge tone="soft">Paket B</Badge>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[35, 78, 100].map((v) => (
                                <div key={v}>
                                    <div className="mb-1 flex justify-between text-label-sm">
                                        <span>Progres</span>
                                        <b>{v}%</b>
                                    </div>
                                    <Progress value={v} />
                                </div>
                            ))}
                        </div>
                        <Tabs value={tab} onChange={setTab} className="w-fit" tabs={[['a', 'Semua', 12], ['b', 'Aktif', 4], ['c', 'Selesai']]} />
                        <Breadcrumb items={[['Kelas Saya', '#'], ['Bahasa Indonesia', '#'], ['Modul 3']]} />
                    </Card>
                </Blok>

                <Blok id="kartu" judul="Kartu">
                    <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
                        <Stat label="Total Peserta Didik" value="214" unit="siswa" icon="groups">
                            <p className="text-label-sm text-on-surface-variant">Kartu statistik</p>
                        </Stat>
                        <SubjectCard m={{ id: 1, nama: 'Bahasa Indonesia', tutor: 'Nurul Aini, M.Pd.', icon: 'menu_book', tone: 'green', materi: 12, tugas: 4, progres: 72 }} />
                        <Card className="p-5">
                            <div className="flex items-center gap-2">
                                <Badge tone="warning">Besok, 23.59</Badge>
                                <span className="text-label-sm text-on-surface-variant">Matematika</span>
                            </div>
                            <p className="mt-2 text-label-md text-[15px]">Latihan Soal Statistika</p>
                            <p className="text-label-sm text-on-surface-variant">Kartu tugas · Sedang dikerjakan</p>
                            <button type="button" className="btn btn-accent btn-sm mt-4">
                                Lanjutkan
                            </button>
                        </Card>
                    </div>
                </Blok>

                <Blok id="tabel" judul="Tabel Data" desc="Di bawah 768 px tabel otomatis berubah menjadi daftar kartu.">
                    <Card className="overflow-hidden">
                        <DataTable
                            columns={[
                                ['nama', 'Peserta Didik'],
                                ['program', 'Program'],
                                ['progres', 'Progres'],
                                ['status', 'Status'],
                            ]}
                            rows={[
                                { nama: { user: 'Dian Wulandari', sub: 'NISN 0079918234' }, program: { badge: 'Paket C', tone: 'primary' }, progres: { progress: 91 }, status: { badge: 'Aktif', tone: 'success' } },
                                { nama: { user: 'Siti Maryati', sub: 'NISN 0092837110' }, program: { badge: 'Paket B', tone: 'soft' }, progres: { progress: 83 }, status: { badge: 'Aktif', tone: 'success' } },
                            ]}
                        />
                        <Pagination shown={2} total={214} />
                    </Card>
                </Blok>

                <Blok id="umpan" judul="Modal, Dialog & Notifikasi">
                    <Card className="flex flex-wrap gap-2 p-5">
                        <button type="button" className="btn btn-ghost" onClick={() => setModal(true)}>
                            Buka Modal
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>
                            Dialog Konfirmasi
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => { setToast(true); setTimeout(() => setToast(false), 3000); }}>
                            Tampilkan Notifikasi
                        </button>
                    </Card>
                </Blok>

                <Blok id="state" judul="Empty, Loading & Error State">
                    <div className="grid gap-gutter md:grid-cols-3">
                        <Card>
                            <Empty icon="inbox" title="Belum ada tugas" desc="Tugas baru dari tutor akan muncul di sini." />
                        </Card>
                        <Card className="space-y-3 p-6" aria-busy="true" aria-label="Memuat">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="mt-4 h-24 w-full" />
                        </Card>
                        <Card>
                            <Empty
                                icon="cloud_off"
                                title="Gagal memuat data"
                                desc="Periksa koneksi internet, lalu coba lagi."
                                action={
                                    <button type="button" className="btn btn-primary btn-sm">
                                        <Icon n="refresh" className="!text-[16px]" />
                                        Coba Lagi
                                    </button>
                                }
                            />
                        </Card>
                    </div>
                </Blok>
            </main>

            <Modal open={modal} onClose={() => setModal(false)} icon="info" title="Contoh Modal" desc="Dipakai untuk formulir singkat." footer={<button type="button" className="btn btn-primary" onClick={() => setModal(false)}>Mengerti</button>}>
                <p>Modal memakai elemen dialog bawaan peramban: fokus terkunci di dalam, tombol Esc menutup, dan latar diredupkan.</p>
            </Modal>
            <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={() => setConfirm(false)} danger icon="delete" title="Hapus materi ini?" desc="Tindakan ini tidak dapat dibatalkan." confirmLabel="Ya, Hapus" />
            {toast && (
                <div role="status" className="fixed inset-x-4 bottom-6 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-inverse-surface p-3.5 text-white shadow-modal">
                    <span className="grid size-8 place-items-center rounded-full bg-secondary-container text-primary-container">
                        <Icon n="check" className="!text-[18px]" />
                    </span>
                    <p className="text-label-md">Tugas berhasil dikumpulkan.</p>
                </div>
            )}
        </div>
    );
}
