<?php

namespace Tests\Feature;

use App\Models\Porter;
use App\Models\Trail;
use App\Models\Trip;
use App\Models\User;
use Database\Seeders\PorterSeeder;
use Database\Seeders\TrailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PorterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([TrailSeeder::class, PorterSeeder::class]);
    }

    public function test_directory_lists_and_filters_porters(): void
    {
        $this->get('/porters')->assertOk()->assertSee('Pak Ujang')->assertSee('Lalu Wirya');

        $this->get('/porters?trail=gunung-rinjani')->assertOk()->assertSee('Lalu Wirya')->assertDontSee('Pak Ujang');
        $this->get('/porters?role=guide')->assertOk()->assertSee('Dede Firmansyah')->assertDontSee('Pak Ujang');
        $this->get('/porters?english=1')->assertOk()->assertSee('Dede Firmansyah')->assertDontSee('Yayan Hermawan');
        $this->get('/porters?verified=1')->assertOk()->assertDontSee('Rudi Setiawan');
    }

    public function test_porter_profile_shows_contact_and_trails(): void
    {
        $this->get('/porters/dede-firmansyah')->assertOk()
            ->assertSee('HPI-JB-2019-0412')
            ->assertSee('https://wa.me/6281290874455')
            ->assertSee('Gunung Salak');
    }

    public function test_trail_page_lists_its_porters(): void
    {
        $this->get('/trails/gunung-papandayan')->assertOk()->assertSee('Yayan Hermawan')->assertDontSee('Pak Ujang');
    }

    public function test_organizer_can_attach_porters_but_only_those_working_that_trail(): void
    {
        $organizer = User::factory()->create();
        $gede = Trail::where('slug', 'gunung-gede')->firstOrFail();
        $ujang = Porter::where('slug', 'pak-ujang-cibodas')->firstOrFail();
        $lalu = Porter::where('slug', 'lalu-sembalun')->firstOrFail();

        $this->actingAs($organizer)->post('/trips', [
            'trail_id' => $gede->id, 'title' => 'Gede with porters', 'description' => 'A trip description that is long enough.',
            'type' => 'open', 'departure_at' => now()->addDays(10)->format('Y-m-d H:i'), 'return_at' => now()->addDays(11)->format('Y-m-d H:i'),
            'meeting_point' => 'Cibodas', 'max_participants' => 8, 'price_idr' => 300000,
            'porter_ids' => [$ujang->id, $lalu->id],
        ])->assertRedirect();

        $trip = Trip::where('title', 'Gede with porters')->firstOrFail();
        $this->assertEqualsCanonicalizing([$ujang->id], $trip->porters()->pluck('porters.id')->all());

        $this->get("/trips/{$trip->id}")->assertOk()->assertSee('Pak Ujang');
    }
}
