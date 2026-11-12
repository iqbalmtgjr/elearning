<?php

namespace App\Http\Controllers;

use App\Support\Akademik;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate(['login' => 'required|string', 'password' => 'required|string']);
        $field = str_contains($data['login'], '@') ? 'email' : 'username';

        if (! Auth::attempt([$field => $data['login'], 'password' => $data['password'], 'status' => fn ($q) => $q->where('status', '!=', 'Nonaktif')], $request->boolean('remember'))) {
            return back()->withErrors(['login' => 'Username/email atau kata sandi tidak sesuai, atau akun dinonaktifkan.'])->onlyInput('login');
        }
        $request->session()->regenerate();
        $role = $request->user()->role;
        Akademik::catat($request->user(), 'login', 'Masuk ke PKBM BHP');

        // Abaikan URL tujuan milik peran lain (mis. perangkat bersama) agar tidak berakhir di 403.
        $url = $request->session()->pull('url.intended', '/'.$role);
        $prefix = explode('/', trim(parse_url($url, PHP_URL_PATH) ?? '', '/'))[0];

        return redirect(in_array($prefix, ['admin', 'tutor', 'siswa']) && $prefix !== $role ? '/'.$role : $url);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    public function kirimTautan(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        Password::sendResetLink($request->only('email')); // sengaja tidak membedakan email terdaftar/tidak

        return back()->with('ok', 'Jika email terdaftar, tautan atur ulang kata sandi telah dikirim.');
    }

    public function formReset(Request $request, string $token)
    {
        return inertia('Auth/ResetPassword', ['token' => $token, 'email' => $request->query('email', '')]);
    }

    public function reset(Request $request)
    {
        $request->validate(['token' => 'required', 'email' => 'required|email', 'password' => 'required|string|min:8|confirmed']);
        $status = Password::reset($request->only('email', 'password', 'password_confirmation', 'token'), function ($user, $password) {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            event(new PasswordReset($user));
        });

        return $status === Password::PASSWORD_RESET
            ? redirect('/login')->with('ok', 'Kata sandi berhasil diatur ulang. Silakan masuk.')
            : back()->withErrors(['email' => 'Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.']);
    }
}
