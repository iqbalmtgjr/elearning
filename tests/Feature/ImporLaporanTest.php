<?php

namespace Tests\Feature;

use App\Models\Soal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ImporLaporanTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private function akun(string $u): User
    {
        return User::where('username', $u)->firstOrFail();
    }

    private function csv(array $rows, string $sep = ';'): UploadedFile
    {
        $isi = "\xEF\xBB\xBF".implode("\n", array_map(fn ($r) => implode($sep, $r), $rows));

        return UploadedFile::fake()->createWithContent('impor.csv', $isi);
    }

    /** Buat .xlsx minimal (sharedStrings + sheet1) seperti yang disimpan Excel. */
    private function xlsx(array $rows): UploadedFile
    {
        $strings = [];
        $sheet = '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        foreach ($rows as $i => $row) {
            $sheet .= '<row r="'.($i + 1).'">';
            foreach (array_values($row) as $j => $v) {
                $ref = chr(65 + $j).($i + 1);
                if (is_int($v)) {
                    $sheet .= "<c r=\"{$ref}\"><v>{$v}</v></c>";
                } else {
                    $strings[] = htmlspecialchars($v);
                    $sheet .= "<c r=\"{$ref}\" t=\"s\"><v>".(count($strings) - 1).'</v></c>';
                }
            }
            $sheet .= '</row>';
        }
        $sheet .= '</sheetData></worksheet>';
        $path = tempnam(sys_get_temp_dir(), 'xlsx');
        $zip = new \ZipArchive;
        $zip->open($path, \ZipArchive::OVERWRITE);
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet);
        $zip->addFromString('xl/sharedStrings.xml', '<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'.implode('', array_map(fn ($s) => "<si><t>{$s}</t></si>", $strings)).'</sst>');
        $zip->close();

        return new UploadedFile($path, 'impor.xlsx', null, null, true);
    }

    public function test_impor_peserta_didik_semua_atau_tidak_dan_lewati(): void
    {
        $admin = $this->akun('admin');
        $res = $this->actingAs($admin)->get('/impor/peserta-didik/templat');
        $res->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->assertHeader('content-disposition', 'attachment; filename="templat-impor-peserta-didik.xlsx"');
        $this->assertStringStartsWith('PK', $res->getContent());

        $rows = [
            ['Nama Lengkap*', 'NISN*', 'Kelas*', 'Program', 'Jenis Kelamin*', 'Tanggal Lahir', 'Telepon'],
            ['Andi Wijaya', '91234567', 'XII IPS 1', '', 'L', '05/06/2003', '81211112222'],
            ['Sari Dewi', '0091234568', 'Kelas Tidak Ada', '', 'P', '', ''],
            ['Budi Santoso Baru', '0081294821', 'XII IPS 1', 'Paket C', 'L', '', ''], // NISN sudah ada → diperbarui
        ];
        $this->actingAs($admin)->post('/impor/peserta-didik', ['berkas' => $this->csv($rows)])->assertSessionHas('impor', fn ($h) => ! $h['ok'] && $h['jumlahGalat'] === 1 && $h['galat'][0]['baris'] === 3);
        $this->assertNull(User::where('username', '0091234567')->first()); // dibatalkan seluruhnya

        $this->actingAs($admin)->post('/impor/peserta-didik', ['berkas' => $this->csv($rows), 'lewati' => 1])->assertSessionHas('impor', fn ($h) => $h['ok'] && $h['dibuat'] === 1 && $h['diperbarui'] === 1);
        $andi = User::where('username', '0091234567')->firstOrFail(); // NISN dilengkapi 0 di depan
        $this->assertSame('Laki-laki', $andi->jenis_kelamin);
        $this->assertSame('2003-06-05', $andi->tanggal_lahir->toDateString());
        $this->assertSame('081211112222', $andi->telepon);
        $this->assertSame('Budi Santoso Baru', $this->akun('siswa')->name);
        auth()->logout();
        $this->post('/login', ['login' => '0091234567', 'password' => '0091234567'])->assertRedirect('/siswa');
    }

    public function test_impor_tutor_dari_xlsx_membuat_kata_sandi_acak(): void
    {
        $file = $this->xlsx([
            ['Nama Lengkap', 'Email', 'Username', 'Keterangan', 'Telepon'],
            ['Laila Fitri, S.Pd.', 'laila@pkbmbhp.sch.id', '', 'Tutor Seni Budaya', 81355556666],
            ['Rina Kartika, S.Si.', 'rina.kartika@pkbmbhp.sch.id', '', 'Tutor IPA & Biologi', ''],
        ]);
        $this->actingAs($this->akun('admin'))->post('/impor/tutor', ['berkas' => $file])
            ->assertSessionHas('impor', fn ($h) => $h['ok'] && $h['dibuat'] === 1 && $h['diperbarui'] === 1 && $h['akun'][0]['username'] === 'laila' && strlen($h['akun'][0]['password']) === 10);
        $laila = User::where('email', 'laila@pkbmbhp.sch.id')->firstOrFail();
        $this->assertSame('tutor', $laila->role);
        $this->assertSame('081355556666', $laila->telepon);
        $this->assertSame('Tutor IPA & Biologi', User::where('username', 'rina')->first()->jabatan);
    }

    public function test_impor_bank_soal_tutor_hanya_mapel_yang_diampu(): void
    {
        $nurul = $this->akun('tutor');
        $awal = Soal::count();
        $rows = [
            ['Mata Pelajaran', 'Program', 'Tipe', 'Tingkat', 'Pertanyaan', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Kunci', 'Pedoman Penskoran'],
            ['Bahasa Indonesia', 'Paket C', 'PG', 'mudah', 'Sinonim kata "cerdas" adalah ...', 'pintar', 'malas', 'lambat', 'diam', 'A', ''],
            ['Bahasa Indonesia', 'Paket C', 'Esai', '', 'Jelaskan pengertian teks ulasan!', '', '', '', '', '', 'Menyebut definisi dan contoh.'],
            ['Matematika', 'Paket C', 'PG', '', '2 + 2 = ...', '3', '4', '', '', 'B', ''], // tidak diampu Nurul
            ['Bahasa Indonesia', 'Paket C', 'PG', '', 'Tujuan utama teks eksplanasi adalah ...', 'x', 'y', '', '', 'A', ''], // sudah ada → dilewati
        ];
        $this->actingAs($nurul)->post('/impor/bank-soal', ['berkas' => $this->csv($rows, ','), 'lewati' => 1])
            ->assertSessionHas('impor', fn ($h) => $h['ok'] && $h['dibuat'] === 2 && $h['dilewati'] === 1 && $h['jumlahGalat'] === 1);
        $this->assertSame($awal + 2, Soal::count());
        $this->assertSame('Mudah', Soal::where('pertanyaan', 'like', 'Sinonim%')->first()->tingkat);
        $this->actingAs($nurul)->post('/impor/peserta-didik', ['berkas' => $this->csv($rows)])->assertForbidden();
        $this->actingAs($this->akun('siswa'))->get('/impor/bank-soal/templat')->assertForbidden();
    }

    public function test_laporan_pdf_dan_rapor(): void
    {
        $admin = $this->akun('admin');
        foreach (['nilai', 'kehadiran', 'progres', 'peserta', 'tutor', 'aktivitas'] as $j) {
            $this->actingAs($admin)->get("/admin/laporan/{$j}/cetak")->assertOk()->assertSee('PKBM Bina Harapan Permata')->assertSee('Simpan sebagai PDF', false);
        }
        $budi = $this->akun('siswa');
        $this->actingAs($budi)->get("/rapor/{$budi->id}")->assertOk()->assertSee('Laporan Hasil Belajar')->assertSee($budi->name);
        $this->actingAs($this->akun('tutor'))->get("/rapor/{$budi->id}")->assertOk(); // wali kelas
        $this->actingAs($this->akun('hendra'))->get("/rapor/{$budi->id}")->assertForbidden();
        $lain = User::siswa()->where('id', '!=', $budi->id)->first();
        $this->actingAs($budi)->get("/rapor/{$lain->id}")->assertForbidden();
    }
}
