<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Presensi extends Model
{
    protected $table = 'presensi';
    protected $guarded = [];
    public $timestamps = false;
    public $incrementing = false;

    public function sesi() { return $this->belongsTo(Sesi::class); }
    public function siswa() { return $this->belongsTo(User::class, 'siswa_id'); }
}
