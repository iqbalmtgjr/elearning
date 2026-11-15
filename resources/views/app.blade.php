<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#005840">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    {{-- Ikon: lokal memuat set lengkap; produksi hanya ikon yang dipakai (resources/icons.txt dibuat saat build). --}}
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,400,0..1,0{{ app()->isLocal() ? '' : '&icon_names=' . trim(file_get_contents(resource_path('icons.txt'))) }}&display=block">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    <style>
        #faq .reveal,
        #program .reveal {
            opacity: 1 !important;
            transform: none !important
        }
    </style>
    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>
