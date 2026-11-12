<?php

namespace App\Http\Controllers;

use App\Models\HasilUjian;
use App\Models\Materi;
use App\Models\Pengajaran;
use App\Models\Pengumpulan;
use App\Models\Pengumuman;
use App\Models\Sesi;
use App\Models\Tugas;
use App\Models\Ujian;
use App\Models\User;
use App\Support\Akademik;
use App\Support\Resources;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SiswaController extends Controller
{
    // ── Penyaji bersama ─────────────────────────────────────────────────
    public static function jadwalLabel(Pengajaran $p): ?string
    {
        return $p->hari === null ? null : Akademik::HARI[$p->hari].', '.Akademik::jam($p->jam_mulai, $p->jam_selesai).($p->mode === 'Daring' ? ' · Daring' : '');
    }

    /** Kartu mapel milik kelas siswa. */
    public static function kartuMapel(User $s): Collection
    {
        $tones = ['green', 'lime', 'mint'];

        return Pengajaran::with('mapel', 'tutor', 'kelas.program')->withCount(['materi' => fn ($q) => $q->terbit(), 'tugas'])->where('kelas_id', $s->kelas_id ?? 0)->orderBy('mapel_id')->get()
            ->values()->map(function ($p, $i) use ($s, $tones) {
                [$selesai, $total, $persen] = Akademik::progres($s, $p->id);

                return ['id' => $p->id, 'nama' => $p->mapel->nama, 'kode' => $p->mapel->kode, 'tutor' => $p->tutor->name, 'icon' => $p->mapel->icon, 'tone' => $tones[$i % 3],
                    'program' => $p->kelas->program->nama, 'materi' => $total, 'selesai' => $selesai, 'tugas' => $p->tugas_count, 'progres' => $persen,
                    'jadwal' => self::jadwalLabel($p) ?? 'Jadwal menyusul', 'deskripsi' => $p->mapel->deskripsi];
            });
    }

    /** Modul & materi kelas siswa, berstatus selesai/sedang/belum. */
    public static function modulMateri(User $u, ?int $kelasId = null): Collection
    {
        $selesai = $u->role === 'siswa' ? DB::table('materi_selesai')->where('user_id', $u->id)->pluck('materi_id')->flip() : collect();
        $materi = Materi::with('pengajaran.mapel')->whereIn('pengajaran_id', Pengajaran::where('kelas_id', $kelasId ?? $u->kelas_id ?? 0)->select('id'))
            ->when($u->role === 'siswa', fn ($q) => $q->terbit())->orderBy('pengajaran_id')->orderBy('modul')->orderBy('urutan')->get();

        return $materi->groupBy(fn ($m) => $m->pengajaran_id.'|'.$m->modul)->map(function ($items) use ($selesai) {
            $ada = $items->contains(fn ($m) => $selesai->has($m->id));
            $sedang = false;

            return ['mapel' => $items[0]->pengajaran->mapel->nama, 'modul' => $items[0]->modul, 'items' => $items->map(function ($m) use ($selesai, $ada, &$sedang) {
                $status = $selesai->has($m->id) ? 'selesai' : ($ada && ! $sedang ? 'sedang' : 'belum');
                $sedang = $sedang || $status === 'sedang';

                return ['id' => $m->id, 'judul' => $m->judul, 'tipe' => $m->tipe, 'durasi' => $m->durasi ? $m->durasi.' menit' : '—', 'status' => $status];
            })->values()];
        })->values();
    }

    private function tugasSiswa(User $s): Collection
    {
        $kumpul = Pengumpulan::where('siswa_id', $s->id)->get()->keyBy('tugas_id');

        return Tugas::with('pengajaran.mapel', 'pengajaran.tutor')->whereIn('pengajaran_id', Pengajaran::where('kelas_id', $s->kelas_id ?? 0)->select('id'))->orderBy('tenggat')->get()
            ->map(fn ($t) => $this->tugasRingkas($t, $kumpul->get($t->id)))
            ->sortBy(fn ($t) => array_search($t['status'], ['terlambat', 'proses', 'belum', 'dikumpulkan', 'dinilai']))->values();
    }

    private function tugasRingkas(Tugas $t, ?Pengumpulan $p): array
    {
        return ['id' => $t->id, 'judul' => $t->judul, 'mapel' => $t->pengajaran->mapel->nama, 'tutor' => $t->pengajaran->tutor->name,
            'diberikan' => Akademik::tgl($t->created_at), 'tenggat' => Akademik::tgl($t->tenggat, 'j M Y, H.i'), 'sisa' => Akademik::sisa($t, $p),
            'status' => Akademik::statusTugas($t, $p), 'nilai' => $p?->nilai];
    }

    private function ujianSiswa(User $s): Collection
    {
        $hasil = HasilUjian::where('siswa_id', $s->id)->get()->keyBy('ujian_id');

        return Ujian::with('pengajaran.mapel', 'pengajaran.tutor')->withCount('soal')->whereIn('pengajaran_id', Pengajaran::where('kelas_id', $s->kelas_id ?? 0)->select('id'))->orderBy('mulai')->get()
            ->map(function ($u) use ($hasil) {
                $h = $hasil->get($u->id);
                $status = $h?->selesai_at ? 'selesai' : $u->status;

                return ['id' => $u->id, 'judul' => $u->judul, 'mapel' => $u->pengajaran->mapel->nama, 'tutor' => $u->pengajaran->tutor->name, 'durasi' => $u->durasi, 'soal' => $u->soal_count,
                    'jadwal' => match ($status) { 'tersedia' => 'Ditutup '.Akademik::tgl($u->selesai, 'j M, H.i'), 'mendatang' => Akademik::tgl($u->mulai, 'D, j M Y · H.i'), default => 'Selesai '.Akademik::tgl($h?->selesai_at ?? $u->selesai) },
                    'status' => $status, 'nilai' => $h?->nilai, 'menunggu' => $h?->selesai_at && $h->nilai === null, 'dilanjutkan' => $h && ! $h->selesai_at];
            });
    }

    // ── Halaman ─────────────────────────────────────────────────────────
    public function dashboard(Request $r)
    {
        $s = $r->user()->load('kelas.program', 'kelas.wali');
        [$selesai, $total, $persen] = Akademik::progres($s);
        $modul = self::modulMateri($s);
        $target = $modul->flatMap(fn ($g) => collect($g['items'])->map(fn ($i) => $i + ['mapel' => $g['mapel'], 'modul' => $g['modul']]))->firstWhere('status', 'sedang')
            ?? $modul->flatMap(fn ($g) => collect($g['items'])->map(fn ($i) => $i + ['mapel' => $g['mapel'], 'modul' => $g['modul']]))->firstWhere('status', 'belum');
        $nilai = Akademik::nilaiSiswa($s)->filter(fn ($n) => $n['akhir'] !== null);
        $lanjut = $target ? Materi::with('pengajaran.tutor')->find($target['id']) : null;
        $terakhir = DB::table('materi_selesai')->where('user_id', $s->id)->max('created_at');

        return inertia('Siswa/Dashboard', [
            'profil' => ['program' => $s->kelas?->program?->nama ?? 'Belum ada kelas', 'kelas' => $s->kelas?->nama ?? '—', 'nisn' => $s->nomor_induk, 'wali' => $s->kelas?->wali?->name ?? '—',
                'progres' => $persen, 'modul' => "{$selesai} dari {$total} materi selesai"],
            'lanjutkan' => $lanjut ? ['id' => $lanjut->id, 'judul' => $lanjut->judul, 'mapel' => $target['mapel'], 'modul' => explode(' · ', $target['modul'])[0], 'tutor' => $lanjut->pengajaran->tutor->name,
                'progres' => Akademik::progres($s, $lanjut->pengajaran_id)[2], 'waktu' => $terakhir ? 'Terakhir belajar '.\Carbon\Carbon::parse($terakhir)->diffForHumans() : 'Belum mulai belajar',
                'meta' => $lanjut->tipe.($lanjut->durasi ? " · {$lanjut->durasi} menit" : '')] : null,
            'mapel' => self::kartuMapel($s)->take(4)->values(),
            'tugas' => $this->tugasSiswa($s)->whereIn('status', ['terlambat', 'proses', 'belum'])->take(3)->values(),
            'ujian' => $this->ujianSiswa($s)->whereIn('status', ['tersedia', 'mendatang'])->take(3)->values(),
            'pengumuman' => Pengumuman::untuk('siswa')->latest()->take(2)->get()->map(fn ($p) => ['id' => $p->id, 'judul' => $p->judul, 'kategori' => $p->kategori, 'penting' => $p->penting, 'tanggal' => Akademik::tgl($p->created_at)]),
            'riwayat' => $s->hasMany(\App\Models\Aktivitas::class)->latest()->take(3)->get()->map(fn ($a) => ['icon' => $a->icon, 'teks' => $a->teks, 'waktu' => $a->created_at->diffForHumans()]),
            'nilai' => ['rata' => $nilai->isEmpty() ? null : round($nilai->avg('akhir'), 1), 'tuntas' => $nilai->where('akhir', '>=', (int) Akademik::pengaturan('kkm'))->count(), 'total' => Akademik::nilaiSiswa($s)->count(), 'tren' => $nilai->count().' mapel sudah memiliki nilai'],
        ]);
    }

    public function kelas(Request $r)
    {
        $s = $r->user()->load('kelas.program', 'kelas.wali');
        abort_unless($s->kelas, 404, 'Anda belum terdaftar di kelas mana pun. Hubungi Tata Usaha.');
        [$selesai, $total, $persen] = Akademik::progres($s);
        $k = $s->kelas;
        $data = ['id' => $k->id, 'nama' => $k->nama, 'program' => $k->program->nama, 'setara' => $k->program->setara, 'tingkat' => $k->tingkat, 'wali' => $k->wali?->name ?? '—',
            'siswa' => $k->siswa()->count(), 'mapel' => $k->pengajaran()->count(), 'jadwal' => $k->jadwal ?? '—', 'ruang' => $k->ruang ?? '—', 'status' => $k->status, 'progres' => $persen];

        return inertia('Siswa/Kelas', [
            'utama' => $data + ['selesai' => $selesai, 'total' => $total],
            'kelas' => [$data + ['peran' => 'Kelas Utama', 'progresSaya' => $persen]],
            'teman' => $k->siswa()->where('id', '!=', $s->id)->orderBy('name')->take(6)->pluck('name'),
        ]);
    }

    public function mapel(Request $r)
    {
        return inertia('Siswa/Mapel', ['mapel' => self::kartuMapel($r->user()), 'menunggu' => $this->tugasSiswa($r->user())->whereIn('status', ['terlambat', 'proses', 'belum'])->values()->take(1)->all(),
            'jumlahMenunggu' => $this->tugasSiswa($r->user())->whereIn('status', ['terlambat', 'proses', 'belum'])->count()]);
    }

    public function materi(Request $r)
    {
        return inertia('Siswa/Materi', ['modul' => self::modulMateri($r->user())]);
    }

    public function tugas(Request $r)
    {
        return inertia('Siswa/Tugas', ['tugas' => $this->tugasSiswa($r->user())]);
    }

    private function tugasMilik(Request $r, int $id): Tugas
    {
        $t = Tugas::with('pengajaran.mapel', 'pengajaran.tutor')->findOrFail($id);
        abort_unless($t->pengajaran->kelas_id === $r->user()->kelas_id, 403);

        return $t;
    }

    public function tugasDetail(Request $r, int $id)
    {
        $t = $this->tugasMilik($r, $id);
        $p = Pengumpulan::where('tugas_id', $t->id)->where('siswa_id', $r->user()->id)->first();
        $riwayat = collect([
            $p?->dinilai_at ? ['waktu' => Akademik::tgl($p->dinilai_at, 'j M Y, H.i'), 'aksi' => 'Dinilai oleh tutor', 'file' => null] : null,
            $p?->dikumpulkan_at ? ['waktu' => Akademik::tgl($p->dikumpulkan_at, 'j M Y, H.i'), 'aksi' => 'Tugas dikumpulkan'.($p->dikumpulkan_at->gt($t->tenggat) ? ' (terlambat)' : ''), 'file' => $p->file_nama, 'url' => $p->file_path ? '/berkas/pengumpulan/'.$p->id : null] : null,
            $p && $p->status === 'draf' ? ['waktu' => Akademik::tgl($p->updated_at, 'j M Y, H.i'), 'aksi' => 'Draf disimpan', 'file' => $p->file_nama, 'url' => $p->file_path ? '/berkas/pengumpulan/'.$p->id : null] : null,
        ])->filter()->values();

        return inertia('Siswa/TugasDetail', ['tugas' => $this->tugasRingkas($t, $p) + [
            'instruksi' => array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $t->instruksi)))),
            'bobot' => 'Nilai maksimal 100 · Bobot tugas '.Akademik::pengaturan('bobot_tugas').'% dari nilai akhir',
            'lampiran' => $t->lampiran_path ? [['nama' => $t->lampiran_nama, 'url' => '/berkas/tugas/'.$t->id]] : [],
            'riwayat' => $riwayat, 'umpan_balik' => $p?->umpan_balik, 'catatan' => $p?->catatan, 'draf' => $p?->status === 'draf' ? $p->file_nama : null,
        ]]);
    }

    public function simpanTugas(Request $r, int $id)
    {
        $t = $this->tugasMilik($r, $id);
        $data = $r->validate(['berkas' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png,ppt,pptx,xls,xlsx,zip', 'catatan' => 'nullable|string|max:1000', 'aksi' => 'required|in:draf,kumpul']);
        $p = Pengumpulan::firstOrNew(['tugas_id' => $t->id, 'siswa_id' => $r->user()->id]);
        abort_if($p->nilai !== null, 422, 'Tugas yang sudah dinilai tidak dapat diubah.');
        if ($f = Resources::simpanBerkas($data['berkas'] ?? null, 'pengumpulan', $p->file_path)) [$p->file_path, $p->file_nama] = [$f['path'], $f['nama']];
        if ($data['aksi'] === 'kumpul' && ! $p->file_path) return back()->withErrors(['berkas' => 'Unggah berkas tugas terlebih dahulu.']);
        $p->catatan = $data['catatan'] ?? $p->catatan;
        $p->status = $data['aksi'] === 'kumpul' ? 'dikumpulkan' : 'draf';
        $p->dikumpulkan_at = $data['aksi'] === 'kumpul' ? now() : null;
        $p->save();

        if ($data['aksi'] === 'kumpul') {
            Akademik::catat($r->user(), 'upload_file', "Mengumpulkan tugas “{$t->judul}”");
            Akademik::kirim([$t->pengajaran->tutor_id], 'upload_file', 'primary', 'Pengumpulan baru', "{$r->user()->name} mengumpulkan {$t->judul}", '/tutor/penilaian?tugas='.$t->id);
        }

        return back()->with('ok', $data['aksi'] === 'kumpul' ? 'Tugas berhasil dikumpulkan. Semangat!' : 'Draf tugas berhasil disimpan.');
    }

    public function batalTugas(Request $r, int $id)
    {
        $t = $this->tugasMilik($r, $id);
        $p = Pengumpulan::where('tugas_id', $t->id)->where('siswa_id', $r->user()->id)->firstOrFail();
        abort_if($p->nilai !== null, 422, 'Tugas sudah dinilai.');
        $p->update(['status' => 'draf', 'dikumpulkan_at' => null]);

        return back()->with('ok', 'Pengumpulan dibatalkan. Kamu dapat mengunggah ulang berkas.');
    }

    public function ujian(Request $r)
    {
        return inertia('Siswa/Ujian', ['ujian' => $this->ujianSiswa($r->user())->values()]);
    }

    private function ujianMilik(Request $r, int $id): Ujian
    {
        $u = Ujian::with('pengajaran.mapel', 'soal')->findOrFail($id);
        abort_unless($u->pengajaran->kelas_id === $r->user()->kelas_id, 403);

        return $u;
    }

    /** Detik tersisa: dibatasi durasi sejak mulai dan waktu tutup ujian. */
    private function sisaDetik(Ujian $u, HasilUjian $h): int
    {
        return max(0, (int) min($h->mulai_at->copy()->addMinutes($u->durasi)->getTimestamp(), $u->selesai->getTimestamp()) - now()->getTimestamp());
    }

    public function kerjakan(Request $r, int $id)
    {
        $u = $this->ujianMilik($r, $id);
        $h = HasilUjian::where('ujian_id', $u->id)->where('siswa_id', $r->user()->id)->first();
        abort_if($h?->selesai_at, 403, 'Kamu sudah menyelesaikan ujian ini.');
        abort_unless($u->status === 'tersedia' || $h, 403, 'Ujian belum dibuka atau sudah ditutup.');
        $h ??= HasilUjian::create(['ujian_id' => $u->id, 'siswa_id' => $r->user()->id, 'mulai_at' => now(), 'jawaban' => []]);
        if ($this->sisaDetik($u, $h) === 0) {
            $this->tutup($u, $h);

            return redirect('/siswa/ujian')->with('ok', 'Waktu ujian sudah habis. Jawaban tersimpan telah dikumpulkan.');
        }

        return inertia('Siswa/UjianKerjakan', [
            'ujian' => ['id' => $u->id, 'judul' => $u->judul, 'mapel' => $u->pengajaran->mapel->nama, 'durasi' => $u->durasi],
            'soal' => $u->soal->map(fn ($s) => ['id' => $s->id, 'tipe' => $s->tipe, 'teks' => $s->pertanyaan, 'opsi' => $s->opsi]), // kunci tidak dikirim
            'jawaban' => (object) ($h->jawaban ?? []),
            'sisa' => $this->sisaDetik($u, $h),
        ]);
    }

    private function bersihkanJawaban(Ujian $u, array $jawaban): array
    {
        $ids = $u->soal->pluck('id')->flip();

        return collect($jawaban)->filter(fn ($v, $k) => $ids->has($k))->map(fn ($v) => is_scalar($v) ? mb_substr((string) $v, 0, 10000) : null)->filter(fn ($v) => $v !== null)->all();
    }

    /** Simpan otomatis (dipanggil berkala dari halaman ujian). */
    public function jawab(Request $r, int $id)
    {
        $u = $this->ujianMilik($r, $id);
        $h = HasilUjian::where('ujian_id', $u->id)->where('siswa_id', $r->user()->id)->whereNull('selesai_at')->firstOrFail();
        if ($this->sisaDetik($u, $h) > -60) $h->update(['jawaban' => $this->bersihkanJawaban($u, (array) $r->input('jawaban', []))]); // toleransi 60 detik jaringan

        return response()->noContent();
    }

    public function kumpulUjian(Request $r, int $id)
    {
        $u = $this->ujianMilik($r, $id);
        $h = HasilUjian::where('ujian_id', $u->id)->where('siswa_id', $r->user()->id)->whereNull('selesai_at')->firstOrFail();
        if ($this->sisaDetik($u, $h) > -60) $h->jawaban = $this->bersihkanJawaban($u, (array) $r->input('jawaban', []));
        $this->tutup($u, $h);
        Akademik::catat($r->user(), 'quiz', "Menyelesaikan ujian “{$u->judul}”");

        return redirect('/siswa/ujian')->with('ok', $h->nilai !== null ? "Jawaban terkumpul. Nilai kamu: {$h->nilai}." : 'Jawaban terkumpul. Nilai akhir terbit setelah esai dinilai tutor.');
    }

    private function tutup(Ujian $u, HasilUjian $h): void
    {
        $h->selesai_at = now();
        $h->nilai = Akademik::hitungNilaiUjian($h, $u->soal);
        $h->save();
        if ($h->nilai === null) {
            Akademik::kirim([$u->pengajaran->tutor_id], 'rate_review', 'warning', 'Esai perlu dinilai', "{$h->siswa->name} menyelesaikan {$u->judul}", '/tutor/penilaian?tab=esai');
        }
    }

    public function nilai(Request $r)
    {
        $s = $r->user();
        $kkm = (int) Akademik::pengaturan('kkm');
        $tugas = Pengumpulan::with('tugas.pengajaran.mapel', 'tugas.pengajaran.tutor')->where('siswa_id', $s->id)->whereNotNull('nilai')->latest('dinilai_at')->get();
        $ujian = HasilUjian::with('ujian.pengajaran.mapel')->where('siswa_id', $s->id)->whereNotNull('nilai')->latest('selesai_at')->get();
        $semua = $tugas->map(fn ($p) => ['tgl' => $p->dinilai_at, 'nilai' => $p->nilai])->concat($ujian->map(fn ($h) => ['tgl' => $h->selesai_at, 'nilai' => $h->nilai]));
        $tren = collect(range(4, 0))->map(fn ($i) => now()->startOfMonth()->subMonths($i))->map(fn ($bulan) => [
            $bulan->translatedFormat('M'), ($v = $semua->filter(fn ($x) => $x['tgl']?->isSameMonth($bulan))->avg('nilai')) ? (int) round($v) : null,
        ])->values();

        return inertia('Siswa/Nilai', [
            'mapel' => Akademik::nilaiSiswa($s), 'kkm' => $kkm, 'tren' => $tren,
            'jumlah' => ['tugas' => $tugas->count(), 'ujian' => $ujian->count()],
            'riwayat' => $tugas->map(fn ($p) => ['judul' => $p->tugas->judul, 'jenis' => 'Tugas', 'mapel' => $p->tugas->pengajaran->mapel->nama, 'tgl' => $p->dinilai_at, 'nilai' => $p->nilai])
                ->concat($ujian->map(fn ($h) => ['judul' => $h->ujian->judul, 'jenis' => 'Ujian', 'mapel' => $h->ujian->pengajaran->mapel->nama, 'tgl' => $h->selesai_at, 'nilai' => $h->nilai]))
                ->sortByDesc('tgl')->take(8)->map(fn ($x) => ['tanggal' => Akademik::tgl($x['tgl'])] + $x)->map(fn ($x) => collect($x)->except('tgl')->all())->values(),
            'umpan' => $tugas->whereNotNull('umpan_balik')->take(3)->map(fn ($p) => ['tutor' => $p->tugas->pengajaran->tutor->name, 'mapel' => $p->tugas->pengajaran->mapel->nama, 'teks' => $p->umpan_balik, 'tanggal' => Akademik::tgl($p->dinilai_at)])->values(),
        ]);
    }

    public function kehadiran(Request $r)
    {
        $s = $r->user();
        $rows = DB::table('presensi')->join('sesi', 'sesi.id', '=', 'presensi.sesi_id')->join('pengajaran', 'pengajaran.id', '=', 'sesi.pengajaran_id')->join('mapel', 'mapel.id', '=', 'pengajaran.mapel_id')
            ->where('presensi.siswa_id', $s->id)->orderByDesc('sesi.tanggal')->get(['sesi.tanggal', 'sesi.mode', 'mapel.nama as mapel', 'pengajaran.jam_mulai', 'presensi.status']);
        $bulan = now()->startOfMonth();
        $kode = ['Hadir' => 'h', 'Izin' => 'i', 'Sakit' => 's', 'Alpa' => 'a'];

        return inertia('Siswa/Kehadiran', [
            'ringkas' => ['hadir' => $rows->where('status', 'Hadir')->count(), 'izin' => $rows->where('status', 'Izin')->count(), 'sakit' => $rows->where('status', 'Sakit')->count(), 'alpa' => $rows->where('status', 'Alpa')->count()],
            'sesi' => $rows->take(20)->map(fn ($x) => ['tanggal' => Akademik::tgl(\Carbon\Carbon::parse($x->tanggal), 'D, j M Y'), 'mapel' => $x->mapel, 'mode' => $x->mode, 'jam' => Akademik::jam($x->jam_mulai, null) ?? '—', 'status' => $x->status])->values(),
            'kalender' => (object) $rows->filter(fn ($x) => \Carbon\Carbon::parse($x->tanggal)->isSameMonth($bulan))
                ->mapWithKeys(fn ($x) => [(int) substr($x->tanggal, 8, 2) => $kode[$x->status]])->all(),
            'bulan' => ['label' => $bulan->translatedFormat('F Y'), 'offset' => $bulan->dayOfWeekIso - 1, 'hari' => $bulan->daysInMonth, 'hariIni' => now()->day],
        ]);
    }
}
