<?php

namespace App\Http\Middleware;

use App\Models\Notifikasi;
use App\Support\Akademik;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'info' => $user->info,
                    'foto' => $user->foto ? '/berkas/foto/'.$user->id.'?v='.$user->updated_at?->timestamp : null,
                    'initials' => Str::of($user->name)->before(',')->replaceMatches('/\b(Drs|Dra|Dr|Hj|Ust)\.\s*/', '')->explode(' ')->filter()->take(2)->map(fn ($w) => Str::upper(Str::substr($w, 0, 1)))->join(''),
                ] : null,
            ],
            'app' => fn () => $user ? [
                'ta' => Akademik::pengaturan('tahun_ajaran'),
                'semester' => Akademik::pengaturan('semester'),
                'notif' => Notifikasi::where('user_id', $user->id)->whereNull('dibaca_at')->count(),
                'konteks' => match ($user->role) {
                    'siswa' => ['Jenjang Aktif', $user->kelas?->program?->nama ?? '—'],
                    'tutor' => ['Mengampu', $user->mengajar()->distinct()->count('kelas_id').' Kelas'],
                    default => ['Cakupan', 'Semua Program'],
                },
            ] : null,
            'flash' => fn () => $request->session()->get('ok'),
            'hasilImpor' => fn () => $request->session()->get('impor'),
        ];
    }
}
