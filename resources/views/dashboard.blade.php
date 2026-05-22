<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard — {{ config('app.name') }}</title>
</head>
<body>
<h1>Welcome, {{ auth()->user()->name }}!</h1>

<p>You're logged in.</p>

<form method="POST" action="{{ route('logout') }}">
    @csrf
    <button type="submit">Log Out</button>
</form>
</body>
</html>
