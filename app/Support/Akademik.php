<?php

namespace App\Support;

use App\Models\Aktivitas;
use App\Models\HasilUjian;
use App\Models\Materi;
use App\Models\Notifikasi;
use App\Models\Pengajaran;
use App\Models\Pengumpulan;
use App\Models\Tugas;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/** Aturan akademik bersama: pengaturan, status tugas, nilai, progres, log, dan notifikasi. */
class Akademik
{
    const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    const PENGATURAN = [
        'nama_lembaga' => 'PKBM Bina Harapan Permata', 'nama_singkat' => 'PKBM BHP', 'kepala' => '', 'npsn' => '', 'email' => '', 'telepon' => '', 'alamat' => '',
        'tahun_ajaran' => '2026/2027', 'semester' => 'Ganjil', 'mulai' => '2026-07-13', 'selesai' => '2026-12-19',
        'kkm' => '75', 'bobot_tugas' => '40',
    ];

    private static ?array $pengaturan = null;

    public static function pengaturan(?string $kunci = null): mixed
    {
        self::$pengaturan ??= array_merge(self::PENGATURAN, DB::table('pengaturan')->pluck('nilai', 'kunci')->all());

        return $kunci ? self::$pengaturan[$kunci] ?? null : self::$pengaturan;
    }

    public static function simpanPengaturan(array $data): void
    {
        foreach (array_intersect_key($data, self::PENGATURAN) as $kunci => $nilai) {
            DB::table('pengaturan')->updateOrInsert(['kunci' => $kunci], ['nilai' => $nilai]);
        }
        self::$pengaturan = null;
    }

    public static function catat(User|int $user, string $icon, string $teks): void
    {
        Aktivitas::create(['user_id' => is_int($user) ? $user : $user->id, 'icon' => $icon, 'teks' => mb_strimwidth($teks, 0, 250, '…')]);
    }

    /** Kirim notifikasi ke banyak pengguna sekaligus. */
    public static function kirim(iterable $userIds, string $icon, string $tone, string $judul, string $teks, ?string $url = null): void
    {
        $now = now();
        $rows = collect($userIds)->unique()->map(fn ($id) => [
            'user_id' => $id, 'icon' => $icon, 'tone' => $tone, 'judul' => $judul, 'teks' => mb_strimwidth($teks, 0, 250, '…'),
            'url' => $url, 'created_at' => $now, 'updated_at' => $now,
        ]);
        foreach ($rows->chunk(500) as $chunk) {
            Notifikasi::insert($chunk->values()->all());
        }
    }

    public static function tgl(?CarbonInterface $d, string $format = 'j M Y'): ?string
    {
        return $d?->translatedFormat($format);
    }

    /** belum | proses | dikumpulkan | terlambat | dinilai */
    public static function statusTugas(Tugas $t, ?Pengumpulan $p): string
    {
        return match (true) {
            $p?->nilai !== null => 'dinilai',
            $p?->status === 'dikumpulkan' => 'dikumpulkan',
            $t->tenggat->isPast() => 'terlambat',
            default => $p ? 'proses' : 'belum',
        };
    }

    /** Teks singkat sisa waktu / keterangan status. */
    public static function sisa(Tugas $t, ?Pengumpulan $p): string
    {
        return match (self::statusTugas($t, $p)) {
            'dinilai' => 'Dinilai '.self::tgl($p->dinilai_at),
            'dikumpulkan' => 'Dikumpulkan '.self::tgl($p->dikumpulkan_at),
            'terlambat' => 'Lewat '.$t->tenggat->diffForHumans(null, CarbonInterface::DIFF_ABSOLUTE),
            default => $t->tenggat->isToday() ? 'Hari ini, '.$t->tenggat->format('H.i')
                : ($t->tenggat->isTomorrow() ? 'Besok, '.$t->tenggat->format('H.i')
                : ceil(now()->floatDiffInDays($t->tenggat)).' hari lagi'),
        };
    }

    /** Nilai ujian 0–100: tiap soal berbobot sama; PG otomatis, esai 0–100 dari tutor. Null bila masih ada esai belum dinilai. */
    public static function hitungNilaiUjian(HasilUjian $h, Collection $soal): ?int
    {
        if ($soal->isEmpty()) return 0;
        $poin = 0;
        foreach ($soal as $s) {
            $jawab = $h->jawaban[$s->id] ?? null;
            if ($s->tipe === 'pg') {
                $poin += (string) $jawab !== '' && (int) $jawab === (int) $s->kunci ? 1 : 0;
            } else {
                $esai = $h->nilai_esai[$s->id] ?? null;
                if ($esai === null && trim((string) $jawab) !== '') return null;
                $poin += ((int) $esai) / 100;
            }
        }

        return (int) round($poin / $soal->count() * 100);
    }

    public static function nilaiAkhir(?float $tugas, ?float $ujian): ?float
    {
        if ($tugas === null && $ujian === null) return null;
        if ($tugas === null || $ujian === null) return round($tugas ?? $ujian, 1);
        $b = (int) self::pengaturan('bobot_tugas') / 100;

        return round($tugas * $b + $ujian * (1 - $b), 1);
    }

    /** Rekap nilai per mapel untuk satu siswa. */
    public static function nilaiSiswa(User $siswa): Collection
    {
        $pengajaran = Pengajaran::with('mapel', 'tutor')->where('kelas_id', $siswa->kelas_id ?? 0)->get();
        $tugas = Pengumpulan::where('siswa_id', $siswa->id)->whereNotNull('nilai')->with('tugas:id,pengajaran_id')->get()->groupBy('tugas.pengajaran_id');
        $ujian = HasilUjian::where('siswa_id', $siswa->id)->whereNotNull('nilai')->with('ujian:id,pengajaran_id')->get()->groupBy('ujian.pengajaran_id');

        return $pengajaran->map(function ($p) use ($tugas, $ujian) {
            $t = $tugas->get($p->id)?->avg('nilai');
            $u = $ujian->get($p->id)?->avg('nilai');

            return ['pengajaran_id' => $p->id, 'mapel' => $p->mapel->nama, 'tutor' => $p->tutor->name, 'tugas' => $t ? round($t, 1) : null, 'ujian' => $u ? round($u, 1) : null, 'akhir' => self::nilaiAkhir($t, $u)];
        })->values();
    }

    /** Rata-rata nilai akhir seluruh mapel (yang sudah punya nilai). */
    public static function rataSiswa(User $siswa): ?float
    {
        $akhir = self::nilaiSiswa($siswa)->pluck('akhir')->filter(fn ($v) => $v !== null);

        return $akhir->isEmpty() ? null : round($akhir->avg(), 1);
    }

    /** [selesai, total, persen] materi terbit di kelas siswa (opsional per pengajaran). */
    public static function progres(User $siswa, ?int $pengajaranId = null): array
    {
        $ids = Materi::terbit()
            ->when($pengajaranId, fn ($q) => $q->where('pengajaran_id', $pengajaranId), fn ($q) => $q->whereIn('pengajaran_id', Pengajaran::where('kelas_id', $siswa->kelas_id ?? 0)->select('id')))
            ->pluck('id');
        $selesai = $ids->isEmpty() ? 0 : DB::table('materi_selesai')->where('user_id', $siswa->id)->whereIn('materi_id', $ids)->count();

        return [$selesai, $ids->count(), $ids->isEmpty() ? 0 : (int) round($selesai / $ids->count() * 100)];
    }

    /** Persentase kehadiran siswa dari seluruh presensi tercatat. */
    public static function persenHadir(int $siswaId): ?int
    {
        $rekap = DB::table('presensi')->where('siswa_id', $siswaId)->selectRaw("count(*) total, sum(case when status = 'Hadir' then 1 else 0 end) hadir")->first();

        return $rekap->total ? (int) round($rekap->hadir / $rekap->total * 100) : null;
    }

    public static function jam(?string $mulai, ?string $selesai): ?string
    {
        return $mulai ? str_replace(':', '.', substr($mulai, 0, 5)).($selesai ? '–'.str_replace(':', '.', substr($selesai, 0, 5)) : '') : null;
    }
}
