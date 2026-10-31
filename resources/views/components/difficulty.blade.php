@props(['trail'])
@php
    $tone = match ($trail->difficulty) {
        'mudah'  => 'bg-emerald-100 text-emerald-800',
        'sedang' => 'bg-amber-100 text-amber-800',
        'berat'  => 'bg-orange-100 text-orange-900',
        default  => 'bg-purple-100 text-purple-900',
    };
@endphp
<span {{ $attributes->merge(['class' => "inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider {$tone}"]) }}>{{ $trail->difficultyLabel() }}</span>
