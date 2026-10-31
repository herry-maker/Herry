<?php

namespace App\Console\Commands;

use App\Models\Trip;
use App\Notifications\TripWeatherAlert;
use App\Services\WeatherService;
use Illuminate\Console\Command;

class AlertTripWeather extends Command
{
    protected $signature = 'trips:weather-alert';

    protected $description = 'Warn trip members when BMKG forecasts heavy rain or thunderstorms within 48 h of departure';

    public function handle(WeatherService $weather): int
    {
        $trips = Trip::with(['trail', 'organizer', 'members'])
            ->whereIn('status', ['open', 'full'])
            ->whereNull('weather_alert_sent_at')
            ->whereBetween('departure_at', [now(), now()->addHours(48)])
            ->get();

        $sent = 0;

        foreach ($trips as $trip) {
            $forecast = $weather->forecast($trip->trail);
            if (! $forecast) {
                continue;
            }

            $window = collect($forecast['days'])->filter(fn ($d) => $d['date'] >= $trip->departure_at->toDateString() && $d['date'] <= $trip->return_at->toDateString());
            $severe = $window->filter(fn ($d) => $d['severe']);

            if ($severe->isEmpty()) {
                continue;
            }

            $recipients = $trip->members->filter(fn ($u) => in_array($u->pivot->status, ['paid', 'confirmed'], true))->push($trip->organizer)->unique('id');

            foreach ($recipients as $user) {
                $user->notify(new TripWeatherAlert($trip, $severe->values()->all()));
            }

            $trip->update(['weather_alert_sent_at' => now()]);
            $sent++;
            $this->line("Alerted {$recipients->count()} on \"{$trip->title}\"");
        }

        $this->info("{$sent} trip(s) alerted.");

        return self::SUCCESS;
    }
}
