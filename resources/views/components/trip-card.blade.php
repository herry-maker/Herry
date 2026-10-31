@props(['trip'])
@php
    $active = $trip->active_members_count ?? $trip->activeMemberCount();
    $left = max(0, $trip->max_participants - $active);
    $pct = $trip->max_participants ? min(100, round($active / $trip->max_participants * 100)) : 0;
@endphp
<a href="{{ route('trips.show', $trip) }}" class="block rounded-2xl bg-white border border-stone-200 overflow-hidden hover:border-canopy transition">
    <x-trail-cover :trail="$trip->trail" class="h-24 flex items-end p-3">
        <span class="relative rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white {{ $trip->beginner_friendly ? 'bg-canopy' : ($trip->type === 'private' ? 'bg-mist' : 'bg-summit') }}">
            {{ $trip->beginner_friendly ? __('Beginner friendly') : ($trip->type === 'private' ? __('Private trip') : __('Open trip')) }}
        </span>
    </x-trail-cover>
    <div class="p-4">
        <h3 class="display text-lg font-bold leading-tight">{{ $trip->title }}</h3>
        <p class="text-xs text-stone-500 mt-0.5">{{ __('by') }} {{ $trip->organizer->name }}</p>
        <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
            <span>📅 <b class="text-stone-900">{{ $trip->departure_at->translatedFormat('j M') }}–{{ $trip->return_at->translatedFormat('j M Y') }}</b></span>
            <span>⏱ <b class="text-stone-900">{{ $trip->durationLabel() }}</b></span>
            <span>▲ <b class="text-stone-900">{{ $trip->trail->name }}</b> · {{ number_format($trip->trail->elevation_m, 0, ',', '.') }} m</span>
        </div>
        <div class="mt-3 h-1 rounded bg-stone-100 overflow-hidden"><div class="h-full bg-canopy" style="width: {{ $pct }}%"></div></div>
        <div class="mt-1 text-xs text-stone-500 tabular">{{ $left > 0 ? "{$left} ".__('seats left')." · {$active}/{$trip->max_participants}" : __('Full') }}</div>
        <div class="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
            <div>
                <div class="display text-xl font-bold text-summit">Rp {{ number_format($trip->price_idr, 0, ',', '.') }} <small class="font-sans text-xs font-normal text-stone-500">{{ __('per person') }}</small></div>
                @if ($trip->includes)<div class="text-[11px] text-stone-500 truncate max-w-56">{{ implode(', ', $trip->includes) }}</div>@endif
            </div>
            <span class="rounded-full bg-canopy px-4 py-1.5 text-xs font-bold text-white">{{ $left > 0 ? __('Join') : __('Full') }}</span>
        </div>
    </div>
</a>
