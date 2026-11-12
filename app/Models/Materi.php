<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materi extends Model
{
    protected $table = 'materi';
    protected $guarded = ['id'];

    public function pengajaran() { return $this->belongsTo(Pengajaran::class); }
    public function selesaiOleh() { return $this->belongsToMany(User::class, 'materi_selesai'); }
    public function komentar() { return $this->hasMany(Diskusi::class)->whereNull('parent_id'); }
    public function scopeTerbit($q) { return $q->where('status', 'Terbit'); }
}
