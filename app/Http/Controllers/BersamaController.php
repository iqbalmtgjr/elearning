<?php

namespace App\Http\Controllers;

use App\Models\Aktivitas;
use App\Models\Diskusi;
use App\Models\Kelas;
use App\Models\Mapel;
use App\Models\Materi;
use App\Models\Notifikasi;
use App\Models\Pengajaran;
use App\Models\Pengumpulan;
use App\Models\Pengumuman;
use App\Models\Program;
use App\Models\Tugas;
use App\Models\Ujian;
use App\Models\User;
use App\Support\Akademik;
use App\Support\Resources;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class BersamaController extends Controller
{
    const KATEGORI = ['Akademik', 'Kegiatan', 'Administrasi', 'Sistem'];

    private function boleh(User $u, Pengajaran $p): bool
    {
        return $u->role === 'admin' || ($u->role === 'tutor' && $p->tutor_id === $u->id) || ($u->role === 'siswa' && $p->kelas_id === $u->kelas_id);
    }

    // ── Beranda publik (Landing Page) ───────────────────────────────────
    public function beranda()
    {
        $pengumuman = Pengumuman::with('penulis')
            ->whereHas('penulis', fn($q) => $q->where('role', 'admin'))
            ->where('target', 'semua')
            ->orderByDesc('penting')
            ->latest()
            ->take(12)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'judul' => $p->judul,
                'kategori' => $p->kategori,
                'tanggal' => Akademik::tgl($p->created_at, 'j F Y'),
                'waktu' => $p->created_at->diffForHumans(),
                'penulis' => $p->penulis?->name ?? 'Administrator',
                'jabatan' => $p->penulis?->jabatan ?: 'Super Admin',
                'ringkas' => str($p->isi)->squish()->limit(180)->toString(),
                'isi' => array_values(array_filter(preg_split('/\r?\n\s*\r?\n/', $p->isi))),
                'baru' => $p->created_at->gt(now()->subDays(5)),
                'penting' => (bool) $p->penting,
                'lampiran' => $p->lampiran_path ? ['nama' => $p->lampiran_nama, 'url' => '/pengumuman-publik/' . $p->id . '/lampiran'] : null,
            ]);

        $program = Program::with(['mapel:id,program_id,nama,icon'])->withCount(['kelas', 'mapel'])->orderBy('id')->get()->map(fn($p) => [
            'id' => $p->id,
            'nama' => $p->nama,
            'setara' => $p->setara,
            'tingkat' => $p->tingkat,
            'deskripsi' => $p->deskripsi,
            'kelas_count' => $p->kelas_count,
            'mapel_count' => $p->mapel_count,
            'mapel' => $p->mapel->map(fn($m) => ['nama' => $m->nama, 'icon' => $m->icon])->values(),
        ]);

        $tutor = User::tutor()->where('status', 'Aktif')->with('mengajar.mapel')->orderBy('name')->take(8)->get()->map(fn($t) => [
            'id' => $t->id,
            'nama' => $t->name,
            'jabatan' => $t->jabatan ?: 'Tutor Akademik',
            'pendidikan' => $t->pendidikan,
            'mapel' => $t->mengajar->pluck('mapel.nama')->unique()->values(),
        ]);

        return inertia('Landing', [
            'lembaga' => Akademik::pengaturan(),
            'statistik' => [
                'siswa' => User::siswa()->where('status', '!=', 'Nonaktif')->count(),
                'tutor' => User::tutor()->where('status', 'Aktif')->count(),
                'kelas' => Kelas::where('status', 'Aktif')->count(),
                'materi' => Materi::terbit()->count(),
                'mapel' => Mapel::count(),
            ],
            'pengumuman' => $pengumuman,
            'program' => $program,
            'tutor' => $tutor,
        ]);
    }

    public function lampiranPengumumanPublik(int $id)
    {
        $p = Pengumuman::whereHas('penulis', fn($q) => $q->where('role', 'admin'))
            ->where('target', 'semua')
            ->findOrFail($id);
        abort_unless($p->lampiran_path && Storage::exists($p->lampiran_path), 404, 'Berkas tidak ditemukan.');

        return Storage::download($p->lampiran_path, $p->lampiran_nama);
    }

    // ── Pengumuman ──────────────────────────────────────────────────────
    private function ringkasPengumuman(Pengumuman $p): array
    {
        return [
            'id' => $p->id,
            'judul' => $p->judul,
            'kategori' => $p->kategori,
            'tanggal' => Akademik::tgl($p->created_at),
            'penulis' => $p->penulis?->name ?? 'PKBM BHP',
            'ringkas' => str($p->isi)->squish()->limit(180)->toString(),
            'baru' => $p->created_at->gt(now()->subDays(3)),
            'penting' => $p->penting,
            'target' => $p->target,
            'lampiran' => $p->lampiran_path ? [['nama' => $p->lampiran_nama, 'url' => '/berkas/pengumuman/' . $p->id]] : [],
            'penulis_id' => $p->penulis_id
        ];
    }

    public function pengumuman(Request $r)
    {
        return inertia('Shared/Pengumuman', ['items' => Pengumuman::with('penulis')->untuk($r->user()->role)->latest()->get()->map(fn($p) => $this->ringkasPengumuman($p) + ['isi' => $p->isi])]);
    }

    public function pengumumanDetail(Request $r, int $id)
    {
        $p = Pengumuman::with('penulis')->untuk($r->user()->role)->findOrFail($id);

        return inertia('Shared/PengumumanDetail', [
            'pengumuman' => $this->ringkasPengumuman($p) + ['isi' => array_values(array_filter(preg_split('/\r?\n\s*\r?\n/', $p->isi)))],
            'lainnya' => Pengumuman::untuk($r->user()->role)->where('id', '!=', $p->id)->latest()->take(3)->get()->map(fn($x) => ['id' => $x->id, 'judul' => $x->judul, 'kategori' => $x->kategori, 'tanggal' => Akademik::tgl($x->created_at)]),
        ]);
    }

    public function simpanPengumuman(Request $r, ?int $id = null)
    {
        abort_if($r->user()->role === 'siswa', 403);
        $p = $id ? Pengumuman::findOrFail($id) : null;
        abort_if($p && $r->user()->role !== 'admin' && $p->penulis_id !== $r->user()->id, 403);
        $d = $r->validate([
            'judul' => 'required|max:160',
            'kategori' => ['required', Rule::in(self::KATEGORI)],
            'target' => 'required|in:semua,siswa,tutor',
            'isi' => 'required|max:10000',
            'penting' => 'boolean',
            'lampiran' => 'nullable|file|max:10240|mimes:pdf,jpg,jpeg,png,doc,docx'
        ]);
        if ($f = Resources::simpanBerkas($d['lampiran'] ?? null, 'pengumuman', $p?->lampiran_path)) {
            [$d['lampiran_path'], $d['lampiran_nama']] = [$f['path'], $f['nama']];
        }
        unset($d['lampiran']);
        if ($p) {
            $p->update($d);

            return back()->with('ok', 'Pengumuman berhasil diperbarui.');
        }
        $p = Pengumuman::create($d + ['penulis_id' => $r->user()->id]);
        $penerima = User::where('id', '!=', $r->user()->id)->where('status', '!=', 'Nonaktif')->when($d['target'] !== 'semua', fn($q) => $q->where('role', $d['target']))->pluck('id');
        Akademik::kirim($penerima, 'campaign', $d['penting'] ?? false ? 'danger' : 'lime', 'Pengumuman baru', $p->judul, '/pengumuman/' . $p->id);
        Akademik::catat($r->user(), 'campaign', "Menerbitkan pengumuman “{$p->judul}”");

        return redirect('/pengumuman')->with('ok', 'Pengumuman berhasil diterbitkan.');
    }

    public function hapusPengumuman(Request $r, int $id)
    {
        $p = Pengumuman::findOrFail($id);
        abort_unless($r->user()->role === 'admin' || $p->penulis_id === $r->user()->id, 403);
        if ($p->lampiran_path) {
            Storage::delete($p->lampiran_path);
        }
        $p->delete();

        return redirect('/pengumuman')->with('ok', 'Pengumuman dihapus.');
    }

    // ── Notifikasi ──────────────────────────────────────────────────────
    public function notifikasi(Request $r)
    {
        return inertia('Shared/Notifikasi', ['items' => $r->user()->notifikasi()->take(60)->get()->map(fn($n) => [
            'id' => $n->id,
            'icon' => $n->icon,
            'tone' => $n->tone,
            'judul' => $n->judul,
            'teks' => $n->teks,
            'waktu' => $n->created_at->diffForHumans(),
            'baru' => ! $n->dibaca_at,
        ])]);
    }

    public function bukaNotifikasi(Request $r, int $id)
    {
        $n = Notifikasi::where('user_id', $r->user()->id)->findOrFail($id);
        $n->update(['dibaca_at' => $n->dibaca_at ?? now()]);

        return redirect($n->url && str_starts_with($n->url, '/') ? $n->url : '/notifikasi');
    }

    public function bacaSemua(Request $r)
    {
        Notifikasi::where('user_id', $r->user()->id)->whereNull('dibaca_at')->update(['dibaca_at' => now()]);

        return back()->with('ok', 'Semua notifikasi ditandai sudah dibaca.');
    }

    // ── Profil & akun ───────────────────────────────────────────────────
    public function profil(Request $r)
    {
        $u = $r->user()->load('kelas.program', 'kelas.wali', 'mengajar.mapel', 'mengajar.kelas');
        $tgl = fn($d) => $d ? Akademik::tgl($d, 'j F Y') : '—';
        $detail = match ($u->role) {
            'siswa' => [
                'NISN' => $u->nomor_induk,
                'Program' => $u->kelas ? $u->kelas->program->nama . ' (' . $u->kelas->program->setara . ')' : '—',
                'Kelas' => $u->kelas?->nama ?? '—',
                'Wali Kelas' => $u->kelas?->wali?->name ?? '—',
                'Jenis Kelamin' => $u->jenis_kelamin ?? '—',
                'Tanggal Lahir' => $tgl($u->tanggal_lahir),
                'Telepon' => $u->telepon ?? '—',
                'Alamat' => $u->alamat ?? '—',
                'Terdaftar Sejak' => Akademik::tgl($u->created_at, 'F Y')
            ],
            'tutor' => [
                'Nomor Induk' => $u->nomor_induk ?? '—',
                'Keterangan' => $u->jabatan ?? '—',
                'Mengampu' => $u->mengajar->pluck('mapel.nama')->unique()->join(', ') ?: '—',
                'Kelas Diampu' => $u->mengajar->pluck('kelas.nama')->unique()->join(', ') ?: '—',
                'Pendidikan' => $u->pendidikan ?? '—',
                'Telepon' => $u->telepon ?? '—',
                'Bergabung Sejak' => Akademik::tgl($u->created_at, 'F Y')
            ],
            default => ['Jabatan' => $u->jabatan ?? 'Administrator', 'Hak Akses' => 'Administrator penuh', 'Telepon' => $u->telepon ?? '—', 'Bergabung Sejak' => Akademik::tgl($u->created_at, 'F Y')],
        };
        $ringkas = match ($u->role) {
            'siswa' => [['Progres Belajar', Akademik::progres($u)[2] . '%'], ['Rata-rata Nilai', ($n = Akademik::rataSiswa($u)) !== null ? number_format($n, 1, ',', '') : '—'], ['Kehadiran', ($h = Akademik::persenHadir($u->id)) !== null ? $h . '%' : '—']],
            'tutor' => [['Kelas Diampu', $u->mengajar->pluck('kelas_id')->unique()->count()], ['Peserta Didik', User::siswa()->whereIn('kelas_id', $u->mengajar->pluck('kelas_id'))->count()], ['Materi', Materi::whereIn('pengajaran_id', $u->mengajar->pluck('id'))->count()]],
            default => [['Peserta Didik', User::siswa()->count()], ['Tutor', User::tutor()->count()], ['Kelas Aktif', Kelas::where('status', 'Aktif')->count()]],
        };

        return inertia('Shared/Profil', compact('detail', 'ringkas'));
    }

    public function profilEdit(Request $r)
    {
        return inertia('Shared/ProfilEdit', ['data' => $r->user()->only(['name', 'email', 'telepon', 'alamat', 'jenis_kelamin']) + ['tanggal_lahir' => $r->user()->tanggal_lahir?->toDateString()]]);
    }

    public function updateProfil(Request $r)
    {
        $u = $r->user();
        $d = $r->validate([
            'name' => [$u->role === 'siswa' ? 'nullable' : 'required', 'string', 'max:120'],
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($u)],
            'telepon' => 'nullable|max:30',
            'alamat' => 'nullable|max:500',
            'tanggal_lahir' => 'nullable|date|before:today',
            'jenis_kelamin' => 'nullable|in:Laki-laki,Perempuan',
            'foto' => 'nullable|image|max:2048',
        ]);
        if ($u->role === 'siswa') {
            unset($d['name']);
        } // nama peserta didik diubah oleh Tata Usaha sesuai dokumen resmi
        if ($f = Resources::simpanBerkas($d['foto'] ?? null, 'foto', $u->foto)) {
            $d['foto'] = $f['path'];
        } else {
            unset($d['foto']);
        }
        $u->update($d);

        return redirect('/profil')->with('ok', 'Profil berhasil diperbarui.');
    }

    public function akun(Request $r)
    {
        $agen = fn($ua) => (str_contains($ua, 'Android') ? 'Android' : (str_contains($ua, 'iPhone') ? 'iPhone' : (str_contains($ua, 'Windows') ? 'Windows' : (str_contains($ua, 'Mac') ? 'macOS' : 'Perangkat lain'))))
            . ' · ' . (str_contains($ua, 'Edg') ? 'Edge' : (str_contains($ua, 'Chrome') ? 'Chrome' : (str_contains($ua, 'Firefox') ? 'Firefox' : (str_contains($ua, 'Safari') ? 'Safari' : 'Peramban'))));

        return inertia('Shared/PengaturanAkun', ['sesi' => DB::table('sessions')->where('user_id', $r->user()->id)->orderByDesc('last_activity')->get()->map(fn($s) => [
            'perangkat' => $agen((string) $s->user_agent),
            'ip' => $s->ip_address,
            'waktu' => Carbon::createFromTimestamp($s->last_activity)->diffForHumans(),
            'kini' => $s->id === $r->session()->getId(),
        ])]);
    }

    public function updatePassword(Request $r)
    {
        $d = $r->validate(['current_password' => 'required|current_password', 'password' => 'required|string|min:8|confirmed'], ['current_password.current_password' => 'Kata sandi saat ini tidak sesuai.']);
        $r->user()->update(['password' => $d['password']]);
        Akademik::catat($r->user(), 'key', 'Mengganti kata sandi');

        return back()->with('ok', 'Kata sandi berhasil diperbarui.');
    }

    public function keluarPerangkatLain(Request $r)
    {
        $n = DB::table('sessions')->where('user_id', $r->user()->id)->where('id', '!=', $r->session()->getId())->delete();

        return back()->with('ok', "Berhasil keluar dari {$n} perangkat lain.");
    }

    public function riwayat(Request $r)
    {
        return inertia('Shared/Riwayat', ['groups' => Aktivitas::where('user_id', $r->user()->id)->where('created_at', '>=', now()->subDays(30))->latest()->take(150)->get()
            ->groupBy(fn($a) => $a->created_at->toDateString())->map(fn($g) => [
                'tanggal' => ($g[0]->created_at->isToday() ? 'Hari ini, ' : ($g[0]->created_at->isYesterday() ? 'Kemarin, ' : '')) . Akademik::tgl($g[0]->created_at, 'l, j F Y'),
                'items' => $g->map(fn($a) => ['icon' => $a->icon, 'teks' => $a->teks, 'waktu' => $a->created_at->format('H.i')])->values(),
            ])->values()]);
    }

    // ── Kelas & materi ──────────────────────────────────────────────────
    public function kelasDetail(Request $r, int $id)
    {
        $u = $r->user();
        $k = Kelas::with('program', 'wali')->findOrFail($id);
        abort_unless($u->role === 'admin' || ($u->role === 'siswa' && $u->kelas_id === $k->id) || ($u->role === 'tutor' && ($k->wali_id === $u->id || $k->pengajaran()->where('tutor_id', $u->id)->exists())), 403);
        $pengajaran = $k->pengajaran()->with('mapel', 'tutor')->get();
        $siswa = $k->siswa()->orderBy('name')->get();
        $tones = ['green', 'lime', 'mint'];
        $progresKelas = function ($pid = null) use ($siswa) {
            if ($siswa->isEmpty()) {
                return 0;
            }

            return (int) round($siswa->avg(fn($s) => Akademik::progres($s, $pid)[2]));
        };
        $pIds = $pengajaran->pluck('id');
        $aktivitas = Materi::with('pengajaran.tutor')->whereIn('pengajaran_id', $pIds)->terbit()->latest()->take(4)->get()->map(fn($m) => ['icon' => 'library_add', 'teks' => "{$m->pengajaran->tutor->name} menambahkan materi “{$m->judul}”", 't' => $m->created_at])
            ->concat(Tugas::whereIn('pengajaran_id', $pIds)->latest()->take(4)->get()->map(fn($t) => ['icon' => 'assignment', 'teks' => "Tugas baru: {$t->judul}", 't' => $t->created_at]))
            ->concat(Ujian::whereIn('pengajaran_id', $pIds)->latest()->take(3)->get()->map(fn($x) => ['icon' => 'quiz', 'teks' => "Ujian dijadwalkan: {$x->judul}", 't' => $x->created_at]))
            ->sortByDesc('t')->take(6)->map(fn($x) => ['icon' => $x['icon'], 'teks' => $x['teks'], 'waktu' => $x['t']->diffForHumans()])->values();
        $acuan = $u->role === 'siswa' ? $u : null;

        return inertia('Shared/KelasDetail', [
            'kelas' => [
                'id' => $k->id,
                'nama' => $k->nama,
                'program' => $k->program->nama,
                'setara' => $k->program->setara,
                'tingkat' => $k->tingkat ?? '',
                'wali' => $k->wali?->name ?? '—',
                'siswa' => $siswa->count(),
                'mapel' => $pengajaran->count(),
                'jadwal' => $k->jadwal ?? '—',
                'progres' => $acuan ? Akademik::progres($acuan)[2] : $progresKelas(),
                'deskripsi' => "Rombongan belajar {$k->program->nama} {$k->program->setara} dengan tutorial tatap muka terjadwal dan pembelajaran daring mandiri melalui PKBM BHP."
            ],
            'mapel' => $pengajaran->values()->map(fn($p, $i) => [
                'id' => $p->id,
                'nama' => $p->mapel->nama,
                'tutor' => $p->tutor->name,
                'icon' => $p->mapel->icon,
                'tone' => $tones[$i % 3],
                'progres' => $acuan ? Akademik::progres($acuan, $p->id)[2] : $progresKelas($p->id)
            ]),
            'modul' => SiswaController::modulMateri($u, $k->id),
            'bisaRapor' => $u->role === 'admin' || $k->wali_id === $u->id,
            'peserta' => $siswa->map(fn($s) => ['id' => $s->id, 'nama' => $s->name, 'nisn' => $s->nomor_induk, 'progres' => $u->role === 'siswa' ? null : Akademik::progres($s)[2]]),
            'aktivitas' => $aktivitas,
        ]);
    }

    private static function embedYoutube(?string $url): ?string
    {
        if (! $url || ! preg_match('~(?:youtube\.com/(?:watch\?v=|embed/|shorts/|live/)|youtu\.be/)([\w-]{11})~', $url, $m)) {
            return null;
        }

        return 'https://www.youtube-nocookie.com/embed/' . $m[1];
    }

    public function materiDetail(Request $r, int $id)
    {
        $u = $r->user();
        $m = Materi::with('pengajaran.mapel', 'pengajaran.tutor', 'pengajaran.kelas.program')->findOrFail($id);
        abort_unless($this->boleh($u, $m->pengajaran) && ($u->role !== 'siswa' || $m->status === 'Terbit'), 403);
        $selesai = $u->role === 'siswa' ? DB::table('materi_selesai')->where('user_id', $u->id)->pluck('materi_id')->flip() : collect();
        $urutan = Materi::where('pengajaran_id', $m->pengajaran_id)->when($u->role === 'siswa', fn($q) => $q->terbit())->orderBy('modul')->orderBy('urutan')->orderBy('id')->get(['id', 'judul', 'modul', 'tipe', 'durasi', 'urutan']);
        $pos = $urutan->search(fn($x) => $x->id === $m->id);
        $item = fn($x) => $x ? ['id' => $x->id, 'judul' => $x->judul] : null;
        if ($u->role === 'siswa' && ! Aktivitas::where('user_id', $u->id)->where('teks', "Membuka materi “{$m->judul}”")->where('created_at', '>', now()->subMinutes(30))->exists()) {
            Akademik::catat($u, 'play_circle', "Membuka materi “{$m->judul}”");
        }
        $komentar = Diskusi::with(['user', 'balasan.user'])->where('materi_id', $m->id)->whereNull('parent_id')->latest()->get();
        $pesan = fn($d) => ['id' => $d->id, 'nama' => $d->user->name, 'tutor' => $d->user->role === 'tutor', 'waktu' => $d->created_at->diffForHumans(), 'teks' => $d->isi];

        return inertia('Shared/MateriDetail', [
            'materi' => [
                'id' => $m->id,
                'judul' => $m->judul,
                'mapel' => $m->pengajaran->mapel->nama,
                'modul' => $m->modul,
                'tutor' => $m->pengajaran->tutor->name,
                'tipe' => $m->tipe,
                'kelas' => $m->pengajaran->kelas->program->nama . ' · ' . $m->pengajaran->kelas->nama,
                'durasi' => $m->durasi ? $m->durasi . ' menit' : null,
                'deskripsi' => $m->deskripsi,
                'konten' => $m->konten,
                'status' => $u->role === 'siswa' ? ($selesai->has($m->id) ? 'selesai' : 'belum') : $m->status,
                'video' => $m->video_url ? ['url' => $m->video_url, 'embed' => self::embedYoutube($m->video_url)] : null,
                'file' => $m->file_path ? [
                    'nama' => $m->file_nama,
                    'url' => '/berkas/materi/' . $m->id,
                    'pdf' => str_ends_with(strtolower($m->file_path), '.pdf'),
                    'ukuran' => Storage::exists($m->file_path) ? max(1, round(Storage::size($m->file_path) / 1024)) . ' KB' : null
                ] : null,
                'bisaUbah' => $u->role === 'admin' || $m->pengajaran->tutor_id === $u->id
            ],
            'daftar' => $urutan->where('modul', $m->modul)->values()->map(fn($x) => [
                'id' => $x->id,
                'judul' => $x->judul,
                'tipe' => $x->tipe,
                'durasi' => $x->durasi ? $x->durasi . ' menit' : '—',
                'status' => $selesai->has($x->id) ? 'selesai' : ($x->id === $m->id ? 'sedang' : 'belum')
            ]),
            'sebelumnya' => $item($pos > 0 ? $urutan[$pos - 1] : null),
            'berikutnya' => $item($urutan[$pos + 1] ?? null),
            'komentar' => $komentar->map(fn($d) => $pesan($d) + ['balasan' => $d->balasan->map($pesan)->values()]),
        ]);
    }

    public function selesaiMateri(Request $r, int $id)
    {
        $m = Materi::with('pengajaran')->findOrFail($id);
        abort_unless($r->user()->role === 'siswa' && $this->boleh($r->user(), $m->pengajaran), 403);
        $sudah = $r->user()->materiSelesai()->where('materi_id', $m->id)->exists();
        $sudah ? $r->user()->materiSelesai()->detach($m->id) : $r->user()->materiSelesai()->attach($m->id, ['created_at' => now()]);
        if (! $sudah) {
            Akademik::catat($r->user(), 'task_alt', "Menyelesaikan materi “{$m->judul}”");
        }

        return back()->with('ok', $sudah ? 'Tanda selesai dibatalkan.' : 'Materi ditandai selesai. Progres belajarmu diperbarui.');
    }

    public function komentar(Request $r, int $id)
    {
        $m = Materi::with('pengajaran')->findOrFail($id);
        abort_unless($this->boleh($r->user(), $m->pengajaran), 403);
        $d = $r->validate(['isi' => 'required|string|max:3000', 'parent_id' => ['nullable', Rule::exists('diskusi', 'id')->where('materi_id', $m->id)]]);
        Diskusi::create($d + ['user_id' => $r->user()->id, 'materi_id' => $m->id]);
        $tujuan = $d['parent_id'] ?? null ? Diskusi::find($d['parent_id'])->user_id : $m->pengajaran->tutor_id;
        if ($tujuan !== $r->user()->id) {
            Akademik::kirim([$tujuan], 'forum', 'primary', 'Komentar baru', "{$r->user()->name} di materi “{$m->judul}”", '/materi/' . $m->id);
        }

        return back()->with('ok', 'Komentar berhasil dikirim.');
    }

    // ── Forum diskusi ───────────────────────────────────────────────────
    public function diskusi(Request $r)
    {
        $pIds = $r->user()->pengajaranQuery()->pluck('id');
        $pesan = fn($d) => ['nama' => $d->user->name, 'tutor' => $d->user->role === 'tutor', 'waktu' => $d->created_at->diffForHumans(), 'teks' => $d->isi];

        return inertia('Shared/Diskusi', [
            'topik' => Diskusi::with(['user', 'pengajaran.mapel', 'pengajaran.kelas', 'balasan.user'])->whereNull('parent_id')->whereNull('materi_id')->whereIn('pengajaran_id', $pIds)->latest()->get()->map(fn($d) => [
                'id' => $d->id,
                'judul' => $d->judul,
                'mapel' => $d->pengajaran->mapel->nama,
                'kelas' => $d->pengajaran->kelas->nama,
                'penulis' => $d->user->name,
                'waktu' => $d->created_at->diffForHumans(),
                'balasan' => $d->balasan->count(),
                'status' => $d->balasan->contains(fn($b) => $b->user->role === 'tutor') ? 'Terjawab' : 'Belum Dijawab',
                'isi' => $d->isi,
                'pesan' => $d->balasan->map($pesan)->values(),
            ]),
            'pengajaran' => $r->user()->pengajaranQuery()->with('mapel', 'kelas')->get()->map(fn($p) => [$p->id, $p->mapel->nama . ' — ' . $p->kelas->nama]),
        ]);
    }

    public function simpanTopik(Request $r)
    {
        $pIds = $r->user()->pengajaranQuery()->pluck('id')->all();
        $d = $r->validate(['pengajaran_id' => ['required', Rule::in($pIds)], 'judul' => 'required|max:160', 'isi' => 'required|max:5000']);
        $t = Diskusi::create($d + ['user_id' => $r->user()->id]);
        $p = Pengajaran::find($d['pengajaran_id']);
        if ($p->tutor_id !== $r->user()->id) {
            Akademik::kirim([$p->tutor_id], 'forum', 'primary', 'Pertanyaan baru di forum', "{$r->user()->name}: {$t->judul}", '/diskusi');
        }

        return back()->with('ok', 'Topik diskusi berhasil dibuat.');
    }

    public function balasTopik(Request $r, int $id)
    {
        $t = Diskusi::with('pengajaran')->whereNull('parent_id')->whereNotNull('pengajaran_id')->findOrFail($id);
        abort_unless($this->boleh($r->user(), $t->pengajaran), 403);
        $d = $r->validate(['isi' => 'required|string|max:3000']);
        Diskusi::create(['user_id' => $r->user()->id, 'parent_id' => $t->id, 'pengajaran_id' => $t->pengajaran_id, 'isi' => $d['isi']]);
        $penerima = collect([$t->user_id, $t->pengajaran->tutor_id])->reject(fn($id) => $id === $r->user()->id);
        Akademik::kirim($penerima, 'forum', 'primary', 'Balasan diskusi baru', "{$r->user()->name} membalas “{$t->judul}”", '/diskusi');

        return back()->with('ok', 'Balasan terkirim.');
    }

    // ── Jadwal ──────────────────────────────────────────────────────────
    public function jadwal(Request $r)
    {
        $u = $r->user();
        $pengajaran = $u->pengajaranQuery()->with('mapel', 'kelas', 'tutor')->whereNotNull('hari')->orderBy('jam_mulai')->get();
        $senin = now()->startOfWeek();
        $bulan = now()->startOfMonth();
        $pIds = $u->pengajaranQuery()->pluck('id');
        $ujian = Ujian::with('pengajaran.mapel')->withCount('soal')->whereIn('pengajaran_id', $pIds)->where('selesai', '>', now())->orderBy('mulai')->get();
        $tugas = Tugas::whereIn('pengajaran_id', $pIds)->whereBetween('tenggat', [now(), now()->addDays(30)])->orderBy('tenggat')->get();
        $agenda = $ujian->filter(fn($x) => $x->mulai->lte(now()->addDays(30)))->map(fn($x) => ['t' => $x->mulai, 'judul' => $x->judul, 'jenis' => 'Ujian'])
            ->concat($tugas->map(fn($t) => ['t' => $t->tenggat, 'judul' => 'Tenggat: ' . $t->judul, 'jenis' => 'Tugas']))->sortBy('t')->values();

        return inertia('Shared/Jadwal', [
            'sesi' => $pengajaran->map(fn($p) => [
                'hari' => $p->hari,
                'jam' => Akademik::jam($p->jam_mulai, $p->jam_selesai),
                'judul' => $p->mapel->nama,
                'kelas' => $u->role === 'siswa' ? $p->tutor->name : $p->kelas->nama . ($u->role === 'admin' ? ' · ' . $p->tutor->name : ''),
                'tempat' => $p->tempat ?? '—',
                'mode' => $p->mode
            ]),
            'hariIni' => now()->dayOfWeekIso - 1,
            'minggu' => ['label' => Akademik::tgl($senin, 'j') . '–' . Akademik::tgl($senin->copy()->addDays(6), 'j F Y'), 'tanggal' => collect(range(0, 6))->map(fn($i) => $senin->copy()->addDays($i)->day)],
            'ujian' => $ujian->take(5)->map(fn($x) => ['id' => $x->id, 'judul' => $x->judul, 'jadwal' => Akademik::tgl($x->mulai, 'D, j M Y · H.i'), 'durasi' => $x->durasi, 'soal' => $x->soal_count]),
            'agenda' => $agenda->take(8)->map(fn($a) => ['tgl' => $a['t']->day, 'bulan' => strtoupper($a['t']->translatedFormat('M')), 'judul' => $a['judul'], 'jenis' => $a['jenis']]),
            'kalender' => [
                'label' => $bulan->translatedFormat('F Y'),
                'offset' => $bulan->dayOfWeekIso - 1,
                'hari' => $bulan->daysInMonth,
                'hariIni' => now()->day,
                'tanda' => (object) $agenda->filter(fn($a) => $a['t']->isSameMonth($bulan))->mapWithKeys(fn($a) => [$a['t']->day => $a['jenis']])->all()
            ],
        ]);
    }

    // ── Rapor (halaman cetak / PDF) ─────────────────────────────────────
    public function rapor(Request $r, int $id)
    {
        $u = $r->user();
        $s = User::siswa()->with('kelas.program', 'kelas.wali')->findOrFail($id);
        abort_unless($u->role === 'admin' || $u->id === $s->id || ($u->role === 'tutor' && $s->kelas?->wali_id === $u->id), 403);
        $kkm = (int) Akademik::pengaturan('kkm');
        $nilai = Akademik::nilaiSiswa($s);
        $f = fn($v) => $v === null ? '—' : number_format($v, 1, ',', '');
        $ada = $nilai->pluck('akhir')->filter(fn($v) => $v !== null);
        $hadir = DB::table('presensi')->where('siswa_id', $s->id)->groupBy('status')->selectRaw('status, count(*) n')->pluck('n', 'status');
        $periode = 'Semester ' . Akademik::pengaturan('semester') . ' Tahun Ajaran ' . Akademik::pengaturan('tahun_ajaran');

        return view('cetak', [
            'judul' => 'Laporan Hasil Belajar Peserta Didik',
            'subjudul' => $periode,
            'info' => [
                'Nama' => $s->name,
                'NISN' => $s->nomor_induk,
                'Program' => $s->kelas ? $s->kelas->program->nama . ' (' . $s->kelas->program->setara . ')' : '—',
                'Kelas' => $s->kelas?->nama ?? '—',
                'Wali Kelas' => $s->kelas?->wali?->name ?? '—',
                'Periode' => $periode
            ],
            'kolom' => ['Mata Pelajaran', 'Tutor', 'Rata-rata Tugas', 'Rata-rata Ujian', 'Nilai Akhir', 'Predikat', 'Keterangan'],
            'baris' => $nilai->map(fn($n) => [
                $n['mapel'],
                $n['tutor'],
                $f($n['tugas']),
                $f($n['ujian']),
                $f($n['akhir']),
                $n['akhir'] === null ? '—' : ($n['akhir'] >= 90 ? 'A' : ($n['akhir'] >= 80 ? 'B' : ($n['akhir'] >= $kkm ? 'C' : 'D'))),
                $n['akhir'] === null ? 'Belum ada nilai' : ($n['akhir'] >= $kkm ? 'Tuntas' : 'Belum tuntas')
            ])->all(),
            'ringkas' => [
                'Rata-rata nilai akhir' => $ada->isEmpty() ? '—' : $f($ada->avg()),
                'KKM' => $kkm,
                'Progres belajar' => Akademik::progres($s)[2] . '%',
                'Hadir' => $hadir['Hadir'] ?? 0,
                'Izin' => $hadir['Izin'] ?? 0,
                'Sakit' => $hadir['Sakit'] ?? 0,
                'Alpa' => $hadir['Alpa'] ?? 0
            ],
            'ttd' => [['Mengetahui,', 'Kepala ' . Akademik::pengaturan('nama_lembaga'), Akademik::pengaturan('kepala')], ['Wali Kelas,', $s->kelas?->nama ?? '', $s->kelas?->wali?->name]],
        ]);
    }

    // ── Berkas (privat, dicek hak aksesnya) ─────────────────────────────
    public function berkas(Request $r, string $jenis, int $id)
    {
        $u = $r->user();
        [$path, $nama] = match ($jenis) {
            'materi' => (fn($m) => $this->boleh($u, $m->pengajaran) ? [$m->file_path, $m->file_nama] : abort(403))(Materi::with('pengajaran')->findOrFail($id)),
            'tugas' => (fn($t) => $this->boleh($u, $t->pengajaran) ? [$t->lampiran_path, $t->lampiran_nama] : abort(403))(Tugas::with('pengajaran')->findOrFail($id)),
            'pengumpulan' => (fn($p) => $u->role === 'admin' || $p->siswa_id === $u->id || $p->tugas->pengajaran->tutor_id === $u->id ? [$p->file_path, $p->file_nama] : abort(403))(Pengumpulan::with('tugas.pengajaran')->findOrFail($id)),
            'pengumuman' => (fn($p) => [$p->lampiran_path, $p->lampiran_nama])(Pengumuman::untuk($u->role)->findOrFail($id)),
            'foto' => [User::findOrFail($id)->foto, 'foto.jpg'],
            default => abort(404),
        };
        abort_unless($path && Storage::exists($path), 404, 'Berkas tidak ditemukan.');

        return $r->boolean('unduh') ? Storage::download($path, $nama) : Storage::response($path, $nama, ['Cache-Control' => 'private, max-age=3600']);
    }
}
