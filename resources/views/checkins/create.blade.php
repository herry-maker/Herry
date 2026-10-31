<x-layouts.app :title="__('Safety check-in')">
    <h1 class="display text-2xl font-extrabold">{{ __('Safety check-in') }}</h1>
    <p class="text-sm text-stone-500">{{ __('Log your hike so your emergency contact is alerted if you are overdue.') }}</p>

    @if ($active)
        <section class="mt-4 rounded-2xl border-2 {{ $active->isOverdue() ? 'border-summit' : 'border-canopy' }} bg-white p-4">
            <div class="text-xs font-bold uppercase tracking-wider {{ $active->isOverdue() ? 'text-summit' : 'text-canopy' }}">{{ $active->isOverdue() ? __('Overdue') : __('You are checked in') }}</div>
            <h2 class="display text-xl font-bold">{{ $active->trail->name }}</h2>
            <p class="text-sm text-stone-500">{{ __('since') }} {{ $active->checkin_at->translatedFormat('D, j M H:i') }} · {{ __('Expected return') }} {{ $active->expected_return_at->translatedFormat('D, j M H:i') }}</p>
            <form method="post" action="{{ route('checkins.checkout', $active) }}" class="mt-4 flex flex-wrap items-center gap-3 text-sm">
                @csrf
                <label class="flex items-center gap-2 font-bold"><input type="checkbox" name="reached_summit" value="1" checked class="size-4 accent-canopy"> {{ __('I reached the summit') }}</label>
                <button class="ml-auto rounded-full bg-canopy px-5 py-2.5 font-bold text-white">{{ __('Check out now') }}</button>
            </form>
        </section>
    @else
        <form method="post" action="{{ route('checkins.store') }}" class="mt-4 grid gap-4 rounded-2xl bg-white border border-stone-200 p-4 text-sm">
            @csrf
            <label>{{ __('Mountain') }}
                <select name="trail_id" id="ci-trail" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2">
                    @foreach ($trails as $t)<option value="{{ $t->id }}" @selected(old('trail_id', $selected) == $t->id)>{{ $t->name }} · {{ number_format($t->elevation_m, 0, ',', '.') }} m</option>@endforeach
                </select></label>
            <label>{{ __('Expected return') }}<input type="datetime-local" name="expected_return_at" id="ci-return" required min="{{ now()->format('Y-m-d\TH:i') }}" value="{{ old('expected_return_at', now()->addDay()->setTime(16, 0)->format('Y-m-d\TH:i')) }}" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <div class="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
                <b class="text-stone-900">{{ __('Your emergency contact') }}:</b> {{ auth()->user()->emergency_name }} · {{ auth()->user()->emergency_phone }}<br>
                {{ __('If you have not checked out :hours hours after this time, we email your emergency contact with your trail and phone number.', ['hours' => \App\Models\CheckIn::OVERDUE_GRACE_HOURS]) }}
            </div>
            <button class="justify-self-end rounded-full bg-canopy px-6 py-2.5 font-bold text-white">✓ {{ __('Check in') }}</button>
        </form>
    @endif
</x-layouts.app>
