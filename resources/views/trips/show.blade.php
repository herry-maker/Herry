<x-layouts.app :title="$trip->title">
    @php $left = $trip->seatsLeft(); @endphp
    <x-trail-cover :trail="$trip->trail" class="h-40 rounded-2xl flex items-end p-4">
        <div class="relative text-white">
            <span class="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider {{ $trip->type === 'private' ? 'bg-mist' : 'bg-summit' }}">{{ $trip->type === 'private' ? __('Private trip') : __('Open trip') }}</span>
            <h1 class="display text-2xl font-extrabold leading-tight mt-1">{{ $trip->title }}</h1>
            <a href="{{ route('trails.show', $trip->trail) }}" class="text-sm underline-offset-2 hover:underline">▲ {{ $trip->trail->name }} · {{ number_format($trip->trail->elevation_m, 0, ',', '.') }} m</a>
        </div>
    </x-trail-cover>

    <div class="mt-3 rounded-2xl bg-white border border-stone-200 p-4">
        <div class="flex items-center gap-3">
            <x-avatar :user="$trip->organizer" />
            <div class="text-sm"><div class="text-xs text-stone-500">{{ __('Organizer') }}</div><a href="{{ route('profile.show', $trip->organizer) }}" class="font-bold">{{ $trip->organizer->name }}</a></div>
            <div class="ml-auto text-right">
                <div class="display text-2xl font-bold text-summit tabular">Rp {{ number_format($trip->price_idr, 0, ',', '.') }}</div>
                <div class="text-[11px] text-stone-500">{{ __('per person') }}</div>
            </div>
        </div>
        <dl class="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt class="text-stone-500">{{ __('Departure') }}</dt><dd class="font-semibold">{{ $trip->departure_at->translatedFormat('D, j M Y H:i') }}</dd>
            <dt class="text-stone-500">{{ __('Return') }}</dt><dd class="font-semibold">{{ $trip->return_at->translatedFormat('D, j M Y H:i') }} · {{ $trip->durationLabel() }}</dd>
            <dt class="text-stone-500">{{ __('Meeting point') }}</dt><dd class="font-semibold">{{ $trip->meeting_point }}</dd>
            <dt class="text-stone-500">{{ __('Members') }}</dt><dd class="font-semibold tabular">{{ $trip->activeMemberCount() }}/{{ $trip->max_participants }} · {{ $left > 0 ? "{$left} ".__('seats left') : __('Full') }}</dd>
        </dl>
        <p class="mt-4 text-sm leading-relaxed whitespace-pre-line">{{ $trip->description }}</p>
        @if ($trip->includes)
            <h3 class="mt-4 text-xs font-bold uppercase tracking-wider text-stone-500">{{ __('Includes') }}</h3>
            <ul class="mt-1 flex flex-wrap gap-1.5 text-xs">@foreach ($trip->includes as $item)<li class="rounded-full bg-stone-100 px-2.5 py-1">{{ $item }}</li>@endforeach</ul>
        @endif
        @if ($trip->porters->isNotEmpty())
            <h3 class="mt-4 text-xs font-bold uppercase tracking-wider text-stone-500">{{ __('Porters & guides') }}</h3>
            <div class="mt-1 grid gap-2 sm:grid-cols-2">@foreach ($trip->porters as $porter)<x-porter-card :porter="$porter" compact />@endforeach</div>
        @endif
        @if ($trip->trail->requiresPermit())
            <a href="{{ route('permits.create', ['trail' => $trip->trail_id, 'trip' => $trip->id]) }}" class="mt-3 inline-block text-xs font-bold text-summit">📄 {{ __('Plan my :permit for this trip', ['permit' => $trip->trail->permitLabel()]) }} →</a>
        @endif
    </div>

    @if ($forecast !== null || ($trip->departure_at->lte(now()->addDays(3)) && $trip->trail->bmkg_adm4))
        <x-weather-card :forecast="$forecast" :highlight="$trip->departure_at" class="mt-3" />
    @endif

    {{-- Member action panel --}}
    <section class="mt-3 rounded-2xl bg-white border border-stone-200 p-4">
        @guest
            <a href="{{ route('login') }}" class="block rounded-full bg-canopy px-5 py-3 text-center text-sm font-bold text-white">{{ __('Log in') }} · {{ __('Join this trip') }}</a>
        @elseif ($isOrganizer)
            <h2 class="display text-base font-bold uppercase tracking-wide">{{ __('Members') }}</h2>
            <ul class="mt-2 divide-y divide-stone-200 text-sm">
                @foreach ($trip->memberships->where('status', '!=', 'cancelled') as $m)
                    <li class="flex items-center gap-3 py-2">
                        <x-avatar :user="$m->user" size="size-8" />
                        <div class="min-w-0 flex-1"><b>{{ $m->user->name }}</b> @if ($m->role === 'leader')<span class="text-xs text-stone-500">· {{ __('Leader') }}</span>@endif
                            <div class="text-xs text-stone-500">{{ __(['pending' => 'Pending payment', 'paid' => 'Proof uploaded', 'confirmed' => 'Confirmed'][$m->status]) }}</div></div>
                        @if ($m->payment_proof_path)<a href="{{ asset('storage/'.$m->payment_proof_path) }}" target="_blank" class="text-xs font-bold text-mist">🧾</a>@endif
                        @if ($m->status === 'paid')
                            <form method="post" action="{{ route('trips.confirm', [$trip, $m]) }}">@csrf<button class="rounded-full bg-canopy px-3 py-1 text-xs font-bold text-white">{{ __('Confirm') }}</button></form>
                        @endif
                    </li>
                @endforeach
            </ul>
        @elseif (! $membership || ! $membership->isActive())
            <form method="post" action="{{ route('trips.join', $trip) }}">@csrf
                <button class="w-full rounded-full bg-canopy px-5 py-3 text-sm font-bold text-white disabled:opacity-50" {{ $left === 0 || $trip->status !== 'open' ? 'disabled' : '' }}>{{ $left > 0 ? __('Join this trip') : __('Full') }}</button>
            </form>
        @else
            @php $s = $membership->status; @endphp
            <div class="flex items-center gap-2 text-sm">
                <span class="size-2.5 rounded-full {{ ['pending' => 'bg-amber-500', 'paid' => 'bg-mist', 'confirmed' => 'bg-canopy'][$s] }}"></span>
                <b>{{ __(['pending' => 'Pending payment', 'paid' => 'Proof uploaded', 'confirmed' => 'Confirmed'][$s]) }}</b>
            </div>

            @if ($s === 'pending')
                <div class="mt-3 rounded-xl bg-stone-50 p-4 text-center">
                    <h3 class="display text-lg font-bold">{{ __('Pay with QRIS') }}</h3>
                    @if ($trip->qris_image_path)
                        <img src="{{ asset('storage/'.$trip->qris_image_path) }}" alt="QRIS" class="mx-auto mt-2 w-56 rounded-lg bg-white p-2">
                        <p class="mt-2 text-xs text-stone-500">{{ __('Scan with any Indonesian banking or e-wallet app. QRIS also works with Malaysian, Thai and Singaporean apps.') }}</p>
                    @else
                        <p class="mt-2 text-xs text-stone-500">{{ __('Organizer has not uploaded a QRIS code yet. Ask in the WhatsApp group.') }}</p>
                    @endif
                    <div class="display text-xl font-bold text-summit mt-2 tabular">Rp {{ number_format($trip->price_idr, 0, ',', '.') }}</div>
                </div>
                <form method="post" action="{{ route('trips.proof', $trip) }}" enctype="multipart/form-data" class="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    @csrf
                    <label for="proof" class="font-bold">{{ __('Upload payment proof') }}</label>
                    <input type="file" name="payment_proof" id="proof" accept="image/*" required class="text-xs">
                    <button class="rounded-full bg-canopy px-4 py-2 text-xs font-bold text-white">{{ __('Upload') }}</button>
                </form>
            @elseif ($s === 'paid')
                <p class="mt-2 text-sm text-stone-500">{{ __('Waiting for the organizer to confirm your payment.') }}</p>
            @else
                <p class="mt-2 text-sm text-stone-500">{{ __('You are confirmed. See you at the meeting point.') }}</p>
                @if ($trip->whatsapp_link)<a href="{{ $trip->whatsapp_link }}" target="_blank" rel="noopener" class="mt-3 inline-block rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white">{{ __('Join WhatsApp group') }} ↗</a>@endif
            @endif

            <form method="post" action="{{ route('trips.leave', $trip) }}" class="mt-4 text-right" x-data="{ sure: false }">
                @csrf @method('delete')
                <button type="button" x-show="!sure" @click="sure = true" class="text-xs font-bold text-stone-500">{{ __('Leave trip') }}</button>
                <span x-show="sure" x-cloak class="text-xs"><button class="font-bold text-summit">{{ __('Leave trip') }}?</button> · <button type="button" @click="sure = false" class="text-stone-500">{{ __('Cancel') }}</button></span>
            </form>
        @endguest
    </section>
</x-layouts.app>
