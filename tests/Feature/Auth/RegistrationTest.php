<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'user', 'token'])
            ->assertJsonPath('user.email', 'test@example.com');

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    }

    public function test_registration_requires_valid_email(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Test',
            'email'                 => 'not-an-email',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Test',
            'email'                 => 'test@example.com',
            'password'              => 'Password1',
            'password_confirmation' => 'wrong',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_duplicate_email_is_rejected(): void
    {
        $data = [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
        ];

        $this->postJson('/api/auth/register', $data)->assertStatus(201);
        $this->postJson('/api/auth/register', $data)->assertStatus(422)->assertJsonValidationErrors('email');
    }
}
