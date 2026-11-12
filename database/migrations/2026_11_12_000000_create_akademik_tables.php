<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program', function (Blueprint $t) {
            $t->id();
            $t->string('nama'); // Paket A / B / C
            $t->string('setara');
            $t->string('tingkat')->nullable();
            $t->text('deskripsi')->nullable();
            $t->timestamps();
        });

        Schema::create('kelas', function (Blueprint $t) {
            $t->id();
            $t->foreignId('program_id')->constrained('program')->cascadeOnDelete();
            $t->string('nama');
            $t->string('tingkat')->nullable();
            $t->foreignId('wali_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('ruang')->nullable();
            $t->string('jadwal')->nullable();
            $t->string('status')->default('Aktif');
            $t->timestamps();
        });

        Schema::table('users', function (Blueprint $t) {
            $t->foreign('kelas_id')->references('id')->on('kelas')->nullOnDelete();
        });

        Schema::create('mapel', function (Blueprint $t) {
            $t->id();
            $t->foreignId('program_id')->constrained('program')->cascadeOnDelete();
            $t->string('nama');
            $t->string('kode')->nullable();
            $t->text('deskripsi')->nullable();
            $t->string('icon')->default('menu_book');
            $t->timestamps();
        });

        // Siapa mengajar mapel apa di kelas mana, sekaligus jadwal tetapnya.
        Schema::create('pengajaran', function (Blueprint $t) {
            $t->id();
            $t->foreignId('kelas_id')->constrained('kelas')->cascadeOnDelete();
            $t->foreignId('mapel_id')->constrained('mapel')->cascadeOnDelete();
            $t->foreignId('tutor_id')->constrained('users')->cascadeOnDelete();
            $t->unsignedTinyInteger('hari')->nullable(); // 0 = Senin … 6 = Minggu
            $t->time('jam_mulai')->nullable();
            $t->time('jam_selesai')->nullable();
            $t->string('tempat')->nullable();
            $t->string('mode')->default('Tatap Muka'); // Tatap Muka | Daring
            $t->timestamps();
            $t->unique(['kelas_id', 'mapel_id']);
        });

        Schema::create('materi', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pengajaran_id')->constrained('pengajaran')->cascadeOnDelete();
            $t->string('modul');
            $t->string('judul');
            $t->text('deskripsi')->nullable();
            $t->string('tipe')->default('Teks'); // Teks | Video | PDF
            $t->longText('konten')->nullable();
            $t->string('video_url')->nullable();
            $t->string('file_path')->nullable();
            $t->string('file_nama')->nullable();
            $t->unsignedSmallInteger('durasi')->nullable(); // menit
            $t->string('status')->default('Terbit'); // Terbit | Draf
            $t->unsignedSmallInteger('urutan')->default(0);
            $t->timestamps();
        });

        Schema::create('materi_selesai', function (Blueprint $t) {
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('materi_id')->constrained('materi')->cascadeOnDelete();
            $t->timestamp('created_at')->nullable();
            $t->primary(['user_id', 'materi_id']);
        });

        Schema::create('tugas', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pengajaran_id')->constrained('pengajaran')->cascadeOnDelete();
            $t->string('judul');
            $t->text('instruksi');
            $t->dateTime('tenggat');
            $t->string('lampiran_path')->nullable();
            $t->string('lampiran_nama')->nullable();
            $t->timestamps();
        });

        Schema::create('pengumpulan', function (Blueprint $t) {
            $t->id();
            $t->foreignId('tugas_id')->constrained('tugas')->cascadeOnDelete();
            $t->foreignId('siswa_id')->constrained('users')->cascadeOnDelete();
            $t->string('file_path')->nullable();
            $t->string('file_nama')->nullable();
            $t->text('catatan')->nullable();
            $t->string('status')->default('draf'); // draf | dikumpulkan
            $t->dateTime('dikumpulkan_at')->nullable();
            $t->unsignedTinyInteger('nilai')->nullable();
            $t->text('umpan_balik')->nullable();
            $t->dateTime('dinilai_at')->nullable();
            $t->timestamps();
            $t->unique(['tugas_id', 'siswa_id']);
        });

        Schema::create('soal', function (Blueprint $t) {
            $t->id();
            $t->foreignId('mapel_id')->constrained('mapel')->cascadeOnDelete();
            $t->foreignId('pembuat_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('tipe'); // pg | esai
            $t->string('tingkat')->default('Sedang');
            $t->text('pertanyaan');
            $t->json('opsi')->nullable(); // pilihan jawaban untuk pg
            $t->text('kunci')->nullable(); // indeks opsi benar (pg) / pedoman penskoran (esai)
            $t->timestamps();
        });

        Schema::create('ujian', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pengajaran_id')->constrained('pengajaran')->cascadeOnDelete();
            $t->string('judul');
            $t->dateTime('mulai');
            $t->dateTime('selesai');
            $t->unsignedSmallInteger('durasi'); // menit
            $t->timestamps();
        });

        Schema::create('ujian_soal', function (Blueprint $t) {
            $t->foreignId('ujian_id')->constrained('ujian')->cascadeOnDelete();
            $t->foreignId('soal_id')->constrained('soal')->cascadeOnDelete();
            $t->unsignedSmallInteger('urutan')->default(0);
            $t->primary(['ujian_id', 'soal_id']);
        });

        Schema::create('hasil_ujian', function (Blueprint $t) {
            $t->id();
            $t->foreignId('ujian_id')->constrained('ujian')->cascadeOnDelete();
            $t->foreignId('siswa_id')->constrained('users')->cascadeOnDelete();
            $t->dateTime('mulai_at');
            $t->dateTime('selesai_at')->nullable();
            $t->json('jawaban')->nullable(); // {soal_id: jawaban}
            $t->json('nilai_esai')->nullable(); // {soal_id: 0-100}
            $t->unsignedTinyInteger('nilai')->nullable(); // terisi setelah semua esai dinilai
            $t->timestamps();
            $t->unique(['ujian_id', 'siswa_id']);
        });

        Schema::create('pengumuman', function (Blueprint $t) {
            $t->id();
            $t->foreignId('penulis_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('judul');
            $t->string('kategori');
            $t->text('isi');
            $t->string('target')->default('semua'); // semua | siswa | tutor
            $t->boolean('penting')->default(false);
            $t->string('lampiran_path')->nullable();
            $t->string('lampiran_nama')->nullable();
            $t->timestamps();
        });

        Schema::create('sesi', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pengajaran_id')->constrained('pengajaran')->cascadeOnDelete();
            $t->date('tanggal');
            $t->string('mode')->default('Tatap Muka');
            $t->string('topik')->nullable();
            $t->timestamps();
        });

        Schema::create('presensi', function (Blueprint $t) {
            $t->foreignId('sesi_id')->constrained('sesi')->cascadeOnDelete();
            $t->foreignId('siswa_id')->constrained('users')->cascadeOnDelete();
            $t->string('status'); // Hadir | Izin | Sakit | Alpa
            $t->primary(['sesi_id', 'siswa_id']);
        });

        // Forum: topik (parent_id null, judul terisi), balasan (parent_id), komentar materi (materi_id).
        Schema::create('diskusi', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('parent_id')->nullable()->constrained('diskusi')->cascadeOnDelete();
            $t->foreignId('materi_id')->nullable()->constrained('materi')->cascadeOnDelete();
            $t->foreignId('pengajaran_id')->nullable()->constrained('pengajaran')->cascadeOnDelete();
            $t->string('judul')->nullable();
            $t->text('isi');
            $t->timestamps();
        });

        Schema::create('notifikasi', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->string('icon');
            $t->string('tone')->default('primary');
            $t->string('judul');
            $t->string('teks');
            $t->string('url')->nullable();
            $t->timestamp('dibaca_at')->nullable();
            $t->timestamps();
            $t->index(['user_id', 'dibaca_at']);
        });

        Schema::create('aktivitas', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->string('icon');
            $t->string('teks');
            $t->timestamps();
            $t->index('created_at');
        });

        Schema::create('pengaturan', function (Blueprint $t) {
            $t->string('kunci')->primary();
            $t->text('nilai')->nullable();
        });
    }

    public function down(): void
    {
        foreach (['pengaturan', 'aktivitas', 'notifikasi', 'diskusi', 'presensi', 'sesi', 'pengumuman', 'hasil_ujian', 'ujian_soal', 'ujian', 'soal', 'pengumpulan', 'tugas', 'materi_selesai', 'materi', 'pengajaran', 'mapel'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropForeign(['kelas_id']));
        Schema::dropIfExists('kelas');
        Schema::dropIfExists('program');
    }
};
