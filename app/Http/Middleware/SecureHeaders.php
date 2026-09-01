<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecureHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Disable legacy XSS auditors (modern browsers ignore this; old ones can be
        // exploited by the auditor itself, so we turn it off universally).
        $response->headers->set('X-XSS-Protection', '0');

        // Restrict what this API response may load — nothing at all is the tightest
        // posture for a pure JSON API that serves no HTML, scripts, or media.
        $response->headers->set('Content-Security-Policy', "default-src 'none'");

        // Enforce HTTPS for one year on HTTPS connections. Only set when the request
        // is actually secure so local HTTP dev doesn't break.
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Prevent the server fingerprint from leaking.
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
