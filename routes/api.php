<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication API Routes
|--------------------------------------------------------------------------
|
| Public endpoints are rate-limited via the 'auth' limiter defined in
| AppServiceProvider to prevent brute-force attacks.
|
*/

Route::prefix('v1/auth')->group(function () {

    // Public endpoints — rate limited against brute force
    Route::middleware('throttle:auth')->group(function () {
        Route::post('/register',        [AuthController::class, 'register']);
        Route::post('/login',           [AuthController::class, 'login']);
        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
        Route::post('/reset-password',  [PasswordResetController::class, 'resetPassword']);
    });

    // Protected endpoints — require a valid Sanctum token
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',           [AuthController::class, 'me']);
        Route::post('/logout',      [AuthController::class, 'logout']);
        Route::post('/logout-all',  [AuthController::class, 'logoutAll']);
        Route::post('/refresh',     [AuthController::class, 'refresh']);
    });
});
