@props(['porter', 'compact' => false])
@php $hue = crc32($porter->slug) % 360; @endphp
<a href="{{ route('porters.show', $porter) }}" class="flex gap-3 rounded-2xl bg-white border border-stone-200 p-3 hover:border-canopy transition">
    <span class="grid size-12 shrink-0 place-items-center rounded-full text-white display text-lg font-bold" style="background: hsl({{ $hue }} 40% 40%)">{{ strtoupper(mb_substr($porter->name, 0, 1)) }}</span>
    <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
            <span class="display text-base font-bold leading-tight truncate">{{ $porter->name }}</span>
            @if ($porter->is_verified)<span class="shrink-0 text-canopy" title="{{ __('Verified') }}">✔</span>@endif
        </div>
        <div class="text-xs text-stone-500">
            <span class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider {{ $porter->role === 'guide' ? 'bg-mist/20 text-mist' : 'bg-stone-100 text-stone-500' }}">{{ $porter->roleLabel() }}</span>
            · {{ $porter->base_area }}
            @if ($porter->speaksEnglish()) · <span class="font-bold text-canopy">EN</span>@endif
        </div>
        @unless ($compact)
            <div class="mt-1 text-xs text-stone-500 truncate">{{ $porter->trails->pluck('name')->map(fn ($n) => str_replace('Gunung ', '', $n))->join(' · ') }}</div>
        @endunless
    </div>
    <div class="text-right shrink-0">
        <div class="display text-base font-bold text-summit tabular">Rp {{ number_format($porter->rate_idr_per_day / 1000, 0) }}k<small class="font-sans text-[10px] font-normal text-stone-500">/{{ __('day') }}</small></div>
        <div class="text-[11px] text-stone-500 tabular">★ {{ number_format($porter->rating_avg, 1) }} ({{ $porter->rating_count }})</div>
    </div>
</a>
