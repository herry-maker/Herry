<?php

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Authentication Routes
|--------------------------------------------------------------------------
| All responses are JSON. Token-based auth via Laravel Sanctum.
| Rate limiting: 5 attempts / minute on login and password reset.
*/

// Public auth endpoints (no token required)
Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'store']);

    Route::post('/login', [LoginController::class, 'store'])
        ->middleware('throttle:auth');

    // Password reset
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])
        ->middleware('throttle:auth')
        ->name('password.email');

    Route::post('/reset-password', [PasswordResetController::class, 'reset'])
        ->name('password.update');
});

// Protected endpoints (Sanctum token required)
Route::middleware('auth:sanctum')->group(function () {
    // Logout
    Route::post('/auth/logout', [LogoutController::class, 'destroy']);
    Route::post('/auth/logout-all', [LogoutController::class, 'destroyAll']);

    // Email verification
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('signed')
        ->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1');

    // Profile
    Route::get('/user', [ProfileController::class, 'show']);
    Route::patch('/user', [ProfileController::class, 'update']);
    Route::put('/user/password', [ProfileController::class, 'updatePassword']);
});
