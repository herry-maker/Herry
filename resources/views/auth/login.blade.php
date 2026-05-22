<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login — {{ config('app.name') }}</title>
</head>
<body>
@if (session('status'))
    <div>{{ session('status') }}</div>
@endif

<form method="POST" action="{{ route('login') }}">
    @csrf

    <div>
        <label for="email">Email</label>
        <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username">
        @error('email') <span>{{ $message }}</span> @enderror
    </div>

    <div>
        <label for="password">Password</label>
        <input id="password" type="password" name="password" required autocomplete="current-password">
        @error('password') <span>{{ $message }}</span> @enderror
    </div>

    <div>
        <label>
            <input type="checkbox" name="remember"> Remember me
        </label>
    </div>

    <button type="submit">Log In</button>

    <a href="{{ route('password.request') }}">Forgot password?</a>
    <a href="{{ route('register') }}">Create account</a>
</form>
</body>
</html>
