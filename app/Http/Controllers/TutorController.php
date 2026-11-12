<?php

namespace App\Http\Controllers;

use App\Models\HasilUjian;
use App\Models\Pengajaran;
use App\Models\Pengumpulan;
use App\Models\Tugas;
use App\Models\Ujian;
use App\Models\User;
use App\Support\Akademik;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TutorController extends Controller
{
    /** Progres rata-rata siswa per kelas atas materi tutor ini: [kelas_id => persen]. */
    private function progresKelas(Collection $pengajaran): Collection
    {
        return $pengajaran->groupBy('kelas_id')->map(function ($ps, $kelasId) {
            $materi = DB::table('materi')->whereIn('pengajaran_id', $ps->pluck('id'))->where('status', 'Terbit')->pluck('id');
            $siswa = User::siswa()->where('kelas_id', $kelasId)->where('status', '!=', 'Nonaktif')->pluck('id');
            if ($materi->isEmpty() || $siswa->isEmpty()) return 0;

            return (int) round(DB::table('materi_selesai')->whereIn('materi_id', $materi)->whereIn('user_id', $siswa)->count() / ($materi->count() * $siswa->count()) * 100);
        });
    }

    /** Kemunculan berikutnya dari jadwal tetap pengajaran. */
    public static function berikutnya(Pengajaran $p): ?\Carbon\Carbon
    {
        if ($p->hari === null || ! $p->jam_mulai) return null;
        $d = now()->startOfWeek()->addDays($p->hari)->setTimeFromTimeString($p->jam_selesai ?? $p->jam_mulai);

        return ($d->isPast() ? $d->addWeek() : $d)->setTimeFromTimeString($p->jam_mulai);
    }

    public function dashboard(Request $r)
    {
        $t = $r->user();
        $pengajaran = $t->mengajar()->with('kelas', 'mapel')->get();
        $kelasIds = $pengajaran->pluck('kelas_id')->unique();
        $tugasIds = Tugas::whereIn('pengajaran_id', $pengajaran->pluck('id'))->pluck('id');
        $menungguEsai = HasilUjian::whereIn('ujian_id', Ujian::whereIn('pengajaran_id', $pengajaran->pluck('id'))->select('id'))->whereNotNull('selesai_at')->whereNull('nilai')->count();
        $progres = $this->progresKelas($pengajaran);
        $siswa = User::siswa()->with('kelas')->whereIn('kelas_id', $kelasIds)->where('status', '!=', 'Nonaktif')->get();

        return inertia('Tutor/Dashboard', [
            'stats' => ['kelas' => $kelasIds->count(), 'siswa' => $siswa->count(), 'aktif' => Tugas::whereIn('id', $tugasIds)->where('tenggat', '>', now())->count(),
                'menunggu' => Pengumpulan::whereIn('tugas_id', $tugasIds)->where('status', 'dikumpulkan')->whereNull('nilai')->count() + $menungguEsai],
            'jadwal' => $pengajaran->map(fn ($p) => [$p, self::berikutnya($p)])->filter(fn ($x) => $x[1])->sortBy(fn ($x) => $x[1])->take(2)->map(fn ($x) => [
                'jam' => $x[1]->isToday() ? Akademik::jam($x[0]->jam_mulai, $x[0]->jam_selesai) : $x[1]->translatedFormat('D, H.i'),
                'judul' => $x[0]->mapel->nama.' · '.$x[0]->kelas->nama, 'tempat' => $x[0]->tempat ?? '—', 'mode' => $x[0]->mode, 'tautan' => str_starts_with((string) $x[0]->tempat, 'http') ? $x[0]->tempat : null,
                'status' => $x[1]->isToday() ? 'Hari ini' : ($x[1]->isTomorrow() ? 'Besok' : (int) now()->startOfDay()->diffInDays($x[1]->copy()->startOfDay()).' hari lagi'),
            ])->values(),
            'pengumpulan' => Pengumpulan::with('siswa.kelas', 'tugas')->whereIn('tugas_id', $tugasIds)->where('status', 'dikumpulkan')->latest('dikumpulkan_at')->take(5)->get()->map(fn ($p) => [
                'nama' => $p->siswa->name, 'tugas' => $p->tugas->judul, 'kelas' => $p->siswa->kelas?->nama, 'waktu' => $p->dikumpulkan_at->diffForHumans(),
                'status' => $p->nilai !== null ? 'Dinilai' : ($p->dikumpulkan_at->gt($p->tugas->tenggat) ? 'Terlambat' : 'Menunggu'),
            ]),
            'perkembangan' => $kelasIds->map(fn ($id) => [$pengajaran->firstWhere('kelas_id', $id)->kelas->nama, $progres[$id] ?? 0])->values(),
            'perhatian' => $siswa->map(fn ($s) => [$s, Akademik::progres($s)[2], Akademik::persenHadir($s->id)])
                ->filter(fn ($x) => $x[1] < 40 || ($x[2] !== null && $x[2] < 75))->sortBy(fn ($x) => $x[1])->take(3)
                ->map(fn ($x) => ['nama' => $x[0]->name, 'kelas' => $x[0]->kelas?->nama, 'alasan' => "Progres {$x[1]}%".($x[2] !== null ? " · kehadiran {$x[2]}%" : '')])->values(),
        ]);
    }

    public function kelas(Request $r)
    {
        $pengajaran = $r->user()->mengajar()->with('kelas.program', 'kelas.wali', 'mapel')->withCount(['materi', 'tugas'])->get();
        $progres = $this->progresKelas($pengajaran);
        $menunggu = Pengumpulan::join('tugas', 'tugas.id', '=', 'pengumpulan.tugas_id')->whereIn('tugas.pengajaran_id', $pengajaran->pluck('id'))
            ->where('pengumpulan.status', 'dikumpulkan')->whereNull('pengumpulan.nilai')->join('pengajaran', 'pengajaran.id', '=', 'tugas.pengajaran_id')
            ->groupBy('pengajaran.kelas_id')->selectRaw('pengajaran.kelas_id, count(*) n')->pluck('n', 'kelas_id');

        return inertia('Tutor/Kelas', ['kelas' => $pengajaran->groupBy('kelas_id')->map(function ($ps) use ($progres, $menunggu) {
            $k = $ps[0]->kelas;
            $slot = $ps->first(fn ($p) => $p->hari !== null);

            return ['id' => $k->id, 'nama' => $k->nama, 'program' => $k->program->nama, 'setara' => $k->program->setara, 'tingkat' => $k->tingkat, 'wali' => $k->wali?->name ?? '—',
                'siswa' => $k->siswa()->count(), 'materi' => $ps->sum('materi_count'), 'mapel' => $ps->pluck('mapel.nama')->join(', '), 'progres' => $progres[$k->id] ?? 0,
                'menunggu' => $menunggu[$k->id] ?? 0, 'sesi' => $slot ? mb_substr(Akademik::HARI[$slot->hari], 0, 3).', '.Akademik::jam($slot->jam_mulai, null).' · '.($slot->mode === 'Daring' ? 'Daring' : ($slot->tempat ?? '—')) : 'Belum terjadwal · —'];
        })->values()]);
    }

    public function penilaian(Request $r)
    {
        $pengajaranIds = $r->user()->role === 'admin' ? Pengajaran::pluck('id') : $r->user()->mengajar()->pluck('id');
        $filter = $r->integer('tugas') ?: null;
        $tugasIds = Tugas::whereIn('pengajaran_id', $pengajaranIds)->when($filter, fn ($q) => $q->where('id', $filter))->pluck('id');
        $ukuran = fn ($path) => $path && Storage::exists($path) ? max(1, round(Storage::size($path) / 1024)).' KB' : null;

        return inertia('Tutor/Penilaian', [
            'items' => Pengumpulan::with('siswa.kelas', 'tugas')->whereIn('tugas_id', $tugasIds)->where('status', 'dikumpulkan')->latest('dikumpulkan_at')->get()->map(fn ($p) => [
                'id' => $p->id, 'nama' => $p->siswa->name, 'kelas' => $p->siswa->kelas?->nama, 'tugas' => $p->tugas->judul, 'waktu' => Akademik::tgl($p->dikumpulkan_at, 'j M Y, H.i'),
                'terlambat' => $p->dikumpulkan_at->gt($p->tugas->tenggat), 'file' => $p->file_nama, 'url' => $p->file_path ? '/berkas/pengumpulan/'.$p->id : null, 'ukuran' => $ukuran($p->file_path),
                'catatan' => $p->catatan, 'status' => $p->nilai === null ? 'menunggu' : 'dinilai', 'nilai' => $p->nilai, 'umpan' => $p->umpan_balik,
            ]),
            'esai' => HasilUjian::with('siswa.kelas', 'ujian.soal')->whereIn('ujian_id', Ujian::whereIn('pengajaran_id', $pengajaranIds)->select('id'))->whereNotNull('selesai_at')->latest('selesai_at')->get()
                ->filter(fn ($h) => $h->ujian->soal->contains('tipe', 'esai'))->map(fn ($h) => [
                    'id' => $h->id, 'nama' => $h->siswa->name, 'kelas' => $h->siswa->kelas?->nama, 'ujian' => $h->ujian->judul, 'waktu' => Akademik::tgl($h->selesai_at, 'j M Y, H.i'),
                    'status' => $h->nilai === null ? 'menunggu' : 'dinilai', 'nilai' => $h->nilai,
                    'soal' => $h->ujian->soal->where('tipe', 'esai')->map(fn ($s) => ['id' => $s->id, 'pertanyaan' => $s->pertanyaan, 'pedoman' => $s->kunci, 'jawaban' => $h->jawaban[$s->id] ?? '', 'nilai' => $h->nilai_esai[$s->id] ?? null])->values(),
                ])->values(),
            'filterTugas' => $filter ? Tugas::find($filter)?->judul : null,
            'tab' => $r->query('tab') === 'esai' ? 'esai' : 'tugas',
        ]);
    }

    private function pengumpulanMilik(Request $r, int $id): Pengumpulan
    {
        $p = Pengumpulan::with('tugas.pengajaran', 'siswa')->findOrFail($id);
        abort_unless($r->user()->role === 'admin' || $p->tugas->pengajaran->tutor_id === $r->user()->id, 403);

        return $p;
    }

    public function nilaiTugas(Request $r, int $id)
    {
        $p = $this->pengumpulanMilik($r, $id);
        $d = $r->validate(['nilai' => 'required|integer|between:0,100', 'umpan_balik' => 'nullable|string|max:2000']);
        $p->update($d + ['dinilai_at' => now()]);
        Akademik::kirim([$p->siswa_id], 'grading', 'success', 'Tugas sudah dinilai', "{$p->tugas->judul} mendapat nilai {$d['nilai']}.", '/siswa/tugas/'.$p->tugas_id);
        Akademik::catat($r->user(), 'grading', "Menilai tugas {$p->siswa->name}: {$p->tugas->judul}");

        return back()->with('ok', "Nilai {$d['nilai']} untuk {$p->siswa->name} tersimpan dan dikirim.");
    }

    public function revisi(Request $r, int $id)
    {
        $p = $this->pengumpulanMilik($r, $id);
        $d = $r->validate(['umpan_balik' => 'nullable|string|max:2000']);
        $p->update(['status' => 'draf', 'dikumpulkan_at' => null, 'nilai' => null, 'dinilai_at' => null, 'umpan_balik' => $d['umpan_balik'] ?? $p->umpan_balik]);
        Akademik::kirim([$p->siswa_id], 'replay', 'warning', 'Tutor meminta revisi', "Perbaiki dan kumpulkan ulang: {$p->tugas->judul}", '/siswa/tugas/'.$p->tugas_id);

        return back()->with('ok', "Permintaan revisi dikirim ke {$p->siswa->name}.");
    }

    public function nilaiEsai(Request $r, int $id)
    {
        $h = HasilUjian::with('ujian.pengajaran', 'ujian.soal', 'siswa')->findOrFail($id);
        abort_unless($r->user()->role === 'admin' || $h->ujian->pengajaran->tutor_id === $r->user()->id, 403);
        $esaiIds = $h->ujian->soal->where('tipe', 'esai')->pluck('id')->map(fn ($v) => (string) $v)->all();
        $d = $r->validate(['nilai' => 'required|array', 'nilai.*' => 'required|integer|between:0,100']);
        $h->nilai_esai = array_replace($h->nilai_esai ?? [], array_intersect_key($d['nilai'], array_flip($esaiIds)));
        $h->nilai = Akademik::hitungNilaiUjian($h, $h->ujian->soal);
        $h->save();
        if ($h->nilai !== null) {
            Akademik::kirim([$h->siswa_id], 'grading', 'success', 'Nilai ujian terbit', "{$h->ujian->judul}: nilai {$h->nilai}.", '/siswa/nilai');
        }

        return back()->with('ok', $h->nilai !== null ? "Nilai akhir {$h->siswa->name}: {$h->nilai}." : 'Nilai esai tersimpan.');
    }
}
