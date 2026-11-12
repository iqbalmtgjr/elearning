<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilUjian extends Model
{
    protected $table = 'hasil_ujian';
    protected $guarded = ['id'];
    protected $casts = ['jawaban' => 'array', 'nilai_esai' => 'array', 'mulai_at' => 'datetime', 'selesai_at' => 'datetime'];

    public function ujian() { return $this->belongsTo(Ujian::class); }
    public function siswa() { return $this->belongsTo(User::class, 'siswa_id'); }
}
