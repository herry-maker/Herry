<x-layouts.app :title="__('Log in')">
    <div class="mx-auto max-w-sm">
        <h1 class="display text-3xl font-extrabold">{{ __('Log in') }}</h1>
        <form method="post" action="{{ route('login') }}" class="mt-4 grid gap-4 rounded-2xl bg-white border border-stone-200 p-5 text-sm">
            @csrf
            <label>{{ __('Email') }}<input type="email" name="email" id="login-email" value="{{ old('email') }}" required autofocus autocomplete="email" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label>{{ __('Password') }}<input type="password" name="password" id="login-password" required autocomplete="current-password" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label class="flex items-center gap-2"><input type="checkbox" name="remember" value="1" class="size-4 accent-canopy"> {{ __('Remember me') }}</label>
            <button class="rounded-full bg-canopy px-5 py-2.5 font-bold text-white">{{ __('Log in') }}</button>
        </form>
        <p class="mt-3 text-center text-sm text-stone-500">{{ __('New here?') }} <a href="{{ route('register') }}" class="font-bold text-canopy">{{ __('Create account') }}</a></p>

        @if (app()->environment('local'))
            <div class="mt-6 rounded-xl bg-stone-100 p-3 text-xs text-stone-500">
                <b class="text-stone-900">{{ __('Demo accounts') }}</b> (password: <code>password</code>)<br>
                budi@example.com · rina@example.com (organizer) · emma@example.com (AU passport)
            </div>
        @endif
    </div>
</x-layouts.app>
