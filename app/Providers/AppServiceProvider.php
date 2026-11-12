<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $pub = ! empty($_SERVER['DOCUMENT_ROOT']) && is_dir($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : base_path('../public_html');
        if (is_dir($pub)) {
            $src = base_path('public/build');
            $dst = $pub.'/build';
            if (is_file($src.'/manifest.json') && realpath($src) !== realpath($dst)) {
                @mkdir($dst.'/assets', 0755, true);
                foreach ([$src.'/manifest.json', ...(glob($src.'/assets/*') ?: [])] as $f) {
                    $t = $dst.(str_ends_with($f, 'manifest.json') ? '/manifest.json' : '/assets/'.basename($f));
                    if (! is_file($t) || filemtime($f) > filemtime($t) || filesize($f) !== filesize($t)) {
                        @copy($f, $t);
                    }
                }
            }
            if (is_file($dst.'/manifest.json')) {
                $this->app->usePublicPath($pub);
            }
        }
    }

    public function boot(): void
    {
        // Dipakai di rute: ->middleware('can:admin') / 'can:tutor' / 'can:siswa'
        foreach (['admin', 'tutor', 'siswa'] as $role) {
            Gate::define($role, fn (User $user) => $user->role === $role);
        }

        ResetPassword::toMailUsing(fn (User $user, string $token) => (new MailMessage)
            ->subject('Atur Ulang Kata Sandi PKBM BHP')
            ->greeting('Halo, '.$user->name)
            ->line('Kami menerima permintaan untuk mengatur ulang kata sandi akun PKBM BHP Anda.')
            ->action('Atur Ulang Kata Sandi', url('/reset-password/'.$token.'?email='.urlencode($user->email)))
            ->line('Tautan ini berlaku selama 60 menit. Abaikan email ini jika Anda tidak memintanya.')
            ->salutation('Salam, PKBM Bina Harapan Permata'));
    }
}
