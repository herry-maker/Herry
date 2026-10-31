<?php

namespace Tests\Feature;

use App\Models\Trail;
use App\Models\Trip;
use App\Models\User;
use Database\Seeders\TrailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TripTest extends TestCase
{
    use RefreshDatabase;

    private User $organizer;

    private Trip $trip;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TrailSeeder::class);
        Storage::fake('public');

        $this->organizer = User::factory()->create();
        $this->trip = Trip::create([
            'trail_id' => Trail::first()->id, 'organizer_id' => $this->organizer->id,
            'title' => 'Test open trip', 'description' => 'A long enough description for the trip.',
            'type' => 'open', 'departure_at' => now()->addWeek(), 'return_at' => now()->addWeek()->addDay(),
            'meeting_point' => 'Pasar Rebo', 'max_participants' => 2, 'price_idr' => 250000, 'status' => 'open',
        ]);
    }

    public function test_join_pay_confirm_flow(): void
    {
        $hiker = User::factory()->create();

        $this->actingAs($hiker)->post("/trips/{$this->trip->id}/join")->assertRedirect("/trips/{$this->trip->id}");
        $this->assertDatabaseHas('trip_members', ['trip_id' => $this->trip->id, 'user_id' => $hiker->id, 'status' => 'pending']);

        $this->actingAs($hiker)->get("/trips/{$this->trip->id}")->assertOk()->assertSee('Pay with QRIS')->assertSee('250.000');

        $this->actingAs($hiker)->post("/trips/{$this->trip->id}/proof", [
            'payment_proof' => UploadedFile::fake()->image('qris.jpg'),
        ])->assertRedirect();
        $member = $this->trip->memberships()->where('user_id', $hiker->id)->first();
        $this->assertSame('paid', $member->status);
        Storage::disk('public')->assertExists($member->payment_proof_path);

        $this->actingAs($hiker)->post("/trips/{$this->trip->id}/members/{$member->id}/confirm")->assertForbidden();

        $this->actingAs($this->organizer)->post("/trips/{$this->trip->id}/members/{$member->id}/confirm")->assertRedirect();
        $this->assertSame('confirmed', $member->fresh()->status);
    }

    public function test_trip_fills_and_rejects_extra_members(): void
    {
        [$a, $b, $c] = User::factory()->count(3)->create();

        $this->actingAs($a)->post("/trips/{$this->trip->id}/join")->assertSessionHasNoErrors();
        $this->actingAs($b)->post("/trips/{$this->trip->id}/join")->assertSessionHasNoErrors();
        $this->assertSame('full', $this->trip->fresh()->status);

        $this->actingAs($c)->post("/trips/{$this->trip->id}/join")->assertSessionHasErrors('join');
        $this->assertDatabaseMissing('trip_members', ['user_id' => $c->id]);

        $this->actingAs($a)->delete("/trips/{$this->trip->id}/leave")->assertRedirect();
        $this->assertSame('open', $this->trip->fresh()->status);
        $this->assertSame(1, $this->trip->fresh()->seatsLeft());
    }

    public function test_organizer_cannot_join_own_trip(): void
    {
        $this->actingAs($this->organizer)->post("/trips/{$this->trip->id}/join")->assertForbidden();
    }

    public function test_organizer_can_publish_a_trip_with_qris(): void
    {
        $this->actingAs($this->organizer)->post('/trips', [
            'trail_id' => Trail::first()->id, 'title' => 'Weekend Papandayan', 'description' => 'Beginner friendly sunrise camp with porters.',
            'type' => 'open', 'departure_at' => now()->addDays(10)->format('Y-m-d H:i'), 'return_at' => now()->addDays(11)->format('Y-m-d H:i'),
            'meeting_point' => 'Stasiun Bogor', 'max_participants' => 15, 'price_idr' => 275000,
            'includes' => "Transport\nPorter\nMakan 3x", 'whatsapp_link' => 'https://chat.whatsapp.com/abc',
            'qris_image' => UploadedFile::fake()->image('qris.png'), 'beginner_friendly' => 1,
        ])->assertRedirect();

        $trip = Trip::where('title', 'Weekend Papandayan')->firstOrFail();
        $this->assertSame(['Transport', 'Porter', 'Makan 3x'], $trip->includes);
        $this->assertTrue($trip->beginner_friendly);
        Storage::disk('public')->assertExists($trip->qris_image_path);
        $this->assertDatabaseHas('trip_members', ['trip_id' => $trip->id, 'user_id' => $this->organizer->id, 'role' => 'leader', 'status' => 'confirmed']);
    }

    public function test_whatsapp_link_must_be_a_chat_invite(): void
    {
        $this->actingAs($this->organizer)->post('/trips', [
            'trail_id' => Trail::first()->id, 'title' => 'Bad link trip', 'description' => 'Description long enough to pass validation.',
            'type' => 'open', 'departure_at' => now()->addDays(10)->format('Y-m-d H:i'), 'return_at' => now()->addDays(11)->format('Y-m-d H:i'),
            'meeting_point' => 'X', 'max_participants' => 5, 'price_idr' => 0, 'whatsapp_link' => 'https://evil.example/phish',
        ])->assertSessionHasErrors('whatsapp_link');
    }
}
