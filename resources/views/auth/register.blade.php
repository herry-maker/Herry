<x-layouts.app :title="__('Create account')">
    <div class="mx-auto max-w-sm">
        <h1 class="display text-3xl font-extrabold">{{ __('Create account') }}</h1>
        <form method="post" action="{{ route('register') }}" class="mt-4 grid gap-4 rounded-2xl bg-white border border-stone-200 p-5 text-sm" x-data="{ nat: '{{ old('nationality', 'ID') }}' }">
            @csrf
            <label>{{ __('Full name') }}<input name="name" id="reg-name" value="{{ old('name') }}" required autofocus class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label>{{ __('Email') }}<input type="email" name="email" id="reg-email" value="{{ old('email') }}" required autocomplete="email" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <div class="grid grid-cols-2 gap-3">
                <label>{{ __('Nationality') }}<input name="nationality" id="reg-nat" x-model="nat" maxlength="2" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 uppercase"><span class="text-[11px] text-stone-500">{{ __('Two-letter country code, e.g. ID, AU, DE') }}</span></label>
                <label>{{ __('ID type') }}<select name="id_type" id="reg-id" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2">
                    <option value="ktp" :selected="nat.toUpperCase() === 'ID'">{{ __('Indonesian ID (KTP)') }}</option>
                    <option value="passport" :selected="nat.toUpperCase() !== 'ID'">{{ __('Passport') }}</option>
                </select></label>
            </div>
            <label>{{ __('Phone') }} <span class="text-stone-500">({{ __('Optional') }})</span><input name="phone" id="reg-phone" value="{{ old('phone') }}" placeholder="+62 …" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label>{{ __('Password') }}<input type="password" name="password" id="reg-password" required autocomplete="new-password" minlength="8" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label>{{ __('Confirm password') }}<input type="password" name="password_confirmation" id="reg-password2" required autocomplete="new-password" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <button class="rounded-full bg-summit px-5 py-2.5 font-bold text-white">{{ __('Create account') }}</button>
        </form>
        <p class="mt-3 text-center text-sm text-stone-500">{{ __('Already have an account?') }} <a href="{{ route('login') }}" class="font-bold text-canopy">{{ __('Log in') }}</a></p>
    </div>
</x-layouts.app>
