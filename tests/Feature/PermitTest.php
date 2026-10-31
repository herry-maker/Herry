<?php

namespace Tests\Feature;

use App\Models\Permit;
use App\Models\Trail;
use App\Models\User;
use App\Notifications\PermitBookingOpen;
use Database\Seeders\TrailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PermitTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Trail $gede;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TrailSeeder::class);
        $this->user = User::factory()->create(['nationality' => 'AU', 'id_type' => 'passport', 'emergency_phone' => '+61 1']);
        $this->gede = Trail::where('slug', 'gunung-gede')->firstOrFail();
    }

    public function test_user_plans_a_permit_and_sees_booking_window(): void
    {
        $hike = today()->addDays(90);

        $this->actingAs($this->user)->post('/permits', [
            'trail_id' => $this->gede->id, 'hike_date' => $hike->toDateString(), 'party_size' => 2,
        ])->assertRedirect('/permits')->assertSessionHas('status', fn ($s) => str_contains($s, $hike->copy()->subDays(Permit::BOOKING_WINDOW_DAYS)->translatedFormat('j M Y')));

        $permit = $this->user->permits()->firstOrFail();
        $this->assertSame('planned', $permit->status);
        $this->assertFalse($permit->bookingWindowOpen());

        $this->actingAs($this->user)->get('/permits')->assertOk()
            ->assertSee('Gunung Gede')
            ->assertSee('Booking usually opens')
            ->assertSee(number_format($this->gede->permit_fee_foreign_idr * 2, 0, ',', '.'));
    }

    public function test_status_update_records_booking_and_owner_only(): void
    {
        $permit = $this->user->permits()->create(['trail_id' => $this->gede->id, 'hike_date' => today()->addDays(20), 'party_size' => 1]);

        $this->actingAs(User::factory()->create())->put("/permits/{$permit->id}", ['status' => 'booked'])->assertForbidden();

        $this->actingAs($this->user)->put("/permits/{$permit->id}", ['status' => 'booked', 'simaksi_code' => 'SMK-123'])->assertRedirect();
        $permit->refresh();
        $this->assertSame('booked', $permit->status);
        $this->assertSame('SMK-123', $permit->simaksi_code);
        $this->assertNotNull($permit->booked_at);

        $this->actingAs($this->user)->delete("/permits/{$permit->id}")->assertRedirect('/permits');
        $this->assertDatabaseMissing('permits', ['id' => $permit->id]);
    }

    public function test_reminder_sent_once_when_window_opens(): void
    {
        Notification::fake();

        $inWindow = $this->user->permits()->create(['trail_id' => $this->gede->id, 'hike_date' => today()->addDays(Permit::BOOKING_WINDOW_DAYS - 1), 'party_size' => 1]);
        $this->user->permits()->create(['trail_id' => $this->gede->id, 'hike_date' => today()->addDays(Permit::BOOKING_WINDOW_DAYS + 10), 'party_size' => 1]);
        $this->user->permits()->create(['trail_id' => $this->gede->id, 'hike_date' => today()->addDays(5), 'party_size' => 1, 'status' => 'booked']);

        $this->artisan('permits:remind')->assertSuccessful();
        Notification::assertSentTo($this->user, PermitBookingOpen::class, fn ($n) => $n->permit->is($inWindow));
        Notification::assertCount(1);
        $this->assertNotNull($inWindow->fresh()->reminder_sent_at);

        $this->artisan('permits:remind')->assertSuccessful();
        Notification::assertCount(1);
    }

    public function test_checkout_marks_booked_permit_as_used(): void
    {
        $permit = $this->user->permits()->create(['trail_id' => $this->gede->id, 'hike_date' => today(), 'party_size' => 1, 'status' => 'approved']);
        $checkIn = $this->user->checkIns()->create(['trail_id' => $this->gede->id, 'checkin_at' => now()->subHours(8), 'expected_return_at' => now()->addHours(4)]);

        $this->actingAs($this->user)->post("/check-in/{$checkIn->id}/checkout", ['reached_summit' => 1])->assertRedirect();

        $this->assertSame('used', $permit->fresh()->status);
    }
}
