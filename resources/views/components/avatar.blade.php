@props(['user', 'size' => 'size-9'])
@php $hue = crc32($user->email) % 360; @endphp
@if ($user->avatar_path)
    <img src="{{ asset('storage/'.$user->avatar_path) }}" alt="{{ $user->name }}" {{ $attributes->merge(['class' => "{$size} rounded-full object-cover shrink-0"]) }}>
@else
    <span {{ $attributes->merge(['class' => "{$size} rounded-full grid place-items-center text-white display font-bold shrink-0"]) }} style="background: hsl({{ $hue }} 45% 38%)">{{ $user->initials() }}</span>
@endif
