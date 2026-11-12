<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $table = 'program';
    protected $guarded = ['id'];

    public function kelas() { return $this->hasMany(Kelas::class); }
    public function mapel() { return $this->hasMany(Mapel::class); }
}
