<?php

namespace Database\Seeders;

use App\Models\Diskusi;
use App\Models\HasilUjian;
use App\Models\Kelas;
use App\Models\Mapel;
use App\Models\Materi;
use App\Models\Notifikasi;
use App\Models\Pengajaran;
use App\Models\Pengumpulan;
use App\Models\Pengumuman;
use App\Models\Program;
use App\Models\Sesi;
use App\Models\Soal;
use App\Models\Tugas;
use App\Models\Ujian;
use App\Models\User;
use App\Support\Akademik;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Data contoh realistis untuk uji coba (php artisan db:seed --class=DemoSeeder).
 * Tanggal dibuat relatif terhadap hari ini agar status tugas/ujian selalu bermakna.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(2026);
        $pw = app()->isProduction() ? Str::password(10, symbols: false) : 'password';
        $now = now();
        User::where('username', 'admin')->update(['name' => 'Ahmad Fauzan, S.Kom.']);

        // ── Tutor ───────────────────────────────────────────────────────
        $tutor = [];
        foreach ([
            ['bin', 'Nurul Aini, M.Pd.', 'tutor', 'TTR-2019-004', 'Tutor Bahasa Indonesia', 'S2 Pendidikan Bahasa Indonesia'],
            ['mat', 'Hendra Wijaya, M.Pd.', 'hendra', 'TTR-2018-002', 'Tutor Matematika', 'S2 Pendidikan Matematika'],
            ['big', 'Sarah Amelia, S.Pd.', 'sarah', 'TTR-2021-011', 'Tutor Bahasa Inggris', 'S1 Pendidikan Bahasa Inggris'],
            ['ppk', 'Drs. Bambang Irawan', 'bambang', 'TTR-2015-001', 'Tutor Pendidikan Pancasila', 'S1 PPKn'],
            ['ipa', 'Rina Kartika, S.Si.', 'rina', 'TTR-2020-007', 'Tutor IPA', 'S1 Biologi'],
            ['ips', 'Ahmad Fauzi, S.Sos.', 'fauzi', 'TTR-2020-008', 'Tutor IPS', 'S1 Sosiologi'],
            ['pag', 'Muhammad Ridwan, S.Ag.', 'ridwan', 'TTR-2022-014', 'Tutor Pendidikan Agama', 'S1 Pendidikan Agama'],
            ['sd', 'Dewi Lestari, S.Pd.', 'dewi', 'TTR-2017-003', 'Guru Kelas Paket A', 'S1 PGSD'],
        ] as [$k, $name, $username, $nip, $jabatan, $pend]) {
            $tutor[$k] = User::create([
                'name' => $name, 'username' => $username, 'role' => 'tutor', 'nomor_induk' => $nip, 'jabatan' => $jabatan, 'pendidikan' => $pend,
                'email' => Str::slug(Str::before($name, ','), '.').'@pkbmbhp.sch.id', 'telepon' => '0812-'.mt_rand(1000, 9999).'-'.mt_rand(1000, 9999), 'password' => $pw,
            ]);
        }

        // ── Kelas & mapel ───────────────────────────────────────────────
        $prog = Program::pluck('id', 'nama');
        $kelas = [];
        foreach ([
            ['XII IPS 1', 'Paket C', 'Tingkat VI', 'bin', 'Ruang Teori C-1', 'Sabtu & Minggu, 08.00–12.00'],
            ['XI IPS', 'Paket C', 'Tingkat V', 'ips', 'Ruang Teori C-2', 'Sabtu & Minggu, 13.00–16.00'],
            ['Kelas 9', 'Paket B', 'Tingkat IV', 'ppk', 'Ruang Teori B-1', 'Sabtu, 08.00–12.00'],
            ['Kelas 8', 'Paket B', 'Tingkat IV', 'ipa', 'Ruang Teori B-2', 'Minggu, 08.00–12.00'],
            ['Kelas 6', 'Paket A', 'Tingkat III', 'sd', 'Ruang Teori A-1', 'Sabtu, 08.00–11.00'],
            ['Kelas 5', 'Paket A', 'Tingkat III', 'sd', 'Ruang Teori A-1', 'Minggu, 08.00–11.00'],
        ] as [$nama, $p, $tingkat, $wali, $ruang, $jadwal]) {
            $kelas[] = Kelas::create(['nama' => $nama, 'program_id' => $prog[$p], 'tingkat' => $tingkat, 'wali_id' => $tutor[$wali]->id, 'ruang' => $ruang, 'jadwal' => $jadwal]);
        }

        $daftarMapel = [
            ['bin', 'Bahasa Indonesia', 'menu_book', 'Teks eksplanasi, ulasan, dan argumentasi untuk komunikasi formal sehari-hari.'],
            ['mat', 'Matematika', 'calculate', 'Statistika, peluang, dan matematika keuangan untuk kebutuhan usaha.'],
            ['big', 'Bahasa Inggris', 'translate', 'Recount text, surat lamaran kerja, dan percakapan profesional.'],
            ['ppk', 'Pendidikan Pancasila', 'balance', 'Hak dan kewajiban warga negara serta harmoni dalam keberagaman.'],
            ['ipa', 'IPA', 'science', 'Ekosistem, energi terbarukan, dan kesehatan lingkungan sekitar.'],
            ['ips', 'IPS', 'public', 'Kegiatan ekonomi, perubahan sosial, dan potensi daerah.'],
            ['pag', 'Pendidikan Agama', 'volunteer_activism', 'Akhlak, keteladanan, dan toleransi dalam kehidupan bermasyarakat.'],
        ];
        $mapel = [];
        foreach (['Paket A' => 'A', 'Paket B' => 'B', 'Paket C' => 'C'] as $p => $huruf) {
            foreach ($daftarMapel as [$k, $nama, $icon, $desk]) {
                if ($p === 'Paket A' && $k === 'big') continue;
                $mapel[$p][$k] = Mapel::create(['program_id' => $prog[$p], 'nama' => $nama, 'kode' => strtoupper($k).'-'.$huruf, 'icon' => $icon, 'deskripsi' => $desk]);
            }
        }

        // Jadwal tetap: [hari 0=Senin, mulai, selesai, tempat, mode]
        $jadwal = [
            0 => ['ips' => [2, '19:00', '20:30', 'Google Meet', 'Daring'], 'ppk' => [3, '19:00', '20:30', 'Google Meet', 'Daring'], 'pag' => [4, '19:00', '20:00', 'Google Meet', 'Daring'],
                'bin' => [5, '08:00', '09:30', 'Ruang Teori C-1', 'Tatap Muka'], 'mat' => [5, '10:00', '11:30', 'Lab Komputer', 'Tatap Muka'],
                'big' => [6, '08:00', '09:30', 'Ruang Teori C-1', 'Tatap Muka'], 'ipa' => [6, '10:00', '11:30', 'Ruang Teori C-1', 'Tatap Muka']],
            1 => ['bin' => [3, '19:00', '20:30', 'Google Meet', 'Daring']],
            2 => ['bin' => [2, '19:00', '20:30', 'Google Meet', 'Daring']],
            3 => ['bin' => [6, '08:00', '09:30', 'Ruang Teori B-2', 'Tatap Muka']],
        ];
        $ajar = []; // [indeks kelas][kode mapel] => Pengajaran
        foreach ($kelas as $i => $k) {
            $p = Program::find($k->program_id)->nama;
            foreach ($mapel[$p] as $kode => $m) {
                [$hari, $mulai, $selesai, $tempat, $mode] = $jadwal[$i][$kode] ?? [null, null, null, null, 'Tatap Muka'];
                $ajar[$i][$kode] = Pengajaran::create([
                    'kelas_id' => $k->id, 'mapel_id' => $m->id, 'tutor_id' => $tutor[$p === 'Paket A' ? 'sd' : $kode]->id,
                    'hari' => $hari, 'jam_mulai' => $mulai, 'jam_selesai' => $selesai, 'tempat' => $tempat, 'mode' => $mode,
                ]);
            }
        }

        // ── Peserta didik ───────────────────────────────────────────────
        $siswa = [];
        foreach ([
            ['Budi Santoso', '0081294821', 0, 'Aktif', 'siswa', 'L'], ['Dian Wulandari', '0079918234', 0, 'Aktif', null, 'P'],
            ['Fajar Anugrah Pratama', '0085521907', 0, 'Perlu Pendampingan', null, 'L'], ['Bambang Setyawan', '0076650012', 0, 'Aktif', null, 'L'],
            ['Wulan Sari', '0083390211', 0, 'Aktif', null, 'P'], ['Rahmat Hidayat', '0080012876', 0, 'Aktif', null, 'L'],
            ['Rizky Ramadhan', '0090214456', 1, 'Aktif', null, 'L'], ['Nadia Putri', '0091187340', 1, 'Aktif', null, 'P'],
            ['Siti Maryati', '0092837110', 2, 'Aktif', null, 'P'], ['Andi Saputra', '0096611023', 2, 'Aktif', null, 'L'],
            ['Ayu Kusuma Dewi', '0101187623', 3, 'Aktif', null, 'P'], ['Lestari Handayani', '0128830451', 4, 'Aktif', null, 'P'],
            ['Yoga Prasetyo', '0119002387', 5, 'Nonaktif', null, 'L'],
        ] as [$name, $nisn, $ki, $status, $username, $jk]) {
            $siswa[$name] = User::create([
                'name' => $name, 'username' => $username ?? $nisn, 'role' => 'siswa', 'nomor_induk' => $nisn, 'kelas_id' => $kelas[$ki]->id, 'status' => $status,
                'jenis_kelamin' => $jk === 'L' ? 'Laki-laki' : 'Perempuan', 'tanggal_lahir' => now()->subYears(mt_rand(17, 30))->subDays(mt_rand(0, 360))->toDateString(),
                'email' => $username ? 'budi.santoso@pkbmbhp.sch.id' : null, 'telepon' => '0857-'.mt_rand(1000, 9999).'-'.mt_rand(1000, 9999),
                'alamat' => 'Kec. Bojonggede, Kab. Bogor', 'password' => $pw,
            ]);
        }
        $budi = $siswa['Budi Santoso'];
        $budi->update(['tanggal_lahir' => '2004-03-14', 'alamat' => 'Jl. Raya Bojonggede No. 21, Kab. Bogor', 'telepon' => '0812-8890-1123']);
        $kelas12 = $kelas[0]->siswa()->get();

        // ── Berkas contoh (PDF kecil) ───────────────────────────────────
        Storage::put('materi/modul-3-bahasa-indonesia.pdf', $this->pdf('Modul 3 - Teks Eksplanasi', ['PKBM Bina Harapan Permata - Paket C Kelas XII', '', 'Struktur teks eksplanasi:', '1. Identifikasi fenomena', '2. Deretan penjelas', '3. Interpretasi']));
        Storage::put('tugas/lembar-kerja.pdf', $this->pdf('Lembar Kerja Tugas', ['Kerjakan sesuai instruksi pada halaman tugas.', 'Unggah hasil dalam format PDF atau gambar.']));
        Storage::put('pengumpulan/contoh-jawaban.pdf', $this->pdf('Contoh Jawaban Peserta Didik', ['Dokumen contoh hasil pekerjaan peserta didik.']));
        Storage::put('pengumuman/jadwal-pts.pdf', $this->pdf('Jadwal PTS Ganjil 2026/2027', ['16-21 November 2026', 'Daring melalui PKBM BHP dan luring di Ruang Komputer.']));

        // ── Materi (kelas XII IPS 1) ────────────────────────────────────
        $materi = [];
        foreach ([
            ['bin', 'Modul 3 · Teks Eksplanasi', [['Pengenalan dan Ciri Teks Eksplanasi', 'Teks', 30], ['Struktur & Ciri Kebahasaan Teks Eksplanasi', 'Video', 45], ['Praktik Menulis Draf Teks Eksplanasi', 'PDF', 40]]],
            ['mat', 'Modul 5 · Statistika Sehari-hari', [['Penyajian Data dalam Tabel dan Diagram', 'Video', 25], ['Menghitung Rata-rata, Median, dan Modus', 'Teks', 35], ['Simpangan Baku untuk Data Penjualan', 'PDF', 40]]],
            ['big', 'Module 4 · Recount Text', [['Generic Structure of Recount Text', 'Video', 20], ['Simple Past Tense in Context', 'Teks', 30]]],
            ['ipa', 'Modul 3 · Energi Terbarukan', [['Sumber Energi di Sekitar Kita', 'PDF', 30], ['Membuat Pemanas Air Tenaga Surya Sederhana', 'Video', 18]]],
            ['ips', 'Modul 2 · Kegiatan Ekonomi', [['Pelaku Kegiatan Ekonomi di Daerah', 'Teks', 30]]],
            ['ppk', 'Modul 2 · Hak dan Kewajiban', [['Hak dan Kewajiban Warga Negara', 'Teks', 30]]],
            ['pag', 'Modul 2 · Keteladanan', [['Kisah Keteladanan dalam Kehidupan', 'Teks', 25]]],
        ] as [$kode, $modul, $items]) {
            foreach ($items as $u => [$judul, $tipe, $durasi]) {
                $materi[$judul] = Materi::create([
                    'pengajaran_id' => $ajar[0][$kode]->id, 'modul' => $modul, 'judul' => $judul, 'tipe' => $tipe, 'durasi' => $durasi, 'urutan' => $u,
                    'deskripsi' => 'Memahami konsep '.Str::lower($judul).' melalui penjelasan, contoh nyata, dan latihan singkat.',
                    'konten' => $judul === 'Struktur & Ciri Kebahasaan Teks Eksplanasi' ? $this->kontenEksplanasi() : $this->kontenUmum($judul),
                    'file_path' => $kode === 'bin' && $u === 1 ? 'materi/modul-3-bahasa-indonesia.pdf' : null,
                    'file_nama' => $kode === 'bin' && $u === 1 ? 'Modul_3_Bahasa_Indonesia_BHP.pdf' : null,
                    'created_at' => $now->copy()->subDays(20 - $u * 3),
                ]);
            }
        }
        foreach (['Pengenalan dan Ciri Teks Eksplanasi', 'Penyajian Data dalam Tabel dan Diagram', 'Generic Structure of Recount Text', 'Pelaku Kegiatan Ekonomi di Daerah', 'Hak dan Kewajiban Warga Negara', 'Kisah Keteladanan dalam Kehidupan'] as $j) {
            $budi->materiSelesai()->attach($materi[$j]->id, ['created_at' => $now->copy()->subDays(mt_rand(1, 10))]);
        }
        foreach ($kelas12->where('id', '!=', $budi->id) as $s) {
            foreach (collect($materi)->random(mt_rand(2, 8)) as $m) {
                $s->materiSelesai()->attach($m->id, ['created_at' => $now->copy()->subDays(mt_rand(1, 14))]);
            }
        }

        // ── Tugas & pengumpulan ─────────────────────────────────────────
        $tugas = fn ($ki, $kode, $judul, $tenggat, $diberikan, $instruksi = null) => Tugas::create([
            'pengajaran_id' => $ajar[$ki][$kode]->id, 'judul' => $judul, 'tenggat' => $tenggat, 'created_at' => $diberikan,
            'instruksi' => $instruksi ?? "Pelajari kembali materi pada modul terkait sebelum mengerjakan.\nKerjakan secara mandiri sesuai petunjuk pada lembar kerja.\nUnggah hasil pekerjaan dalam format PDF, DOCX, atau gambar (maksimal 10 MB).",
            'lampiran_path' => 'tugas/lembar-kerja.pdf', 'lampiran_nama' => 'Lembar_Kerja_'.Str::slug($judul, '_').'.pdf',
        ]);
        $t1 = $tugas(0, 'mat', 'Latihan Soal Statistika: Rata-rata dan Simpangan Baku', $now->copy()->addDay()->setTime(23, 59), $now->copy()->subDays(6),
            "Unduh lembar kerja statistika pada bagian lampiran.\nHitung rata-rata, median, modus, dan simpangan baku dari data penjualan warung selama 10 hari.\nTuliskan langkah perhitungan secara lengkap, bukan hanya jawaban akhir.\nUnggah hasil dalam bentuk PDF atau foto yang jelas (maksimal 10 MB).");
        $t2 = $tugas(0, 'bin', 'Menulis Teks Eksplanasi tentang Fenomena Alam di Sekitarmu', $now->copy()->addDays(3)->setTime(23, 59), $now->copy()->subDays(3),
            "Pilih satu fenomena alam yang pernah terjadi di sekitar tempat tinggalmu, misalnya banjir, kemarau, atau angin puting beliung.\nTulis teks eksplanasi minimal 4 paragraf dengan struktur: identifikasi fenomena, deretan penjelas, dan interpretasi.\nGunakan minimal tiga konjungsi kausalitas (karena, sehingga, akibatnya) dan dua konjungsi temporal.\nKumpulkan dalam format .docx atau .pdf dengan nama file: Nama_Kelas_TeksEksplanasi.");
        $t3 = $tugas(0, 'big', 'Recount Text: My Most Memorable Experience', $now->copy()->addDays(6)->setTime(23, 59), $now->copy()->subDays(2));
        $t4 = $tugas(0, 'ppk', 'Analisis Kasus Pelanggaran Hak dan Pengingkaran Kewajiban', $now->copy()->subDays(4)->setTime(23, 59), $now->copy()->subDays(15));
        $t5 = $tugas(0, 'ipa', 'Laporan Pengamatan Ekosistem di Lingkungan Rumah', $now->copy()->subDays(5)->setTime(23, 59), $now->copy()->subDays(16));
        $t6 = $tugas(0, 'ips', 'Peta Persebaran Kegiatan Ekonomi di Daerah Tempat Tinggal', $now->copy()->subDays(12)->setTime(23, 59), $now->copy()->subDays(23));
        $t7 = $tugas(0, 'pag', 'Rangkuman Kisah Keteladanan dan Nilai Moral', $now->copy()->subDays(18)->setTime(23, 59), $now->copy()->subDays(27));
        $t8 = $tugas(0, 'bin', 'Analisis Struktur Teks Ulasan', $now->copy()->subDays(5)->setTime(23, 59), $now->copy()->subDays(14));
        $t9 = $tugas(1, 'bin', 'Ulasan Film Pendek Bertema Sosial', $now->copy()->subDay()->setTime(21, 0), $now->copy()->subDays(8));
        $t10 = $tugas(2, 'bin', 'Menulis Surat Resmi Permohonan Izin', $now->copy()->subDays(2)->setTime(23, 59), $now->copy()->subDays(9));

        $kumpul = fn ($t, $s, $at, $extra = []) => Pengumpulan::create($extra + [
            'tugas_id' => $t->id, 'siswa_id' => $s->id, 'status' => 'dikumpulkan', 'dikumpulkan_at' => $at,
            'file_path' => 'pengumpulan/contoh-jawaban.pdf', 'file_nama' => Str::slug($s->name, '_').'_'.Str::slug(Str::limit($t->judul, 20, ''), '_').'.pdf',
        ]);
        $kumpul($t1, $budi, null, ['status' => 'draf', 'dikumpulkan_at' => null, 'file_nama' => 'statistika_budi_draf.pdf']);
        $kumpul($t5, $budi, $now->copy()->subDays(7)->setTime(20, 14));
        $kumpul($t6, $budi, $now->copy()->subDays(13)->setTime(21, 40), ['nilai' => 88, 'dinilai_at' => $now->copy()->subDays(9), 'umpan_balik' => 'Peta sudah rapi dan legendanya jelas. Pertahankan ketelitianmu. Untuk tugas berikutnya, tambahkan sumber data dan sedikit analisis mengapa kegiatan ekonomi terpusat di wilayah tertentu.']);
        $kumpul($t7, $budi, $now->copy()->subDays(19)->setTime(19, 5), ['nilai' => 92, 'dinilai_at' => $now->copy()->subDays(16), 'umpan_balik' => 'Rangkuman runtut dan nilai moralnya tergali dengan baik.']);
        $kumpul($t8, $budi, $now->copy()->subDays(6), ['nilai' => 84, 'dinilai_at' => $now->copy()->subDays(3), 'umpan_balik' => 'Analisis sudah tepat, perhatikan ejaan.']);
        $kumpul($t2, $siswa['Dian Wulandari'], $now->copy()->subHours(3), ['catatan' => 'Saya mengambil fenomena banjir rob di pesisir utara. Mohon koreksinya, Bu.']);
        $kumpul($t2, $siswa['Bambang Setyawan'], $now->copy()->subHours(6));
        $kumpul($t9, $siswa['Rizky Ramadhan'], $now->copy()->subHours(2), ['catatan' => 'Maaf terlambat, Bu. Saya lembur di tempat kerja.']);
        $kumpul($t10, $siswa['Siti Maryati'], $now->copy()->subDays(3), ['nilai' => 90, 'dinilai_at' => $now->copy()->subDays(1), 'umpan_balik' => 'Format surat sudah tepat dan bahasanya santun. Perhatikan penulisan tanggal tanpa angka nol di depan.']);
        $kumpul($t8, $siswa['Fajar Anugrah Pratama'], $now->copy()->subDays(4), ['nilai' => 72, 'dinilai_at' => $now->copy()->subDays(2), 'umpan_balik' => 'Struktur sudah teridentifikasi, tetapi bagian evaluasi masih kurang. Lihat kembali contoh di Modul 2.']);
        foreach ($kelas12->whereNotIn('name', ['Budi Santoso', 'Fajar Anugrah Pratama']) as $s) {
            foreach ([$t5, $t6, $t7, $t8] as $t) {
                if (! Pengumpulan::where('tugas_id', $t->id)->where('siswa_id', $s->id)->exists()) {
                    $kumpul($t, $s, $t->tenggat->copy()->subDays(1), ['nilai' => mt_rand(72, 96), 'dinilai_at' => $t->tenggat->copy()->addDays(2), 'umpan_balik' => 'Kerja bagus, terus tingkatkan.']);
                }
            }
        }

        // ── Bank soal & ujian ───────────────────────────────────────────
        $buatSoal = fn ($kode, $items) => collect($items)->map(fn ($s) => Soal::create([
            'mapel_id' => $mapel['Paket C'][$kode]->id, 'pembuat_id' => $tutor[$kode]->id, 'tipe' => isset($s[1]) && is_array($s[1]) ? 'pg' : 'esai',
            'tingkat' => ['Mudah', 'Sedang', 'Sulit'][mt_rand(0, 2)], 'pertanyaan' => $s[0], 'opsi' => is_array($s[1] ?? null) ? $s[1] : null, 'kunci' => $s[2] ?? ($s[1] ?? null),
        ]));
        $soalBin = $buatSoal('bin', [
            ['Tujuan utama teks eksplanasi adalah ...', ['Menghibur pembaca dengan kisah rekaan', 'Menjelaskan proses terjadinya suatu fenomena secara logis', 'Membujuk pembaca agar membeli suatu produk', 'Menceritakan pengalaman pribadi penulis'], 1],
            ['Bagian teks eksplanasi yang berisi gambaran umum tentang fenomena yang akan dijelaskan disebut ...', ['Interpretasi', 'Deretan penjelas', 'Identifikasi fenomena', 'Orientasi'], 2],
            ['Kata "karena", "sehingga", dan "akibatnya" termasuk jenis konjungsi ...', ['Temporal', 'Kausalitas', 'Pertentangan', 'Penambahan'], 1],
            ['"Hujan turun deras selama tiga hari. Akibatnya, sungai meluap dan merendam permukiman warga." Hubungan antarkalimat tersebut adalah ...', ['Sebab–akibat', 'Perbandingan', 'Urutan waktu', 'Pertentangan'], 0],
            ['Konjungsi yang tepat untuk melengkapi kalimat berikut: "Air laut menguap, ... uap air naik dan membentuk awan."', ['tetapi', 'kemudian', 'meskipun', 'bahkan'], 1],
            ['Berikut yang BUKAN ciri kebahasaan teks eksplanasi adalah ...', ['Menggunakan istilah ilmiah', 'Menggunakan konjungsi kausal dan temporal', 'Banyak menggunakan kata ganti orang pertama "aku"', 'Bersifat informatif dan faktual'], 2],
            ['Bagian interpretasi pada teks eksplanasi berisi ...', ['Daftar istilah sulit', 'Simpulan atau pandangan penulis terhadap fenomena', 'Judul dan identitas penulis', 'Urutan peristiwa secara kronologis'], 1],
            ['Topik berikut yang paling tepat dikembangkan menjadi teks eksplanasi adalah ...', ['Liburan ke rumah nenek', 'Proses terjadinya gempa bumi tektonik', 'Resep membuat nasi goreng', 'Biografi tokoh pahlawan nasional'], 1],
            ['Jelaskan tiga struktur teks eksplanasi beserta fungsi masing-masing!', 'Skor penuh bila menyebut identifikasi fenomena, deretan penjelas, dan interpretasi beserta fungsinya.'],
            ['Tuliskan satu paragraf deretan penjelas tentang proses terjadinya banjir di perkotaan dengan menggunakan minimal dua konjungsi kausalitas!', 'Paragraf runtut, memuat minimal dua konjungsi kausalitas.'],
        ]);
        $soalMat = $buatSoal('mat', [
            ['Rata-rata dari data 4, 6, 8, 10, 12 adalah ...', ['6', '7', '8', '9'], 2],
            ['Median dari data 3, 7, 5, 9, 1 adalah ...', ['3', '5', '7', '9'], 1],
            ['Modus dari data 2, 4, 4, 5, 6, 4, 7 adalah ...', ['2', '4', '5', '6'], 1],
            ['Jelaskan perbedaan rata-rata dan median beserta contoh penggunaannya dalam usaha warung!', 'Menjelaskan definisi dan memberi contoh yang relevan.'],
        ]);
        $soalBig = $buatSoal('big', [
            ['The generic structure of a recount text is ...', ['Orientation – Events – Reorientation', 'Goal – Materials – Steps', 'Thesis – Arguments – Conclusion', 'Identification – Description'], 0],
            ['"Last week I ... to Bogor Botanical Garden." The correct verb is ...', ['go', 'goes', 'went', 'gone'], 2],
        ]);
        $soalIpa = $buatSoal('ipa', [
            ['Organisme yang berperan sebagai produsen dalam ekosistem adalah ...', ['Tumbuhan hijau', 'Jamur', 'Belalang', 'Ular'], 0],
            ['Rantai makanan yang benar adalah ...', ['Rumput → belalang → katak → ular', 'Ular → katak → belalang → rumput', 'Katak → rumput → ular → belalang', 'Belalang → rumput → katak → ular'], 0],
        ]);
        $soalPpk = $buatSoal('ppk', [
            ['Contoh kewajiban warga negara adalah ...', ['Mendapat pendidikan', 'Membayar pajak', 'Memperoleh pekerjaan', 'Mendapat perlindungan hukum'], 1],
            ['Demokrasi Pancasila berlandaskan sila ke- ...', ['Pertama', 'Kedua', 'Keempat', 'Kelima'], 2],
        ]);

        $ujian = fn ($kode, $judul, $mulai, $durasi, $soal) => tap(Ujian::create([
            'pengajaran_id' => $ajar[0][$kode]->id, 'judul' => $judul, 'mulai' => $mulai, 'selesai' => $mulai->copy()->addMinutes($kode === 'bin' ? 14 * 60 : $durasi + 60), 'durasi' => $durasi,
        ]), fn ($u) => $u->soal()->attach($soal->values()->mapWithKeys(fn ($s, $i) => [$s->id => ['urutan' => $i]])->all()));
        $ujian('bin', 'Kuis Modul 3: Teks Eksplanasi', $now->copy()->subHours(2), 30, $soalBin);
        $ujian('mat', 'Penilaian Tengah Semester Matematika', $now->copy()->addDays(8)->setTime(8, 0), 90, $soalMat);
        $ujian('big', 'Penilaian Tengah Semester Bahasa Inggris', $now->copy()->addDays(9)->setTime(10, 0), 90, $soalBig);
        $uIpa = $ujian('ipa', 'Kuis Modul 2: Ekosistem dan Rantai Makanan', $now->copy()->subDays(12)->setTime(8, 0), 30, $soalIpa);
        $uPpk = $ujian('ppk', 'Kuis Modul 2: Demokrasi Pancasila', $now->copy()->subDays(19)->setTime(8, 0), 30, $soalPpk);
        foreach ($kelas12 as $s) {
            foreach ([[$uIpa, $soalIpa], [$uPpk, $soalPpk]] as [$u, $soal]) {
                $jawaban = $soal->mapWithKeys(fn ($q) => [$q->id => $s->is($budi) || mt_rand(0, 3) ? (int) $q->kunci : 3])->all();
                $h = HasilUjian::create(['ujian_id' => $u->id, 'siswa_id' => $s->id, 'mulai_at' => $u->mulai->copy()->addMinutes(5), 'selesai_at' => $u->mulai->copy()->addMinutes(25), 'jawaban' => $jawaban]);
                $h->update(['nilai' => Akademik::hitungNilaiUjian($h, $soal)]);
            }
        }

        // ── Pengumuman ─────────────────────────────────────────────────
        $admin = User::where('username', 'admin')->first();
        foreach ([
            ['Jadwal Penilaian Tengah Semester Ganjil 2026/2027', 'Akademik', true, 1, 'pengumuman/jadwal-pts.pdf', 'Jadwal_PTS_Ganjil_2026.pdf', "PTS dilaksanakan 16–21 November 2026 secara daring melalui PKBM BHP dan luring di Ruang Komputer.\n\nPeserta didik diharapkan mempelajari kembali materi pada setiap modul, menyelesaikan tugas yang tertunda, serta memastikan perangkat dan kuota internet siap digunakan.\n\nApabila terdapat kendala, silakan menghubungi wali kelas atau Tata Usaha pada hari kerja pukul 08.00–16.00 WIB."],
            ['Workshop Kewirausahaan: Memulai Usaha Rumahan', 'Kegiatan', false, 3, null, null, "Workshop wajib bagi peserta didik Paket C pada Sabtu, 28 November 2026 pukul 13.00 di Aula PKBM BHP.\n\nPeserta akan belajar menyusun rencana usaha sederhana, menghitung modal, dan memasarkan produk melalui media sosial."],
            ['Libur Peringatan Hari Pahlawan', 'Akademik', false, 6, null, null, 'Kelas daring pada Hari Pahlawan ditiadakan dan diganti dengan pembelajaran mandiri melalui modul.'],
            ['Kelengkapan Berkas Ijazah Paket C Angkatan 2027', 'Administrasi', true, 8, null, null, "Lengkapi salinan akta kelahiran, kartu keluarga, dan ijazah jenjang sebelumnya paling lambat 30 November 2026.\n\nBerkas diserahkan langsung ke Tata Usaha."],
            ['Pemeliharaan Sistem PKBM BHP', 'Sistem', false, 11, null, null, 'Sistem tidak dapat diakses pada Minggu dini hari pukul 00.00–04.00 WIB untuk peningkatan layanan.'],
            ['Pendaftaran Peserta Didik Baru Gelombang 2', 'Kegiatan', false, 15, null, null, 'Pendaftaran Paket A, B, dan C gelombang 2 dibuka hingga 15 Desember 2026. Ajak keluarga dan tetangga untuk melanjutkan pendidikan.'],
        ] as [$judul, $kat, $penting, $hari, $path, $nama, $isi]) {
            Pengumuman::create(['penulis_id' => $admin->id, 'judul' => $judul, 'kategori' => $kat, 'penting' => $penting, 'isi' => $isi, 'lampiran_path' => $path, 'lampiran_nama' => $nama, 'created_at' => $now->copy()->subDays($hari)]);
        }

        // ── Presensi 3 pekan terakhir (kelas XII IPS 1) ─────────────────
        $khusus = ['pag' => 'Izin', 'ppk' => 'Alpa', 'ipa' => 'Sakit'];
        foreach ([1, 2, 3] as $w) {
            foreach ($ajar[0] as $kode => $p) {
                $tanggal = $now->copy()->startOfWeek()->subWeeks($w)->addDays($p->hari);
                $sesi = Sesi::create(['pengajaran_id' => $p->id, 'tanggal' => $tanggal, 'mode' => $p->mode]);
                DB::table('presensi')->insert($kelas12->map(fn ($s) => [
                    'sesi_id' => $sesi->id, 'siswa_id' => $s->id,
                    'status' => $s->is($budi) ? ($w === array_search($kode, array_keys($khusus)) + 1 && isset($khusus[$kode]) ? $khusus[$kode] : 'Hadir')
                        : (mt_rand(0, $s->name === 'Fajar Anugrah Pratama' ? 2 : 9) ? 'Hadir' : ['Izin', 'Sakit', 'Alpa'][mt_rand(0, 2)]),
                ])->all());
            }
        }

        // ── Diskusi ─────────────────────────────────────────────────────
        $nurul = $tutor['bin'];
        $m2 = $materi['Struktur & Ciri Kebahasaan Teks Eksplanasi'];
        $d = Diskusi::create(['user_id' => $siswa['Dian Wulandari']->id, 'materi_id' => $m2->id, 'isi' => 'Bu, kalau membahas fenomena "banjir di perkotaan", apakah faktor kebiasaan membuang sampah masuk ke deretan penjelas atau interpretasi?', 'created_at' => $now->copy()->subHours(2)]);
        Diskusi::create(['user_id' => $nurul->id, 'parent_id' => $d->id, 'isi' => 'Pertanyaan bagus, Dian. Kebiasaan membuang sampah sembarangan termasuk deretan penjelas karena merupakan faktor penyebab. Interpretasi berisi simpulan atau sikapmu terhadap fenomena tersebut.', 'created_at' => $now->copy()->subMinutes(45)]);
        Diskusi::create(['user_id' => $siswa['Bambang Setyawan']->id, 'materi_id' => $m2->id, 'isi' => 'Terima kasih untuk rangkuman visualnya, Bu. Sangat membantu saya yang belajar sambil bekerja malam hari.', 'created_at' => $now->copy()->subHours(4)]);

        $topik = Diskusi::create(['user_id' => $siswa['Dian Wulandari']->id, 'pengajaran_id' => $ajar[0]['bin']->id, 'judul' => 'Faktor kebiasaan membuang sampah masuk struktur yang mana?', 'isi' => 'Kalau membahas fenomena banjir di perkotaan, apakah faktor kebiasaan membuang sampah termasuk deretan penjelas atau interpretasi?', 'created_at' => $now->copy()->subHours(2)]);
        Diskusi::create(['user_id' => $nurul->id, 'parent_id' => $topik->id, 'isi' => 'Termasuk deretan penjelas, karena merupakan faktor penyebab. Interpretasi berisi simpulan atau sikapmu terhadap fenomena.', 'created_at' => $now->copy()->subMinutes(45)]);
        Diskusi::create(['user_id' => $siswa['Bambang Setyawan']->id, 'parent_id' => $topik->id, 'isi' => 'Berarti kalau saya menulis saran supaya warga tidak buang sampah ke sungai, itu masuk interpretasi ya, Bu?', 'created_at' => $now->copy()->subMinutes(30)]);
        Diskusi::create(['user_id' => $nurul->id, 'parent_id' => $topik->id, 'isi' => 'Betul sekali. Saran dan ajakan cocok ditempatkan pada bagian interpretasi.', 'created_at' => $now->copy()->subMinutes(12)]);
        $topik2 = Diskusi::create(['user_id' => $siswa['Rizky Ramadhan']->id, 'pengajaran_id' => $ajar[1]['bin']->id, 'judul' => 'Contoh konjungsi temporal selain “kemudian”?', 'isi' => 'Saya sering memakai kata “kemudian” berulang-ulang. Ada pilihan kata lain yang bisa dipakai?', 'created_at' => $now->copy()->subDay()]);
        Diskusi::create(['user_id' => $nurul->id, 'parent_id' => $topik2->id, 'isi' => 'Bisa gunakan: lalu, setelah itu, selanjutnya, pada akhirnya, sebelum, dan sesudah.', 'created_at' => $now->copy()->subHours(20)]);
        Diskusi::create(['user_id' => $siswa['Siti Maryati']->id, 'pengajaran_id' => $ajar[2]['bin']->id, 'judul' => 'Apakah tugas boleh ditulis tangan lalu difoto?', 'isi' => 'Di rumah saya tidak ada laptop. Apakah tugas surat resmi boleh ditulis tangan lalu difoto, Bu?', 'created_at' => $now->copy()->subDays(2)]);

        // ── Notifikasi & aktivitas ──────────────────────────────────────
        foreach ([
            [$budi, 'assignment_late', 'danger', 'Tenggat tugas besok', 'Latihan Soal Statistika harus dikumpulkan paling lambat besok pukul 23.59.', "/siswa/tugas/{$t1->id}", null],
            [$budi, 'grading', 'success', 'Tugas sudah dinilai', 'Peta Persebaran Kegiatan Ekonomi mendapat nilai 88.', "/siswa/tugas/{$t6->id}", null],
            [$budi, 'forum', 'primary', 'Balasan diskusi baru', 'Nurul Aini, M.Pd. membalas pertanyaan pada materi Struktur Teks Eksplanasi.', "/materi/{$m2->id}", null],
            [$budi, 'campaign', 'lime', 'Pengumuman baru', 'Jadwal Penilaian Tengah Semester Ganjil 2026/2027 telah diterbitkan.', '/pengumuman', $now->copy()->subDay()],
            [$budi, 'quiz', 'primary', 'Ujian dibuka', 'Kuis Modul 3: Teks Eksplanasi sudah dapat dikerjakan.', '/siswa/ujian', $now->copy()->subDay()],
            [$nurul, 'upload_file', 'primary', 'Pengumpulan baru', 'Dian Wulandari mengumpulkan tugas Teks Eksplanasi.', '/tutor/penilaian', null],
            [$nurul, 'forum', 'primary', 'Pertanyaan baru di forum', 'Siti Maryati bertanya di forum Kelas 9.', '/diskusi', null],
            [$admin, 'person_add', 'lime', 'Peserta didik baru', '6 peserta didik baru terdaftar minggu ini.', '/admin/peserta-didik', null],
        ] as [$u, $icon, $tone, $judul, $teks, $url, $dibaca]) {
            Notifikasi::create(['user_id' => $u->id, 'icon' => $icon, 'tone' => $tone, 'judul' => $judul, 'teks' => $teks, 'url' => $url, 'dibaca_at' => $dibaca]);
        }

        $kegiatan = [['play_circle', 'Membuka materi “%s”'], ['task_alt', 'Menyelesaikan materi “%s”'], ['quiz', 'Mengerjakan kuis %s'], ['upload_file', 'Mengumpulkan tugas %s']];
        $semua = User::siswa()->get();
        foreach ([[6, 18], [5, 22], [4, 20], [3, 16], [2, 14], [1, 30], [0, 26]] as [$hariLalu, $jumlah]) {
            for ($i = 0; $i < $jumlah; $i++) {
                [$icon, $fmt] = $kegiatan[mt_rand(0, 3)];
                DB::table('aktivitas')->insert(['user_id' => $semua->random()->id, 'icon' => $icon, 'teks' => sprintf($fmt, collect($materi)->random()->judul),
                    'created_at' => $now->copy()->subDays($hariLalu)->setTime(mt_rand(7, 21), mt_rand(0, 59)), 'updated_at' => $now]);
            }
        }
        Akademik::catat($budi, 'login', 'Masuk ke PKBM BHP');

        $this->command?->info("Akun demo (tutor, siswa, dan lainnya) memakai kata sandi: {$pw}");
    }

    private function kontenUmum(string $judul): string
    {
        return "## Tujuan Pembelajaran\nSetelah mempelajari materi \"{$judul}\", kamu diharapkan mampu memahami konsep utama dan menerapkannya dalam kehidupan sehari-hari.\n\n## Uraian Materi\nBacalah uraian berikut dengan saksama. Catat istilah penting yang belum kamu pahami, lalu tanyakan kepada tutor melalui kolom diskusi.\n\n> Kunci: hubungkan materi dengan pengalaman nyata di lingkungan tempat tinggal atau tempat kerjamu.\n\n## Latihan\n- Tuliskan tiga hal penting yang kamu pelajari.\n- Berikan satu contoh penerapannya di sekitarmu.";
    }

    private function kontenEksplanasi(): string
    {
        return "## 1. Hakikat dan Fungsi Teks Eksplanasi\nDalam kehidupan sehari-hari kita sering menjumpai fenomena alam maupun sosial: banjir saat musim hujan, harga cabai yang naik menjelang hari raya, atau gempa bumi. Teks eksplanasi adalah teks faktual yang bertujuan menjelaskan proses terjadinya suatu fenomena secara runtut dan logis.\n\nBagi peserta didik Program Paket C, kemampuan ini sangat berguna: kamu belajar menyusun penjelasan berdasarkan hubungan sebab–akibat dan urutan waktu, bukan sekadar opini pribadi.\n\n> Kunci pemahaman: teks eksplanasi selalu bersandar pada fakta. Ciri utamanya adalah penggunaan konjungsi kausal (karena, sehingga, akibatnya) dan temporal (kemudian, lalu, setelah itu).\n\n## 2. Tiga Struktur Teks Eksplanasi\n- Identifikasi fenomena: gambaran umum tentang fenomena yang akan dijelaskan.\n- Deretan penjelas: rangkaian proses terjadinya fenomena secara bertahap.\n- Interpretasi: simpulan atau pandangan penulis, termasuk dampak dan upaya pencegahan.\n\n## 3. Contoh: Fenomena Gempa Bumi Tektonik\n> Gempa bumi tektonik terjadi ketika dua lempeng kerak bumi saling bergesekan. Akibatnya, energi tersimpan dalam jumlah besar. Setelah energi melampaui batas kekuatan batuan, lempeng bergeser secara tiba-tiba sehingga getaran merambat ke permukaan.\n\n- Istilah ilmiah: lempeng, kerak bumi, getaran.\n- Konjungsi kausal: akibatnya, sehingga.\n- Konjungsi temporal: setelah.";
    }

    /** PDF satu halaman berisi teks sederhana (ASCII) untuk berkas contoh. */
    private function pdf(string $judul, array $baris): string
    {
        $esc = fn ($s) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s);
        $teks = 'BT /F1 18 Tf 72 760 Td ('.$esc($judul).') Tj /F1 11 Tf 15 TL 0 -14 Td';
        foreach ($baris as $b) {
            $teks .= ' ('.$esc($b).") '";
        }
        $teks .= ' ET';
        $obj = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length '.strlen($teks)." >>\nstream\n{$teks}\nendstream",
        ];
        $out = "%PDF-1.4\n";
        $off = [];
        foreach ($obj as $i => $o) {
            $off[] = strlen($out);
            $out .= ($i + 1)." 0 obj\n{$o}\nendobj\n";
        }
        $xref = strlen($out);
        $out .= "xref\n0 ".(count($obj) + 1)."\n0000000000 65535 f \n";
        foreach ($off as $o) {
            $out .= sprintf("%010d 00000 n \n", $o);
        }

        return $out.'trailer << /Size '.(count($obj) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
}
