<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $guarded = ['id', 'remember_token'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'tanggal_lahir' => 'date'];
    }

    public function kelas() { return $this->belongsTo(Kelas::class); }
    public function mengajar() { return $this->hasMany(Pengajaran::class, 'tutor_id'); }
    public function pengumpulan() { return $this->hasMany(Pengumpulan::class, 'siswa_id'); }
    public function hasilUjian() { return $this->hasMany(HasilUjian::class, 'siswa_id'); }
    public function presensi() { return $this->hasMany(Presensi::class, 'siswa_id'); }
    public function materiSelesai() { return $this->belongsToMany(Materi::class, 'materi_selesai'); }
    public function notifikasi() { return $this->hasMany(Notifikasi::class)->latest(); }

    public function scopeSiswa(Builder $q) { return $q->where('role', 'siswa'); }
    public function scopeTutor(Builder $q) { return $q->where('role', 'tutor'); }

    /** Keterangan singkat di header & profil. */
    public function getInfoAttribute(): string
    {
        return $this->role === 'siswa' ? 'NISN '.$this->nomor_induk : ($this->jabatan ?: ($this->role === 'tutor' ? 'Tutor' : 'Administrator'));
    }

    /** Pengajaran yang boleh diakses: tutor → yang diampu, siswa → milik kelasnya, admin → semua. */
    public function pengajaranQuery(): Builder
    {
        return Pengajaran::query()
            ->when($this->role === 'tutor', fn ($q) => $q->where('tutor_id', $this->id))
            ->when($this->role === 'siswa', fn ($q) => $q->where('kelas_id', $this->kelas_id ?? 0));
    }
}
