<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    protected $table = 'kelas';
    protected $guarded = ['id'];

    public function program() { return $this->belongsTo(Program::class); }
    public function wali() { return $this->belongsTo(User::class, 'wali_id'); }
    public function siswa() { return $this->hasMany(User::class, 'kelas_id')->where('role', 'siswa'); }
    public function pengajaran() { return $this->hasMany(Pengajaran::class); }
}
