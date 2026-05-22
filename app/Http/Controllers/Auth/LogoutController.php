<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            // Revoke the token that was used to authenticate the request
            $request->user()->currentAccessToken()->delete();

            return response()->json(['message' => 'Logged out successfully.']);
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function destroyAll(Request $request): JsonResponse
    {
        // Revoke all tokens for this user (logout from all devices)
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out from all devices.']);
    }
}
