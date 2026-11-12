<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mapel extends Model
{
    protected $table = 'mapel';
    protected $guarded = ['id'];

    public function program() { return $this->belongsTo(Program::class); }
    public function pengajaran() { return $this->hasMany(Pengajaran::class); }
    public function soal() { return $this->hasMany(Soal::class); }
}
