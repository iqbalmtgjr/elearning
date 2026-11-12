<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BersamaController;
use App\Http\Controllers\ImporController;
use App\Http\Controllers\PresensiController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\SiswaController;
use App\Http\Controllers\TutorController;
use App\Support\Resources;
use Illuminate\Support\Facades\Route;

Route::get('/', [BersamaController::class, 'beranda'])->name('beranda');
Route::get('/pengumuman-publik/{id}/lampiran', [BersamaController::class, 'lampiranPengumumanPublik'])->whereNumber('id');
Route::inertia('/design-system', 'DesignSystem');

// ── Autentikasi ──────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::inertia('/login', 'Auth/Login', ['demo' => ! app()->isProduction()])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::inertia('/lupa-password', 'Auth/ForgotPassword');
    Route::post('/lupa-password', [AuthController::class, 'kirimTautan'])->middleware('throttle:3,1');
    Route::get('/reset-password/{token}', [AuthController::class, 'formReset'])->name('password.reset');
    Route::post('/reset-password', [AuthController::class, 'reset'])->middleware('throttle:6,1');
});

// ── Semua peran ──────────────────────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/impor/{jenis}/templat', [ImporController::class, 'templat'])->whereIn('jenis', ['peserta-didik', 'tutor', 'bank-soal']);
    Route::post('/impor/{jenis}', [ImporController::class, 'simpan'])->whereIn('jenis', ['peserta-didik', 'tutor', 'bank-soal'])->middleware('throttle:20,1');

    Route::controller(BersamaController::class)->group(function () {
        Route::get('/pengumuman', 'pengumuman');
        Route::post('/pengumuman', 'simpanPengumuman');
        Route::get('/pengumuman/{id}', 'pengumumanDetail')->whereNumber('id');
        Route::post('/pengumuman/{id}', 'simpanPengumuman')->whereNumber('id');
        Route::delete('/pengumuman/{id}', 'hapusPengumuman')->whereNumber('id');

        Route::get('/notifikasi', 'notifikasi');
        Route::get('/notifikasi/{id}', 'bukaNotifikasi')->whereNumber('id');
        Route::post('/notifikasi/baca-semua', 'bacaSemua');

        Route::get('/profil', 'profil');
        Route::get('/profil/edit', 'profilEdit');
        Route::post('/profil', 'updateProfil');
        Route::get('/pengaturan-akun', 'akun');
        Route::put('/pengaturan-akun/password', 'updatePassword')->middleware('throttle:6,1');
        Route::post('/pengaturan-akun/keluar-lainnya', 'keluarPerangkatLain');
        Route::get('/riwayat-aktivitas', 'riwayat');

        Route::get('/kelas/{id}', 'kelasDetail')->whereNumber('id');
        Route::get('/materi/{id}', 'materiDetail')->whereNumber('id');
        Route::post('/materi/{id}/selesai', 'selesaiMateri')->whereNumber('id');
        Route::post('/materi/{id}/komentar', 'komentar')->whereNumber('id');

        Route::get('/diskusi', 'diskusi');
        Route::post('/diskusi', 'simpanTopik');
        Route::post('/diskusi/{id}/balas', 'balasTopik')->whereNumber('id');

        Route::get('/jadwal', 'jadwal');
        Route::get('/rapor/{id}', 'rapor')->whereNumber('id');
        Route::get('/berkas/{jenis}/{id}', 'berkas')->whereIn('jenis', ['materi', 'tugas', 'pengumpulan', 'pengumuman', 'foto'])->whereNumber('id');
    });
});

// ── Halaman data generik (admin & tutor) ─────────────────────────────────
$resource = function (string $role, array $resources) {
    Route::get("/{$role}/{resource}", [ResourceController::class, 'index'])->whereIn('resource', $resources);
    Route::post("/{$role}/{resource}", [ResourceController::class, 'store'])->whereIn('resource', $resources);
    Route::put("/{$role}/{resource}/{id}", [ResourceController::class, 'update'])->whereIn('resource', $resources)->whereNumber('id');
    Route::delete("/{$role}/{resource}/{id}", [ResourceController::class, 'destroy'])->whereIn('resource', $resources)->whereNumber('id');
};

// ── Administrator ────────────────────────────────────────────────────────
Route::middleware(['auth', 'can:admin'])->group(function () use ($resource) {
    Route::get('/admin', [AdminController::class, 'dashboard']);
    Route::get('/admin/laporan', [AdminController::class, 'laporan']);
    Route::get('/admin/laporan/{jenis}', [AdminController::class, 'ekspor'])->whereIn('jenis', ['nilai', 'kehadiran', 'progres', 'peserta', 'tutor', 'aktivitas']);
    Route::get('/admin/laporan/{jenis}/cetak', [AdminController::class, 'cetak'])->whereIn('jenis', ['nilai', 'kehadiran', 'progres', 'peserta', 'tutor', 'aktivitas']);
    Route::get('/admin/pengaturan', [AdminController::class, 'pengaturan']);
    Route::post('/admin/pengaturan', [AdminController::class, 'simpanPengaturan']);
    $resource('admin', Resources::ADMIN);
});

// ── Tutor ────────────────────────────────────────────────────────────────
Route::middleware(['auth', 'can:tutor'])->group(function () use ($resource) {
    Route::get('/tutor', [TutorController::class, 'dashboard']);
    Route::get('/tutor/kelas', [TutorController::class, 'kelas']);
    Route::get('/tutor/penilaian', [TutorController::class, 'penilaian']);
    Route::post('/tutor/penilaian/{id}', [TutorController::class, 'nilaiTugas'])->whereNumber('id');
    Route::post('/tutor/penilaian/{id}/revisi', [TutorController::class, 'revisi'])->whereNumber('id');
    Route::post('/tutor/esai/{id}', [TutorController::class, 'nilaiEsai'])->whereNumber('id');
    $resource('tutor', Resources::TUTOR);
});

// ── Presensi (admin & tutor) ─────────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/presensi/{id}', [PresensiController::class, 'show'])->whereNumber('id');
    Route::post('/presensi/{id}', [PresensiController::class, 'simpan'])->whereNumber('id');
});

// ── Peserta didik ────────────────────────────────────────────────────────
Route::middleware(['auth', 'can:siswa'])->prefix('siswa')->controller(SiswaController::class)->group(function () {
    Route::get('/', 'dashboard');
    Route::get('/kelas', 'kelas');
    Route::get('/mapel', 'mapel');
    Route::get('/materi', 'materi');
    Route::get('/tugas', 'tugas');
    Route::get('/tugas/{id}', 'tugasDetail')->whereNumber('id');
    Route::post('/tugas/{id}', 'simpanTugas')->whereNumber('id');
    Route::delete('/tugas/{id}/pengumpulan', 'batalTugas')->whereNumber('id');
    Route::get('/ujian', 'ujian');
    Route::get('/ujian/{id}/kerjakan', 'kerjakan')->whereNumber('id');
    Route::post('/ujian/{id}/jawab', 'jawab')->whereNumber('id')->middleware('throttle:60,1');
    Route::post('/ujian/{id}/kumpul', 'kumpulUjian')->whereNumber('id');
    Route::get('/nilai', 'nilai');
    Route::get('/kehadiran', 'kehadiran');
});
