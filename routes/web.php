<?php

use App\Http\Controllers\Web\CheckInController;
use App\Http\Controllers\Web\HomeController;
use App\Http\Controllers\Web\LocaleController;
use App\Http\Controllers\Web\PostController;
use App\Http\Controllers\Web\ProfileController;
use App\Http\Controllers\Web\TrailController;
use App\Http\Controllers\Web\TrailReviewController;
use App\Http\Controllers\Web\TripController;
use App\Http\Controllers\Web\TripMemberController;
use App\Http\Controllers\Web\WebAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('/locale/{locale}', [LocaleController::class, 'switch'])->name('locale.switch');

Route::get('/trails', [TrailController::class, 'index'])->name('trails.index');
Route::get('/trails/{trail}', [TrailController::class, 'show'])->name('trails.show');

Route::get('/trips', [TripController::class, 'index'])->name('trips.index');
Route::get('/trips/{trip}', [TripController::class, 'show'])->name('trips.show')->where('trip', '[0-9]+');

Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
Route::get('/hikers/{user}', [ProfileController::class, 'show'])->name('profile.show');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [WebAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [WebAuthController::class, 'login'])->middleware('throttle:auth');
    Route::get('/register', [WebAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [WebAuthController::class, 'register'])->middleware('throttle:auth');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [WebAuthController::class, 'logout'])->name('logout');

    Route::post('/trails/{trail}/reviews', [TrailReviewController::class, 'store'])->name('reviews.store');

    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::post('/posts/{post}/like', [PostController::class, 'toggleLike'])->name('posts.like');
    Route::post('/posts/{post}/comments', [PostController::class, 'comment'])->name('posts.comment');

    Route::get('/check-in', [CheckInController::class, 'create'])->name('checkins.create');
    Route::post('/check-in', [CheckInController::class, 'store'])->name('checkins.store');
    Route::post('/check-in/{checkIn}/checkout', [CheckInController::class, 'checkout'])->name('checkins.checkout');

    Route::get('/trips/new', [TripController::class, 'create'])->name('trips.create');
    Route::post('/trips', [TripController::class, 'store'])->name('trips.store');
    Route::post('/trips/{trip}/join', [TripMemberController::class, 'join'])->name('trips.join');
    Route::post('/trips/{trip}/proof', [TripMemberController::class, 'uploadProof'])->name('trips.proof');
    Route::post('/trips/{trip}/members/{member}/confirm', [TripMemberController::class, 'confirm'])->name('trips.confirm');
    Route::delete('/trips/{trip}/leave', [TripMemberController::class, 'cancel'])->name('trips.leave');

    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
});
