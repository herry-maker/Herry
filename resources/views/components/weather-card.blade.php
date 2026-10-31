@props(['forecast', 'highlight' => null])
@php $descKey = app()->getLocale() === 'id' ? 'desc_id' : 'desc_en'; @endphp
<section {{ $attributes->merge(['class' => 'rounded-2xl bg-white border border-stone-200 p-4']) }}>
    <div class="flex items-baseline justify-between">
        <h2 class="display text-base font-bold uppercase tracking-wide">{{ __('Weather at basecamp') }}</h2>
        <span class="text-[11px] text-stone-500">BMKG · {{ $forecast ? $forecast['place'] : '' }}</span>
    </div>

    @if (! $forecast)
        <p class="mt-2 text-sm text-stone-500">{{ __('Forecast unavailable right now. Check BMKG directly before you leave.') }}</p>
    @else
        <div class="mt-3 grid grid-cols-3 gap-2">
            @foreach ($forecast['days'] as $day)
                @php $isHl = $highlight && $day['date'] === $highlight->toDateString(); @endphp
                <div class="rounded-xl p-2.5 text-center {{ $day['severe'] ? 'bg-summit-light ring-1 ring-summit' : 'bg-stone-50' }} {{ $isHl ? 'outline outline-2 outline-canopy' : '' }}">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-stone-500">{{ \Illuminate\Support\Carbon::parse($day['date'])->translatedFormat('D j M') }}</div>
                    <div class="text-2xl leading-none mt-1">{{ \App\Services\WeatherService::icon($day['code']) }}</div>
                    <div class="display text-lg font-bold leading-tight mt-1 tabular">{{ $day['tmin'] }}–{{ $day['tmax'] }}°</div>
                    <div class="text-[11px] leading-tight {{ $day['severe'] ? 'font-bold text-summit' : 'text-stone-500' }}">{{ $day[$descKey] }}</div>
                    <div class="text-[10px] text-stone-500 mt-1 tabular">💧{{ $day['hu_max'] }}% · 💨{{ $day['ws_max'] }} km/h</div>
                </div>
            @endforeach
        </div>
        @if (collect($forecast['days'])->contains('severe', true))
            <p class="mt-3 rounded-xl bg-summit-light px-3 py-2 text-xs font-semibold text-summit">⚠ {{ __('Heavy rain or thunderstorm forecast. Lightning on exposed ridges is the main killer on Javanese volcanoes; plan to be off the summit before noon or postpone.') }}</p>
        @endif
        <p class="mt-2 text-[10px] text-stone-500">{{ __('Forecast for the nearest village to basecamp; summit conditions are colder and wetter. Updated :time.', ['time' => \Illuminate\Support\Carbon::parse($forecast['updated'])->diffForHumans()]) }}</p>
    @endif
</section>
