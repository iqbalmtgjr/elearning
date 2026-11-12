<?php

namespace App\Http\Controllers;

use App\Support\Akademik;
use App\Support\Impor;
use Illuminate\Http\Request;

class ImporController extends Controller
{
    const JENIS = ['admin' => ['peserta-didik', 'tutor', 'bank-soal'], 'tutor' => ['bank-soal']];

    const NAMA = ['peserta-didik' => 'peserta didik', 'tutor' => 'tutor', 'bank-soal' => 'soal'];

    private function boleh(Request $r, string $jenis): void
    {
        abort_unless(in_array($jenis, self::JENIS[$r->user()->role] ?? []), 403);
    }

    public function templat(Request $r, string $jenis)
    {
        $this->boleh($r, $jenis);

        return response(Impor::templat($jenis), 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"templat-impor-{$jenis}.xlsx\"",
        ]);
    }

    public function simpan(Request $r, string $jenis)
    {
        $this->boleh($r, $jenis);
        $r->validate(['berkas' => 'required|file|max:5120|mimes:xlsx,csv,txt', 'lewati' => 'boolean'], ['berkas.mimes' => 'Gunakan berkas Excel (.xlsx) atau CSV.']);
        $hasil = Impor::proses($jenis, $r->file('berkas'), $r->user(), $r->boolean('lewati'));
        if ($hasil['ok']) {
            Akademik::catat($r->user(), 'upload_file', "Mengimpor {$hasil['dibuat']} " . self::NAMA[$jenis] . ' baru dan memperbarui ' . $hasil['diperbarui']);
        }

        return back()->with('impor', $hasil + ['jenis' => self::NAMA[$jenis]]);
    }
}
