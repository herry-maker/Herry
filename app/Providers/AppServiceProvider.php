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
        // Auth endpoints: 5 attempts per minute per IP, plus a separate 10/minute
        // per email+IP bucket so distributed attacks against one account are also
        // throttled even when individual IPs stay under the global limit.
        RateLimiter::for('auth', function (Request $request) {
            return [
                Limit::perMinute(5)->by($request->ip()),
                Limit::perMinute(10)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
            ];
        });

        // Standard API limit.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
