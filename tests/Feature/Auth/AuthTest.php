<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Register
    // -------------------------------------------------------------------------

    public function test_register_creates_user_and_returns_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Alice',
            'email'                 => 'alice@example.com',
            'password'              => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['message', 'user', 'token', 'type'])
                 ->assertJson(['type' => 'Bearer']);

        $this->assertDatabaseHas('users', ['email' => 'alice@example.com']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'alice@example.com']);

        $this->postJson('/api/auth/register', [
            'name'                  => 'Alice',
            'email'                 => 'alice@example.com',
            'password'              => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['email']);
    }

    public function test_register_fails_with_short_password(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Alice',
            'email'                 => 'alice@example.com',
            'password'              => 'abc',
            'password_confirmation' => 'abc',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['password']);
    }

    public function test_register_fails_with_mismatched_password_confirmation(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Alice',
            'email'                 => 'alice@example.com',
            'password'              => 'secret123',
            'password_confirmation' => 'different',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['password']);
    }

    public function test_register_fails_with_single_char_name(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'A',
            'email'                 => 'alice@example.com',
            'password'              => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['name']);
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------

    public function test_login_returns_token_for_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret123')]);

        $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'secret123',
        ])->assertOk()
          ->assertJsonStructure(['message', 'user', 'token', 'type']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret123')]);

        $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'wrongpassword',
        ])->assertStatus(401)
          ->assertJson(['message' => 'Invalid credentials.']);
    }

    public function test_login_fails_with_unknown_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email'    => 'nobody@example.com',
            'password' => 'secret123',
        ])->assertStatus(401)
          ->assertJson(['message' => 'Invalid credentials.']);
    }

    // -------------------------------------------------------------------------
    // Me
    // -------------------------------------------------------------------------

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->getJson('/api/auth/me')
             ->assertOk()
             ->assertJsonPath('user.id', $user->id);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')
             ->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // Update profile
    // -------------------------------------------------------------------------

    public function test_update_profile_changes_name(): void
    {
        $user = User::factory()->create(['name' => 'OldName']);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->putJson('/api/auth/me', ['name' => 'NewName'])
             ->assertOk()
             ->assertJsonPath('user.name', 'NewName');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'NewName']);
    }

    public function test_update_profile_rejects_duplicate_email(): void
    {
        $other = User::factory()->create(['email' => 'taken@example.com']);
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->putJson('/api/auth/me', ['email' => 'taken@example.com'])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['email']);
    }

    public function test_update_profile_allows_keeping_own_email(): void
    {
        $user  = User::factory()->create(['email' => 'alice@example.com']);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->putJson('/api/auth/me', ['email' => 'alice@example.com'])
             ->assertOk();
    }

    // -------------------------------------------------------------------------
    // Change password
    // -------------------------------------------------------------------------

    public function test_change_password_succeeds(): void
    {
        $user = User::factory()->create(['password' => Hash::make('oldpass1')]);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->putJson('/api/auth/password', [
                 'current_password'          => 'oldpass1',
                 'new_password'              => 'newpass99',
                 'new_password_confirmation' => 'newpass99',
             ])->assertOk()
               ->assertJson(['message' => 'Password changed successfully.']);

        $this->assertTrue(Hash::check('newpass99', $user->fresh()->password));
    }

    public function test_change_password_rejects_wrong_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct')]);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->putJson('/api/auth/password', [
                 'current_password'          => 'wrong',
                 'new_password'              => 'newpass99',
                 'new_password_confirmation' => 'newpass99',
             ])->assertStatus(422);
    }

    public function test_change_password_revokes_other_tokens(): void
    {
        $user   = User::factory()->create(['password' => Hash::make('oldpass1')]);
        $active = $user->createToken('active')->plainTextToken;
        $user->createToken('other');

        $this->withToken($active)
             ->putJson('/api/auth/password', [
                 'current_password'          => 'oldpass1',
                 'new_password'              => 'newpass99',
                 'new_password_confirmation' => 'newpass99',
             ])->assertOk();

        // Only the active token survives; the "other" token row must be gone.
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------

    public function test_logout_revokes_current_token(): void
    {
        $user  = User::factory()->create();
        $user->createToken('test');

        $this->withToken($user->createToken('active')->plainTextToken)
             ->postJson('/api/auth/logout')
             ->assertOk()
             ->assertJson(['message' => 'Logged out successfully.']);

        // One token was deleted; only the unused 'test' token remains.
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_logout_all_revokes_all_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('first');
        $user->createToken('second');
        $active = $user->createToken('active')->plainTextToken;

        $this->withToken($active)
             ->postJson('/api/auth/logout-all')
             ->assertOk();

        // All tokens, including the one used to call logout-all, must be gone.
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    // -------------------------------------------------------------------------
    // Refresh
    // -------------------------------------------------------------------------

    public function test_refresh_returns_new_token_and_invalidates_old(): void
    {
        $user = User::factory()->create();
        $old  = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($old)
                         ->postJson('/api/auth/refresh')
                         ->assertOk()
                         ->assertJsonStructure(['token', 'type']);

        $newToken = $response->json('token');
        $this->assertNotEmpty($newToken);
        $this->assertNotEquals($old, $newToken);

        // Refresh rotates: old token row gone, exactly one new row exists.
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    // -------------------------------------------------------------------------
    // Password reset
    // -------------------------------------------------------------------------

    public function test_forgot_password_returns_ok_for_registered_email(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])
             ->assertOk();
    }

    public function test_forgot_password_returns_ok_for_unknown_email(): void
    {
        // Laravel returns the same success message to avoid email enumeration.
        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
             ->assertOk();
    }

    public function test_reset_password_updates_password_and_revokes_tokens(): void
    {
        $user  = User::factory()->create(['password' => Hash::make('oldpass')]);
        $token = $user->createToken('test')->plainTextToken;

        // Generate a real reset token via the broker.
        $resetToken = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token'                 => $resetToken,
            'email'                 => $user->email,
            'password'              => 'newpass99',
            'password_confirmation' => 'newpass99',
        ])->assertOk();

        $this->assertTrue(Hash::check('newpass99', $user->fresh()->password));

        // All tokens should be revoked after a password reset.
        $this->withToken($token)
             ->getJson('/api/auth/me')
             ->assertStatus(401);
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/reset-password', [
            'token'                 => 'invalid-token',
            'email'                 => $user->email,
            'password'              => 'newpass99',
            'password_confirmation' => 'newpass99',
        ])->assertStatus(422);
    }

    // -------------------------------------------------------------------------
    // Email verification
    // -------------------------------------------------------------------------

    public function test_resend_verification_succeeds_for_unverified_user(): void
    {
        Notification::fake();
        $user  = User::factory()->unverified()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->postJson('/api/auth/email/resend')
             ->assertOk()
             ->assertJson(['message' => 'Verification link sent.']);
    }

    public function test_resend_verification_reports_already_verified(): void
    {
        $user  = User::factory()->create(); // verified by default
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->postJson('/api/auth/email/resend')
             ->assertOk()
             ->assertJson(['message' => 'Email already verified.']);
    }
}
