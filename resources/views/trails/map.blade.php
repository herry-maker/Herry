<x-layouts.app :title="__('Trail map')">
    <div class="flex items-center justify-between">
        <h1 class="display text-2xl font-extrabold">{{ __('Trail map') }}</h1>
        <a href="{{ route('trails.index') }}" class="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold">☰ {{ __('List') }}</a>
    </div>

    <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-stone-500">
        @foreach (['mudah' => ['#1c6640', __('Easy')], 'sedang' => ['#b8860b', __('Moderate')], 'berat' => ['#d45c1a', __('Hard')], 'ekstrem' => ['#6b2fa0', __('Extreme')]] as [$color, $label])
            <span class="inline-flex items-center gap-1"><i class="size-2.5 rounded-full" style="background: {{ $color }}"></i> {{ $label }}</span>
        @endforeach
        <span class="inline-flex items-center gap-1 ml-auto"><i class="size-2.5 rounded-full ring-2 ring-summit ring-offset-1"></i> {{ __('Permit required') }}</span>
    </div>

    <div id="trail-map" class="mt-3 h-[60vh] min-h-80 rounded-2xl border border-stone-200 overflow-hidden bg-stone-100"
         data-trails='@json($trails)'
         data-i18n='@json(['hours' => __('h from Jakarta'), 'permit' => __('Permit required'), 'open' => __('Open trail')])'></div>

    <p class="mt-2 text-xs text-stone-500">{{ __('Map data © OpenStreetMap contributors. Pins mark the usual basecamp; always confirm the trailhead with the organizer or ranger post.') }}</p>
</x-layouts.app>
