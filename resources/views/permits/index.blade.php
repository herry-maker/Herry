<x-layouts.app :title="__('My permits')">
    <div class="flex items-center justify-between">
        <h1 class="display text-2xl font-extrabold">{{ __('My permits') }}</h1>
        <a href="{{ route('permits.create') }}" class="rounded-full bg-summit px-4 py-2 text-xs font-bold text-white">+ {{ __('Plan a permit') }}</a>
    </div>
    <p class="text-sm text-stone-500">{{ __('Track SIMAKSI and entry tickets for each hike. We email you the day the booking window opens.') }}</p>

    @php
        $tone = ['planned' => 'bg-amber-100 text-amber-800', 'booked' => 'bg-mist/20 text-mist', 'approved' => 'bg-emerald-100 text-emerald-800', 'used' => 'bg-stone-100 text-stone-500', 'expired' => 'bg-red-100 text-red-800'];
    @endphp

    @foreach ([[__('Upcoming'), $upcoming], [__('Past'), $past]] as [$heading, $list])
        @continue($list->isEmpty() && $heading === __('Past'))
        <section class="mt-4">
            <h2 class="display text-base font-bold uppercase tracking-wide mb-2">{{ $heading }}</h2>
            <div class="space-y-3">
                @forelse ($list as $permit)
                    <article class="rounded-2xl bg-white border border-stone-200 p-4" x-data="{ edit: false }">
                        <div class="flex items-start gap-3">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <a href="{{ route('trails.show', $permit->trail) }}" class="display text-lg font-bold leading-tight">{{ $permit->trail->name }}</a>
                                    <span class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider {{ $tone[$permit->status] }}">{{ $permit->statusLabel() }}</span>
                                </div>
                                <div class="text-sm text-stone-500">{{ $permit->hike_date->translatedFormat('D, j M Y') }} · {{ $permit->party_size }} {{ __('hikers') }} · {{ $permit->trail->permitLabel() }}</div>
                                @if ($permit->trip)<a href="{{ route('trips.show', $permit->trip) }}" class="text-xs font-bold text-canopy">⛺ {{ $permit->trip->title }}</a>@endif
                            </div>
                            @if ($permit->hike_date->gte(today()))
                                <div class="text-right shrink-0">
                                    <div class="display text-2xl font-extrabold leading-none tabular">{{ $permit->daysUntilHike() }}</div>
                                    <div class="text-[10px] uppercase tracking-wider text-stone-500">{{ __('days') }}</div>
                                </div>
                            @endif
                        </div>

                        @if ($permit->status === 'planned' && $permit->hike_date->gte(today()))
                            <div class="mt-3 rounded-xl {{ $permit->bookingWindowOpen() ? 'bg-canopy-light text-canopy' : 'bg-stone-50 text-stone-500' }} px-3 py-2 text-xs font-semibold">
                                @if ($permit->bookingWindowOpen())
                                    {{ __('Booking window is open. Quota: :quota.', ['quota' => $permit->trail->daily_quota ? $permit->trail->daily_quota.' '.__('hikers').'/'.__('day') : __('no fixed quota')]) }}
                                @else
                                    {{ __('Booking usually opens :date (:days days before).', ['date' => $permit->bookingOpensOn()->translatedFormat('j M Y'), 'days' => \App\Models\Permit::BOOKING_WINDOW_DAYS]) }}
                                @endif
                            </div>
                        @endif

                        @if ($permit->simaksi_code)<div class="mt-2 text-sm"><span class="text-stone-500">{{ __('Code') }}:</span> <span class="font-mono font-bold select-all">{{ $permit->simaksi_code }}</span></div>@endif
                        @if ($fee = $permit->feeFor(auth()->user()))<div class="text-sm"><span class="text-stone-500">{{ __('Estimated fee') }}:</span> <b class="tabular">Rp {{ number_format($fee, 0, ',', '.') }}</b> <span class="text-xs text-stone-500">({{ $permit->party_size }} × {{ auth()->user()->isForeign() ? __('foreign visitor') : __('Indonesian') }})</span></div>@endif
                        @if ($permit->notes)<p class="mt-1 text-xs text-stone-500">{{ $permit->notes }}</p>@endif

                        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                            @if ($permit->trail->permit_url)<a href="{{ $permit->trail->permit_url }}" target="_blank" rel="noopener" class="rounded-full bg-forest px-3 py-1.5 text-white">{{ __('Book permit') }} ↗</a>@endif
                            <button type="button" @click="edit = !edit" class="rounded-full border border-stone-200 bg-white px-3 py-1.5">{{ __('Update status') }}</button>
                            <form method="post" action="{{ route('permits.destroy', $permit) }}" class="ml-auto" x-data="{ sure: false }">
                                @csrf @method('delete')
                                <button type="button" x-show="!sure" @click="sure = true" class="text-stone-500">{{ __('Remove') }}</button>
                                <span x-show="sure" x-cloak><button class="text-summit">{{ __('Remove') }}?</button> · <button type="button" @click="sure = false" class="text-stone-500">{{ __('Cancel') }}</button></span>
                            </form>
                        </div>

                        <form x-show="edit" x-cloak method="post" action="{{ route('permits.update', $permit) }}" class="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3 text-sm sm:grid-cols-[auto_1fr_auto]">
                            @csrf @method('put')
                            <select name="status" id="permit-status-{{ $permit->id }}" class="rounded-lg border border-stone-200 bg-white px-2 py-1.5">
                                @foreach (\App\Models\Permit::STATUSES as $s)<option value="{{ $s }}" @selected($permit->status === $s)>{{ __(ucfirst($s)) }}</option>@endforeach
                            </select>
                            <input name="simaksi_code" id="permit-code-{{ $permit->id }}" value="{{ $permit->simaksi_code }}" placeholder="{{ __('SIMAKSI code') }}" class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 font-mono">
                            <button class="rounded-full bg-canopy px-4 py-1.5 text-xs font-bold text-white">{{ __('Save') }}</button>
                        </form>
                    </article>
                @empty
                    <p class="rounded-2xl bg-white border border-stone-200 p-6 text-center text-sm text-stone-500">{{ __('No permits planned yet. Pick a mountain and a date.') }}</p>
                @endforelse
            </div>
        </section>
    @endforeach
</x-layouts.app>
