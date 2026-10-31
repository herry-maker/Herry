<x-layouts.app :title="$user->name">
    @php $own = auth()->id() === $user->id; @endphp
    <section class="rounded-2xl bg-gradient-to-br from-forest to-canopy p-5 text-center text-white">
        <x-avatar :user="$user" size="size-16" class="mx-auto text-2xl ring-4 ring-white/30" />
        <h1 class="display text-2xl font-bold mt-2">{{ $user->name }}</h1>
        <p class="text-xs opacity-80">{{ $user->experienceLabel() }} · {{ __('Joined') }} {{ $user->created_at->translatedFormat('M Y') }} · {{ $user->nationality }}@if ($user->emergency_phone) · 🛡@endif</p>
        @if ($user->bio)<p class="mt-2 text-sm opacity-90 max-w-md mx-auto">{{ $user->bio }}</p>@endif
        <div class="mt-4 grid grid-cols-4 divide-x divide-white/20">
            @foreach ([[$user->summit_count, __('Summits')], [number_format($user->total_elevation_m / 1000, 1).'k', 'm'], [$trips->count(), __('Trips')], [$user->badges->count(), __('Badges')]] as [$v, $l])
                <div><div class="display text-2xl font-extrabold leading-none tabular">{{ $v }}</div><div class="text-[10px] uppercase tracking-wider opacity-70">{{ $l }}</div></div>
            @endforeach
        </div>
        @if ($own)
            <div class="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
                <a href="{{ route('profile.edit') }}" class="rounded-full bg-white/15 px-4 py-2">{{ __('Edit profile') }}</a>
                <a href="{{ route('checkins.create') }}" class="rounded-full bg-summit px-4 py-2">✓ {{ __('Check in') }}</a>
                <a href="{{ route('permits.index') }}" class="rounded-full bg-white/15 px-4 py-2">📄 {{ __('My permits') }}</a>
                <button type="button" id="install-app" hidden class="rounded-full bg-white/15 px-4 py-2">📲 {{ __('Install app') }}</button>
                <form method="post" action="{{ route('logout') }}">@csrf<button class="rounded-full bg-white/15 px-4 py-2">{{ __('Log out') }}</button></form>
            </div>
        @endif
    </section>

    <section class="mt-4">
        <h2 class="display text-base font-bold uppercase tracking-wide mb-2">{{ __('Badges') }} <span class="text-stone-500 font-sans text-xs font-normal normal-case">{{ $user->badges->count() }} / {{ $allBadges->count() }}</span></h2>
        <div class="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
            @foreach ($allBadges as $badge)
                @php $has = $user->badges->contains('id', $badge->id); @endphp
                <div class="shrink-0 w-20 text-center {{ $has ? '' : 'opacity-35 grayscale' }}" title="{{ $badge->description() }}">
                    <div class="mx-auto grid size-12 place-items-center rounded-full border-2 {{ $has ? 'border-summit bg-summit-light' : 'border-stone-200 bg-white' }} text-xl">{{ $badge->icon }}</div>
                    <div class="mt-1 text-[10px] font-semibold leading-tight">{{ $badge->name() }}</div>
                </div>
            @endforeach
        </div>
    </section>

    <section class="mt-4">
        <h2 class="display text-base font-bold uppercase tracking-wide mb-2">{{ __('Summit log') }}</h2>
        <div class="rounded-2xl bg-white border border-stone-200 divide-y divide-stone-200">
            @forelse ($summits as $s)
                <a href="{{ route('trails.show', $s->trail) }}" class="flex items-center gap-3 p-3">
                    <span class="grid size-9 place-items-center rounded-xl bg-canopy-light text-canopy">▲</span>
                    <div class="min-w-0 flex-1"><div class="text-sm font-bold">{{ $s->trail->name }}</div><div class="text-xs text-stone-500">{{ $s->checkout_at->translatedFormat('j M Y') }} · {{ $s->trail->regency }}</div></div>
                    <div class="display font-bold text-stone-500 tabular">{{ number_format($s->trail->elevation_m, 0, ',', '.') }} m</div>
                </a>
            @empty
                <p class="p-4 text-sm text-stone-500">{{ __('No summits yet. Check in on your next hike.') }}</p>
            @endforelse
        </div>
    </section>

    @if ($trips->isNotEmpty())
        <section class="mt-4">
            <h2 class="display text-base font-bold uppercase tracking-wide mb-2">{{ __('Trips') }}</h2>
            <div class="grid gap-3 sm:grid-cols-2">@foreach ($trips as $trip)<x-trip-card :trip="$trip" />@endforeach</div>
        </section>
    @endif
</x-layouts.app>
