<x-layouts.app :title="__('Open Trips')">
    <div class="flex items-center justify-between">
        <h1 class="display text-2xl font-extrabold">{{ __('Open Trips') }}</h1>
        @auth<a href="{{ route('trips.create') }}" class="rounded-full bg-summit px-4 py-2 text-xs font-bold text-white">+ {{ __('Organize a trip') }}</a>@endauth
    </div>

    <div class="mt-3 flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 text-xs font-bold">
        @php
            $chips = [
                ['label' => __('All'), 'params' => []],
                ['label' => __('This weekend'), 'params' => ['when' => 'weekend']],
                ['label' => __('This month'), 'params' => ['when' => 'month']],
                ['label' => __('Under Rp 300k'), 'params' => ['max_price' => 300000]],
                ['label' => __('Beginner friendly'), 'params' => ['beginner' => 1]],
            ];
        @endphp
        @foreach ($chips as $chip)
            @php $on = $chip['params'] ? collect($chip['params'])->every(fn ($v, $k) => ($filters[$k] ?? null) == $v) : empty(array_filter($filters)); @endphp
            <a href="{{ route('trips.index', $chip['params']) }}" class="shrink-0 rounded-full border px-3 py-1.5 {{ $on ? 'border-canopy bg-canopy-light text-canopy' : 'border-stone-200 text-stone-500' }}">{{ $chip['label'] }}</a>
        @endforeach
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
        @forelse ($trips as $trip)
            <x-trip-card :trip="$trip" />
        @empty
            <p class="sm:col-span-2 rounded-2xl bg-white border border-stone-200 p-6 text-center text-sm text-stone-500">{{ __('No trips match. Try another filter or organize one.') }}</p>
        @endforelse
    </div>
    <div class="mt-4">{{ $trips->links() }}</div>
</x-layouts.app>
