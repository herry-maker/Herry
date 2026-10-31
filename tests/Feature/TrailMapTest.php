<?php

namespace Tests\Feature;

use Database\Seeders\TrailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrailMapTest extends TestCase
{
    use RefreshDatabase;

    public function test_map_page_embeds_every_trail_with_coordinates(): void
    {
        $this->seed(TrailSeeder::class);

        $response = $this->get('/trails/map')->assertOk()->assertSee('id="trail-map"', false);

        preg_match("/data-trails='(.+?)'/", $response->getContent(), $m);
        $trails = json_decode(html_entity_decode($m[1], ENT_QUOTES), true);

        $this->assertCount(12, $trails);
        foreach ($trails as $trail) {
            $this->assertIsFloat($trail['lat']);
            $this->assertIsFloat($trail['lng']);
            $this->assertStringStartsWith('http', $trail['url']);
        }
        $this->assertTrue(collect($trails)->firstWhere('slug', 'gunung-gede')['permit']);
        $this->assertFalse(collect($trails)->firstWhere('slug', 'gunung-prau')['permit']);
    }

    public function test_trail_page_has_mini_map_pin(): void
    {
        $this->seed(TrailSeeder::class);

        $this->get('/trails/gunung-rinjani')->assertOk()
            ->assertSee('id="trail-mini-map"', false)
            ->assertSee('&quot;lat&quot;:-8.4111', false);
    }
}
