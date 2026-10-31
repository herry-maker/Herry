<x-layouts.app :title="__('Porters & guides')">
    <h1 class="display text-2xl font-extrabold">{{ __('Porters & guides') }}</h1>
    <p class="text-sm text-stone-500">{{ __('Community-verified local porters and licensed guides. Rates are per day; agree the total directly over WhatsApp.') }}</p>

    <form method="get" class="mt-3 flex flex-wrap gap-2 text-xs font-bold">
        <select name="trail" id="porter-trail" onchange="this.form.submit()" class="rounded-full border border-stone-200 bg-white px-3 py-1.5">
            <option value="">{{ __('All mountains') }}</option>
            @foreach ($trails as $t)<option value="{{ $t->slug }}" @selected(($filters['trail'] ?? '') === $t->slug)>{{ $t->name }}</option>@endforeach
        </select>
        @php $q = array_filter($filters); @endphp
        @foreach ([['role' => 'porter', 'label' => __('Porter')], ['role' => 'guide', 'label' => __('Guide')], ['english' => 1, 'label' => __('Speaks English')], ['verified' => 1, 'label' => __('Verified')]] as $chip)
            @php
                $label = $chip['label']; unset($chip['label']);
                $key = array_key_first($chip);
                $on = ($filters[$key] ?? null) == $chip[$key];
                $params = $on ? array_diff_key($q, $chip) : [...$q, ...$chip];
            @endphp
            <a href="{{ route('porters.index', $params) }}" class="rounded-full border px-3 py-1.5 {{ $on ? 'border-canopy bg-canopy-light text-canopy' : 'border-stone-200 text-stone-500' }}">{{ $label }}</a>
        @endforeach
    </form>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
        @forelse ($porters as $porter)
            <x-porter-card :porter="$porter" />
        @empty
            <p class="sm:col-span-2 rounded-2xl bg-white border border-stone-200 p-6 text-center text-sm text-stone-500">{{ __('No porters or guides match those filters.') }}</p>
        @endforelse
    </div>
</x-layouts.app>
