<?php

namespace Tests\Feature;

use App\Models\CheckIn;
use App\Models\Trail;
use App\Models\User;
use App\Notifications\HikerOverdue;
use Database\Seeders\BadgeSeeder;
use Database\Seeders\TrailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CheckInTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([TrailSeeder::class, BadgeSeeder::class]);
    }

    private function hiker(): User
    {
        return User::factory()->create(['emergency_name' => 'Sari', 'emergency_phone' => '+62 813 000']);
    }

    public function test_check_in_requires_emergency_contact(): void
    {
        $user = User::factory()->create(['emergency_phone' => null]);

        $this->actingAs($user)->get('/check-in')->assertRedirect('/profile/edit');
    }

    public function test_checkout_with_summit_updates_stats_and_awards_badge(): void
    {
        $user = $this->hiker();
        $gede = Trail::where('slug', 'gunung-gede')->firstOrFail();

        $this->actingAs($user)->post('/check-in', [
            'trail_id' => $gede->id,
            'expected_return_at' => now()->addDay()->format('Y-m-d H:i'),
        ])->assertRedirect('/');

        $checkIn = $user->checkIns()->active()->firstOrFail();

        $this->actingAs($user)->post('/check-in', ['trail_id' => $gede->id, 'expected_return_at' => now()->addDay()->format('Y-m-d H:i')])
            ->assertSessionHasErrors('trail_id');

        $this->actingAs($user)->post("/check-in/{$checkIn->id}/checkout", ['reached_summit' => 1])->assertRedirect("/hikers/{$user->id}");

        $user->refresh();
        $this->assertSame(1, $user->summit_count);
        $this->assertSame($gede->elevation_m, $user->total_elevation_m);
        $this->assertTrue($user->badges()->where('slug', 'first-summit')->exists());
        $this->assertFalse($user->badges()->where('slug', 'three-thousand')->exists());
    }

    public function test_another_user_cannot_check_out_my_hike(): void
    {
        $user = $this->hiker();
        $checkIn = $user->checkIns()->create(['trail_id' => Trail::first()->id, 'checkin_at' => now(), 'expected_return_at' => now()->addDay()]);

        $this->actingAs(User::factory()->create())->post("/check-in/{$checkIn->id}/checkout")->assertForbidden();
    }

    public function test_overdue_command_notifies_once(): void
    {
        Notification::fake();
        $user = $this->hiker();

        $overdue = $user->checkIns()->create([
            'trail_id' => Trail::first()->id,
            'checkin_at' => now()->subDays(2),
            'expected_return_at' => now()->subHours(CheckIn::OVERDUE_GRACE_HOURS + 1),
        ]);
        $user->checkIns()->create(['trail_id' => Trail::first()->id, 'checkin_at' => now(), 'expected_return_at' => now()->addHours(2)]);

        $this->artisan('checkins:alert-overdue')->assertSuccessful();
        Notification::assertSentOnDemand(HikerOverdue::class, fn ($n, $c, $notifiable) => $notifiable->routes['mail'] === $user->email);
        Notification::assertCount(1);
        $this->assertTrue($overdue->fresh()->overdue_alert_sent);

        $this->artisan('checkins:alert-overdue')->assertSuccessful();
        Notification::assertCount(1);
    }
}
