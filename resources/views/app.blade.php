<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-bs-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name', 'Money Exchange') }}</title>

    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    @routes
    @viteReactRefresh
    @vite(['resources/css/app.scss', 'resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
