import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Badge, Card, Empty, Icon, PageHeader, SearchInput, Stat } from '../../Components/ui';
import { SubjectCard } from './Dashboard';

export default function Mapel({ mapel, menunggu, jumlahMenunggu }) {
    const [q, setQ] = useState('');
    const [urut, setUrut] = useState('progres');
    const list = mapel
        .filter((m) => `${m.nama} ${m.tutor}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => (urut === 'progres' ? a.progres - b.progres : a.nama.localeCompare(b.nama)));
    const rata = mapel.length ? Math.round(mapel.reduce((s, m) => s + m.progres, 0) / mapel.length) : 0;

    return (
        <>
            <Head title="Mata Pelajaran" />
            <PageHeader
                crumbs={[['Dashboard', '/siswa'], ['Mata Pelajaran']]}
                chips={mapel[0] && <Badge tone="primary">{mapel[0].program}</Badge>}
                title="Mata Pelajaran"
                desc="Mata pelajaran yang kamu ikuti semester ini. Selesaikan materi dan tugas untuk mencapai ketuntasan minimal 75."
            />

            <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-gutter lg:grid-cols-4">
                <Stat label="Mata Pelajaran" value={mapel.length} icon="menu_book" />
                <Stat label="Rata-rata Progres" value={`${rata}%`} icon="trending_up" />
                <Stat label="Materi Selesai" value={`${mapel.reduce((s, m) => s + m.selesai, 0)}/${mapel.reduce((s, m) => s + m.materi, 0)}`} icon="task_alt" />
                <Stat label="Tugas Menunggu" value={jumlahMenunggu} icon="assignment_late" className={jumlahMenunggu ? 'ring-1 ring-warning/40' : ''} />
            </section>

            {jumlahMenunggu > 0 && <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warning-container text-warning-ink">
                    <Icon n="notifications_active" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-label-md">{jumlahMenunggu} tugas menunggu tindakanmu</p>
                    <p className="text-label-sm text-on-surface-variant">Paling mendesak: {menunggu[0]?.judul} · {menunggu[0]?.sisa}</p>
                </div>
                <Link href="/siswa/tugas" className="btn btn-ghost btn-sm">
                    Kerjakan Tugas
                    <Icon n="arrow_forward" className="!text-[16px]" />
                </Link>
            </Card>}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <SearchInput value={q} onChange={setQ} placeholder="Cari mata pelajaran atau tutor…" className="sm:max-w-sm sm:flex-1" />
                <select value={urut} onChange={(e) => setUrut(e.target.value)} className="input sm:w-64" aria-label="Urutkan">
                    <option value="progres">Urutkan: progres terendah dulu</option>
                    <option value="nama">Urutkan: nama A–Z</option>
                </select>
            </div>

            {list.length ? (
                <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {list.map((m) => (
                        <SubjectCard key={m.id} m={m}>
                            <p className="mt-3 line-clamp-2 text-label-sm text-on-surface-variant">{m.deskripsi}</p>
                            <p className="mt-2 flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                                <Icon n="schedule" className="!text-[16px]" />
                                {m.jadwal}
                            </p>
                        </SubjectCard>
                    ))}
                </div>
            ) : (
                <Card>
                    <Empty icon="search_off" title="Mata pelajaran tidak ditemukan" desc="Periksa kembali kata kunci pencarianmu." />
                </Card>
            )}
        </>
    );
}
