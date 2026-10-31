<x-layouts.app :title="__('Offline')">
    <section class="rounded-2xl bg-white border border-stone-200 p-6 text-center">
        <div class="text-4xl">📴</div>
        <h1 class="display text-2xl font-extrabold mt-2">{{ __('You are offline') }}</h1>
        <p class="mt-2 text-sm text-stone-500 max-w-md mx-auto">{{ __('No signal at basecamp is normal. Pages you opened earlier still work, and a check-in you submit now is saved on this phone and sent when you are back in coverage.') }}</p>
        <div class="mt-4 flex flex-wrap justify-center gap-2 text-sm font-bold">
            <a href="{{ route('trails.index') }}" class="rounded-full border border-stone-200 px-4 py-2">{{ __('Trails') }}</a>
            <a href="{{ route('checkins.create') }}" class="rounded-full bg-canopy px-4 py-2 text-white">✓ {{ __('Check in') }}</a>
        </div>
        <p class="mt-6 text-xs text-stone-500">{{ __('Emergency') }}: BASARNAS <span class="font-mono font-bold select-all">115</span> · {{ __('Police') }} <span class="font-mono font-bold select-all">110</span></p>
    </section>
</x-layouts.app>
