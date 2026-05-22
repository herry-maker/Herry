<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password — {{ config('app.name') }}</title>
</head>
<body>
<form method="POST" action="{{ route('password.update') }}">
    @csrf

    <input type="hidden" name="token" value="{{ $token }}">

    <div>
        <label for="email">Email</label>
        <input id="email" type="email" name="email" value="{{ old('email', request()->email) }}" required autofocus autocomplete="username">
        @error('email') <span>{{ $message }}</span> @enderror
    </div>

    <div>
        <label for="password">New Password</label>
        <input id="password" type="password" name="password" required autocomplete="new-password">
        @error('password') <span>{{ $message }}</span> @enderror
    </div>

    <div>
        <label for="password_confirmation">Confirm Password</label>
        <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password">
    </div>

    <button type="submit">Reset Password</button>
</form>
</body>
</html>
