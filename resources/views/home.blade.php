<x-layouts.app :title="__('Home')">
    @php
        $hour = (int) now()->format('G');
        $greeting = $hour < 11 ? __('Good morning,') : ($hour < 16 ? __('Good afternoon,') : __('Good evening,'));
    @endphp

    <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest to-canopy text-white p-5">
        <svg class="absolute -right-4 -bottom-2 w-44 h-28 opacity-15" viewBox="0 0 170 110" aria-hidden="true"><polygon points="85,8 165,110 5,110" fill="#fff"/><polygon points="40,40 100,110 -20,110" fill="#fff"/></svg>
        @auth
            <p class="text-sm opacity-80">{{ $greeting }}</p>
            <h1 class="display text-2xl font-bold">{{ auth()->user()->name }}</h1>
            <div class="mt-3 flex gap-6 relative">
                <div><div class="display text-3xl font-extrabold leading-none tabular">{{ auth()->user()->summit_count }}</div><div class="text-[10px] uppercase tracking-wider opacity-75">{{ __('Summits') }}</div></div>
                <div><div class="display text-3xl font-extrabold leading-none tabular">{{ number_format(auth()->user()->total_elevation_m / 1000, 1) }}k</div><div class="text-[10px] uppercase tracking-wider opacity-75">m {{ __('Elevation') }}</div></div>
                <div><div class="display text-3xl font-extrabold leading-none tabular">{{ auth()->user()->trips()->wherePivotIn('status', ['paid', 'confirmed'])->count() }}</div><div class="text-[10px] uppercase tracking-wider opacity-75">{{ __('Trips') }}</div></div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2 relative">
                <a href="{{ route('trips.index') }}" class="rounded-full bg-summit px-4 py-2 text-sm font-bold">{{ __('Find an open trip') }} →</a>
                @if ($activeCheckIn)
                    <a href="{{ route('checkins.create') }}" class="rounded-full bg-white/15 px-4 py-2 text-sm font-bold {{ $activeCheckIn->isOverdue() ? 'ring-2 ring-summit' : '' }}">⏱ {{ __('You are checked in') }}: {{ $activeCheckIn->trail->name }}</a>
                @else
                    <a href="{{ route('checkins.create') }}" class="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">✓ {{ __('Check in') }}</a>
                @endif
            </div>
        @else
            <h1 class="display text-3xl font-extrabold leading-tight">{{ __('Welcome, hiker') }}</h1>
            <p class="mt-1 max-w-md text-sm opacity-85">{{ __("Hiking community for Indonesia's mountains, from Jakarta weekend trips to Rinjani traverses.") }}</p>
            <div class="mt-4 flex gap-2 relative">
                <a href="{{ route('register') }}" class="rounded-full bg-summit px-4 py-2 text-sm font-bold">{{ __('Create account') }}</a>
                <a href="{{ route('login') }}" class="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">{{ __('Log in') }}</a>
            </div>
        @endauth
    </section>

    <section class="mt-6">
        <div class="flex items-baseline justify-between mb-2">
            <h2 class="display text-base font-bold uppercase tracking-wide">{{ __('Popular trails') }}</h2>
            <a href="{{ route('trails.index') }}" class="text-xs font-bold text-canopy">{{ __('See all') }}</a>
        </div>
        <div class="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
            @foreach ($popularTrails as $trail)
                <a href="{{ route('trails.show', $trail) }}" class="shrink-0 w-36 rounded-2xl bg-white border border-stone-200 overflow-hidden">
                    <x-trail-cover :trail="$trail" class="h-20" />
                    <div class="p-2.5">
                        <div class="display text-sm font-bold leading-tight">{{ $trail->name }}</div>
                        <div class="text-[11px] text-stone-500 tabular">{{ number_format($trail->elevation_m, 0, ',', '.') }} m · {{ $trail->regency }}</div>
                        <x-difficulty :trail="$trail" class="mt-1" />
                    </div>
                </a>
            @endforeach
        </div>
    </section>

    @if ($nextTrips->isNotEmpty())
        <section class="mt-6">
            <div class="flex items-baseline justify-between mb-2">
                <h2 class="display text-base font-bold uppercase tracking-wide">{{ __('Upcoming trips') }}</h2>
                <a href="{{ route('trips.index') }}" class="text-xs font-bold text-canopy">{{ __('See all') }}</a>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
                @foreach ($nextTrips as $trip)<x-trip-card :trip="$trip" />@endforeach
            </div>
        </section>
    @endif

    <section class="mt-6">
        <div class="flex items-baseline justify-between mb-2">
            <h2 class="display text-base font-bold uppercase tracking-wide">{{ __('Community') }}</h2>
            <span class="text-xs font-bold text-stone-500">{{ __('Latest') }}</span>
        </div>

        @auth
            <form method="post" action="{{ route('posts.store') }}" enctype="multipart/form-data" x-data="{ type: 'story', open: false }" class="mb-3 rounded-2xl bg-white border border-stone-200 p-4">
                @csrf
                <div class="flex gap-3">
                    <x-avatar :user="auth()->user()" />
                    <textarea name="body" id="post-body" rows="2" @focus="open = true" required minlength="3" placeholder="{{ __('Share a story or trail update') }}" class="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-canopy focus:outline-none">{{ old('body') }}</textarea>
                </div>
                <div x-show="open" x-cloak class="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
                    <select name="type" x-model="type" id="post-type" class="rounded-lg border border-stone-200 bg-white px-2 py-1.5">
                        <option value="story">{{ __('Story') }}</option>
                        <option value="condition_alert">{{ __('Trail condition alert') }}</option>
                    </select>
                    <select name="trail_id" id="post-trail" class="rounded-lg border border-stone-200 bg-white px-2 py-1.5" :required="type === 'condition_alert'">
                        <option value="">{{ __('Tag a trail (optional)') }}</option>
                        @foreach (\App\Models\Trail::orderBy('name')->get(['id', 'name']) as $t)<option value="{{ $t->id }}">{{ $t->name }}</option>@endforeach
                    </select>
                    <input type="file" name="photos[]" id="post-photos" accept="image/*" multiple class="text-xs file:mr-2 file:rounded-full file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:font-bold">
                    <button class="sm:col-span-3 justify-self-end rounded-full bg-canopy px-5 py-2 text-sm font-bold text-white">{{ __('Post') }}</button>
                </div>
            </form>
        @else
            <p class="mb-3 rounded-2xl bg-white border border-stone-200 p-4 text-sm text-stone-500">{{ __('Log in to post, review and join trips.') }}</p>
        @endauth

        <div class="space-y-3">
            @foreach ($posts as $post)<x-post-card :post="$post" />@endforeach
        </div>
        <div class="mt-4">{{ $posts->links() }}</div>
    </section>
</x-layouts.app>
