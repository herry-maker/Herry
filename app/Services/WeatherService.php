<?php

namespace App\Services;

use App\Models\Trail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class WeatherService
{
    public const ENDPOINT = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';

    /** BMKG weather codes: 63 heavy rain, 95/97 thunderstorm. */
    public const SEVERE_CODES = [63, 95, 97];

    public const RAIN_CODES = [60, 61, 63, 80, 95, 97];

    private const TTL_OK = 3600;

    private const TTL_FAIL = 300;

    /**
     * @return array{updated: string, days: list<array<string, mixed>>}|null
     */
    public function forecast(Trail $trail): ?array
    {
        if (! $trail->bmkg_adm4) {
            return null;
        }

        $key = "bmkg:{$trail->bmkg_adm4}";
        $cached = Cache::get($key);

        if ($cached !== null) {
            return $cached ?: null;
        }

        $forecast = $this->fetch($trail->bmkg_adm4);
        Cache::put($key, $forecast ?? false, $forecast ? self::TTL_OK : self::TTL_FAIL);

        return $forecast;
    }

    /** @return array<string, mixed>|null the day entry for the given date, if within the forecast */
    public function dayFor(Trail $trail, Carbon $date): ?array
    {
        $forecast = $this->forecast($trail);

        return $forecast ? collect($forecast['days'])->firstWhere('date', $date->toDateString()) : null;
    }

    private function fetch(string $adm4): ?array
    {
        try {
            $response = Http::timeout(8)->acceptJson()->get(self::ENDPOINT, ['adm4' => $adm4]);
        } catch (Throwable) {
            return null;
        }

        if (! $response->ok()) {
            return null;
        }

        return $this->normalise($response->json());
    }

    private function normalise(?array $payload): ?array
    {
        $slots = collect(data_get($payload, 'data.0.cuaca', []))->flatten(1)
            ->filter(fn ($s) => isset($s['local_datetime'], $s['t'], $s['weather']))
            ->map(fn ($s) => [
                'at'      => Carbon::parse($s['local_datetime']),
                't'       => (int) round($s['t']),
                'hu'      => (int) ($s['hu'] ?? 0),
                'ws'      => (int) round($s['ws'] ?? 0),
                'code'    => (int) $s['weather'],
                'desc_id' => (string) ($s['weather_desc'] ?? ''),
                'desc_en' => (string) ($s['weather_desc_en'] ?? ''),
            ])
            ->sortBy('at')
            ->values();

        if ($slots->isEmpty()) {
            return null;
        }

        $days = $slots->groupBy(fn ($s) => $s['at']->toDateString())->map(function ($daySlots, $date) {
            $worst = $daySlots->sortByDesc(fn ($s) => $this->severity($s['code']))->first();

            return [
                'date'       => $date,
                'tmin'       => $daySlots->min('t'),
                'tmax'       => $daySlots->max('t'),
                'hu_max'     => $daySlots->max('hu'),
                'ws_max'     => $daySlots->max('ws'),
                'code'       => $worst['code'],
                'desc_id'    => $worst['desc_id'],
                'desc_en'    => $worst['desc_en'],
                'rain_slots' => $daySlots->filter(fn ($s) => in_array($s['code'], self::RAIN_CODES, true))->count(),
                'severe'     => $daySlots->contains(fn ($s) => in_array($s['code'], self::SEVERE_CODES, true)),
                'slots'      => $daySlots->map(fn ($s) => ['time' => $s['at']->format('H:i'), 't' => $s['t'], 'code' => $s['code'], 'desc_id' => $s['desc_id'], 'desc_en' => $s['desc_en']])->values()->all(),
            ];
        })->values()->take(3)->all();

        return [
            'updated' => now()->toIso8601String(),
            'place'   => (string) data_get($payload, 'data.0.lokasi.desa', data_get($payload, 'lokasi.desa', '')),
            'days'    => $days,
        ];
    }

    private function severity(int $code): int
    {
        return match (true) {
            in_array($code, self::SEVERE_CODES, true) => 3,
            in_array($code, self::RAIN_CODES, true)   => 2,
            $code >= 3                                 => 1,
            default                                    => 0,
        };
    }

    public static function icon(int $code): string
    {
        return match (true) {
            in_array($code, [95, 97], true) => '⛈',
            $code === 63                    => '🌧',
            in_array($code, [60, 61, 80], true) => '🌦',
            $code === 45                    => '🌫',
            $code >= 3                      => '☁️',
            $code === 2                     => '⛅',
            default                         => '☀️',
        };
    }
}
