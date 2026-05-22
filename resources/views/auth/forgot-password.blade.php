<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password — {{ config('app.name') }}</title>
</head>
<body>
@if (session('status'))
    <div>{{ session('status') }}</div>
@endif

<p>Forgot your password? Enter your email and we'll send a reset link.</p>

<form method="POST" action="{{ route('password.email') }}">
    @csrf

    <div>
        <label for="email">Email</label>
        <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username">
        @error('email') <span>{{ $message }}</span> @enderror
    </div>

    <button type="submit">Send Reset Link</button>

    <a href="{{ route('login') }}">Back to login</a>
</form>
</body>
</html>
