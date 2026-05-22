<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(array $overrides = []): User
    {
        return User::create(array_merge([
            'name'     => 'Test User',
            'email'    => 'test@example.com',
            'password' => Hash::make('Password1'),
        ], $overrides));
    }

    public function test_users_can_login_with_correct_credentials(): void
    {
        $this->createUser();

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'test@example.com',
            'password' => 'Password1',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'user', 'token']);
    }

    public function test_users_cannot_login_with_wrong_password(): void
    {
        $this->createUser();

        $this->postJson('/api/auth/login', [
            'email'    => 'test@example.com',
            'password' => 'WrongPassword',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_users_cannot_login_with_nonexistent_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email'    => 'nobody@example.com',
            'password' => 'Password1',
        ])->assertStatus(422);
    }
}
