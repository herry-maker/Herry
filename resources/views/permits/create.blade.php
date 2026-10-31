<x-layouts.app :title="__('Plan a permit')">
    <h1 class="display text-2xl font-extrabold">{{ __('Plan a permit') }}</h1>
    <p class="text-sm text-stone-500">{{ __('Pick the mountain and your hike date. We calculate when booking opens and remind you by email.') }}</p>

    @php
        $meta = $trails->mapWithKeys(fn ($t) => [$t->id => ['quota' => $t->daily_quota, 'permit' => $t->permitLabel(), 'fee' => $t->permitFeeFor(auth()->user()), 'url' => $t->permit_url]]);
    @endphp

    <form method="post" action="{{ route('permits.store') }}" class="mt-4 grid gap-4 rounded-2xl bg-white border border-stone-200 p-4 text-sm"
          x-data="{ trail: '{{ old('trail_id', $selected ?? $trip?->trail_id ?? $trails->first()?->id) }}', date: '{{ old('hike_date', $trip?->departure_at->toDateString() ?? '') }}', size: {{ old('party_size', 1) }}, meta: @js($meta),
                    opens() { if (!this.date) return null; const d = new Date(this.date); d.setDate(d.getDate() - {{ \App\Models\Permit::BOOKING_WINDOW_DAYS }}); return d; },
                    windowOpen() { const o = this.opens(); return o && o <= new Date(); } }">
        @csrf
        @if ($trip)<input type="hidden" name="trip_id" value="{{ $trip->id }}">@endif
        <label>{{ __('Mountain') }}
            <select name="trail_id" id="permit-trail" x-model="trail" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2">
                @foreach ($trails as $t)<option value="{{ $t->id }}">{{ $t->name }} · {{ $t->permitLabel() }}@if ($t->daily_quota) · {{ $t->daily_quota }}/{{ __('day') }}@endif</option>@endforeach
            </select></label>
        <div class="grid grid-cols-2 gap-3">
            <label>{{ __('Hike date') }}<input type="date" name="hike_date" id="permit-date" x-model="date" required min="{{ today()->toDateString() }}" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label>{{ __('Party size') }}<input type="number" name="party_size" id="permit-size" x-model.number="size" min="1" max="50" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
        </div>

        <div class="rounded-xl bg-stone-50 p-3 text-xs text-stone-500 space-y-1" x-cloak x-show="date">
            <div x-show="windowOpen()" class="font-bold text-canopy">{{ __('Booking window is open now.') }}</div>
            <div x-show="!windowOpen()"><b class="text-stone-900">{{ __('Booking opens') }}:</b> <span x-text="opens()?.toLocaleDateString('{{ app()->getLocale() }}-{{ app()->getLocale() === 'id' ? 'ID' : 'GB' }}', { day: 'numeric', month: 'short', year: 'numeric' })"></span> ({{ \App\Models\Permit::BOOKING_WINDOW_DAYS }} {{ __('days before') }})</div>
            <div x-show="meta[trail]?.quota"><b class="text-stone-900">{{ __('Daily quota') }}:</b> <span x-text="meta[trail]?.quota"></span> {{ __('hikers') }}</div>
            <div x-show="meta[trail]?.fee"><b class="text-stone-900">{{ __('Estimated fee') }}:</b> Rp <span x-text="(meta[trail]?.fee * size).toLocaleString('id-ID')"></span> <span>({{ auth()->user()->isForeign() ? __('foreign visitor') : __('Indonesian') }} × <span x-text="size"></span>)</span></div>
        </div>

        <label>{{ __('Notes') }} <span class="text-stone-500">({{ __('Optional') }})</span><textarea name="notes" id="permit-notes" rows="2" maxlength="500" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2">{{ old('notes') }}</textarea></label>
        <button class="justify-self-end rounded-full bg-summit px-6 py-2.5 font-bold text-white">{{ __('Save permit plan') }}</button>
    </form>
</x-layouts.app>
