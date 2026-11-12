@php($p = \App\Support\Akademik::pengaturan())
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $judul }} · {{ $p['nama_singkat'] }}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>
        @page { size: A4 {{ ($lanskap ?? false) ? 'landscape' : 'portrait' }}; margin: 14mm 12mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #ecf0ef; font-size: 11.5px; }
        .lembar { max-width: {{ ($lanskap ?? false) ? '1120px' : '800px' }}; margin: 24px auto; background: #fff; padding: 32px 36px; box-shadow: 0 1px 3px rgb(0 40 29 / .08); }
        .kop { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 3px double #005840; }
        .kop svg { width: 56px; height: 56px; flex: none; }
        .kop h1 { margin: 0; font-size: 19px; color: #005840; letter-spacing: -.01em; }
        .kop p { margin: 2px 0 0; color: #475569; font-size: 11px; }
        h2 { text-align: center; margin: 20px 0 2px; font-size: 15px; text-transform: uppercase; letter-spacing: .04em; }
        .sub { text-align: center; color: #64748b; margin: 0 0 16px; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin: 0 0 14px; }
        .info div { display: flex; gap: 8px; } .info dt { width: 110px; color: #64748b; } .info dd { margin: 0; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #005840; color: #fff; font-size: 10.5px; text-align: left; padding: 6px 7px; text-transform: uppercase; letter-spacing: .03em; }
        td { padding: 5px 7px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) td { background: #f4f7f6; }
        td.no { width: 32px; color: #64748b; text-align: center; }
        thead { display: table-header-group; } tr { page-break-inside: avoid; }
        .ringkas { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-top: 12px; padding: 10px 12px; background: #f4f7f6; border-radius: 6px; }
        .ringkas b { color: #005840; }
        .ttd { display: flex; justify-content: space-between; gap: 40px; margin-top: 36px; page-break-inside: avoid; }
        .ttd div { text-align: center; min-width: 200px; } .ttd .nama { margin-top: 64px; font-weight: 700; border-top: 1px solid #1e293b; padding-top: 4px; }
        .kaki { margin-top: 24px; color: #94a3b8; font-size: 10px; display: flex; justify-content: space-between; }
        .alat { position: sticky; top: 0; z-index: 1; display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; padding: 10px 16px; background: #005840; color: #fff; }
        .alat button { font: inherit; font-weight: 700; border: 0; border-radius: 8px; padding: 8px 14px; cursor: pointer; background: #d1f843; color: #1e293b; }
        .alat button.lain { background: rgb(255 255 255 / .12); color: #fff; }
        .alat span { font-size: 12px; opacity: .85; }
        .kosong { text-align: center; color: #64748b; padding: 24px; }
        @media print { body { background: #fff; } .alat { display: none; } .lembar { margin: 0; padding: 0; box-shadow: none; max-width: none; } }
        @media (max-width: 640px) { .lembar { margin: 0; padding: 20px 16px; } .info { grid-template-columns: 1fr; } .tabel { overflow-x: auto; } }
    </style>
</head>
<body>
    <div class="alat">
        <button type="button" onclick="window.print()">Cetak / Simpan PDF</button>
        <button type="button" class="lain" onclick="window.close()">Tutup</button>
        <span>Untuk PDF: pada dialog cetak pilih tujuan “Simpan sebagai PDF”.</span>
    </div>
    <main class="lembar">
        <header class="kop">
            <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#005840"/><path d="M16 8 6 13l10 5 10-5-10-5Z" fill="#D1F843"/><path d="M10 16v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5l-6 3-6-3Z" fill="#fff"/></svg>
            <div>
                <h1>{{ $p['nama_lembaga'] }}</h1>
                <p>{{ $p['alamat'] ?: 'Pusat Kegiatan Belajar Masyarakat' }}</p>
                <p>{{ collect([$p['npsn'] ? 'NPSN '.$p['npsn'] : null, $p['telepon'] ? 'Telp. '.$p['telepon'] : null, $p['email'] ?: null])->filter()->join(' · ') }}</p>
            </div>
        </header>

        <h2>{{ $judul }}</h2>
        <p class="sub">{{ $subjudul }}</p>

        @isset($info)
            <dl class="info">
                @foreach ($info as $k => $v)
                    <div><dt>{{ $k }}</dt><dd>{{ $v }}</dd></div>
                @endforeach
            </dl>
        @endisset

        <div class="tabel">
            <table>
                <thead><tr><th>No</th>@foreach ($kolom as $k)<th>{{ $k }}</th>@endforeach</tr></thead>
                <tbody>
                    @forelse ($baris as $i => $b)
                        <tr><td class="no">{{ $i + 1 }}</td>@foreach ($b as $sel)<td>{{ $sel }}</td>@endforeach</tr>
                    @empty
                        <tr><td colspan="{{ count($kolom) + 1 }}" class="kosong">Belum ada data.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        @isset($ringkas)
            <div class="ringkas">
                @foreach ($ringkas as $k => $v)
                    <span>{{ $k }}: <b>{{ $v }}</b></span>
                @endforeach
            </div>
        @endisset

        <section class="ttd">
            @foreach ($ttd as [$atas, $jabatan, $nama])
                <div>
                    @if ($loop->last)<p style="margin:0 0 2px">{{ now()->translatedFormat('j F Y') }}</p>@else<p style="margin:0 0 2px">&nbsp;</p>@endif
                    <p style="margin:0">{{ $atas }}</p>
                    <p style="margin:0">{{ $jabatan }}</p>
                    <p class="nama">{{ $nama ?: '(............................................)' }}</p>
                </div>
            @endforeach
        </section>

        <footer class="kaki">
            <span>Dokumen ini dibuat otomatis oleh {{ $p['nama_singkat'] }}.</span>
            <span>Dicetak {{ now()->translatedFormat('j F Y, H.i') }} WIB</span>
        </footer>
    </main>
    <script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script>
</body>
</html>
