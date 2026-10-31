@props(['trail', 'class' => 'h-20'])
<div {{ $attributes->merge(['class' => "relative overflow-hidden cover-{$trail->cover_gradient} {$class}"]) }}>
    @if ($trail->cover_path)
        <img src="{{ asset('storage/'.$trail->cover_path) }}" alt="" class="absolute inset-0 size-full object-cover">
    @else
        <svg class="absolute inset-x-0 bottom-0 w-full h-2/3" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <polygon points="50,3 92,40 8,40" fill="rgba(6,22,12,.6)"/>
            <polygon points="22,16 56,40 -12,40" fill="rgba(6,22,12,.4)"/>
            <polygon points="78,20 112,40 46,40" fill="rgba(6,22,12,.3)"/>
        </svg>
    @endif
    @if ($slot->isNotEmpty())
        <div class="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/70 via-black/30 to-transparent" aria-hidden="true"></div>
    @endif
    {{ $slot }}
</div>
