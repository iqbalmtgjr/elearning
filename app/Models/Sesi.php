<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sesi extends Model
{
    protected $table = 'sesi';
    protected $guarded = ['id'];
    protected $casts = ['tanggal' => 'date'];

    public function pengajaran() { return $this->belongsTo(Pengajaran::class); }
    public function presensi() { return $this->hasMany(Presensi::class); }
}
