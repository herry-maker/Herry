<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function store(LoginRequest $request): JsonResponse|RedirectResponse
    {
        $request->authenticate();

        if ($request->expectsJson()) {
            $user  = Auth::user();
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful.',
                'user'    => $user->only('id', 'name', 'email', 'email_verified_at'),
                'token'   => $token,
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function show(): JsonResponse
    {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }
}
