<x-layouts.app :title="$trail->name">
    <x-trail-cover :trail="$trail" class="h-44 rounded-2xl flex items-end p-4">
        <div class="relative text-white">
            <x-difficulty :trail="$trail" />
            <h1 class="display text-3xl font-extrabold leading-none mt-1">{{ $trail->name }}</h1>
            <p class="text-sm opacity-90">{{ $trail->regency }}, {{ $trail->province }}</p>
        </div>
    </x-trail-cover>

    <div class="mt-3 grid grid-cols-3 gap-2 text-center">
        @foreach ([[number_format($trail->elevation_m, 0, ',', '.'), 'm'], [rtrim(rtrim(number_format($trail->length_km, 1, ',', ''), '0'), ','), __('km round trip')], ['±'.rtrim(rtrim(number_format($trail->hours_from_jakarta, 1, ',', ''), '0'), ','), __('h from Jakarta')]] as [$v, $l])
            <div class="rounded-xl bg-white border border-stone-200 py-2">
                <div class="display text-2xl font-extrabold leading-none tabular">{{ $v }}</div>
                <div class="text-[10px] uppercase tracking-wider text-stone-500">{{ $l }}</div>
            </div>
        @endforeach
    </div>

    <p class="mt-4 text-sm leading-relaxed">{{ $trail->description() }}</p>

    <section class="mt-4 rounded-2xl bg-white border border-stone-200 p-4">
        <h2 class="display text-base font-bold uppercase tracking-wide">{{ __('Permit') }}</h2>
        <dl class="mt-2 grid grid-cols-2 gap-y-2 text-sm">
            <dt class="text-stone-500">{{ __('Type') }}</dt><dd class="font-semibold">{{ $trail->permitLabel() }}</dd>
            @if ($trail->daily_quota)<dt class="text-stone-500">{{ __('Daily quota') }}</dt><dd class="font-semibold tabular">{{ $trail->daily_quota }} {{ __('hikers') }}</dd>@endif
            @if ($trail->permit_fee_local_idr)<dt class="text-stone-500">{{ __('Fee (Indonesian)') }}</dt><dd class="font-semibold tabular">Rp {{ number_format($trail->permit_fee_local_idr, 0, ',', '.') }}</dd>@endif
            @if ($trail->permit_fee_foreign_idr)<dt class="text-stone-500">{{ __('Fee (foreign visitor)') }}</dt><dd class="font-semibold tabular">Rp {{ number_format($trail->permit_fee_foreign_idr, 0, ',', '.') }}</dd>@endif
            @auth @if ($fee = $trail->permitFeeFor(auth()->user()))<dt class="text-summit font-bold">{{ __('Your fee') }}</dt><dd class="font-bold text-summit tabular">Rp {{ number_format($fee, 0, ',', '.') }}</dd>@endif @endauth
        </dl>
        <div class="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            @if ($trail->basarnas_required)<span class="rounded-full bg-summit-light px-3 py-1 text-summit">{{ __('BASARNAS check-in required') }}</span>@endif
            @if ($trail->guide_required)<span class="rounded-full bg-summit-light px-3 py-1 text-summit">{{ __('Local guide required') }}</span>@endif
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
            @if ($trail->permit_url)<a href="{{ $trail->permit_url }}" target="_blank" rel="noopener" class="rounded-full bg-forest px-4 py-2 text-xs font-bold text-white">{{ __('Book permit') }} ↗</a>@endif
            <a href="{{ route('checkins.create', ['trail' => $trail->id]) }}" class="rounded-full bg-canopy px-4 py-2 text-xs font-bold text-white">✓ {{ __('Check in here') }}</a>
            <a href="{{ route('trips.create', ['trail' => $trail->id]) }}" class="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold">{{ __('Organize a trip here') }}</a>
        </div>
    </section>

    <section class="mt-4">
        <div class="flex items-baseline justify-between mb-2">
            <h2 class="display text-base font-bold uppercase tracking-wide">{{ __('Latest condition') }}</h2>
            @if ($trail->reviews_count)<span class="text-xs text-stone-500">★ {{ number_format($trail->reviews_avg_rating, 1) }} · {{ $trail->reviews_count }} {{ __('reviews') }}</span>@endif
        </div>
        <div class="space-y-2">
            @forelse ($trail->reviews as $review)
                @php $tone = ['baik' => 'bg-emerald-100 text-emerald-800', 'sedang' => 'bg-amber-100 text-amber-800', 'buruk' => 'bg-red-100 text-red-800'][$review->condition]; @endphp
                <article class="rounded-2xl bg-white border border-stone-200 p-4">
                    <div class="flex items-center gap-2 text-xs">
                        <x-avatar :user="$review->user" size="size-7" />
                        <b>{{ $review->user->name }}</b>
                        <span class="text-stone-500">· {{ $review->visited_at->translatedFormat('j M Y') }}</span>
                        <span class="ml-auto rounded px-1.5 py-0.5 font-bold {{ $tone }}">{{ $review->conditionLabel() }}</span>
                    </div>
                    <div class="mt-1 text-xs text-summit">{{ str_repeat('★', $review->rating) }}<span class="text-stone-200">{{ str_repeat('★', 5 - $review->rating) }}</span>
                        <span class="ml-2 text-stone-500">{{ $review->water_available === null ? __('Water unknown') : ($review->water_available ? '💧 '.__('Water available') : __('No water')) }}</span></div>
                    <p class="mt-2 text-sm leading-relaxed">{{ $review->body }}</p>
                </article>
            @empty
                <p class="rounded-2xl bg-white border border-stone-200 p-4 text-sm text-stone-500">{{ __('No reviews yet') }}</p>
            @endforelse
        </div>

        @auth
            <details class="mt-3 rounded-2xl bg-white border border-stone-200">
                <summary class="cursor-pointer px-4 py-3 text-sm font-bold">{{ __('Report trail condition') }}</summary>
                <form method="post" action="{{ route('reviews.store', $trail) }}" enctype="multipart/form-data" class="grid gap-3 border-t border-stone-200 p-4 text-sm">
                    @csrf
                    <div class="grid grid-cols-2 gap-3">
                        <label>{{ __('Rating') }}<select name="rating" id="rv-rating" required class="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5">@for ($i = 5; $i >= 1; $i--)<option value="{{ $i }}">{{ str_repeat('★', $i) }}</option>@endfor</select></label>
                        <label>{{ __('Condition') }}<select name="condition" id="rv-condition" required class="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5"><option value="baik">{{ __('Good') }}</option><option value="sedang">{{ __('Fair') }}</option><option value="buruk">{{ __('Poor') }}</option></select></label>
                        <label>{{ __('Water at source') }}<select name="water_available" id="rv-water" class="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5"><option value="">{{ __('Unknown') }}</option><option value="1">{{ __('Yes') }}</option><option value="0">{{ __('No') }}</option></select></label>
                        <label>{{ __('Date visited') }}<input type="date" name="visited_at" id="rv-date" required max="{{ now()->toDateString() }}" value="{{ now()->toDateString() }}" class="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5"></label>
                    </div>
                    <label>{{ __('What should the next hiker know?') }}<textarea name="body" id="rv-body" rows="3" required minlength="10" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></textarea></label>
                    <label class="text-xs">{{ __('Photos (up to 4)') }}<input type="file" name="photos[]" id="rv-photos" accept="image/*" multiple class="mt-1 block text-xs"></label>
                    <button class="justify-self-end rounded-full bg-canopy px-5 py-2 font-bold text-white">{{ __('Submit report') }}</button>
                </form>
            </details>
        @endauth
    </section>

    <section class="mt-4">
        <h2 class="display text-base font-bold uppercase tracking-wide mb-2">{{ __('Upcoming trips') }}</h2>
        @if ($trail->upcomingTrips->isEmpty())
            <p class="rounded-2xl bg-white border border-stone-200 p-4 text-sm text-stone-500">{{ __('No upcoming trips.') }}</p>
        @else
            <div class="grid gap-3 sm:grid-cols-2">@foreach ($trail->upcomingTrips as $trip)<x-trip-card :trip="$trip" />@endforeach</div>
        @endif
    </section>

    @if ($trail->posts->isNotEmpty())
        <section class="mt-4">
            <h2 class="display text-base font-bold uppercase tracking-wide mb-2">{{ __('Stories from this trail') }}</h2>
            <div class="space-y-3">@foreach ($trail->posts as $post)<x-post-card :post="$post" />@endforeach</div>
        </section>
    @endif
</x-layouts.app>
