<?php

namespace App\Support;

use App\Models\HasilUjian;
use App\Models\Kelas;
use App\Models\Mapel;
use App\Models\Materi;
use App\Models\Pengajaran;
use App\Models\Pengumpulan;
use App\Models\Program;
use App\Models\Sesi;
use App\Models\Soal;
use App\Models\Tugas;
use App\Models\Ujian;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Definisi halaman data (tabel + formulir) untuk admin & tutor.
 * Tiap definisi: title, desc, icon, add, noun, query, stats, filters, columns, row, form, rules, save, can, prepare (opsional).
 * Query sudah dibatasi sesuai peran, sehingga update/hapus hanya bisa menyentuh data milik sendiri.
 */
class Resources
{
    const ADMIN = ['peserta-didik', 'tutor', 'program', 'mapel', 'kelas', 'pengajaran', 'materi', 'tugas', 'ujian', 'bank-soal', 'nilai', 'kehadiran'];
    const TUTOR = ['peserta-didik', 'materi', 'tugas', 'ujian', 'bank-soal', 'kehadiran'];
    const STATUS_SISWA = ['Aktif', 'Perlu Pendampingan', 'Nonaktif'];
    const IKON_MAPEL = [['menu_book', 'Buku'], ['calculate', 'Kalkulator'], ['translate', 'Bahasa'], ['balance', 'Timbangan'], ['science', 'Sains'], ['public', 'Globe'], ['volunteer_activism', 'Kepedulian'], ['palette', 'Seni'], ['computer', 'Komputer'], ['construction', 'Keterampilan']];

    // ── Helper sel tabel ────────────────────────────────────────────────
    public static function u(string $name, ?string $sub = null): array { return ['user' => $name, 'sub' => $sub]; }
    public static function b(string $text, string $tone = 'neutral'): array { return ['badge' => $text, 'tone' => $tone]; }
    public static function t(string $text, ?string $sub = null): array { return ['text' => $text, 'sub' => $sub]; }
    public static function p(int $value): array { return ['progress' => max(0, min(100, $value))]; }
    public static function paket(?string $p): array { return self::b($p ?? '—', ['Paket A' => 'lime', 'Paket B' => 'soft', 'Paket C' => 'primary'][$p] ?? 'neutral'); }

    public static function status(string $s): array
    {
        return self::b($s, match ($s) {
            'Aktif', 'Terbit', 'Tuntas', 'Selesai', 'Tercatat', 'Berlangsung' => 'success',
            'Cuti', 'Draf', 'Perlu Pendampingan', 'Belum Diisi', 'Terjadwal' => 'warning',
            'Nonaktif', 'Belum Tuntas' => 'danger',
            default => 'neutral',
        });
    }

    /** Simpan berkas unggahan ke disk privat, hapus berkas lama. */
    public static function simpanBerkas(?UploadedFile $file, string $folder, ?string $lama = null): ?array
    {
        if (! $file) return null;
        if ($lama) Storage::delete($lama);

        return ['path' => $file->store($folder), 'nama' => $file->getClientOriginalName()];
    }

    private static function opsiPengajaran(User $u): array
    {
        return $u->pengajaranQuery()->with('mapel', 'kelas.program')->get()
            ->sortBy(fn ($p) => $p->kelas->program->nama.$p->kelas->nama.$p->mapel->nama)
            ->map(fn ($p) => [$p->id, $p->mapel->nama.' — '.$p->kelas->program->nama.' '.$p->kelas->nama])->values()->all();
    }

    private static function opsiKelas(): array
    {
        return Kelas::with('program')->get()->map(fn ($k) => [$k->id, $k->program->nama.' — '.$k->nama])->all();
    }

    private static function siswaKelas(int $kelasId): Collection
    {
        return User::siswa()->where('kelas_id', $kelasId)->where('status', '!=', 'Nonaktif')->pluck('id');
    }

    /** Statistik bersama untuk tabel siswa: progres & kehadiran (sekali query, bukan per baris). */
    private static function statistikSiswa(): array
    {
        $totalPerKelas = Materi::terbit()->join('pengajaran', 'pengajaran.id', '=', 'materi.pengajaran_id')->groupBy('kelas_id')->selectRaw('kelas_id, count(*) n')->pluck('n', 'kelas_id');
        $selesai = DB::table('materi_selesai')->join('materi', 'materi.id', '=', 'materi_selesai.materi_id')->where('materi.status', 'Terbit')->groupBy('user_id')->selectRaw('user_id, count(*) n')->pluck('n', 'user_id');
        $hadir = DB::table('presensi')->groupBy('siswa_id')->selectRaw("siswa_id, count(*) total, sum(case when status = 'Hadir' then 1 else 0 end) hadir")->get()->keyBy('siswa_id');

        return compact('totalPerKelas', 'selesai', 'hadir');
    }

    private static function progresDari(array $ctx, User $s): int
    {
        $total = $ctx['totalPerKelas'][$s->kelas_id] ?? 0;

        return $total ? (int) round(($ctx['selesai'][$s->id] ?? 0) / $total * 100) : 0;
    }

    private static function hadirDari(array $ctx, int $id): ?int
    {
        $h = $ctx['hadir'][$id] ?? null;

        return $h && $h->total ? (int) round($h->hadir / $h->total * 100) : null;
    }

    public static function make(string $key, User $user): array
    {
        $tutor = $user->role === 'tutor';
        $mapelOpt = Mapel::with('program')->orderBy('program_id')->get()->map(fn ($m) => [$m->id, $m->nama.' ('.$m->program->nama.')'])->all();
        $programFilter = ['Semua Program', 'Paket A', 'Paket B', 'Paket C'];

        return match ($key) {
            // ── Peserta didik ───────────────────────────────────────────
            'peserta-didik' => [
                'title' => $tutor ? 'Peserta Didik' : 'Data Peserta Didik', 'icon' => 'groups', 'noun' => 'Data peserta didik',
                'desc' => $tutor ? 'Peserta didik pada kelas yang Anda ampu beserta perkembangan belajarnya.' : 'Kelola data peserta didik seluruh program kesetaraan. Username login = NISN.',
                'add' => $tutor ? null : 'Tambah Peserta Didik', 'edit' => ! $tutor,
                'query' => fn () => User::siswa()->with('kelas.program')->orderBy('name')
                    ->when($tutor, fn ($q) => $q->whereIn('kelas_id', $user->mengajar()->select('kelas_id'))),
                'prepare' => fn () => self::statistikSiswa(),
                'stats' => fn ($items, $ctx) => [
                    ['Total Peserta Didik', $items->count(), 'groups'], ['Aktif', $items->where('status', 'Aktif')->count(), 'how_to_reg'],
                    ['Perlu Pendampingan', $items->where('status', 'Perlu Pendampingan')->count(), 'support'],
                    ['Rata-rata Kehadiran', ($v = $items->map(fn ($s) => self::hadirDari($ctx, $s->id))->filter(fn ($v) => $v !== null)->avg()) !== null ? round($v).'%' : '—', 'event_available'],
                ],
                'filters' => [$programFilter, ['Semua Status', ...self::STATUS_SISWA]],
                'columns' => [['nama', 'Peserta Didik'], ['program', 'Program'], ['kelas', 'Kelas'], ['progres', 'Progres Belajar'], ['hadir', 'Kehadiran'], ['status', 'Status']],
                'row' => fn (User $s, $ctx) => [
                    'nama' => self::u($s->name, 'NISN '.$s->nomor_induk), 'program' => self::paket($s->kelas?->program?->nama), 'kelas' => $s->kelas?->nama ?? '—',
                    'progres' => self::p(self::progresDari($ctx, $s)), 'hadir' => ($h = self::hadirDari($ctx, $s->id)) !== null ? $h.'%' : '—', 'status' => self::status($s->status),
                    '_values' => ['name' => $s->name, 'nomor_induk' => $s->nomor_induk, 'email' => $s->email, 'kelas_id' => $s->kelas_id, 'jenis_kelamin' => $s->jenis_kelamin, 'tanggal_lahir' => $s->tanggal_lahir?->toDateString(), 'telepon' => $s->telepon, 'alamat' => $s->alamat, 'status' => $s->status],
                ],
                'form' => [['name', 'Nama Lengkap', 'text'], ['nomor_induk', 'NISN', 'text'], ['kelas_id', 'Kelas', 'select', self::opsiKelas()], ['email', 'Email (opsional)', 'email'],
                    ['jenis_kelamin', 'Jenis Kelamin', 'select', ['Laki-laki', 'Perempuan']], ['tanggal_lahir', 'Tanggal Lahir (opsional)', 'date'], ['telepon', 'Nomor Telepon (opsional)', 'tel'],
                    ['status', 'Status', 'select', self::STATUS_SISWA], ['password', 'Kata Sandi (opsional, kosong = NISN)', 'password'], ['alamat', 'Alamat (opsional)', 'textarea']],
                'rules' => fn ($m) => ['name' => 'required|string|max:120', 'nomor_induk' => ['required', 'string', 'max:20', Rule::unique('users', 'username')->ignore($m)], 'kelas_id' => 'required|exists:kelas,id',
                    'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($m)], 'jenis_kelamin' => 'required|in:Laki-laki,Perempuan', 'tanggal_lahir' => 'nullable|date',
                    'telepon' => 'nullable|string|max:30', 'status' => ['required', Rule::in(self::STATUS_SISWA)], 'password' => 'nullable|string|min:6', 'alamat' => 'nullable|string|max:500'],
                'save' => function (array $d, ?User $m) {
                    $d['username'] = $d['nomor_induk'];
                    if (empty($d['password'])) {
                        if ($m) {
                            unset($d['password']);
                        } else {
                            $d['password'] = $d['nomor_induk']; // kata sandi awal = NISN, sarankan diganti
                        }
                    }

                    return $m ? tap($m)->update($d) : User::create($d + ['role' => 'siswa']);
                },
            ],

            // ── Tutor ──────────────────────────────────────────────────
            'tutor' => [
                'title' => 'Data Tutor', 'desc' => 'Kelola tutor, mata pelajaran yang diampu, dan status keaktifan.', 'icon' => 'co_present', 'add' => 'Tambah Tutor', 'noun' => 'Data tutor',
                'query' => fn () => User::tutor()->with('mengajar.mapel')->orderBy('name'),
                'stats' => fn ($items) => [['Total Tutor', $items->count(), 'co_present'], ['Aktif Mengajar', $items->where('status', 'Aktif')->count(), 'how_to_reg'],
                    ['Rasio Tutor : Peserta', '1 : '.max(1, round(User::siswa()->count() / max(1, $items->count()))), 'diversity_3'], ['Materi Diterbitkan', Materi::terbit()->count(), 'library_books']],
                'filters' => [['Semua Status', 'Aktif', 'Cuti', 'Nonaktif']],
                'columns' => [['nama', 'Tutor'], ['mapel', 'Mengampu'], ['kelas', 'Kelas'], ['telepon', 'Kontak'], ['status', 'Status']],
                'row' => fn (User $t) => [
                    'nama' => self::u($t->name, $t->nomor_induk), 'mapel' => self::t($t->mengajar->pluck('mapel.nama')->unique()->join(', ') ?: '—', $t->jabatan),
                    'kelas' => $t->mengajar->pluck('kelas_id')->unique()->count().' kelas', 'telepon' => $t->telepon ?? '—', 'status' => self::status($t->status),
                    '_values' => $t->only(['name', 'nomor_induk', 'username', 'email', 'jabatan', 'pendidikan', 'telepon', 'status']),
                ],
                'form' => [['name', 'Nama Lengkap & Gelar', 'text'], ['nomor_induk', 'Nomor Induk Tutor', 'text'], ['username', 'Username Login', 'text'], ['email', 'Email', 'email'],
                    ['jabatan', 'Keterangan (mis. Tutor Matematika)', 'text'], ['pendidikan', 'Pendidikan Terakhir (opsional)', 'text'], ['telepon', 'Nomor Telepon (opsional)', 'tel'],
                    ['status', 'Status', 'select', ['Aktif', 'Cuti', 'Nonaktif']], ['password', 'Kata Sandi (kosongkan bila tidak diubah)', 'password']],
                'rules' => fn ($m) => ['name' => 'required|string|max:120', 'nomor_induk' => 'nullable|string|max:30', 'username' => ['required', 'alpha_dash', 'max:40', Rule::unique('users')->ignore($m)],
                    'email' => ['required', 'email', Rule::unique('users')->ignore($m)], 'jabatan' => 'nullable|string|max:80', 'pendidikan' => 'nullable|string|max:80', 'telepon' => 'nullable|string|max:30',
                    'status' => 'required|in:Aktif,Cuti,Nonaktif', 'password' => [$m ? 'nullable' : 'required', 'string', 'min:8']],
                'save' => function (array $d, ?User $m) {
                    if (empty($d['password'])) unset($d['password']);

                    return $m ? tap($m)->update($d) : User::create($d + ['role' => 'tutor']);
                },
            ],

            // ── Program ────────────────────────────────────────────────
            'program' => [
                'title' => 'Program Pendidikan', 'desc' => 'Program pendidikan kesetaraan yang diselenggarakan lembaga.', 'icon' => 'school', 'add' => 'Tambah Program', 'noun' => 'Program',
                'query' => fn () => Program::withCount(['kelas', 'mapel'])->orderBy('nama'),
                'prepare' => fn () => ['siswa' => User::siswa()->join('kelas', 'kelas.id', '=', 'users.kelas_id')->groupBy('kelas.program_id')->selectRaw('kelas.program_id, count(*) n')->pluck('n', 'program_id')],
                'stats' => fn ($items, $ctx) => [['Program', $items->count(), 'school'], ['Total Kelas', $items->sum('kelas_count'), 'meeting_room'], ['Total Peserta Didik', $ctx['siswa']->sum(), 'groups']],
                'filters' => [],
                'columns' => [['program', 'Program'], ['setara', 'Kesetaraan'], ['kelas', 'Kelas'], ['siswa', 'Peserta Didik'], ['mapel', 'Mata Pelajaran']],
                'row' => fn (Program $p, $ctx) => ['program' => self::u($p->nama, $p->tingkat), 'setara' => $p->setara, 'kelas' => $p->kelas_count.' kelas', 'siswa' => (string) ($ctx['siswa'][$p->id] ?? 0), 'mapel' => $p->mapel_count.' mapel',
                    '_values' => $p->only(['nama', 'setara', 'tingkat', 'deskripsi'])],
                'form' => [['nama', 'Nama Program', 'text'], ['setara', 'Kesetaraan', 'text'], ['tingkat', 'Tingkatan (opsional)', 'text'], ['deskripsi', 'Deskripsi (opsional)', 'textarea']],
                'rules' => fn ($m) => ['nama' => ['required', 'max:60', Rule::unique('program')->ignore($m)], 'setara' => 'required|max:80', 'tingkat' => 'nullable|max:60', 'deskripsi' => 'nullable|max:1000'],
                'save' => fn ($d, $m) => $m ? tap($m)->update($d) : Program::create($d),
            ],

            // ── Mata pelajaran ─────────────────────────────────────────
            'mapel' => [
                'title' => 'Mata Pelajaran', 'desc' => 'Daftar mata pelajaran per program beserta tutor pengampu.', 'icon' => 'menu_book', 'add' => 'Tambah Mata Pelajaran', 'noun' => 'Mata pelajaran',
                'query' => fn () => Mapel::with(['program', 'pengajaran.tutor'])->withCount('soal')->orderBy('program_id')->orderBy('nama'),
                'stats' => fn ($items) => [['Total Mata Pelajaran', $items->count(), 'menu_book'], ['Soal di Bank Soal', $items->sum('soal_count'), 'inventory_2'], ['Pengampu Aktif', $items->flatMap->pengajaran->pluck('tutor_id')->unique()->count(), 'co_present']],
                'filters' => [$programFilter],
                'columns' => [['nama', 'Mata Pelajaran'], ['program', 'Program'], ['tutor', 'Tutor Pengampu'], ['kelas', 'Kelas']],
                'row' => fn (Mapel $m) => ['nama' => self::u($m->nama, $m->kode), 'program' => self::paket($m->program->nama), 'tutor' => $m->pengajaran->pluck('tutor.name')->unique()->join(', ') ?: '—',
                    'kelas' => $m->pengajaran->count().' kelas', '_values' => $m->only(['nama', 'kode', 'program_id', 'icon', 'deskripsi'])],
                'form' => [['nama', 'Nama Mata Pelajaran', 'text'], ['kode', 'Kode (opsional)', 'text'], ['program_id', 'Program', 'select', Program::orderBy('nama')->get()->map(fn ($p) => [$p->id, $p->nama])->all()],
                    ['icon', 'Ikon', 'select', self::IKON_MAPEL], ['deskripsi', 'Deskripsi Singkat (opsional)', 'textarea']],
                'rules' => fn ($m) => ['nama' => 'required|max:80', 'kode' => 'nullable|max:20', 'program_id' => 'required|exists:program,id', 'icon' => ['required', Rule::in(array_column(self::IKON_MAPEL, 0))], 'deskripsi' => 'nullable|max:500'],
                'save' => fn ($d, $m) => $m ? tap($m)->update($d) : Mapel::create($d),
            ],

            // ── Kelas ──────────────────────────────────────────────────
            'kelas' => [
                'title' => 'Data Kelas', 'desc' => 'Rombongan belajar aktif, wali kelas, dan capaian pembelajarannya.', 'icon' => 'meeting_room', 'add' => 'Buat Kelas', 'noun' => 'Kelas',
                'query' => fn () => Kelas::with(['program', 'wali'])->withCount('siswa')->orderBy('program_id')->orderBy('nama'),
                'prepare' => fn () => self::statistikSiswa() + ['anggota' => User::siswa()->get(['id', 'kelas_id'])->groupBy('kelas_id')],
                'stats' => fn ($items) => [['Kelas Aktif', $items->where('status', 'Aktif')->count(), 'meeting_room'], ['Rata-rata Peserta', round($items->avg('siswa_count') ?? 0).' / kelas', 'groups'], ['Total Peserta', $items->sum('siswa_count'), 'school']],
                'filters' => [$programFilter, ['Semua Status', 'Aktif', 'Nonaktif']],
                'columns' => [['nama', 'Kelas'], ['program', 'Program'], ['wali', 'Wali Kelas'], ['siswa', 'Peserta'], ['progres', 'Progres Kelas'], ['status', 'Status']],
                'row' => function (Kelas $k, $ctx) {
                    $anggota = $ctx['anggota'][$k->id] ?? collect();
                    $total = $ctx['totalPerKelas'][$k->id] ?? 0;
                    $prog = $total && $anggota->count() ? (int) round($anggota->sum(fn ($s) => $ctx['selesai'][$s->id] ?? 0) / ($total * $anggota->count()) * 100) : 0;

                    return ['nama' => self::u($k->nama, trim($k->tingkat.' · '.$k->ruang, ' ·')), 'program' => self::paket($k->program->nama), 'wali' => $k->wali?->name ?? '—', 'siswa' => $k->siswa_count.' siswa',
                        'progres' => self::p($prog), 'status' => self::status($k->status), 'href' => '/kelas/'.$k->id, '_values' => $k->only(['nama', 'program_id', 'tingkat', 'wali_id', 'ruang', 'jadwal', 'status'])];
                },
                'form' => [['nama', 'Nama Kelas', 'text'], ['program_id', 'Program', 'select', Program::orderBy('nama')->get()->map(fn ($p) => [$p->id, $p->nama])->all()], ['tingkat', 'Tingkat (opsional)', 'text'],
                    ['wali_id', 'Wali Kelas', 'select', User::tutor()->orderBy('name')->get()->map(fn ($t) => [$t->id, $t->name])->all()], ['ruang', 'Ruang (opsional)', 'text'],
                    ['jadwal', 'Ringkasan Jadwal (opsional)', 'text'], ['status', 'Status', 'select', ['Aktif', 'Nonaktif']]],
                'rules' => fn ($m) => ['nama' => 'required|max:60', 'program_id' => 'required|exists:program,id', 'tingkat' => 'nullable|max:40', 'wali_id' => 'nullable|exists:users,id', 'ruang' => 'nullable|max:60', 'jadwal' => 'nullable|max:120', 'status' => 'required|in:Aktif,Nonaktif'],
                'save' => fn ($d, $m) => $m ? tap($m)->update($d) : Kelas::create($d),
            ],

            // ── Pengampu & jadwal ──────────────────────────────────────
            'pengajaran' => [
                'title' => 'Pengampu & Jadwal', 'desc' => 'Tentukan tutor pengampu setiap mata pelajaran di tiap kelas beserta jadwal tetapnya.', 'icon' => 'calendar_month', 'add' => 'Tambah Pengampu', 'noun' => 'Pengampu',
                'query' => fn () => Pengajaran::with(['kelas.program', 'mapel', 'tutor'])->orderBy('kelas_id')->orderBy('hari'),
                'stats' => fn ($items) => [['Penugasan', $items->count(), 'assignment_ind'], ['Terjadwal', $items->whereNotNull('hari')->count(), 'event'], ['Belum Terjadwal', $items->whereNull('hari')->count(), 'event_busy']],
                'filters' => [$programFilter, ['Semua Moda', 'Tatap Muka', 'Daring']],
                'columns' => [['mapel', 'Mata Pelajaran'], ['program', 'Program'], ['tutor', 'Tutor'], ['jadwal', 'Jadwal'], ['mode', 'Moda']],
                'row' => fn (Pengajaran $p) => [
                    'mapel' => self::t($p->mapel->nama, $p->kelas->nama), 'program' => self::paket($p->kelas->program->nama), 'tutor' => $p->tutor->name,
                    'jadwal' => $p->hari !== null ? self::t(Akademik::HARI[$p->hari].', '.Akademik::jam($p->jam_mulai, $p->jam_selesai), $p->tempat) : '—', 'mode' => self::b($p->mode, $p->mode === 'Daring' ? 'lime' : 'soft'),
                    '_values' => ['kelas_id' => $p->kelas_id, 'mapel_id' => $p->mapel_id, 'tutor_id' => $p->tutor_id, 'hari' => $p->hari, 'jam_mulai' => substr((string) $p->jam_mulai, 0, 5), 'jam_selesai' => substr((string) $p->jam_selesai, 0, 5), 'tempat' => $p->tempat, 'mode' => $p->mode],
                ],
                'form' => [['kelas_id', 'Kelas', 'select', self::opsiKelas()], ['mapel_id', 'Mata Pelajaran', 'select', $mapelOpt], ['tutor_id', 'Tutor Pengampu', 'select', User::tutor()->orderBy('name')->get()->map(fn ($t) => [$t->id, $t->name])->all()],
                    ['hari', 'Hari (opsional)', 'select', collect(Akademik::HARI)->map(fn ($h, $i) => [$i, $h])->all()], ['jam_mulai', 'Jam Mulai (opsional)', 'time'], ['jam_selesai', 'Jam Selesai (opsional)', 'time'],
                    ['tempat', 'Tempat / Tautan (opsional)', 'text'], ['mode', 'Moda', 'select', ['Tatap Muka', 'Daring']]],
                'rules' => fn ($m) => ['kelas_id' => 'required|exists:kelas,id', 'mapel_id' => ['required', 'exists:mapel,id', Rule::unique('pengajaran')->where('kelas_id', request('kelas_id'))->ignore($m)],
                    'tutor_id' => ['required', Rule::exists('users', 'id')->where('role', 'tutor')], 'hari' => 'nullable|integer|between:0,6', 'jam_mulai' => 'nullable|date_format:H:i', 'jam_selesai' => 'nullable|date_format:H:i|after:jam_mulai',
                    'tempat' => 'nullable|max:120', 'mode' => 'required|in:Tatap Muka,Daring'],
                'messages' => ['mapel_id.unique' => 'Mata pelajaran ini sudah memiliki pengampu di kelas tersebut.'],
                'save' => fn ($d, $m) => $m ? tap($m)->update($d) : Pengajaran::create($d),
            ],

            // ── Materi ─────────────────────────────────────────────────
            'materi' => [
                'title' => 'Materi Pembelajaran', 'icon' => 'local_library', 'add' => 'Tambah Materi', 'noun' => 'Materi',
                'desc' => $tutor ? 'Buat, unggah, dan kelola materi untuk kelas yang Anda ampu.' : 'Pantau dan kelola materi yang diterbitkan tutor di seluruh kelas.',
                'query' => fn () => Materi::with(['pengajaran.mapel', 'pengajaran.kelas.program'])->withCount('selesaiOleh')->latest()
                    ->when($tutor, fn ($q) => $q->whereIn('pengajaran_id', $user->mengajar()->select('id'))),
                'prepare' => fn () => ['siswa' => User::siswa()->where('status', '!=', 'Nonaktif')->groupBy('kelas_id')->selectRaw('kelas_id, count(*) n')->pluck('n', 'kelas_id')],
                'stats' => fn ($items) => [['Total Materi', $items->count(), 'library_books'], ['Video', $items->where('tipe', 'Video')->count(), 'smart_display'], ['Dokumen', $items->whereNotNull('file_path')->count(), 'picture_as_pdf'], ['Draf', $items->where('status', 'Draf')->count(), 'edit_note']],
                'filters' => [['Semua Tipe', 'Teks', 'Video', 'PDF'], ['Semua Status', 'Terbit', 'Draf']],
                'columns' => [['judul', 'Materi'], ['tipe', 'Tipe'], ['kelas', 'Kelas'], ['dilihat', 'Diselesaikan'], ['status', 'Status']],
                'row' => fn (Materi $m, $ctx) => [
                    'judul' => self::t($m->judul, $m->pengajaran->mapel->nama.' · '.$m->modul), 'tipe' => self::b($m->tipe, 'soft'), 'kelas' => $m->pengajaran->kelas->program->nama.' '.$m->pengajaran->kelas->nama,
                    'dilihat' => $m->selesai_oleh_count.' / '.($ctx['siswa'][$m->pengajaran->kelas_id] ?? 0).' siswa', 'status' => self::status($m->status), 'href' => '/materi/'.$m->id,
                    '_values' => $m->only(['pengajaran_id', 'modul', 'judul', 'deskripsi', 'tipe', 'konten', 'video_url', 'durasi', 'status']) + ['_file' => $m->file_nama],
                ],
                'form' => [['pengajaran_id', 'Mata Pelajaran & Kelas', 'select', self::opsiPengajaran($user)], ['modul', 'Modul (mis. Modul 3 · Teks Eksplanasi)', 'text'], ['judul', 'Judul Materi', 'text'],
                    ['tipe', 'Tipe', 'select', ['Teks', 'Video', 'PDF']], ['durasi', 'Estimasi Durasi (menit, opsional)', 'number'], ['status', 'Status', 'select', ['Terbit', 'Draf']],
                    ['deskripsi', 'Deskripsi Singkat (opsional)', 'textarea'],
                    ['konten', 'Isi Materi (opsional) — baris "## " = subjudul, "- " = poin, "> " = kotak penting', 'textarea'],
                    ['video_url', 'Tautan Video YouTube (opsional)', 'url'], ['file', 'Dokumen Pembelajaran (opsional) — PDF/DOCX/PPTX, maks. 20 MB', 'file']],
                'rules' => fn ($m) => ['pengajaran_id' => ['required', Rule::in(array_column(self::opsiPengajaran($user), 0))], 'modul' => 'required|max:120', 'judul' => 'required|max:160', 'tipe' => 'required|in:Teks,Video,PDF',
                    'durasi' => 'nullable|integer|min:1|max:600', 'status' => 'required|in:Terbit,Draf', 'deskripsi' => 'nullable|max:1000', 'konten' => 'nullable|max:60000', 'video_url' => 'nullable|url|max:255',
                    'file' => 'nullable|file|max:20480|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx'],
                'save' => function (array $d, ?Materi $m) {
                    if ($f = self::simpanBerkas($d['file'] ?? null, 'materi', $m?->file_path)) [$d['file_path'], $d['file_nama']] = [$f['path'], $f['nama']];
                    unset($d['file']);
                    $baru = ! $m;
                    $m = $m ? tap($m)->update($d) : Materi::create($d + ['urutan' => Materi::where('pengajaran_id', $d['pengajaran_id'])->where('modul', $d['modul'])->count()]);
                    if ($baru && $m->status === 'Terbit') {
                        $p = $m->pengajaran()->with('mapel')->first();
                        Akademik::kirim(self::siswaKelas($p->kelas_id), 'library_add', 'primary', 'Materi baru', "{$p->mapel->nama}: {$m->judul}", '/materi/'.$m->id);
                    }

                    return $m;
                },
                'hapus' => fn (Materi $m) => $m->file_path && Storage::delete($m->file_path),
            ],

            // ── Tugas ──────────────────────────────────────────────────
            'tugas' => [
                'title' => 'Tugas', 'icon' => 'assignment', 'add' => 'Buat Tugas', 'noun' => 'Tugas',
                'desc' => $tutor ? 'Buat tugas dan pantau pengumpulan peserta didik. Klik baris untuk menilai.' : 'Pantau tugas dan tingkat pengumpulan di seluruh kelas.',
                'query' => fn () => Tugas::with(['pengajaran.mapel', 'pengajaran.kelas.program', 'pengajaran.tutor'])->withCount(['pengumpulan as dikumpulkan_count' => fn ($q) => $q->where('status', 'dikumpulkan'), 'pengumpulan as dinilai_count' => fn ($q) => $q->whereNotNull('nilai')])->latest()
                    ->when($tutor, fn ($q) => $q->whereIn('pengajaran_id', $user->mengajar()->select('id'))),
                'prepare' => fn () => ['siswa' => User::siswa()->where('status', '!=', 'Nonaktif')->groupBy('kelas_id')->selectRaw('kelas_id, count(*) n')->pluck('n', 'kelas_id')],
                'stats' => fn ($items) => [['Tugas Aktif', $items->filter(fn ($t) => $t->tenggat->isFuture())->count(), 'assignment'], ['Menunggu Penilaian', $items->sum(fn ($t) => $t->dikumpulkan_count - $t->dinilai_count), 'pending_actions'], ['Total Tugas', $items->count(), 'task']],
                'filters' => [['Semua Status', 'Berlangsung', 'Selesai']],
                'columns' => [['judul', 'Tugas'], ['kelas', 'Kelas'], ['tenggat', 'Tenggat'], ['kumpul', 'Pengumpulan'], ['status', 'Status']],
                'row' => fn (Tugas $t, $ctx) => [
                    'judul' => self::t($t->judul, $t->pengajaran->mapel->nama.' · '.$t->pengajaran->tutor->name), 'kelas' => $t->pengajaran->kelas->program->nama.' '.$t->pengajaran->kelas->nama,
                    'tenggat' => Akademik::tgl($t->tenggat, 'j M Y, H.i'), 'kumpul' => self::p(($n = $ctx['siswa'][$t->pengajaran->kelas_id] ?? 0) ? round($t->dikumpulkan_count / $n * 100) : 0),
                    'status' => self::status($t->tenggat->isFuture() ? 'Berlangsung' : 'Selesai'), 'href' => $tutor ? '/tutor/penilaian?tugas='.$t->id : null,
                    '_values' => ['pengajaran_id' => $t->pengajaran_id, 'judul' => $t->judul, 'tenggat' => $t->tenggat->format('Y-m-d\TH:i'), 'instruksi' => $t->instruksi, '_file' => $t->lampiran_nama],
                ],
                'form' => [['pengajaran_id', 'Mata Pelajaran & Kelas', 'select', self::opsiPengajaran($user)], ['judul', 'Judul Tugas', 'text'], ['tenggat', 'Batas Pengumpulan', 'datetime-local'],
                    ['instruksi', 'Instruksi Pengerjaan (satu langkah per baris)', 'textarea'], ['file', 'Lampiran (opsional) — maks. 20 MB', 'file']],
                'rules' => fn ($m) => ['pengajaran_id' => ['required', Rule::in(array_column(self::opsiPengajaran($user), 0))], 'judul' => 'required|max:160', 'tenggat' => 'required|date', 'instruksi' => 'required|max:5000',
                    'file' => 'nullable|file|max:20480|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,zip'],
                'save' => function (array $d, ?Tugas $m) {
                    if ($f = self::simpanBerkas($d['file'] ?? null, 'tugas', $m?->lampiran_path)) [$d['lampiran_path'], $d['lampiran_nama']] = [$f['path'], $f['nama']];
                    unset($d['file']);
                    if ($m) return tap($m)->update($d);
                    $t = Tugas::create($d);
                    $p = $t->pengajaran()->with('mapel')->first();
                    Akademik::kirim(self::siswaKelas($p->kelas_id), 'assignment', 'primary', 'Tugas baru', "{$p->mapel->nama}: {$t->judul} · tenggat ".Akademik::tgl($t->tenggat, 'j M, H.i'), '/siswa/tugas/'.$t->id);

                    return $t;
                },
                'hapus' => fn (Tugas $t) => [$t->lampiran_path && Storage::delete($t->lampiran_path), Storage::delete($t->pengumpulan()->whereNotNull('file_path')->pluck('file_path')->all())],
            ],

            // ── Ujian ──────────────────────────────────────────────────
            'ujian' => [
                'title' => 'Ujian', 'desc' => 'Jadwalkan ujian berbasis komputer. Soal pilihan ganda dinilai otomatis, esai dinilai di menu Penilaian.', 'icon' => 'quiz', 'add' => 'Buat Ujian', 'noun' => 'Ujian',
                'query' => fn () => Ujian::with(['pengajaran.mapel', 'pengajaran.kelas.program', 'soal:id'])->withCount('hasil')->latest('mulai')
                    ->when($tutor, fn ($q) => $q->whereIn('pengajaran_id', $user->mengajar()->select('id'))),
                'stats' => fn ($items) => [['Terjadwal', $items->filter(fn ($u) => $u->status === 'mendatang')->count(), 'event'], ['Berlangsung', $items->filter(fn ($u) => $u->status === 'tersedia')->count(), 'timer'], ['Selesai', $items->filter(fn ($u) => $u->status === 'selesai')->count(), 'task_alt']],
                'filters' => [['Semua Status', 'Terjadwal', 'Berlangsung', 'Selesai']],
                'columns' => [['judul', 'Ujian'], ['jadwal', 'Jadwal'], ['durasi', 'Durasi'], ['soal', 'Soal'], ['peserta', 'Peserta'], ['status', 'Status']],
                'row' => fn (Ujian $u) => [
                    'judul' => self::t($u->judul, $u->pengajaran->mapel->nama.' · '.$u->pengajaran->kelas->nama), 'jadwal' => self::t(Akademik::tgl($u->mulai, 'j M Y, H.i'), 's.d. '.Akademik::tgl($u->selesai, 'j M, H.i')),
                    'durasi' => $u->durasi.' menit', 'soal' => $u->soal->count().' soal', 'peserta' => $u->hasil_count.' siswa',
                    'status' => self::status(['tersedia' => 'Berlangsung', 'mendatang' => 'Terjadwal', 'selesai' => 'Selesai'][$u->status]),
                    '_values' => ['pengajaran_id' => $u->pengajaran_id, 'judul' => $u->judul, 'mulai' => $u->mulai->format('Y-m-d\TH:i'), 'selesai' => $u->selesai->format('Y-m-d\TH:i'), 'durasi' => $u->durasi, 'soal_ids' => $u->soal->pluck('id')],
                ],
                'form' => [['pengajaran_id', 'Mata Pelajaran & Kelas', 'select', self::opsiPengajaran($user)], ['judul', 'Nama Ujian', 'text'], ['mulai', 'Dibuka Mulai', 'datetime-local'], ['selesai', 'Ditutup Pada', 'datetime-local'],
                    ['durasi', 'Durasi Pengerjaan (menit)', 'number'],
                    ['soal_ids', 'Soal dari Bank Soal (pilih minimal satu)', 'checks', Soal::with('mapel.program')->when($tutor, fn ($q) => $q->whereIn('mapel_id', $user->mengajar()->select('mapel_id')))->get()
                        ->map(fn ($s) => [$s->id, ($s->tipe === 'pg' ? '[PG] ' : '[Esai] ').str($s->pertanyaan)->limit(90), $s->mapel->nama.' · '.$s->mapel->program->nama])->all()]],
                'rules' => fn ($m) => ['pengajaran_id' => ['required', Rule::in(array_column(self::opsiPengajaran($user), 0))], 'judul' => 'required|max:160', 'mulai' => 'required|date', 'selesai' => 'required|date|after:mulai',
                    'durasi' => 'required|integer|min:5|max:300', 'soal_ids' => 'required|array|min:1', 'soal_ids.*' => 'integer|exists:soal,id'],
                'save' => function (array $d, ?Ujian $m) {
                    $soal = collect($d['soal_ids'])->values()->mapWithKeys(fn ($id, $i) => [$id => ['urutan' => $i]])->all();
                    unset($d['soal_ids']);
                    $baru = ! $m;
                    $m = $m ? tap($m)->update($d) : Ujian::create($d);
                    $m->soal()->sync($soal);
                    if ($baru) {
                        $p = $m->pengajaran()->with('mapel')->first();
                        Akademik::kirim(self::siswaKelas($p->kelas_id), 'quiz', 'primary', 'Ujian dijadwalkan', "{$m->judul} · dibuka ".Akademik::tgl($m->mulai, 'j M, H.i'), '/siswa/ujian');
                    }

                    return $m;
                },
            ],

            // ── Bank soal ──────────────────────────────────────────────
            'bank-soal' => [
                'title' => 'Bank Soal', 'desc' => 'Kumpulan soal pilihan ganda dan esai yang dapat dipakai ulang untuk ujian.', 'icon' => 'inventory_2', 'add' => 'Tambah Soal', 'noun' => 'Soal',
                'query' => fn () => Soal::with('mapel.program')->withCount('ujian')->latest()
                    ->when($tutor, fn ($q) => $q->whereIn('mapel_id', $user->mengajar()->select('mapel_id'))),
                'stats' => fn ($items) => [['Total Soal', $items->count(), 'inventory_2'], ['Pilihan Ganda', $items->where('tipe', 'pg')->count(), 'radio_button_checked'], ['Esai', $items->where('tipe', 'esai')->count(), 'notes']],
                'filters' => [['Semua Tipe', 'Pilihan Ganda', 'Esai'], ['Semua Tingkat', 'Mudah', 'Sedang', 'Sulit']],
                'columns' => [['soal', 'Soal'], ['tipe', 'Tipe'], ['tingkat', 'Tingkat'], ['dipakai', 'Dipakai']],
                'row' => fn (Soal $s) => [
                    'soal' => self::t($s->pertanyaan, $s->mapel->nama.' · '.$s->mapel->program->nama), 'tipe' => self::b($s->tipe === 'pg' ? 'Pilihan Ganda' : 'Esai', 'soft'),
                    'tingkat' => self::b($s->tingkat, ['Mudah' => 'lime', 'Sedang' => 'warning', 'Sulit' => 'danger'][$s->tingkat] ?? 'neutral'), 'dipakai' => $s->ujian_count.' ujian',
                    '_values' => ['mapel_id' => $s->mapel_id, 'tipe' => $s->tipe, 'tingkat' => $s->tingkat, 'pertanyaan' => $s->pertanyaan, 'opsi_a' => $s->opsi[0] ?? '', 'opsi_b' => $s->opsi[1] ?? '', 'opsi_c' => $s->opsi[2] ?? '', 'opsi_d' => $s->opsi[3] ?? '',
                        'kunci' => $s->tipe === 'pg' ? (int) $s->kunci : null, 'pedoman' => $s->tipe === 'esai' ? $s->kunci : ''],
                ],
                'form' => [['mapel_id', 'Mata Pelajaran', 'select', $tutor ? Mapel::with('program')->whereIn('id', $user->mengajar()->select('mapel_id'))->get()->map(fn ($m) => [$m->id, $m->nama.' ('.$m->program->nama.')'])->all() : $mapelOpt],
                    ['tipe', 'Tipe Soal', 'select', [['pg', 'Pilihan Ganda'], ['esai', 'Esai']]], ['tingkat', 'Tingkat Kesulitan', 'select', ['Mudah', 'Sedang', 'Sulit']], ['pertanyaan', 'Pertanyaan', 'textarea'],
                    ['opsi_a', 'Pilihan A (pilihan ganda)', 'text'], ['opsi_b', 'Pilihan B (pilihan ganda)', 'text'], ['opsi_c', 'Pilihan C (opsional)', 'text'], ['opsi_d', 'Pilihan D (opsional)', 'text'],
                    ['kunci', 'Kunci Jawaban (pilihan ganda)', 'select', [[0, 'A'], [1, 'B'], [2, 'C'], [3, 'D']]], ['pedoman', 'Pedoman Penskoran (esai, opsional)', 'textarea']],
                'rules' => fn ($m) => ['mapel_id' => ['required', $tutor ? Rule::in(Pengajaran::where('tutor_id', $user->id)->pluck('mapel_id')) : 'exists:mapel,id'], 'tipe' => 'required|in:pg,esai', 'tingkat' => 'required|in:Mudah,Sedang,Sulit',
                    'pertanyaan' => 'required|max:3000', 'opsi_a' => 'required_if:tipe,pg|nullable|max:500', 'opsi_b' => 'required_if:tipe,pg|nullable|max:500', 'opsi_c' => 'nullable|max:500', 'opsi_d' => 'nullable|max:500',
                    'kunci' => 'required_if:tipe,pg|nullable|integer|between:0,3', 'pedoman' => 'nullable|max:2000'],
                'messages' => ['opsi_a.required_if' => 'Pilihan A wajib untuk soal pilihan ganda.', 'opsi_b.required_if' => 'Pilihan B wajib untuk soal pilihan ganda.', 'kunci.required_if' => 'Pilih kunci jawaban.'],
                'save' => function (array $d, ?Soal $m) use ($user) {
                    $opsi = array_values(array_filter([$d['opsi_a'] ?? null, $d['opsi_b'] ?? null, $d['opsi_c'] ?? null, $d['opsi_d'] ?? null], fn ($v) => filled($v)));
                    if ($d['tipe'] === 'pg' && ! isset($opsi[(int) $d['kunci']])) {
                        throw \Illuminate\Validation\ValidationException::withMessages(['kunci' => 'Kunci jawaban menunjuk pilihan yang kosong.']);
                    }
                    $data = ['mapel_id' => $d['mapel_id'], 'tipe' => $d['tipe'], 'tingkat' => $d['tingkat'], 'pertanyaan' => $d['pertanyaan'],
                        'opsi' => $d['tipe'] === 'pg' ? $opsi : null, 'kunci' => $d['tipe'] === 'pg' ? (string) $d['kunci'] : ($d['pedoman'] ?? null)];

                    return $m ? tap($m)->update($data) : Soal::create($data + ['pembuat_id' => $user->id]);
                },
            ],

            // ── Nilai (rekap, hanya baca) ──────────────────────────────
            'nilai' => [
                'title' => 'Nilai dan Hasil Belajar', 'desc' => 'Rekap rata-rata nilai tugas, ujian, dan nilai akhir peserta didik. KKM '.Akademik::pengaturan('kkm').'. Klik baris untuk mencetak rapor.', 'icon' => 'insights', 'add' => null, 'edit' => false, 'noun' => 'Nilai',
                'query' => fn () => User::siswa()->with('kelas.program')->orderBy('name'),
                'prepare' => fn () => [
                    'tugas' => Pengumpulan::whereNotNull('nilai')->groupBy('siswa_id')->selectRaw('siswa_id, avg(nilai) n')->pluck('n', 'siswa_id'),
                    'ujian' => HasilUjian::whereNotNull('nilai')->groupBy('siswa_id')->selectRaw('siswa_id, avg(nilai) n')->pluck('n', 'siswa_id'),
                ],
                'stats' => function ($items, $ctx) {
                    $akhir = $items->map(fn ($s) => Akademik::nilaiAkhir($ctx['tugas'][$s->id] ?? null, $ctx['ujian'][$s->id] ?? null))->filter(fn ($v) => $v !== null);
                    $kkm = (int) Akademik::pengaturan('kkm');

                    return [['Rata-rata Nilai Akhir', $akhir->isEmpty() ? '—' : number_format($akhir->avg(), 1, ',', ''), 'insights'],
                        ['Tuntas KKM', $akhir->isEmpty() ? '—' : round($akhir->filter(fn ($v) => $v >= $kkm)->count() / $akhir->count() * 100).'%', 'verified'],
                        ['Belum Tuntas', $akhir->filter(fn ($v) => $v < $kkm)->count().' siswa', 'report']];
                },
                'filters' => [$programFilter, ['Semua Ketuntasan', 'Tuntas', 'Belum Tuntas']],
                'columns' => [['nama', 'Peserta Didik'], ['program', 'Program'], ['tugas', 'Rata-rata Tugas'], ['ujian', 'Rata-rata Ujian'], ['akhir', 'Nilai Akhir'], ['status', 'Ketuntasan']],
                'row' => function (User $s, $ctx) {
                    $t = $ctx['tugas'][$s->id] ?? null;
                    $u = $ctx['ujian'][$s->id] ?? null;
                    $a = Akademik::nilaiAkhir($t, $u);
                    $f = fn ($v) => $v === null ? '—' : number_format($v, 1, ',', '');

                    return ['href' => '/rapor/'.$s->id, 'external' => true, 'nama' => self::u($s->name, $s->kelas?->nama), 'program' => self::paket($s->kelas?->program?->nama), 'tugas' => $f($t), 'ujian' => $f($u), 'akhir' => self::t($f($a)),
                        'status' => $a === null ? self::b('Belum Ada Nilai') : self::status($a >= (int) Akademik::pengaturan('kkm') ? 'Tuntas' : 'Belum Tuntas')];
                },
                'form' => [],
            ],

            // ── Kehadiran (sesi presensi) ──────────────────────────────
            'kehadiran' => [
                'title' => 'Kehadiran', 'desc' => 'Buat sesi pertemuan lalu isi presensi peserta didik. Klik baris untuk mengisi atau mengubah presensi.', 'icon' => 'event_available', 'add' => 'Buat Sesi Presensi', 'noun' => 'Sesi presensi',
                'query' => fn () => Sesi::with(['pengajaran.kelas.program', 'pengajaran.mapel', 'pengajaran.tutor'])->withCount(['presensi', 'presensi as hadir_count' => fn ($q) => $q->where('status', 'Hadir')])->latest('tanggal')
                    ->when($tutor, fn ($q) => $q->whereIn('pengajaran_id', $user->mengajar()->select('id'))),
                'stats' => fn ($items) => [['Sesi Tercatat', $items->where('presensi_count', '>', 0)->count().' / '.$items->count(), 'fact_check'],
                    ['Rata-rata Kehadiran', ($n = $items->sum('presensi_count')) ? round($items->sum('hadir_count') / $n * 100).'%' : '—', 'event_available'], ['Belum Diisi', $items->where('presensi_count', 0)->count(), 'pending_actions']],
                'filters' => [$programFilter, ['Semua Status', 'Tercatat', 'Belum Diisi']],
                'columns' => [['sesi', 'Sesi'], ['kelas', 'Kelas'], ['tutor', 'Tutor'], ['hadir', 'Kehadiran'], ['status', 'Status']],
                'row' => fn (Sesi $s) => [
                    'sesi' => self::t(Akademik::tgl($s->tanggal, 'D, j M Y'), $s->pengajaran->mapel->nama.' · '.$s->mode), 'kelas' => self::paket($s->pengajaran->kelas->program->nama),
                    'tutor' => $s->pengajaran->tutor->name, 'hadir' => self::p($s->presensi_count ? round($s->hadir_count / $s->presensi_count * 100) : 0),
                    'status' => self::status($s->presensi_count ? 'Tercatat' : 'Belum Diisi'), 'href' => '/presensi/'.$s->id,
                    '_values' => ['pengajaran_id' => $s->pengajaran_id, 'tanggal' => $s->tanggal->toDateString(), 'mode' => $s->mode, 'topik' => $s->topik],
                ],
                'form' => [['pengajaran_id', 'Mata Pelajaran & Kelas', 'select', self::opsiPengajaran($user)], ['tanggal', 'Tanggal Pertemuan', 'date'], ['mode', 'Moda', 'select', ['Tatap Muka', 'Daring']], ['topik', 'Topik (opsional)', 'text']],
                'rules' => fn ($m) => ['pengajaran_id' => ['required', Rule::in(array_column(self::opsiPengajaran($user), 0))], 'tanggal' => 'required|date', 'mode' => 'required|in:Tatap Muka,Daring', 'topik' => 'nullable|max:160'],
                'save' => fn ($d, $m) => $m ? tap($m)->update($d) : Sesi::create($d),
                'redirect' => fn (Sesi $s) => '/presensi/'.$s->id,
            ],
        };
    }
}
