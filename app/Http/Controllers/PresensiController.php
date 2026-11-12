<?php

namespace App\Http\Controllers;

use App\Models\Sesi;
use App\Models\User;
use App\Support\Akademik;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PresensiController extends Controller
{
    private function sesi(Request $r, int $id): Sesi
    {
        $s = Sesi::with('pengajaran.kelas.program', 'pengajaran.mapel', 'pengajaran.tutor')->findOrFail($id);
        abort_unless($r->user()->role === 'admin' || $s->pengajaran->tutor_id === $r->user()->id, 403);

        return $s;
    }

    public function show(Request $r, int $id)
    {
        $s = $this->sesi($r, $id);
        $status = DB::table('presensi')->where('sesi_id', $s->id)->pluck('status', 'siswa_id');

        return inertia('Shared/Presensi', [
            'sesi' => ['id' => $s->id, 'tanggal' => Akademik::tgl($s->tanggal, 'l, j F Y'), 'mapel' => $s->pengajaran->mapel->nama, 'kelas' => $s->pengajaran->kelas->program->nama.' · '.$s->pengajaran->kelas->nama,
                'tutor' => $s->pengajaran->tutor->name, 'mode' => $s->mode, 'topik' => $s->topik, 'tercatat' => $status->isNotEmpty()],
            'siswa' => User::siswa()->where('kelas_id', $s->pengajaran->kelas_id)->where('status', '!=', 'Nonaktif')->orderBy('name')->get()
                ->map(fn ($u) => ['id' => $u->id, 'nama' => $u->name, 'nisn' => $u->nomor_induk, 'status' => $status[$u->id] ?? null]),
            'kembali' => '/'.$r->user()->role.'/kehadiran',
        ]);
    }

    public function simpan(Request $r, int $id)
    {
        $s = $this->sesi($r, $id);
        $ids = User::siswa()->where('kelas_id', $s->pengajaran->kelas_id)->pluck('id')->all();
        $d = $r->validate(['status' => 'required|array', 'status.*' => 'required|in:Hadir,Izin,Sakit,Alpa']);
        $rows = collect($d['status'])->filter(fn ($v, $siswa) => in_array((int) $siswa, $ids))->map(fn ($v, $siswa) => ['sesi_id' => $s->id, 'siswa_id' => (int) $siswa, 'status' => $v])->values()->all();
        DB::table('presensi')->upsert($rows, ['sesi_id', 'siswa_id'], ['status']);
        Akademik::catat($r->user(), 'fact_check', "Mengisi presensi {$s->pengajaran->mapel->nama} {$s->pengajaran->kelas->nama} (".Akademik::tgl($s->tanggal).')');

        return redirect('/'.$r->user()->role.'/kehadiran')->with('ok', 'Presensi '.count($rows).' peserta didik tersimpan.');
    }
}
