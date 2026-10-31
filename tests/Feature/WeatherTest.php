<?php

namespace Tests\Feature;

use App\Models\Trail;
use App\Models\Trip;
use App\Models\User;
use App\Notifications\TripWeatherAlert;
use App\Services\WeatherService;
use Database\Seeders\TrailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class WeatherTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TrailSeeder::class);
        Cache::flush();
    }

    /** Build a BMKG-shaped payload: three days of 3-hourly slots with the given weather code per day. */
    private function bmkg(array $codesPerDay): array
    {
        $days = [];
        foreach ($codesPerDay as $offset => $code) {
            $slots = [];
            foreach ([1, 4, 7, 10, 13, 16, 19, 22] as $h) {
                $slots[] = [
                    'local_datetime' => today()->addDays($offset)->setTime($h, 0)->format('Y-m-d H:i:s'),
                    't' => 14 + $h / 2, 'hu' => 80 + $h / 4, 'ws' => 5 + $h, 'tcc' => 50,
                    'weather' => ($h === 13 ? $code : 1),
                    'weather_desc' => $code === 97 ? 'Hujan Petir' : 'Cerah', 'weather_desc_en' => $code === 97 ? 'Severe Thunderstorm' : 'Sunny',
                ];
            }
            $days[] = $slots;
        }

        return ['lokasi' => ['desa' => 'Cibodas'], 'data' => [['lokasi' => ['desa' => 'Cibodas'], 'cuaca' => $days]]];
    }

    public function test_trail_page_shows_three_day_forecast_from_bmkg(): void
    {
        Http::fake([WeatherService::ENDPOINT.'*' => Http::response($this->bmkg([1, 61, 97]))]);

        $this->get('/trails/gunung-gede')->assertOk()
            ->assertSee('Weather at basecamp')
            ->assertSee('Cibodas')
            ->assertSee('Severe Thunderstorm')
            ->assertSee('Heavy rain or thunderstorm forecast');

        Http::assertSentCount(1);
        $this->get('/trails/gunung-gede')->assertOk();
        Http::assertSentCount(1);
    }

    public function test_forecast_failure_degrades_gracefully_and_is_not_cached_long(): void
    {
        Http::fake([WeatherService::ENDPOINT.'*' => Http::response('', 503)]);

        $this->get('/trails/gunung-gede')->assertOk()->assertSee('Forecast unavailable');
        $this->assertFalse(Cache::get('bmkg:32.03.10.2003'));

        $this->assertNull(app(WeatherService::class)->forecast(new Trail(['bmkg_adm4' => null])));
    }

    public function test_weather_alert_notifies_confirmed_members_once_on_severe_forecast(): void
    {
        Notification::fake();
        Http::fake([WeatherService::ENDPOINT.'*' => Http::response($this->bmkg([1, 97, 1]))]);

        $organizer = User::factory()->create();
        $member = User::factory()->create();
        $pending = User::factory()->create();
        $trip = Trip::create([
            'trail_id' => Trail::where('slug', 'gunung-gede')->value('id'), 'organizer_id' => $organizer->id,
            'title' => 'Storm trip', 'description' => 'Description long enough for the trip.',
            'type' => 'open', 'departure_at' => today()->addDay()->setTime(22, 0), 'return_at' => today()->addDays(2)->setTime(18, 0),
            'meeting_point' => 'Cibodas', 'max_participants' => 10, 'price_idr' => 0, 'status' => 'open',
        ]);
        $trip->memberships()->create(['user_id' => $member->id, 'status' => 'confirmed']);
        $trip->memberships()->create(['user_id' => $pending->id, 'status' => 'pending']);

        $this->artisan('trips:weather-alert')->assertSuccessful();

        Notification::assertSentTo([$organizer, $member], TripWeatherAlert::class);
        Notification::assertNotSentTo($pending, TripWeatherAlert::class);
        $this->assertNotNull($trip->fresh()->weather_alert_sent_at);

        $this->artisan('trips:weather-alert')->assertSuccessful();
        Notification::assertCount(2);
    }

    public function test_weather_alert_skips_clear_forecast(): void
    {
        Notification::fake();
        Http::fake([WeatherService::ENDPOINT.'*' => Http::response($this->bmkg([1, 1, 1]))]);

        $organizer = User::factory()->create();
        Trip::create([
            'trail_id' => Trail::first()->id, 'organizer_id' => $organizer->id, 'title' => 'Clear trip', 'description' => 'Description long enough.',
            'type' => 'open', 'departure_at' => now()->addHours(20), 'return_at' => now()->addHours(40),
            'meeting_point' => 'X', 'max_participants' => 5, 'price_idr' => 0, 'status' => 'open',
        ]);

        $this->artisan('trips:weather-alert')->assertSuccessful();
        Notification::assertNothingSent();
    }
}
