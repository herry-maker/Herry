<x-layouts.app :title="__('Trails')">
    <form method="get" class="space-y-2">
        <div class="flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-3 py-2">
            <span aria-hidden="true">⌕</span>
            <input type="search" name="q" id="trail-q" value="{{ $filters['q'] ?? '' }}" placeholder="{{ __('Search mountains') }}" class="flex-1 bg-transparent text-sm focus:outline-none">
            @foreach (['difficulty', 'max_hours', 'permit'] as $k)@if (!empty($filters[$k]))<input type="hidden" name="{{ $k }}" value="{{ $filters[$k] }}">@endif @endforeach
        </div>
        <div class="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 text-xs font-bold">
            @php
                $chips = [
                    ['label' => __('All'), 'params' => []],
                    ['label' => __('≤ 3 h from Jakarta'), 'params' => ['max_hours' => 3]],
                    ['label' => __('≤ 5 h from Jakarta'), 'params' => ['max_hours' => 5]],
                    ['label' => __('Easy'), 'params' => ['difficulty' => 'mudah']],
                    ['label' => __('Moderate'), 'params' => ['difficulty' => 'sedang']],
                    ['label' => __('Hard'), 'params' => ['difficulty' => 'berat']],
                    ['label' => __('Extreme'), 'params' => ['difficulty' => 'ekstrem']],
                    ['label' => __('Permit required'), 'params' => ['permit' => 'simaksi']],
                ];
            @endphp
            @foreach ($chips as $chip)
                @php $on = $chip['params'] ? collect($chip['params'])->every(fn ($v, $k) => ($filters[$k] ?? null) == $v) : empty(array_filter($filters)); @endphp
                <a href="{{ route('trails.index', array_filter(['q' => $filters['q'] ?? null, ...$chip['params']])) }}"
                   class="shrink-0 rounded-full border px-3 py-1.5 {{ $on ? 'border-canopy bg-canopy-light text-canopy' : 'border-stone-200 text-stone-500' }}">{{ $chip['label'] }}</a>
            @endforeach
        </div>
    </form>

    <p class="mt-3 text-xs text-stone-500">{{ __('Showing :count trails', ['count' => $trails->count()]) }}</p>

    <div class="mt-2 divide-y divide-stone-200 rounded-2xl bg-white border border-stone-200">
        @forelse ($trails as $trail)
            <a href="{{ route('trails.show', $trail) }}" class="flex gap-3 p-3 hover:bg-stone-50">
                <x-trail-cover :trail="$trail" class="h-16 w-20 shrink-0 rounded-xl" />
                <div class="min-w-0 flex-1">
                    <h3 class="display text-lg font-bold leading-tight">{{ $trail->name }}</h3>
                    <p class="text-xs text-stone-500">{{ $trail->regency }}, {{ $trail->province }} · ±{{ rtrim(rtrim(number_format($trail->hours_from_jakarta, 1, ',', ''), '0'), ',') }} {{ __('h from Jakarta') }}</p>
                    <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 tabular">
                        <span><b class="text-stone-900">{{ number_format($trail->elevation_m, 0, ',', '.') }}</b> m</span>
                        <span><b class="text-stone-900">{{ rtrim(rtrim(number_format($trail->length_km, 1, ',', ''), '0'), ',') }}</b> {{ __('km round trip') }}</span>
                        <x-difficulty :trail="$trail" />
                        @if ($trail->requiresPermit())<span class="rounded border border-summit px-1.5 py-0.5 text-[10px] font-bold text-summit">{{ $trail->permitLabel() }}@if ($trail->daily_quota) {{ $trail->daily_quota }}/d @endif</span>@endif
                        @if ($trail->reviews_count)<span>★ {{ number_format($trail->reviews_avg_rating, 1) }} ({{ $trail->reviews_count }})</span>@endif
                    </div>
                </div>
            </a>
        @empty
            <p class="p-6 text-center text-sm text-stone-500">{{ __('No trails match those filters.') }}</p>
        @endforelse
    </div>
</x-layouts.app>
