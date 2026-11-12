<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengumuman extends Model
{
    protected $table = 'pengumuman';
    protected $guarded = ['id'];
    protected $casts = ['penting' => 'boolean'];

    public function penulis() { return $this->belongsTo(User::class, 'penulis_id'); }

    /** Pengumuman yang boleh dilihat peran tertentu. */
    public function scopeUntuk($q, string $role)
    {
        return $role === 'admin' ? $q : $q->whereIn('target', ['semua', $role]);
    }
}
