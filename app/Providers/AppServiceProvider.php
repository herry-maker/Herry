<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Dedicated limiter for auth endpoints — keyed on email+IP so a single
        // attacker cannot enumerate many accounts simultaneously from one IP.
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute((int) env('AUTH_THROTTLE_ATTEMPTS', 5))
                ->by($request->input('email').'|'.$request->ip())
                ->response(fn (Request $req, array $headers) => response()->json(
                    ['message' => 'Too many attempts. Please try again later.'],
                    429,
                    $headers,
                ));
        });
    }
}
