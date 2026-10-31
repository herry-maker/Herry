<x-layouts.app :title="$porter->name">
    @php $hue = crc32($porter->slug) % 360; @endphp
    <a href="{{ route('porters.index') }}" class="text-xs font-bold text-stone-500">← {{ __('Porters & guides') }}</a>

    <section class="mt-2 rounded-2xl bg-white border border-stone-200 p-5">
        <div class="flex items-start gap-4">
            <span class="grid size-16 shrink-0 place-items-center rounded-full text-white display text-2xl font-bold" style="background: hsl({{ $hue }} 40% 40%)">{{ strtoupper(mb_substr($porter->name, 0, 1)) }}</span>
            <div class="min-w-0 flex-1">
                <h1 class="display text-2xl font-extrabold leading-tight">{{ $porter->name }} @if ($porter->is_verified)<span class="text-canopy text-lg" title="{{ __('Verified') }}">✔</span>@endif</h1>
                <p class="text-sm text-stone-500">{{ $porter->roleLabel() }} · {{ $porter->base_area }}</p>
                <div class="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold">
                    @foreach ($porter->languages as $lang)<span class="rounded bg-stone-100 px-1.5 py-0.5 uppercase">{{ $lang }}</span>@endforeach
                    @if ($porter->license_no)<span class="rounded bg-canopy-light px-1.5 py-0.5 text-canopy">{{ __('License') }} {{ $porter->license_no }}</span>@endif
                </div>
            </div>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-xl bg-stone-50 py-2"><div class="display text-xl font-extrabold leading-none text-summit tabular">Rp {{ number_format($porter->rate_idr_per_day / 1000, 0) }}k</div><div class="text-[10px] uppercase tracking-wider text-stone-500">{{ __('per day') }}</div></div>
            <div class="rounded-xl bg-stone-50 py-2"><div class="display text-xl font-extrabold leading-none tabular">★ {{ number_format($porter->rating_avg, 1) }}</div><div class="text-[10px] uppercase tracking-wider text-stone-500">{{ $porter->rating_count }} {{ __('reviews') }}</div></div>
            <div class="rounded-xl bg-stone-50 py-2"><div class="display text-xl font-extrabold leading-none tabular">{{ $porter->trips_led }}</div><div class="text-[10px] uppercase tracking-wider text-stone-500">{{ __('Trips') }}</div></div>
        </div>

        <p class="mt-4 text-sm leading-relaxed">{{ $porter->bio() }}</p>

        <div class="mt-4 rounded-xl bg-stone-50 p-3 text-sm">
            <div class="text-xs font-bold uppercase tracking-wider text-stone-500">{{ __('Contact') }}</div>
            <div class="mt-1 flex flex-wrap items-center gap-2">
                <span class="font-mono select-all">{{ $porter->phone }}</span>
                <a href="{{ $porter->whatsappUrl() }}" target="_blank" rel="noopener" class="rounded-full bg-[#25D366] px-4 py-1.5 text-xs font-bold text-white">WhatsApp ↗</a>
            </div>
            <p class="mt-2 text-xs text-stone-500">{{ __('Arda Traveling does not take a commission. Agree the fee, dates and load limit in writing before departure.') }}</p>
        </div>
    </section>

    <section class="mt-4">
        <h2 class="display text-base font-bold uppercase tracking-wide mb-2">{{ __('Works on') }}</h2>
        <div class="flex flex-wrap gap-2">
            @foreach ($porter->trails as $trail)
                <a href="{{ route('trails.show', $trail) }}" class="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-bold">▲ {{ $trail->name }} <span class="text-stone-500 font-normal tabular">{{ number_format($trail->elevation_m, 0, ',', '.') }} m</span></a>
            @endforeach
        </div>
    </section>

    @if ($porter->trips->isNotEmpty())
        <section class="mt-4">
            <h2 class="display text-base font-bold uppercase tracking-wide mb-2">{{ __('Upcoming trips with :name', ['name' => $porter->name]) }}</h2>
            <div class="grid gap-3 sm:grid-cols-2">@foreach ($porter->trips as $trip)<x-trip-card :trip="$trip" />@endforeach</div>
        </section>
    @endif
</x-layouts.app>
