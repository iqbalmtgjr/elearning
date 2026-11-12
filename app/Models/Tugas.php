<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tugas extends Model
{
    protected $table = 'tugas';
    protected $guarded = ['id'];
    protected $casts = ['tenggat' => 'datetime'];

    public function pengajaran() { return $this->belongsTo(Pengajaran::class); }
    public function pengumpulan() { return $this->hasMany(Pengumpulan::class); }
}
