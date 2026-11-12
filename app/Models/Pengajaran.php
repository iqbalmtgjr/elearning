<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengajaran extends Model
{
    protected $table = 'pengajaran';
    protected $guarded = ['id'];

    public function kelas() { return $this->belongsTo(Kelas::class); }
    public function mapel() { return $this->belongsTo(Mapel::class); }
    public function tutor() { return $this->belongsTo(User::class, 'tutor_id'); }
    public function materi() { return $this->hasMany(Materi::class); }
    public function tugas() { return $this->hasMany(Tugas::class); }
    public function ujian() { return $this->hasMany(Ujian::class); }
    public function sesi() { return $this->hasMany(Sesi::class); }

    /** "Bahasa Indonesia â€” Kelas XII IPS 1" (butuh relasi mapel & kelas). */
    public function getLabelAttribute(): string
    {
        return $this->mapel?->nama.' â€” '.$this->kelas?->nama;
    }
}
