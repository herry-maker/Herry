<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Email — {{ config('app.name') }}</title>
</head>
<body>
@if (session('status') === 'verification-link-sent')
    <div>A fresh verification link has been sent to your email address.</div>
@endif

<p>Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we emailed you? If you didn't receive the email, we'll gladly send another.</p>

<form method="POST" action="{{ route('verification.send') }}">
    @csrf
    <button type="submit">Resend Verification Email</button>
</form>

<form method="POST" action="{{ route('logout') }}">
    @csrf
    <button type="submit">Log Out</button>
</form>
</body>
</html>
