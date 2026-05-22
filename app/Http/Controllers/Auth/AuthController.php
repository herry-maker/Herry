<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password,
        ]);

        $token = $user->createToken('auth_token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'user'    => $user,
            'token'   => $token,
            'type'    => 'Bearer',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        // Always run Hash::check — even for unknown emails — to prevent timing-based
        // enumeration attacks that reveal whether an address is registered.
        $hash = $user?->password ?? '$2y$12$invalid.hash.that.never.matches.anything.here';

        if (! $user || ! Hash::check($request->password, $hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $token = $user->createToken(
            $request->header('User-Agent', 'api_token'),
            ['*'],
            now()->addDays(30),
        )->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user'    => $user,
            'token'   => $token,
            'type'    => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'All sessions terminated.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $request->user()->update($request->validated());

        return response()->json([
            'message' => 'Profile updated.',
            'user'    => $request->user()->fresh(),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        if (! Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $request->user()->update(['password' => $request->new_password]);

        // Revoke all other tokens so existing sessions are invalidated.
        $request->user()->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        $token = $user->createToken(
            $request->header('User-Agent', 'api_token'),
            ['*'],
            now()->addDays(30),
        )->plainTextToken;

        return response()->json([
            'message' => 'Token refreshed.',
            'token'   => $token,
            'type'    => 'Bearer',
        ]);
    }
}
