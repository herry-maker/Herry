<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configureNotificationUrls();
    }

    private function configureNotificationUrls(): void
    {
        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        // Password-reset email links point to the frontend SPA, not a Laravel route.
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) use ($frontend): string {
            return $frontend . '/reset-password?token=' . $token
                . '&email=' . rawurlencode((string) $notifiable->getEmailForPasswordReset());
        });

        // Email-verification links are signed API routes served by this backend.
        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())],
            );
        });
    }

    private function configureRateLimiting(): void
    {
        // Login / register: 10 attempts per minute per IP, plus a tighter 3-per-minute
        // bucket keyed on email+IP so that a single account cannot be hammered from
        // one address more than 3 times a minute, while still allowing a busy shared
        // IP to log in with different accounts up to 10 times. A pure per-email limit
        // (no IP component) is intentionally avoided to prevent user-enumeration via
        // differential rate-limit responses.
        RateLimiter::for('auth', function (Request $request) {
            return [
                Limit::perMinute(10)->by($request->ip()),
                Limit::perMinute(3)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
            ];
        });

        // Standard API limit for authenticated endpoints.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Tighter limit for password-reset email sending (prevents email flooding).
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinutes(15, 3)->by($request->ip());
        });
    }
}
