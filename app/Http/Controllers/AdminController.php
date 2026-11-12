<?php

namespace App\Http\Controllers;

use App\Models\Aktivitas;
use App\Models\HasilUjian;
use App\Models\Kelas;
use App\Models\Mapel;
use App\Models\Materi;
use App\Models\Pengumpulan;
use App\Models\Program;
use App\Models\Sesi;
use App\Models\Tugas;
use App\Models\Ujian;
use App\Models\User;
use App\Support\Akademik;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    const PERAN = ['admin' => 'Administrator', 'tutor' => 'Tutor', 'siswa' => 'Peserta Didik'];

    public function dashboard()
    {
        $perProgram = Program::orderBy('nama')->get()->map(fn ($p) => [$p->nama, $p->setara, User::siswa()->where('status', '!=', 'Nonaktif')->whereIn('kelas_id', $p->kelas()->select('id'))->count()]);
        $hari = collect(range(6, 0))->map(fn ($i) => now()->subDays($i)->startOfDay());
        $harian = Aktivitas::where('created_at', '>=', $hari[0])->get(['user_id', 'created_at'])->groupBy(fn ($a) => $a->created_at->toDateString())->map(fn ($g) => $g->pluck('user_id')->unique()->count());
        $basi = Pengumpulan::where('status', 'dikumpulkan')->whereNull('nilai')->where('dikumpulkan_at', '<', now()->subDays(3))->count();
        $segera = Tugas::with('pengajaran.mapel', 'pengajaran.kelas')->withCount(['pengumpulan as kumpul' => fn ($q) => $q->where('status', 'dikumpulkan')])->whereBetween('tenggat', [now(), now()->addDays(3)])->get()
            ->map(fn ($t) => [$t, ($n = User::siswa()->where('kelas_id', $t->pengajaran->kelas_id)->count()) ? round($t->kumpul / $n * 100) : 100])->filter(fn ($x) => $x[1] < 50)->first();
        $draf = Materi::where('status', 'Draf')->count();
        $kosong = Sesi::doesntHave('presensi')->where('tanggal', '<=', now())->count();

        return inertia('Admin/Dashboard', [
            'stats' => ['siswa' => User::siswa()->where('status', '!=', 'Nonaktif')->count(), 'tutor' => User::tutor()->where('status', 'Aktif')->count(), 'kelas' => Kelas::where('status', 'Aktif')->count(), 'mapel' => Mapel::count(),
                'materi' => Materi::terbit()->count(), 'baru' => User::siswa()->where('created_at', '>=', now()->subMonths(6))->count()],
            'perProgram' => $perProgram,
            'aktivitas' => $hari->map(fn ($d) => [$d->translatedFormat('D'), $harian[$d->toDateString()] ?? 0, $d->isWeekend()])->values(),
            'rentang' => Akademik::tgl($hari[0], 'j M').' – '.Akademik::tgl($hari[6], 'j M Y'),
            'ujian' => Ujian::with('pengajaran.kelas.program', 'pengajaran.mapel')->where('mulai', '>', now())->orderBy('mulai')->take(3)->get()->map(fn ($u) => [
                'judul' => $u->judul, 'kelas' => $u->pengajaran->kelas->program->nama.' · '.$u->pengajaran->kelas->nama, 'tanggal' => $u->mulai->format('j'), 'hari' => $u->mulai->translatedFormat('D'),
                'peserta' => User::siswa()->where('kelas_id', $u->pengajaran->kelas_id)->count(),
            ]),
            'perhatian' => array_values(array_filter([
                $basi ? ['label' => 'Menunggu penilaian', 'teks' => "{$basi} pengumpulan tugas belum dinilai lebih dari 3 hari", 'tone' => 'danger', 'href' => '/admin/tugas'] : null,
                $segera ? ['label' => 'Pengumpulan rendah', 'teks' => "Baru {$segera[1]}% peserta {$segera[0]->pengajaran->kelas->nama} mengumpulkan “{$segera[0]->judul}”", 'tone' => 'warning', 'href' => '/admin/tugas'] : null,
                $kosong ? ['label' => 'Presensi kosong', 'teks' => "{$kosong} sesi pertemuan belum diisi presensinya", 'tone' => 'warning', 'href' => '/admin/kehadiran'] : null,
                $draf ? ['label' => 'Draf belum terbit', 'teks' => "{$draf} materi masih berstatus draf", 'tone' => 'neutral', 'href' => '/admin/materi'] : null,
            ])),
            'terbaru' => Aktivitas::with('user.kelas.program')->latest()->take(6)->get()->map(fn ($a) => [
                'nama' => $a->user->name, 'sub' => $a->user->info, 'program' => $a->user->kelas?->program?->nama ?? self::PERAN[$a->user->role], 'aktivitas' => $a->teks, 'waktu' => $a->created_at->diffForHumans(),
            ]),
            'sistem' => Aktivitas::with('user')->whereHas('user', fn ($q) => $q->whereIn('role', ['admin', 'tutor']))->latest()->take(4)->get()->map(fn ($a) => [
                'icon' => $a->icon, 'teks' => $a->user->name.': '.$a->teks, 'waktu' => $a->created_at->diffForHumans(),
            ]),
        ]);
    }

    /** Nilai akhir per siswa (rata-rata tugas & ujian berbobot). */
    private function nilaiPerSiswa(): \Illuminate\Support\Collection
    {
        $t = Pengumpulan::whereNotNull('nilai')->groupBy('siswa_id')->selectRaw('siswa_id, avg(nilai) n')->pluck('n', 'siswa_id');
        $u = HasilUjian::whereNotNull('nilai')->groupBy('siswa_id')->selectRaw('siswa_id, avg(nilai) n')->pluck('n', 'siswa_id');

        return User::siswa()->pluck('id')->mapWithKeys(fn ($id) => [$id => ['tugas' => $t[$id] ?? null, 'ujian' => $u[$id] ?? null, 'akhir' => Akademik::nilaiAkhir($t[$id] ?? null, $u[$id] ?? null)]]);
    }

    public function laporan()
    {
        $nilai = $this->nilaiPerSiswa();
        $kkm = (int) Akademik::pengaturan('kkm');

        return inertia('Admin/Laporan', [
            'periode' => 'Semester '.Akademik::pengaturan('semester').' '.Akademik::pengaturan('tahun_ajaran'),
            'kkm' => $kkm,
            'ringkas' => Program::orderBy('nama')->get()->map(function ($p) use ($nilai, $kkm) {
                $ids = User::siswa()->whereIn('kelas_id', $p->kelas()->select('id'))->pluck('id');
                $akhir = $ids->map(fn ($id) => $nilai[$id]['akhir'] ?? null)->filter(fn ($v) => $v !== null);
                $hadir = DB::table('presensi')->whereIn('siswa_id', $ids)->selectRaw("count(*) t, sum(case when status = 'Hadir' then 1 else 0 end) h")->first();

                return ['program' => $p->nama, 'siswa' => $ids->count(), 'nilai' => $akhir->isEmpty() ? null : round($akhir->avg(), 1),
                    'hadir' => $hadir->t ? (int) round($hadir->h / $hadir->t * 100) : 0, 'tuntas' => $akhir->isEmpty() ? 0 : (int) round($akhir->filter(fn ($v) => $v >= $kkm)->count() / $akhir->count() * 100)];
            }),
            'jenis' => [
                ['icon' => 'grading', 'judul' => 'Rekap Nilai Peserta Didik', 'teks' => 'Rata-rata nilai tugas, ujian, nilai akhir, dan ketuntasan setiap peserta didik.', 'kunci' => 'nilai'],
                ['icon' => 'event_available', 'judul' => 'Rekap Kehadiran', 'teks' => 'Jumlah hadir, izin, sakit, alpa, dan persentase kehadiran per peserta didik.', 'kunci' => 'kehadiran'],
                ['icon' => 'trending_up', 'judul' => 'Progres Pembelajaran', 'teks' => 'Penyelesaian materi setiap peserta didik pada kelasnya.', 'kunci' => 'progres'],
                ['icon' => 'badge', 'judul' => 'Data Peserta Didik', 'teks' => 'Biodata, kelas, kontak, dan status keaktifan peserta didik.', 'kunci' => 'peserta'],
                ['icon' => 'co_present', 'judul' => 'Kinerja Tutor', 'teks' => 'Jumlah materi, tugas, ujian, dan pengumpulan yang belum dinilai per tutor.', 'kunci' => 'tutor'],
                ['icon' => 'monitoring', 'judul' => 'Log Aktivitas', 'teks' => 'Riwayat aktivitas pengguna 30 hari terakhir.', 'kunci' => 'aktivitas'],
            ],
        ]);
    }

    const JUDUL = ['nilai' => 'Rekap Nilai Peserta Didik', 'kehadiran' => 'Rekap Kehadiran Peserta Didik', 'progres' => 'Progres Pembelajaran Peserta Didik', 'peserta' => 'Data Peserta Didik', 'tutor' => 'Kinerja Tutor', 'aktivitas' => 'Log Aktivitas 30 Hari Terakhir'];

    /** Data laporan [judul kolom, baris] — dipakai ekspor CSV dan halaman cetak/PDF. */
    private function dataLaporan(string $jenis): array
    {
        $f = fn ($v) => $v === null ? '' : str_replace('.', ',', (string) round($v, 1));
        [$header, $rows] = match ($jenis) {
            'nilai' => (function () use ($f) {
                $n = $this->nilaiPerSiswa();
                $kkm = (int) Akademik::pengaturan('kkm');

                return [['NISN', 'Nama', 'Program', 'Kelas', 'Rata-rata Tugas', 'Rata-rata Ujian', 'Nilai Akhir', 'Ketuntasan'],
                    User::siswa()->with('kelas.program')->orderBy('name')->get()->map(fn ($s) => [$s->nomor_induk, $s->name, $s->kelas?->program?->nama, $s->kelas?->nama,
                        $f($n[$s->id]['tugas']), $f($n[$s->id]['ujian']), $f($n[$s->id]['akhir']), $n[$s->id]['akhir'] === null ? '-' : ($n[$s->id]['akhir'] >= $kkm ? 'Tuntas' : 'Belum Tuntas')])];
            })(),
            'kehadiran' => [['NISN', 'Nama', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Persentase Hadir'],
                User::siswa()->with('kelas')->orderBy('name')->get()->map(function ($s) {
                    $c = DB::table('presensi')->where('siswa_id', $s->id)->groupBy('status')->selectRaw('status, count(*) n')->pluck('n', 'status');
                    $t = $c->sum();

                    return [$s->nomor_induk, $s->name, $s->kelas?->nama, $c['Hadir'] ?? 0, $c['Izin'] ?? 0, $c['Sakit'] ?? 0, $c['Alpa'] ?? 0, $t ? round(($c['Hadir'] ?? 0) / $t * 100).'%' : '-'];
                })],
            'progres' => [['NISN', 'Nama', 'Kelas', 'Materi Selesai', 'Total Materi', 'Progres'],
                User::siswa()->with('kelas')->orderBy('name')->get()->map(fn ($s) => [$s->nomor_induk, $s->name, $s->kelas?->nama, ...(fn ($p) => [$p[0], $p[1], $p[2].'%'])(Akademik::progres($s))])],
            'peserta' => [['NISN', 'Nama', 'Jenis Kelamin', 'Tanggal Lahir', 'Program', 'Kelas', 'Telepon', 'Email', 'Alamat', 'Status'],
                User::siswa()->with('kelas.program')->orderBy('name')->get()->map(fn ($s) => [$s->nomor_induk, $s->name, $s->jenis_kelamin, $s->tanggal_lahir?->format('d/m/Y'), $s->kelas?->program?->nama, $s->kelas?->nama, $s->telepon, $s->email, $s->alamat, $s->status])],
            'tutor' => [['Nama', 'Nomor Induk', 'Mengampu', 'Materi', 'Tugas', 'Ujian', 'Belum Dinilai', 'Status'],
                User::tutor()->with('mengajar.mapel')->orderBy('name')->get()->map(function ($t) {
                    $ids = $t->mengajar->pluck('id');

                    return [$t->name, $t->nomor_induk, $t->mengajar->pluck('mapel.nama')->unique()->join(', '), Materi::whereIn('pengajaran_id', $ids)->count(), Tugas::whereIn('pengajaran_id', $ids)->count(),
                        Ujian::whereIn('pengajaran_id', $ids)->count(), Pengumpulan::whereIn('tugas_id', Tugas::whereIn('pengajaran_id', $ids)->select('id'))->where('status', 'dikumpulkan')->whereNull('nilai')->count(), $t->status];
                })],
            'aktivitas' => [['Waktu', 'Pengguna', 'Peran', 'Aktivitas'],
                Aktivitas::with('user')->where('created_at', '>=', now()->subDays(30))->latest()->get()->map(fn ($a) => [$a->created_at->format('d/m/Y H:i'), $a->user->name, self::PERAN[$a->user->role], $a->teks])],
            default => abort(404),
        };

        return [$header, $rows];
    }

    /** Ekspor CSV (terbuka di Excel). Pemisah ";" agar kolom terbaca benar pada Excel berbahasa Indonesia. */
    public function ekspor(string $jenis)
    {
        [$header, $rows] = $this->dataLaporan($jenis);

        return response()->streamDownload(function () use ($header, $rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $header, ';');
            foreach ($rows as $row) fputcsv($out, $row, ';');
            fclose($out);
        }, "laporan-{$jenis}-".now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Halaman cetak resmi (kop lembaga); simpan sebagai PDF lewat dialog cetak peramban. */
    public function cetak(Request $r, string $jenis)
    {
        [$header, $rows] = $this->dataLaporan($jenis);

        return view('cetak', [
            'judul' => self::JUDUL[$jenis], 'subjudul' => 'Semester '.Akademik::pengaturan('semester').' Tahun Ajaran '.Akademik::pengaturan('tahun_ajaran'),
            'kolom' => $header, 'baris' => collect($rows)->values()->all(), 'lanskap' => count($header) > 7,
            'ttd' => [['Mengetahui,', 'Kepala '.Akademik::pengaturan('nama_lembaga'), Akademik::pengaturan('kepala')], ['Dibuat oleh,', self::PERAN[$r->user()->role], $r->user()->name]],
        ]);
    }

    public function pengaturan()
    {
        return inertia('Admin/Pengaturan', ['pengaturan' => Akademik::pengaturan()]);
    }

    public function simpanPengaturan(Request $r)
    {
        $d = $r->validate([
            'nama_lembaga' => 'required|max:120', 'nama_singkat' => 'required|max:40', 'kepala' => 'nullable|max:120', 'npsn' => 'nullable|max:20', 'email' => 'nullable|email', 'telepon' => 'nullable|max:30', 'alamat' => 'nullable|max:300',
            'tahun_ajaran' => ['required', 'regex:/^\d{4}\/\d{4}$/'], 'semester' => 'required|in:Ganjil,Genap', 'mulai' => 'required|date', 'selesai' => 'required|date|after:mulai',
            'kkm' => 'required|integer|between:0,100', 'bobot_tugas' => 'required|integer|between:0,100',
        ], ['tahun_ajaran.regex' => 'Format tahun ajaran: 2026/2027.']);
        Akademik::simpanPengaturan($d);
        Akademik::catat($r->user(), 'settings', 'Memperbarui pengaturan sistem');

        return back()->with('ok', 'Pengaturan sistem berhasil disimpan.');
    }
}
