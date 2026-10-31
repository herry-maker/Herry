<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ isset($title) ? $title.' · ' : '' }}{{ config('app.name') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Nunito:wght@400;600;700&display=swap">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-dvh flex flex-col">

<header class="bg-forest text-white sticky top-0 z-30">
    <div class="mx-auto max-w-3xl flex items-center justify-between px-4 h-14">
        <a href="{{ route('home') }}" class="display text-2xl font-extrabold tracking-wide">ARDA<span class="text-summit">.</span>traveling</a>
        <nav class="flex items-center gap-2 text-sm">
            <div class="flex rounded-md overflow-hidden border border-white/25 text-xs font-bold">
                @foreach (['en' => 'EN', 'id' => 'ID'] as $code => $label)
                    <a href="{{ route('locale.switch', $code) }}"
                       class="px-2 py-1 {{ app()->getLocale() === $code ? 'bg-white text-forest' : 'hover:bg-white/15' }}"
                       aria-label="{{ __('Language') }} {{ $label }}">{{ $label }}</a>
                @endforeach
            </div>
            @auth
                <a href="{{ route('profile.show', auth()->user()) }}" class="ml-1 grid place-items-center size-9 rounded-full bg-summit display font-bold" title="{{ auth()->user()->name }}">
                    {{ auth()->user()->initials() }}
                </a>
            @else
                <a href="{{ route('login') }}" class="ml-1 rounded-full bg-summit px-3 py-1.5 font-bold">{{ __('Log in') }}</a>
            @endauth
        </nav>
    </div>
</header>

@if (session('status'))
    <div x-data="{ open: true }" x-show="open" x-transition.opacity class="mx-auto w-full max-w-3xl px-4 pt-3">
        <div class="flex items-start justify-between gap-3 rounded-xl bg-canopy-light text-canopy px-4 py-3 text-sm font-semibold">
            <span>{{ session('status') }}</span>
            <button @click="open = false" class="text-canopy/70 hover:text-canopy" aria-label="Dismiss">×</button>
        </div>
    </div>
@endif

@if ($errors->any())
    <div class="mx-auto w-full max-w-3xl px-4 pt-3">
        <div class="rounded-xl bg-summit-light text-summit px-4 py-3 text-sm font-semibold">
            <ul class="list-disc pl-4 space-y-0.5">
                @foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach
            </ul>
        </div>
    </div>
@endif

<main class="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4">
    {{ $slot }}
</main>

<nav class="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
    <div class="mx-auto max-w-3xl grid grid-cols-4 text-[11px] font-bold">
        @php
            $items = [
                ['route' => 'home', 'label' => __('Home'), 'icon' => '⌂', 'active' => request()->routeIs('home') || request()->routeIs('posts.*')],
                ['route' => 'trails.index', 'label' => __('Trails'), 'icon' => '▲', 'active' => request()->routeIs('trails.*')],
                ['route' => 'trips.index', 'label' => __('Open Trips'), 'icon' => '⛺', 'active' => request()->routeIs('trips.*')],
                ['route' => auth()->check() ? 'profile.show' : 'login', 'params' => auth()->check() ? [auth()->user()] : [], 'label' => __('Profile'), 'icon' => '◉', 'active' => request()->routeIs('profile.*') || request()->routeIs('checkins.*') || request()->routeIs('login') || request()->routeIs('register')],
            ];
        @endphp
        @foreach ($items as $item)
            <a href="{{ route($item['route'], $item['params'] ?? []) }}"
               class="flex flex-col items-center gap-0.5 py-2.5 {{ $item['active'] ? 'text-canopy' : 'text-stone-500' }}">
                <span class="text-lg leading-none" aria-hidden="true">{{ $item['icon'] }}</span>
                <span>{{ $item['label'] }}</span>
                <span class="size-1 rounded-full {{ $item['active'] ? 'bg-canopy' : 'bg-transparent' }}"></span>
            </a>
        @endforeach
    </div>
</nav>

</body>
</html>
