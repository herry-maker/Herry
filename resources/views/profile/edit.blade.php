<x-layouts.app :title="__('Edit profile')">
    <h1 class="display text-2xl font-extrabold">{{ __('Edit profile') }}</h1>
    <form method="post" action="{{ route('profile.update') }}" enctype="multipart/form-data" class="mt-4 grid gap-4 rounded-2xl bg-white border border-stone-200 p-4 text-sm">
        @csrf @method('put')
        <label>{{ __('Full name') }}<input name="name" id="pf-name" value="{{ old('name', $user->name) }}" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
        <div class="grid grid-cols-2 gap-3">
            <label>{{ __('Phone') }}<input name="phone" id="pf-phone" value="{{ old('phone', $user->phone) }}" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"></label>
            <label>{{ __('Experience level') }}<select name="experience_level" id="pf-exp" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2">
                @foreach (['pemula' => __('Beginner'), 'madya' => __('Intermediate'), 'ahli' => __('Expert')] as $v => $l)<option value="{{ $v }}" @selected(old('experience_level', $user->experience_level) === $v)>{{ $l }}</option>@endforeach
            </select></label>
            <label>{{ __('Nationality') }}<input name="nationality" id="pf-nat" value="{{ old('nationality', $user->nationality) }}" maxlength="2" required class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 uppercase"><span class="text-xs text-stone-500">{{ __('Two-letter country code, e.g. ID, AU, DE') }}</span></label>
            <label>{{ __('ID type') }}<select name="id_type" id="pf-id" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"><option value="ktp" @selected(old('id_type', $user->id_type) === 'ktp')>{{ __('Indonesian ID (KTP)') }}</option><option value="passport" @selected(old('id_type', $user->id_type) === 'passport')>{{ __('Passport') }}</option></select></label>
        </div>
        <label>{{ __('Bio') }}<textarea name="bio" id="pf-bio" rows="2" maxlength="500" class="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2">{{ old('bio', $user->bio) }}</textarea></label>
        <fieldset class="rounded-xl border border-summit/40 bg-summit-light/40 p-3">
            <legend class="px-1 text-xs font-bold uppercase tracking-wider text-summit">{{ __('Your emergency contact') }}</legend>
            <div class="grid grid-cols-2 gap-3">
                <label>{{ __('Emergency contact name') }}<input name="emergency_name" id="pf-ename" value="{{ old('emergency_name', $user->emergency_name) }}" required class="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2"></label>
                <label>{{ __('Emergency contact phone') }}<input name="emergency_phone" id="pf-ephone" value="{{ old('emergency_phone', $user->emergency_phone) }}" required class="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2"></label>
            </div>
        </fieldset>
        <label>{{ __('Avatar') }}<input type="file" name="avatar" id="pf-avatar" accept="image/*" class="mt-1 block text-xs"></label>
        <button class="justify-self-end rounded-full bg-canopy px-6 py-2.5 font-bold text-white">{{ __('Save') }}</button>
    </form>
</x-layouts.app>
