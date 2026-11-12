<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Soal extends Model
{
    protected $table = 'soal';
    protected $guarded = ['id'];
    protected $casts = ['opsi' => 'array'];

    public function mapel() { return $this->belongsTo(Mapel::class); }
    public function ujian() { return $this->belongsToMany(Ujian::class, 'ujian_soal'); }
}
