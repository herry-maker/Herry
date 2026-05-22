<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name'     => 'Test',
            'email'    => 'test@example.com',
            'password' => Hash::make('Password1'),
        ]);
    }

    public function test_authenticated_users_can_logout(): void
    {
        $user  = $this->makeUser();
        $token = $user->createToken('api-token')->plainTextToken;

        // Logout succeeds
        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out successfully.');

        // Token row is gone from the database
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_revoked_token_cannot_access_protected_routes(): void
    {
        $user  = $this->makeUser();
        $token = $user->createToken('api-token')->plainTextToken;

        // Revoke the token directly (simulate logout)
        $user->tokens()->delete();

        // Protected route must return 401
        $this->withToken($token)
            ->getJson('/api/user')
            ->assertUnauthorized();
    }

    public function test_logout_all_revokes_every_token(): void
    {
        $user = $this->makeUser();
        $user->createToken('device-1');
        $activeToken = $user->createToken('device-2')->plainTextToken;

        $this->withToken($activeToken)
            ->postJson('/api/auth/logout-all')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out from all devices.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_unauthenticated_users_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }
}
