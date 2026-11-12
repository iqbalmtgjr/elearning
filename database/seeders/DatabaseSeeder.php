<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Data minimum agar aplikasi bisa dipakai: akun admin + program Paket A/B/C.
     * Lokal: kata sandi "password" dan data contoh (DemoSeeder) ikut diisi.
     * Produksi: kata sandi admin acak, ditampilkan sekali di terminal.
     */
    public function run(): void
    {
        $password = app()->isProduction() ? Str::password(12, symbols: false) : 'password';
        User::updateOrCreate(['username' => 'admin'], [
            'name' => 'Administrator', 'role' => 'admin', 'jabatan' => 'Operator Sistem', 'email' => 'admin@pkbmbhp.sch.id', 'password' => $password,
        ]);
        $this->command?->info("Akun admin: admin / {$password}");

        foreach ([['Paket A', 'Setara SD / MI', 'Tingkat I–III'], ['Paket B', 'Setara SMP / MTs', 'Tingkat IV'], ['Paket C', 'Setara SMA / MA', 'Tingkat V–VI']] as [$nama, $setara, $tingkat]) {
            Program::firstOrCreate(['nama' => $nama], ['setara' => $setara, 'tingkat' => $tingkat]);
        }

        if (! app()->isProduction()) {
            $this->call(DemoSeeder::class);
        }
    }
}
