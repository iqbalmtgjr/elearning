<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diskusi extends Model
{
    protected $table = 'diskusi';
    protected $guarded = ['id'];

    public function user() { return $this->belongsTo(User::class); }
    public function balasan() { return $this->hasMany(Diskusi::class, 'parent_id')->oldest(); }
    public function materi() { return $this->belongsTo(Materi::class); }
    public function pengajaran() { return $this->belongsTo(Pengajaran::class); }
}
