<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // -----------------------------------------------------------------------
    // Registration
    // -----------------------------------------------------------------------

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Alice Smith',
            'email'                 => 'alice@example.com',
            'password'              => 'Secret1pass',
            'password_confirmation' => 'Secret1pass',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'user', 'token', 'type'])
            ->assertJsonPath('type', 'Bearer');

        $this->assertDatabaseHas('users', ['email' => 'alice@example.com']);

        // Password must be hashed, never stored as plaintext.
        $user = User::where('email', 'alice@example.com')->first();
        $this->assertTrue(Hash::check('Secret1pass', $user->password));
        $this->assertNotEquals('Secret1pass', $user->password);
    }

    public function test_register_returns_a_working_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Bob',
            'email'                 => 'bob@example.com',
            'password'              => 'Secret1pass',
            'password_confirmation' => 'Secret1pass',
        ]);

        $token = $response->json('token');
        $this->assertNotEmpty($token);

        // The token must work on a protected route.
        $this->getJson('/api/auth/me', ['Authorization' => "Bearer $token"])
            ->assertOk()
            ->assertJsonPath('user.email', 'bob@example.com');
    }

    public function test_register_validates_required_fields(): void
    {
        $this->postJson('/api/auth/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dup@example.com']);

        $this->postJson('/api/auth/register', [
            'name'                  => 'Another',
            'email'                 => 'dup@example.com',
            'password'              => 'Secret1pass',
            'password_confirmation' => 'Secret1pass',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_rejects_mismatched_password_confirmation(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Charlie',
            'email'                 => 'charlie@example.com',
            'password'              => 'Secret1pass',
            'password_confirmation' => 'DifferentPass1',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_register_rejects_weak_password(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Dan',
            'email'                 => 'dan@example.com',
            'password'              => 'weak',
            'password_confirmation' => 'weak',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    // -----------------------------------------------------------------------
    // Login
    // -----------------------------------------------------------------------

    public function test_user_can_login(): void
    {
        $user = User::factory()->create(['password' => 'Secret1pass']);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'Secret1pass',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'user', 'token', 'type'])
            ->assertJsonPath('type', 'Bearer');
    }

    public function test_login_returns_a_working_token(): void
    {
        $user = User::factory()->create(['password' => 'Secret1pass']);

        $token = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'Secret1pass',
        ])->json('token');

        $this->getJson('/api/auth/me', ['Authorization' => "Bearer $token"])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create(['password' => 'Secret1pass']);

        $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'WrongPass1',
        ])->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid credentials.');
    }

    public function test_login_rejects_unknown_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email'    => 'ghost@example.com',
            'password' => 'Secret1pass',
        ])->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid credentials.');
    }

    public function test_login_validates_required_fields(): void
    {
        $this->postJson('/api/auth/login', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    // -----------------------------------------------------------------------
    // Logout
    // -----------------------------------------------------------------------

    public function test_user_can_logout(): void
    {
        $user        = User::factory()->create();
        $tokenResult = $user->createToken('test');
        $tokenId     = $tokenResult->accessToken->id;
        $plainToken  = $tokenResult->plainTextToken;

        $this->postJson('/api/auth/logout', [], ['Authorization' => "Bearer $plainToken"])
            ->assertOk()
            ->assertJsonPath('message', 'Logged out successfully.');

        // Token row must be deleted from the database.
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }

    public function test_logout_requires_authentication(): void
    {
        $this->postJson('/api/auth/logout')->assertUnauthorized();
    }

    public function test_logout_all_revokes_every_token(): void
    {
        $user = User::factory()->create();
        $user->createToken('t1');
        $user->createToken('t2');

        $this->postJson('/api/auth/logout-all', [], ['Authorization' => "Bearer {$user->createToken('t3')->plainTextToken}"])
            ->assertOk();

        // All token rows must be gone.
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    // -----------------------------------------------------------------------
    // Me / Profile
    // -----------------------------------------------------------------------

    public function test_me_returns_authenticated_user(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->getJson('/api/auth/me', ['Authorization' => "Bearer $token"])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_user_can_update_profile(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->putJson('/api/auth/me', ['name' => 'New Name'], ['Authorization' => "Bearer $token"])
            ->assertOk()
            ->assertJsonPath('user.name', 'New Name');
    }

    public function test_profile_update_rejects_duplicate_email(): void
    {
        $other = User::factory()->create(['email' => 'taken@example.com']);
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->putJson('/api/auth/me', ['email' => 'taken@example.com'], ['Authorization' => "Bearer $token"])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    // -----------------------------------------------------------------------
    // Change Password
    // -----------------------------------------------------------------------

    public function test_user_can_change_password(): void
    {
        $user  = User::factory()->create(['password' => 'OldPass1']);
        $token = $user->createToken('test')->plainTextToken;

        $this->putJson('/api/auth/password', [
            'current_password'          => 'OldPass1',
            'new_password'              => 'NewPass2pass',
            'new_password_confirmation' => 'NewPass2pass',
        ], ['Authorization' => "Bearer $token"])
            ->assertOk()
            ->assertJsonPath('message', 'Password changed successfully.');

        $this->assertTrue(Hash::check('NewPass2pass', $user->fresh()->password));
    }

    public function test_change_password_rejects_wrong_current_password(): void
    {
        $user  = User::factory()->create(['password' => 'OldPass1']);
        $token = $user->createToken('test')->plainTextToken;

        $this->putJson('/api/auth/password', [
            'current_password'          => 'WrongOld1',
            'new_password'              => 'NewPass2pass',
            'new_password_confirmation' => 'NewPass2pass',
        ], ['Authorization' => "Bearer $token"])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Current password is incorrect.');
    }

    public function test_change_password_revokes_other_tokens(): void
    {
        $user        = User::factory()->create(['password' => 'OldPass1']);
        $activeResult = $user->createToken('active');
        $otherResult  = $user->createToken('other');
        $activeToken  = $activeResult->plainTextToken;
        $otherId      = $otherResult->accessToken->id;

        $this->putJson('/api/auth/password', [
            'current_password'          => 'OldPass1',
            'new_password'              => 'NewPass2pass',
            'new_password_confirmation' => 'NewPass2pass',
        ], ['Authorization' => "Bearer $activeToken"])
            ->assertOk();

        // Other token row must be deleted.
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $otherId]);
        // Active token row must still exist.
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $activeResult->accessToken->id]);
    }

    public function test_change_password_rejects_same_as_current(): void
    {
        $user  = User::factory()->create(['password' => 'OldPass1']);
        $token = $user->createToken('test')->plainTextToken;

        $this->putJson('/api/auth/password', [
            'current_password'          => 'OldPass1',
            'new_password'              => 'OldPass1',
            'new_password_confirmation' => 'OldPass1',
        ], ['Authorization' => "Bearer $token"])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['new_password']);
    }

    // -----------------------------------------------------------------------
    // Token Refresh
    // -----------------------------------------------------------------------

    public function test_user_can_refresh_token(): void
    {
        $user        = User::factory()->create();
        $oldResult   = $user->createToken('test');
        $oldToken    = $oldResult->plainTextToken;
        $oldTokenId  = $oldResult->accessToken->id;

        $response = $this->postJson('/api/auth/refresh', [], ['Authorization' => "Bearer $oldToken"]);
        $response->assertOk()->assertJsonStructure(['token']);

        $newToken = $response->json('token');
        $this->assertNotEmpty($newToken);
        $this->assertNotEquals($oldToken, $newToken);

        // Old token row must be deleted from the database.
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $oldTokenId]);

        // New token must exist in the database.
        $this->assertSame(1, PersonalAccessToken::where('tokenable_id', $user->id)->count());
    }

    // -----------------------------------------------------------------------
    // Password not leaked in response
    // -----------------------------------------------------------------------

    public function test_password_not_returned_in_register_response(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Eve',
            'email'                 => 'eve@example.com',
            'password'              => 'Secret1pass',
            'password_confirmation' => 'Secret1pass',
        ]);

        $this->assertArrayNotHasKey('password', $response->json('user') ?? []);
    }

    public function test_password_not_returned_in_login_response(): void
    {
        $user = User::factory()->create(['password' => 'Secret1pass']);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'Secret1pass',
        ]);

        $this->assertArrayNotHasKey('password', $response->json('user') ?? []);
    }
}
