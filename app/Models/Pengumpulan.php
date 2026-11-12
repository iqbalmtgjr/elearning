<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengumpulan extends Model
{
    protected $table = 'pengumpulan';
    protected $guarded = ['id'];
    protected $casts = ['dikumpulkan_at' => 'datetime', 'dinilai_at' => 'datetime'];

    public function tugas() { return $this->belongsTo(Tugas::class); }
    public function siswa() { return $this->belongsTo(User::class, 'siswa_id'); }
}
