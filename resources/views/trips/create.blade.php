<x-layouts.app :title="__('Organize a trip')">
    <h1 class="display text-2xl font-extrabold">{{ __('Organize a trip') }}</h1>
    <form method="post" action="{{ route('trips.store') }}" enctype="multipart/form-data" class="mt-4 grid gap-4 rounded-2xl bg-white border border-stone-200 p-4 text-sm"
          x-data="{ trail: '{{ old('trail_id', $selected ?? $trails->first()?->id) }}', porters: @js($porters), get available() { return this.porters.filter(p => p.trail_ids.includes(Number(this.trail))); } }">
        @csrf
        <label>{{ __('Mountain') }}
            <select name="trail_id" id="trip-trail" x-model="trail" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2">
                @foreach ($trails as $t)<option value="{{ $t->id }}" @selected(old('trail_id', $selected) == $t->id)>{{ $t->name }} · {{ number_format($t->elevation_m, 0, ',', '.') }} m</option>@endforeach
            </select></label>
        <label>{{ __('Title') }}<input name="title" id="trip-title" value="{{ old('title') }}" required minlength="5" maxlength="120" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
        <label>{{ __('Description') }}<textarea name="description" id="trip-desc" rows="4" required minlength="20" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2">{{ old('description') }}</textarea></label>
        <div class="grid grid-cols-2 gap-3">
            <label>{{ __('Type') }}<select name="type" id="trip-type" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"><option value="open">{{ __('Open trip') }}</option><option value="private" @selected(old('type') === 'private')>{{ __('Private trip') }}</option></select></label>
            <label>{{ __('Max participants') }}<input type="number" name="max_participants" id="trip-max" value="{{ old('max_participants', 12) }}" min="2" max="100" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label>{{ __('Departure') }}<input type="datetime-local" name="departure_at" id="trip-dep" value="{{ old('departure_at') }}" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label>{{ __('Return') }}<input type="datetime-local" name="return_at" id="trip-ret" value="{{ old('return_at') }}" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
        </div>
        <label>{{ __('Meeting point') }}<input name="meeting_point" id="trip-meet" value="{{ old('meeting_point') }}" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2" placeholder="Terminal Pasar Rebo, Jakarta Timur"></label>
        <label>{{ __('Price (IDR)') }}<input type="number" name="price_idr" id="trip-price" value="{{ old('price_idr', 0) }}" min="0" step="1000" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
        <label>{{ __("What's included (one per line)") }}<textarea name="includes" id="trip-inc" rows="3" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2" placeholder="Transport PP&#10;Porter&#10;Makan 3x">{{ old('includes') }}</textarea></label>
        <label>{{ __('WhatsApp group link') }} <span class="text-stone-500">({{ __('Optional') }})</span><input type="url" name="whatsapp_link" id="trip-wa" value="{{ old('whatsapp_link') }}" placeholder="https://chat.whatsapp.com/…" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
        <label>{{ __('Your QRIS code image') }} <span class="text-stone-500">({{ __('Optional') }})</span>
            <input type="file" name="qris_image" id="trip-qris" accept="image/*" class="mt-1 block text-xs">
            <span class="text-xs text-stone-500">{{ __('Members scan this to pay you directly.') }}</span></label>
        <fieldset x-show="available.length" x-cloak>
            <legend class="font-semibold">{{ __('Porters & guides') }} <span class="text-stone-500 font-normal">({{ __('Optional') }})</span></legend>
            <div class="mt-1 grid gap-1.5 sm:grid-cols-2">
                <template x-for="p in available" :key="p.id">
                    <label class="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs">
                        <input type="checkbox" name="porter_ids[]" :value="p.id" class="size-4 accent-canopy">
                        <span class="min-w-0 flex-1"><b x-text="p.name"></b> <span x-show="p.verified" class="text-canopy">✔</span><br><span class="text-stone-500" x-text="p.role + ' · Rp ' + (p.rate / 1000) + 'k/{{ __('day') }}'"></span></span>
                    </label>
                </template>
            </div>
        </fieldset>
        <label class="flex items-center gap-2"><input type="checkbox" name="beginner_friendly" value="1" @checked(old('beginner_friendly')) class="size-4 accent-canopy"> {{ __('Beginner friendly') }}</label>
        <button class="justify-self-end rounded-full bg-summit px-6 py-2.5 font-bold text-white">{{ __('Publish trip') }}</button>
    </form>
</x-layouts.app>
