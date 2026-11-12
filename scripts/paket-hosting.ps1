# Membuat paket unggah hosting (cPanel) dalam satu file zip.
# Pemakaian (dari folder proyek):
#   powershell -ExecutionPolicy Bypass -File scripts\paket-hosting.ps1 -Url https://lms.binaharapanpermata.com
# Hasil: pkbm-bhp-hosting.zip berisi aplikasi + vendor produksi + aset build + .env.production (APP_KEY baru).
# Zip berisi APP_KEY: jangan dibagikan, hapus setelah diunggah.
param([string]$Url = 'https://lms.binaharapanpermata.com')
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$stage = Join-Path $env:TEMP 'pkbm-bhp-paket'
$zip = Join-Path $root 'pkbm-bhp-hosting.zip'

npm run build
if ($LASTEXITCODE) { throw 'npm run build gagal' }
php artisan optimize:clear | Out-Null
composer install --no-dev --optimize-autoloader --no-interaction
if ($LASTEXITCODE) {
    # Windows kadang masih mengunci berkas vendor (mis. server lokal baru dihentikan); coba sekali lagi.
    Start-Sleep -Seconds 3
    composer install --no-dev --optimize-autoloader --no-interaction
    if ($LASTEXITCODE) { throw 'composer install gagal' }
}

try {
    if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
    robocopy $root $stage /E /NFL /NDL /NJH /NJS /NP `
        /XD "$root\node_modules" "$root\.git" "$root\tests" "$root\.vscode" "$root\.idea" "$root\storage\app\private" `
        /XF .env .env.backup database.sqlite *.log hot pkbm-bhp-hosting.zip | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy gagal ($LASTEXITCODE)" }

    $key = (php artisan key:generate --show).Trim()
    @"
APP_NAME="PKBM BHP"
APP_ENV=production
APP_KEY=$key
APP_DEBUG=false
APP_URL=$Url
APP_LOCALE=id
APP_FALLBACK_LOCALE=id
APP_FAKER_LOCALE=id_ID

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=ISI_NAMA_DATABASE
DB_USERNAME=ISI_USER_DATABASE
DB_PASSWORD=ISI_PASSWORD_DATABASE

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=sync

# Email untuk "Lupa password" - isi dengan akun email cPanel (mis. no-reply@binaharapanpermata.com)
MAIL_MAILER=smtp
MAIL_HOST=mail.binaharapanpermata.com
MAIL_PORT=465
MAIL_SCHEME=smtps
MAIL_USERNAME=no-reply@binaharapanpermata.com
MAIL_PASSWORD=ISI_PASSWORD_EMAIL
MAIL_FROM_ADDRESS=no-reply@binaharapanpermata.com
MAIL_FROM_NAME="PKBM BHP"
"@ | Set-Content -Encoding ascii (Join-Path $stage '.env.production')

    if (Test-Path $zip) { Remove-Item $zip -Force }
    & "$env:windir\System32\tar.exe" -a -cf $zip -C $stage .
    if ($LASTEXITCODE) { throw 'pembuatan zip gagal' }
    Write-Host ("Paket siap: {0} ({1:N1} MB)" -f $zip, ((Get-Item $zip).Length / 1MB))
}
finally {
    composer install --no-interaction --quiet  # kembalikan paket dev untuk pengembangan lokal
    if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
}

