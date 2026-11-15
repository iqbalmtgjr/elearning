<?php

namespace Tests\Feature;

use App\Models\HasilUjian;
use App\Models\Kelas;
use App\Models\Materi;
use App\Models\Notifikasi;
use App\Models\Pengumpulan;
use App\Models\Tugas;
use App\Models\Ujian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HalamanTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private const BERSAMA = ['/pengumuman', '/pengumuman/1', '/notifikasi', '/profil', '/profil/edit', '/pengaturan-akun', '/riwayat-aktivitas', '/diskusi', '/jadwal'];

    private const HALAMAN = [
        'admin' => [
            '/admin',
            '/admin/laporan',
            '/admin/pengaturan',
            '/admin/peserta-didik',
            '/admin/tutor',
            '/admin/program',
            '/admin/mapel',
            '/admin/kelas',
            '/admin/pengajaran',
            '/admin/materi',
            '/admin/tugas',
            '/admin/ujian',
            '/admin/bank-soal',
            '/admin/nilai',
            '/admin/kehadiran',
            '/presensi/1',
            '/kelas/1',
            '/materi/2',
            '/admin/laporan/nilai',
            '/admin/laporan/kehadiran'
        ],
        'tutor' => ['/tutor', '/tutor/kelas', '/tutor/penilaian', '/tutor/penilaian?tab=esai', '/tutor/peserta-didik', '/tutor/materi', '/tutor/tugas', '/tutor/ujian', '/tutor/bank-soal', '/tutor/kehadiran', '/kelas/1', '/materi/2', '/presensi/1'],
        'siswa' => ['/siswa', '/siswa/kelas', '/siswa/mapel', '/siswa/materi', '/siswa/tugas', '/siswa/tugas/1', '/siswa/tugas/6', '/siswa/ujian', '/siswa/nilai', '/siswa/kehadiran', '/kelas/1', '/materi/2', '/berkas/materi/2'],
    ];

    private function akun(string $username): User
    {
        return User::where('username', $username)->firstOrFail();
    }

    public function test_semua_halaman_terbuka_untuk_tiap_peran(): void
    {
        foreach (self::HALAMAN as $role => $urls) {
            $user = $this->akun($role === 'siswa' ? 'siswa' : ($role === 'tutor' ? 'tutor' : 'admin'));
            foreach ([...$urls, ...self::BERSAMA] as $url) {
                $this->actingAs($user)->get($url)->assertOk();
            }
        }
        $this->get('/')->assertOk()->assertSee('Landing', false)->assertSee('Jadwal Penilaian Tengah Semester', false);
        $this->get('/design-system')->assertOk();
    }

    public function test_login_dan_hak_akses(): void
    {
        $this->get('/admin')->assertRedirect('/login');
        $this->post('/login', ['login' => 'siswa', 'password' => 'salah'])->assertSessionHasErrors('login');
        $this->post('/login', ['login' => 'budi.santoso@pkbmbhp.sch.id', 'password' => 'password'])->assertRedirect('/siswa');

        $this->get('/admin')->assertForbidden();
        $this->get('/tutor/penilaian')->assertForbidden();
        $this->get('/siswa/ujian/2/kerjakan')->assertForbidden(); // belum dibuka
        $this->get('/siswa/tugas/10')->assertForbidden(); // tugas kelas lain
        $this->get('/presensi/1')->assertForbidden();

        // Tutor lain tidak bisa mengubah materi milik Nurul (query dibatasi → 404)
        $materi = Materi::first();
        $this->actingAs($this->akun('hendra'))->put("/tutor/materi/{$materi->id}", ['judul' => 'x'])->assertNotFound();
    }

    public function test_alur_tugas_dikumpulkan_lalu_dinilai(): void
    {
        Storage::fake();
        $budi = $this->akun('siswa');
        $tugas = Tugas::where('judul', 'like', 'Menulis Teks Eksplanasi%')->first();

        $this->actingAs($budi)->post("/siswa/tugas/{$tugas->id}", ['aksi' => 'kumpul'])->assertSessionHasErrors('berkas');
        $this->actingAs($budi)->post("/siswa/tugas/{$tugas->id}", ['aksi' => 'kumpul', 'catatan' => 'Mohon dicek', 'berkas' => UploadedFile::fake()->create('teks.pdf', 120, 'application/pdf')])
            ->assertSessionHas('ok');
        $p = Pengumpulan::where('tugas_id', $tugas->id)->where('siswa_id', $budi->id)->firstOrFail();
        $this->assertSame('dikumpulkan', $p->status);
        Storage::assertExists($p->file_path);

        $nurul = $this->akun('tutor');
        $this->actingAs($nurul)->get('/berkas/pengumpulan/' . $p->id)->assertOk();
        $this->actingAs($this->akun('hendra'))->get('/berkas/pengumpulan/' . $p->id)->assertForbidden();
        $this->actingAs($nurul)->post("/tutor/penilaian/{$p->id}", ['nilai' => 87, 'umpan_balik' => 'Bagus'])->assertSessionHas('ok');
        $this->assertSame(87, $p->fresh()->nilai);
        $this->assertTrue(Notifikasi::where('user_id', $budi->id)->where('judul', 'Tugas sudah dinilai')->exists());
        $this->actingAs($budi)->post("/siswa/tugas/{$tugas->id}", ['aksi' => 'draf'])->assertStatus(422); // sudah dinilai
    }

    public function test_alur_ujian_pg_otomatis_dan_esai_dinilai_tutor(): void
    {
        $budi = $this->akun('siswa');
        $ujian = Ujian::with('soal')->where('judul', 'like', 'Kuis Modul 3%')->first();
        $this->actingAs($budi)->get("/siswa/ujian/{$ujian->id}/kerjakan")->assertOk()->assertDontSee('"kunci"', false);

        $jawaban = $ujian->soal->mapWithKeys(fn($s) => [$s->id => $s->tipe === 'pg' ? (int) $s->kunci : 'Jawaban esai saya.'])->all();
        $this->actingAs($budi)->post("/siswa/ujian/{$ujian->id}/jawab", ['jawaban' => $jawaban])->assertNoContent();
        $this->actingAs($budi)->post("/siswa/ujian/{$ujian->id}/kumpul", ['jawaban' => $jawaban])->assertRedirect('/siswa/ujian');
        $h = HasilUjian::where('ujian_id', $ujian->id)->where('siswa_id', $budi->id)->first();
        $this->assertNotNull($h->selesai_at);
        $this->assertNull($h->nilai); // menunggu esai
        $this->actingAs($budi)->get("/siswa/ujian/{$ujian->id}/kerjakan")->assertForbidden(); // tidak bisa mengulang

        $esai = $ujian->soal->where('tipe', 'esai')->pluck('id')->mapWithKeys(fn($id) => [$id => 50])->all();
        $this->actingAs($this->akun('tutor'))->post("/tutor/esai/{$h->id}", ['nilai' => $esai])->assertSessionHas('ok');
        $this->assertSame(90, $h->fresh()->nilai); // 8 PG benar + 2 esai × 0,5 = 9 dari 10
    }

    public function test_admin_menambah_peserta_didik_yang_bisa_login(): void
    {
        $this->actingAs($this->akun('admin'))->post('/admin/peserta-didik', [
            'name' => 'Rina Marlina',
            'nomor_induk' => '0099887766',
            'kelas_id' => 1,
            'jenis_kelamin' => 'Perempuan',
            'status' => 'Aktif',
        ])->assertSessionHas('ok');
        auth()->logout();
        $this->post('/login', ['login' => '0099887766', 'password' => '0099887766'])->assertRedirect('/siswa');
    }

    public function test_admin_enrol_dan_keluarkan_peserta_kelas(): void
    {
        $kelas = Kelas::create(['program_id' => 1, 'nama' => 'Kelas Uji']);
        $siswa = $this->akun('siswa');
        $tutor = $this->akun('tutor');

        $this->actingAs($tutor)->post("/admin/kelas/{$kelas->id}/peserta", ['siswa' => [$siswa->id]])->assertForbidden();
        $this->actingAs($this->akun('admin'))->post("/admin/kelas/{$kelas->id}/peserta", ['siswa' => [$tutor->id]])->assertSessionHasErrors('siswa.0'); // bukan siswa

        $this->post("/admin/kelas/{$kelas->id}/peserta", ['siswa' => [$siswa->id]])->assertSessionHas('ok');
        $this->assertSame($kelas->id, $siswa->fresh()->kelas_id); // dipindah dari kelas lama
        $this->get("/kelas/{$kelas->id}")->assertInertia(fn($p) => $p->where('peserta.0.id', $siswa->id)->where('calon', fn($c) => ! collect($c)->contains('id', $siswa->id)));

        $this->delete("/admin/kelas/{$kelas->id}/peserta/{$siswa->id}")->assertSessionHas('ok');
        $this->assertNull($siswa->fresh()->kelas_id);
        $this->delete("/admin/kelas/{$kelas->id}/peserta/{$siswa->id}")->assertNotFound(); // sudah bukan anggota
    }

    public function test_presensi_tersimpan(): void
    {
        $siswa = User::siswa()->where('kelas_id', 1)->pluck('id');
        $this->actingAs($this->akun('tutor'))->post('/presensi/1', ['status' => $siswa->mapWithKeys(fn($id) => [$id => 'Izin'])->all()])->assertRedirect('/tutor/kehadiran');
        $this->assertSame($siswa->count(), \DB::table('presensi')->where('sesi_id', 1)->where('status', 'Izin')->count());
    }
}
