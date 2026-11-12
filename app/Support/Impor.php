<?php

namespace App\Support;

use App\Models\Kelas;
use App\Models\Mapel;
use App\Models\Soal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Impor massal dari Excel (.xlsx) atau CSV untuk peserta didik, tutor, dan bank soal.
 * Semua baris divalidasi dulu; tanpa opsi "lewati", satu baris salah = tidak ada yang disimpan.
 */
class Impor
{
    const MAKS_BARIS = 2000;

    /** [kunci, judul kolom templat, wajib, contoh, keterangan, alias judul lain] */
    public static function kolom(string $jenis): array
    {
        return match ($jenis) {
            'peserta-didik' => [
                ['name', 'Nama Lengkap', true, 'Budi Santoso', '', ['nama', 'nama peserta didik', 'nama siswa']],
                ['nomor_induk', 'NISN', true, '0081294821', 'Jadi username login. Format kolom sebagai Teks agar angka 0 di depan tidak hilang.', ['nis', 'nomor induk']],
                ['kelas', 'Kelas', true, 'XII IPS 1', 'Sama persis dengan nama di Data Kelas.', ['rombel', 'nama kelas', 'rombongan belajar']],
                ['program', 'Program', false, 'Paket C', 'Isi bila ada nama kelas yang sama di program berbeda.', ['paket', 'jenjang']],
                ['jenis_kelamin', 'Jenis Kelamin', true, 'L', 'L atau P.', ['jk', 'l p', 'gender']],
                ['tanggal_lahir', 'Tanggal Lahir', false, '14/03/2004', 'HH/BB/TTTT.', ['tgl lahir', 'lahir']],
                ['telepon', 'Telepon', false, '081288901123', '', ['no hp', 'hp', 'nomor telepon', 'no telepon', 'whatsapp', 'wa']],
                ['email', 'Email', false, '', '', ['e mail', 'surel']],
                ['alamat', 'Alamat', false, 'Jl. Raya Bojonggede No. 21', '', []],
                ['status', 'Status', false, 'Aktif', 'Aktif / Perlu Pendampingan / Nonaktif. Kosong = Aktif.', []],
                ['password', 'Kata Sandi', false, '', 'Kosong = sama dengan NISN.', ['sandi', 'kata kunci']],
            ],
            'tutor' => [
                ['name', 'Nama Lengkap', true, 'Hendra Wijaya, M.Pd.', 'Boleh dengan gelar.', ['nama', 'nama tutor', 'nama guru']],
                ['email', 'Email', true, 'hendra@pkbmbhp.sch.id', 'Dipakai untuk masuk dan reset kata sandi.', ['e mail', 'surel']],
                ['username', 'Username', false, 'hendra', 'Kosong = dibuat dari email.', ['nama pengguna']],
                ['nomor_induk', 'Nomor Induk', false, 'TTR-2018-002', '', ['nip', 'nuptk', 'nomor induk tutor']],
                ['jabatan', 'Keterangan', false, 'Tutor Matematika', '', ['jabatan', 'tugas']],
                ['pendidikan', 'Pendidikan', false, 'S2 Pendidikan Matematika', '', ['pendidikan terakhir', 'ijazah']],
                ['telepon', 'Telepon', false, '081322901145', '', ['no hp', 'hp', 'nomor telepon', 'no telepon', 'whatsapp', 'wa']],
                ['status', 'Status', false, 'Aktif', 'Aktif / Cuti / Nonaktif. Kosong = Aktif.', []],
                ['password', 'Kata Sandi', false, '', 'Kosong = dibuat acak dan ditampilkan sekali setelah impor.', ['sandi', 'kata kunci']],
            ],
            'bank-soal' => [
                ['mapel', 'Mata Pelajaran', true, 'Bahasa Indonesia', 'Nama atau kode mapel.', ['mapel', 'kode mapel', 'pelajaran']],
                ['program', 'Program', false, 'Paket C', 'Isi bila nama mapel sama di beberapa program.', ['paket', 'jenjang']],
                ['tipe', 'Tipe', true, 'PG', 'PG atau Esai.', ['tipe soal', 'jenis soal']],
                ['tingkat', 'Tingkat', false, 'Sedang', 'Mudah / Sedang / Sulit. Kosong = Sedang.', ['tingkat kesulitan', 'kesulitan']],
                ['pertanyaan', 'Pertanyaan', true, 'Tujuan utama teks eksplanasi adalah ...', '', ['soal', 'butir soal']],
                ['opsi_a', 'Pilihan A', false, 'Menghibur pembaca', 'Wajib untuk PG.', ['a', 'opsi a', 'jawaban a']],
                ['opsi_b', 'Pilihan B', false, 'Menjelaskan proses terjadinya fenomena', 'Wajib untuk PG.', ['b', 'opsi b', 'jawaban b']],
                ['opsi_c', 'Pilihan C', false, 'Membujuk pembaca', '', ['c', 'opsi c', 'jawaban c']],
                ['opsi_d', 'Pilihan D', false, 'Menceritakan pengalaman pribadi', '', ['d', 'opsi d', 'jawaban d']],
                ['kunci', 'Kunci', false, 'B', 'A–D, wajib untuk PG.', ['kunci jawaban', 'jawaban benar']],
                ['pedoman', 'Pedoman Penskoran', false, '', 'Untuk esai (opsional).', ['pedoman', 'rubrik']],
            ],
        };
    }

    public static function norm(?string $s): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', ' ', Str::lower(Str::ascii((string) $s))));
    }

    /** Info untuk modal impor: kolom & daftar acuan (kelas / mapel yang valid). */
    public static function info(string $jenis, User $user): array
    {
        return [
            'jenis' => $jenis,
            'kolom' => collect(self::kolom($jenis))->map(fn($k) => ['judul' => $k[1], 'wajib' => $k[2], 'contoh' => $k[3], 'ket' => $k[4]]),
            'acuan' => match ($jenis) {
                'peserta-didik' => ['Kelas yang tersedia', Kelas::with('program')->orderBy('program_id')->get()->map(fn($k) => "{$k->program->nama} — {$k->nama}")],
                'bank-soal' => ['Mata pelajaran yang tersedia', self::mapelBoleh($user)->map(fn($m) => "{$m->nama} ({$m->program->nama})" . ($m->kode ? " · kode {$m->kode}" : ''))],
                default => null,
            },
        ];
    }

    private static function mapelBoleh(User $user)
    {
        return Mapel::with('program')->when($user->role === 'tutor', fn($q) => $q->whereIn('id', $user->mengajar()->select('mapel_id')))->orderBy('program_id')->orderBy('nama')->get();
    }

    /** Templat Excel (.xlsx) siap isi beserta lembar contoh & petunjuk. */
    public static function templat(string $jenis): string
    {
        $kolom = self::kolom($jenis);
        $strings = [];
        $strIdx = function (string $s) use (&$strings): int {
            $strings[] = htmlspecialchars($s, ENT_XML1 | ENT_QUOTES, 'UTF-8');

            return count($strings) - 1;
        };
        $buatSheet = function (array $rows, array $widths) use ($strIdx): string {
            $cols = implode('', array_map(fn($i, $w) => '<col min="' . ($i + 1) . '" max="' . ($i + 1) . '" width="' . $w . '" customWidth="1" style="0"/>', array_keys($widths), $widths));
            $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>' . $cols . '</cols><sheetData>';
            foreach ($rows as $rIdx => $row) {
                $h = $rIdx === 0 ? ' ht="24" customHeight="1"' : '';
                $xml .= '<row r="' . ($rIdx + 1) . '"' . $h . '>';
                foreach (array_values($row) as $cIdx => $val) {
                    $ref = chr(65 + $cIdx) . ($rIdx + 1);
                    $style = $rIdx === 0 ? 1 : 0;
                    $xml .= '<c r="' . $ref . '" s="' . $style . '" t="s"><v>' . $strIdx((string) $val) . '</v></c>';
                }
                $xml .= '</row>';
            }

            return $xml . '</sheetData></worksheet>';
        };

        $judul = array_map(fn($k) => $k[1] . ($k[2] ? '*' : ''), $kolom);
        $lebar1 = array_map(fn($k) => max(mb_strlen($k[1]) + 5, min(mb_strlen($k[3]) + 4, 36), 14), $kolom);
        $baris2 = [
            ['Kolom', 'Sifat', 'Contoh Pengisian', 'Keterangan'],
            ...array_map(fn($k) => [$k[1] . ($k[2] ? '*' : ''), $k[2] ? 'Wajib' : 'Opsional', $k[3], $k[4]], $kolom),
        ];

        $path = tempnam(sys_get_temp_dir(), 'tmpl');
        $zip = new \ZipArchive;
        $zip->open($path, \ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data Impor" sheetId="1" r:id="rId1"/><sheet name="Contoh dan Petunjuk" sheetId="2" r:id="rId2"/></sheets></workbook>');
        $zip->addFromString('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="medium"><color rgb="FF94A3B8"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="49" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
        $zip->addFromString('xl/worksheets/sheet1.xml', $buatSheet([$judul], $lebar1));
        $zip->addFromString('xl/worksheets/sheet2.xml', $buatSheet($baris2, [22, 12, 38, 48]));
        $zip->addFromString('xl/sharedStrings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' . count($strings) . '" uniqueCount="' . count($strings) . '">' . implode('', array_map(fn($s) => "<si><t>{$s}</t></si>", $strings)) . '</sst>');
        $zip->close();

        $isi = file_get_contents($path);
        @unlink($path);

        return $isi;
    }

    // ── Membaca berkas ──────────────────────────────────────────────────
    /** @return array<int, array> baris data: ['_baris' => nomor baris di berkas, kunci => nilai] */
    public static function baca(UploadedFile $file, string $jenis): array
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $mentah = $ext === 'xlsx' ? self::bacaXlsx($file->getRealPath()) : self::bacaCsv($file->getRealPath());
        $mentah = array_values(array_filter($mentah, fn($r) => implode('', array_map('trim', $r[1])) !== ''));
        if ($mentah && count(array_filter($mentah[0][1], fn($v) => trim($v) !== '')) === 1 && str_contains($mentah[0][1][0] ?? '', ';')) {
            $mentah = array_map(fn($r) => [$r[0], count(array_filter($r[1], fn($v) => trim($v) !== '')) === 1 ? str_getcsv($r[1][0] ?? '', ';', '"', '') : $r[1]], $mentah);
        }
        if ($mentah && count(array_filter($mentah[0][1], fn($v) => trim($v) !== '')) === 1 && str_contains($mentah[0][1][0] ?? '', ';')) {
            $mentah = array_map(fn($r) => [$r[0], count(array_filter($r[1], fn($v) => trim($v) !== '')) === 1 ? str_getcsv($r[1][0] ?? '', ';', '"', '') : $r[1]], $mentah);
        }
        if (count($mentah) < 2) {
            throw ValidationException::withMessages(['berkas' => 'Berkas kosong atau hanya berisi judul kolom.']);
        }
        if (count($mentah) - 1 > self::MAKS_BARIS) {
            throw ValidationException::withMessages(['berkas' => 'Maksimal ' . self::MAKS_BARIS . ' baris per impor. Pecah berkas menjadi beberapa bagian.']);
        }

        // Cocokkan judul kolom dengan definisi (judul, kunci, atau alias).
        $peta = [];
        foreach ($mentah[0][1] as $i => $judul) {
            $j = self::norm(str_replace('*', '', $judul));
            foreach (self::kolom($jenis) as [$kunci, $label,,,, $alias]) {
                if ($j !== '' && in_array($j, array_map([self::class, 'norm'], [$label, str_replace('_', ' ', $kunci), ...$alias]), true)) {
                    $peta[$i] = $kunci;
                }
            }
        }
        $hilang = collect(self::kolom($jenis))->filter(fn($k) => $k[2] && ! in_array($k[0], $peta, true))->pluck(1);
        if ($hilang->isNotEmpty()) {
            throw ValidationException::withMessages(['berkas' => 'Kolom wajib tidak ditemukan: ' . $hilang->join(', ') . '. Gunakan templat yang disediakan.']);
        }

        return collect(array_slice($mentah, 1))->map(function ($r) use ($peta) {
            $baris = ['_baris' => $r[0]];
            foreach ($peta as $i => $kunci) {
                $baris[$kunci] = trim((string) ($r[1][$i] ?? ''));
            }

            return $baris;
        })->all();
    }

    /** @return array<int, array{0:int,1:array}> [nomor baris, sel] */
    private static function bacaCsv(string $path): array
    {
        $isi = file_get_contents($path);
        $isi = preg_replace('/^\xEF\xBB\xBF/', '', $isi);
        if (! mb_check_encoding($isi, 'UTF-8')) {
            $isi = mb_convert_encoding($isi, 'UTF-8', 'Windows-1252');
        }
        $baris1 = strtok($isi, "\n");
        $lewat = 0;
        if (preg_match('/^sep=(.)/i', trim($baris1), $m)) {
            $sep = $m[1];
            $isi = substr($isi, strlen($baris1) + 1);
            $baris1 = strtok($isi, "\n");
            $lewat = 1;
        } else {
            $sep = collect([';', ',', "\t"])->sortByDesc(fn($d) => substr_count($baris1, $d))->first();
        }
        $h = fopen('php://temp', 'r+');
        fwrite($h, $isi);
        rewind($h);
        $hasil = [];
        $no = $lewat;
        while (($r = fgetcsv($h, null, $sep, '"', '')) !== false) {
            $hasil[] = [++$no, $r];
        }
        fclose($h);

        return $hasil;
    }

    private static function bacaXlsx(string $path): array
    {
        $zip = new \ZipArchive;
        if ($zip->open($path) !== true) {
            throw ValidationException::withMessages(['berkas' => 'Berkas Excel tidak dapat dibuka. Simpan ulang sebagai .xlsx atau .csv.']);
        }
        $strings = [];
        if (($xml = $zip->getFromName('xl/sharedStrings.xml')) !== false) {
            foreach (simplexml_load_string($xml)->si as $si) {
                $strings[] = implode('', array_map('strval', $si->xpath('.//*[local-name()="t"]')));
            }
        }
        $sheet = $zip->getFromName('xl/worksheets/sheet1.xml');
        for ($i = 0; $sheet === false && $i < $zip->numFiles; $i++) {
            if (preg_match('#^xl/worksheets/sheet\d+\.xml$#', $zip->getNameIndex($i))) {
                $sheet = $zip->getFromIndex($i);
            }
        }
        $zip->close();
        if ($sheet === false) {
            throw ValidationException::withMessages(['berkas' => 'Lembar kerja tidak ditemukan di berkas Excel.']);
        }

        $hasil = [];
        foreach (simplexml_load_string($sheet)->sheetData->row as $row) {
            $sel = [];
            foreach ($row->c as $c) {
                $kol = 0;
                foreach (str_split(preg_replace('/\d+/', '', (string) $c['r'])) as $huruf) {
                    $kol = $kol * 26 + ord($huruf) - 64;
                }
                $t = (string) $c['t'];
                $v = match ($t) {
                    's' => $strings[(int) $c->v] ?? '',
                    'inlineStr' => implode('', array_map('strval', $c->xpath('.//*[local-name()="t"]'))),
                    default => (string) $c->v
                };
                if ($t === '' && is_numeric($v) && str_contains(strtolower($v), 'e')) {
                    $v = number_format((float) $v, 0, '', '');
                }
                $sel[$kol - 1] = $v;
            }
            $hasil[] = [(int) $row['r'], $sel ? array_replace(array_fill(0, max(array_keys($sel)) + 1, ''), $sel) : []];
        }

        return $hasil;
    }

    // ── Normalisasi nilai sel ───────────────────────────────────────────
    private static function tanggal(string $v): ?string
    {
        if ($v === '') {
            return null;
        }
        if (is_numeric($v) && $v > 1000 && $v < 80000) {
            return Carbon::create(1899, 12, 30)->addDays((int) $v)->toDateString();
        } // nomor seri tanggal Excel
        foreach (['d/m/Y', 'd-m-Y', 'Y-m-d', 'd.m.Y', 'j/n/Y'] as $f) {
            try {
                return Carbon::createFromFormat('!' . $f, $v)->toDateString();
            } catch (\Throwable) {
                // coba format berikutnya
            }
        }

        return 'tidak-valid';
    }

    private static function telepon(string $v): ?string
    {
        if ($v === '') {
            return null;
        }

        return ctype_digit($v) && str_starts_with($v, '8') ? '0' . $v : $v; // angka 0 di depan hilang di Excel
    }

    // ── Proses impor ────────────────────────────────────────────────────
    public static function proses(string $jenis, UploadedFile $file, User $user, bool $lewati): array
    {
        $baris = self::baca($file, $jenis);
        [$siap, $galat] = match ($jenis) {
            'peserta-didik' => self::siapkanPeserta($baris),
            'tutor' => self::siapkanTutor($baris),
            'bank-soal' => self::siapkanSoal($baris, $user),
        };
        $ringkas = ['total' => count($baris), 'galat' => array_slice($galat, 0, 100), 'jumlahGalat' => count($galat)];
        if ($galat && ! $lewati) {
            return $ringkas + ['ok' => false, 'valid' => count($siap)];
        }

        $hasil = ['dibuat' => 0, 'diperbarui' => 0, 'dilewati' => 0, 'akun' => []];
        DB::transaction(function () use ($siap, &$hasil) {
            foreach ($siap as $s) {
                if ($s['aksi'] === 'lewati') {
                    $hasil['dilewati']++;

                    continue;
                }
                $s['simpan']();
                $hasil[$s['aksi'] === 'buat' ? 'dibuat' : 'diperbarui']++;
                if (isset($s['akun'])) {
                    $hasil['akun'][] = $s['akun'];
                }
            }
        });

        return $ringkas + $hasil + ['ok' => true];
    }

    private static function validasi(array $d, array $rules): array
    {
        return Validator::make($d, $rules, [], trans('validation.attributes'))->errors()->all();
    }

    private static function siapkanPeserta(array $baris): array
    {
        $kelas = Kelas::with('program')->get();
        $nisnFile = collect($baris)->pluck('nomor_induk')->map(fn($n) => ctype_digit($n) && strlen($n) < 10 ? str_pad($n, 10, '0', STR_PAD_LEFT) : $n);
        $ada = User::whereIn('username', $nisnFile)->orWhereIn('nomor_induk', $nisnFile)->get();
        $cari = fn($nisn) => $ada->first(fn($u) => $u->role === 'siswa' && $u->nomor_induk === $nisn) ?? $ada->firstWhere('username', $nisn);
        $siap = $galat = $lihat = [];

        foreach ($baris as $r) {
            $nisn = ctype_digit($r['nomor_induk']) && strlen($r['nomor_induk']) < 10 ? str_pad($r['nomor_induk'], 10, '0', STR_PAD_LEFT) : $r['nomor_induk'];
            $n = self::norm($r['kelas']);
            $p = self::norm($r['program'] ?? '');
            $cocok = $kelas->filter(fn($k) => (self::norm($k->nama) === $n && ($p === '' || self::norm($k->program->nama) === $p)) || self::norm($k->program->nama . ' ' . $k->nama) === $n);
            $jk = match (self::norm($r['jenis_kelamin'])) {
                'l', 'laki laki', 'laki', 'pria' => 'Laki-laki',
                'p', 'perempuan', 'wanita' => 'Perempuan',
                default => $r['jenis_kelamin']
            };
            $d = [
                'name' => $r['name'],
                'nomor_induk' => $nisn,
                'jenis_kelamin' => $jk,
                'tanggal_lahir' => self::tanggal($r['tanggal_lahir'] ?? ''),
                'telepon' => self::telepon($r['telepon'] ?? ''),
                'email' => ($r['email'] ?? '') ?: null,
                'alamat' => ($r['alamat'] ?? '') ?: null,
                'status' => ($r['status'] ?? '') ?: 'Aktif',
                'password' => ($r['password'] ?? '') ?: null
            ];
            $lama = $cari($nisn);

            $pesan = self::validasi($d, [
                'name' => 'required|string|max:120',
                'nomor_induk' => 'required|string|max:20',
                'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
                'tanggal_lahir' => 'nullable|date|before:today',
                'telepon' => 'nullable|string|max:30',
                'email' => ['nullable', 'email', Rule::unique('users')->ignore($lama)],
                'alamat' => 'nullable|max:500',
                'status' => ['required', Rule::in(Resources::STATUS_SISWA)],
                'password' => 'nullable|string|min:6',
            ]);
            if ($cocok->count() !== 1) {
                $pesan[] = $cocok->isEmpty() ? "Kelas “{$r['kelas']}” tidak ditemukan." : "Kelas “{$r['kelas']}” ada di beberapa program; isi kolom Program.";
            }
            if ($lama && $lama->role !== 'siswa') {
                $pesan[] = "NISN {$nisn} sudah dipakai sebagai username akun lain.";
            }
            if (isset($lihat[$nisn])) {
                $pesan[] = "NISN {$nisn} ganda dengan baris {$lihat[$nisn]}.";
            }
            $lihat[$nisn] = $r['_baris'];
            if ($pesan) {
                $galat[] = ['baris' => $r['_baris'], 'nama' => $r['name'] ?: '—', 'pesan' => implode(' ', $pesan)];

                continue;
            }

            $data = array_filter($d, fn($v) => $v !== null) + ['kelas_id' => $cocok->first()->id, 'role' => 'siswa'];
            if (! $lama) {
                $data += ['username' => $nisn, 'password' => $data['password'] ?? $nisn];
            } // username lama tidak diubah
            $siap[] = ['aksi' => $lama ? 'ubah' : 'buat', 'simpan' => fn() => $lama ? $lama->update($data) : User::create($data)];
        }

        return [$siap, $galat];
    }

    private static function siapkanTutor(array $baris): array
    {
        $siap = $galat = $lihat = [];
        $dipakai = User::pluck('username')->flip()->all();

        foreach ($baris as $r) {
            $email = Str::lower($r['email']);
            $lama = $email ? User::where('email', $email)->orWhere(fn($q) => $r['username'] !== '' ? $q->where('username', $r['username']) : $q->whereRaw('0 = 1'))->first() : null;
            $username = $r['username'] ?: ($lama?->username ?? Str::of($email)->before('@')->slug('_')->limit(30, '')->toString());
            if (! $r['username'] && ! $lama) {
                $dasar = $username ?: 'tutor';
                for ($i = 2; isset($dipakai[$username]); $i++) {
                    $username = $dasar . $i;
                }
            }
            $d = [
                'name' => $r['name'],
                'email' => $email,
                'username' => $username,
                'nomor_induk' => ($r['nomor_induk'] ?? '') ?: null,
                'jabatan' => ($r['jabatan'] ?? '') ?: null,
                'pendidikan' => ($r['pendidikan'] ?? '') ?: null,
                'telepon' => self::telepon($r['telepon'] ?? ''),
                'status' => ($r['status'] ?? '') ?: 'Aktif',
                'password' => ($r['password'] ?? '') ?: null
            ];

            $pesan = self::validasi($d, [
                'name' => 'required|string|max:120',
                'email' => ['required', 'email', Rule::unique('users')->ignore($lama)],
                'username' => ['required', 'alpha_dash', 'max:40', Rule::unique('users')->ignore($lama)],
                'nomor_induk' => 'nullable|max:30',
                'jabatan' => 'nullable|max:80',
                'pendidikan' => 'nullable|max:80',
                'telepon' => 'nullable|max:30',
                'status' => 'required|in:Aktif,Cuti,Nonaktif',
                'password' => 'nullable|string|min:8',
            ]);
            if ($lama && $lama->role !== 'tutor') {
                $pesan[] = 'Email/username sudah dipakai akun yang bukan tutor.';
            }
            if (isset($lihat[$email]) || isset($lihat['u:' . $username])) {
                $pesan[] = 'Email atau username ganda dengan baris ' . ($lihat[$email] ?? $lihat['u:' . $username]) . '.';
            }
            $lihat[$email] = $lihat['u:' . $username] = $r['_baris'];
            if ($pesan) {
                $galat[] = ['baris' => $r['_baris'], 'nama' => $r['name'] ?: '—', 'pesan' => implode(' ', $pesan)];

                continue;
            }

            $dipakai[$username] = true;
            $data = array_filter($d, fn($v) => $v !== null) + ['role' => 'tutor'];
            $akun = null;
            if (! $lama && empty($data['password'])) {
                $data['password'] = Str::password(10, symbols: false);
                $akun = ['nama' => $d['name'], 'username' => $username, 'password' => $data['password']];
            }
            $siap[] = ['aksi' => $lama ? 'ubah' : 'buat', 'simpan' => fn() => $lama ? $lama->update($data) : User::create($data), 'akun' => $akun];
            if (! $akun) {
                unset($siap[array_key_last($siap)]['akun']);
            }
        }

        return [$siap, $galat];
    }

    private static function siapkanSoal(array $baris, User $user): array
    {
        $mapel = self::mapelBoleh($user);
        $siap = $galat = $lihat = [];

        foreach ($baris as $r) {
            $n = self::norm($r['mapel']);
            $p = self::norm($r['program'] ?? '');
            $cocok = $mapel->filter(fn($m) => ($m->kode && self::norm($m->kode) === $n) || (self::norm($m->nama) === $n && ($p === '' || self::norm($m->program->nama) === $p)));
            $tipe = match (self::norm($r['tipe'])) {
                'pg', 'pilihan ganda', 'pilgan', 'multiple choice' => 'pg',
                'esai', 'essay', 'uraian', 'isian' => 'esai',
                default => $r['tipe']
            };
            $opsi = array_values(array_filter([$r['opsi_a'] ?? '', $r['opsi_b'] ?? '', $r['opsi_c'] ?? '', $r['opsi_d'] ?? ''], fn($v) => $v !== ''));
            $kunci = ['a' => 0, 'b' => 1, 'c' => 2, 'd' => 3][self::norm($r['kunci'] ?? '')] ?? null;
            $d = ['pertanyaan' => $r['pertanyaan'], 'tipe' => $tipe, 'tingkat' => Str::ucfirst(Str::lower(($r['tingkat'] ?? '') ?: 'Sedang'))];

            $pesan = self::validasi($d, ['pertanyaan' => 'required|max:3000', 'tipe' => 'required|in:pg,esai', 'tingkat' => 'required|in:Mudah,Sedang,Sulit']);
            if ($cocok->count() !== 1) {
                $pesan[] = $cocok->isEmpty() ? "Mata pelajaran “{$r['mapel']}” tidak ditemukan" . ($user->role === 'tutor' ? ' atau tidak Anda ampu' : '') . '.' : "Mata pelajaran “{$r['mapel']}” ada di beberapa program; isi kolom Program.";
            }
            if ($tipe === 'pg' && count($opsi) < 2) {
                $pesan[] = 'Soal pilihan ganda butuh minimal Pilihan A dan B.';
            }
            if ($tipe === 'pg' && ($kunci === null || ! isset($opsi[$kunci]))) {
                $pesan[] = 'Kunci harus A–D dan menunjuk pilihan yang terisi.';
            }
            if ($pesan) {
                $galat[] = ['baris' => $r['_baris'], 'nama' => Str::limit($r['pertanyaan'] ?: '—', 50), 'pesan' => implode(' ', $pesan)];

                continue;
            }

            $m = $cocok->first();
            $kunciDup = $m->id . '|' . self::norm($d['pertanyaan']);
            if (isset($lihat[$kunciDup]) || Soal::where('mapel_id', $m->id)->where('pertanyaan', $d['pertanyaan'])->exists()) {
                $siap[] = ['aksi' => 'lewati'];

                continue;
            }
            $lihat[$kunciDup] = true;
            $data = $d + ['mapel_id' => $m->id, 'pembuat_id' => $user->id, 'opsi' => $tipe === 'pg' ? $opsi : null, 'kunci' => $tipe === 'pg' ? (string) $kunci : (($r['pedoman'] ?? '') ?: null)];
            $siap[] = ['aksi' => 'buat', 'simpan' => fn() => Soal::create($data)];
        }

        return [$siap, $galat];
    }
}
