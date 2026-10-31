<?php

namespace Tests\Feature;

use App\Models\Trail;
use App\Models\User;
use Database\Seeders\TrailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TrailSeeder::class);
    }

    public function test_guest_can_browse_and_filter_trails(): void
    {
        $this->get('/trails')->assertOk()->assertSee('Gunung Gede')->assertSee('Gunung Rinjani');

        $this->get('/trails?max_hours=3')->assertOk()->assertSee('Gunung Salak')->assertDontSee('Gunung Rinjani');
        $this->get('/trails?difficulty=ekstrem')->assertOk()->assertSee('Gunung Ciremai')->assertDontSee('Gunung Prau');
        $this->get('/trails?permit=simaksi')->assertOk()->assertSee('Gunung Gede')->assertDontSee('Gunung Bromo');
    }

    public function test_trail_page_shows_fee_for_the_viewers_nationality(): void
    {
        $gede = Trail::where('slug', 'gunung-gede')->firstOrFail();

        $local = User::factory()->create(['nationality' => 'ID']);
        $this->actingAs($local)->get('/trails/gunung-gede')
            ->assertOk()->assertSee('Your fee')->assertSee(number_format($gede->permit_fee_local_idr, 0, ',', '.'));

        $foreign = User::factory()->create(['nationality' => 'DE', 'id_type' => 'passport']);
        $this->actingAs($foreign)->get('/trails/gunung-gede')
            ->assertOk()->assertSee(number_format($gede->permit_fee_foreign_idr, 0, ',', '.'));
    }

    public function test_locale_switch_persists_in_session_and_on_user(): void
    {
        $user = User::factory()->create(['preferred_locale' => 'en']);

        $this->actingAs($user)->get('/locale/id')->assertRedirect();
        $this->assertSame('id', $user->fresh()->preferred_locale);
        $this->get('/trails')->assertSee('Jalur');

        $this->get('/locale/fr')->assertNotFound();
    }

    public function test_user_can_submit_a_trail_review(): void
    {
        $user = User::factory()->create();
        $trail = Trail::first();

        $this->actingAs($user)->post("/trails/{$trail->slug}/reviews", [
            'rating'     => 4,
            'condition'  => 'sedang',
            'body'       => 'Fallen tree between Pos 3 and Pos 4, still passable.',
            'visited_at' => now()->subDay()->toDateString(),
        ])->assertRedirect("/trails/{$trail->slug}");

        $this->assertDatabaseHas('trail_reviews', ['trail_id' => $trail->id, 'user_id' => $user->id, 'condition' => 'sedang']);
        $this->get("/trails/{$trail->slug}")->assertSee('Fallen tree between Pos 3');
    }

    public function test_guest_cannot_review(): void
    {
        $trail = Trail::first();
        $this->post("/trails/{$trail->slug}/reviews", ['rating' => 5])->assertRedirect('/login');
    }
}
