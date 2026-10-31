<?php

namespace Tests\Feature;

use App\Models\Trail;
use App\Models\User;
use Database\Seeders\TrailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PwaTest extends TestCase
{
    use RefreshDatabase;

    public function test_manifest_service_worker_and_icons_are_served(): void
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.webmanifest')), true);
        $this->assertSame('Arda Traveling', $manifest['name']);
        $this->assertSame('standalone', $manifest['display']);

        foreach ($manifest['icons'] as $icon) {
            $this->assertFileExists(public_path($icon['src']));
        }

        $this->assertFileExists(public_path('sw.js'));
        $this->assertStringContainsString("'/offline'", file_get_contents(public_path('sw.js')));
    }

    public function test_offline_page_and_layout_pwa_tags(): void
    {
        $this->get('/offline')->assertOk()->assertSee('You are offline')->assertSee('115');
        $this->get('/')->assertOk()
            ->assertSee('rel="manifest"', false)
            ->assertSee('name="theme-color"', false)
            ->assertSee('id="net-banner"', false);
    }

    public function test_queued_offline_check_in_keeps_its_original_start_time(): void
    {
        $this->seed(TrailSeeder::class);
        $user = User::factory()->create(['emergency_name' => 'A', 'emergency_phone' => '1']);
        $startedAt = now()->subHours(5)->startOfMinute();

        $this->actingAs($user)->post('/check-in', [
            'trail_id' => Trail::first()->id,
            'checkin_at' => $startedAt->toIso8601String(),
            'expected_return_at' => now()->addHours(6)->format('Y-m-d H:i'),
        ], ['Accept' => 'application/json', 'X-Requested-With' => 'XMLHttpRequest'])->assertRedirect('/');

        $this->assertTrue($user->checkIns()->first()->checkin_at->equalTo($startedAt));

        $this->actingAs(User::factory()->create(['emergency_phone' => '1']))->post('/check-in', [
            'trail_id' => Trail::first()->id, 'checkin_at' => now()->addHour()->toIso8601String(), 'expected_return_at' => now()->addDay()->format('Y-m-d H:i'),
        ])->assertSessionHasErrors('checkin_at');
    }
}
