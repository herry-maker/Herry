<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['service' => 'Herry Auth API', 'version' => '1.0.0']);
});
