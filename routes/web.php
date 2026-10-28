<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Djahwasi Guitar Tuner: a self-contained static page in public/tuner (Web Audio pitch detection, no build step).
// Its assets use relative paths, so it must be reached at the folder address /tuner/ (trailing slash).
// Web servers normally serve that folder directly; this route covers /tuner and any /tuner/ request that reaches Laravel.
Route::get('/tuner', function (Request $request) {
    if (! str_starts_with($request->getRequestUri(), '/tuner/')) {
        return redirect('/tuner/');
    }

    return response()->file(public_path('tuner/index.html'));
});
