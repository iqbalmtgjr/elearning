<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ujian extends Model
{
    protected $table = 'ujian';
    protected $guarded = ['id'];
    protected $casts = ['mulai' => 'datetime', 'selesai' => 'datetime'];

    public function pengajaran() { return $this->belongsTo(Pengajaran::class); }
    public function soal() { return $this->belongsToMany(Soal::class, 'ujian_soal')->withPivot('urutan')->orderByPivot('urutan'); }
    public function hasil() { return $this->hasMany(HasilUjian::class); }

    /** tersedia | mendatang | selesai, berdasarkan jendela waktu ujian. */
    public function getStatusAttribute(): string
    {
        return now()->lt($this->mulai) ? 'mendatang' : (now()->gt($this->selesai) ? 'selesai' : 'tersedia');
    }
}
