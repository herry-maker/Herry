<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Strobe guitar tuner: a self-contained static page (Web Audio pitch detection), no build step needed.
Route::get('/tuner', function () {
    return response()->file(public_path('tuner/index.html'));
});
