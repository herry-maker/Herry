<?php

namespace App\Notifications;

use App\Models\Trip;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;

class TripWeatherAlert extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param list<array<string, mixed>> $severeDays */
    public function __construct(public Trip $trip, public array $severeDays) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Storm risk: {$this->trip->title} ({$this->trip->departure_at->format('j M')})")
            ->greeting("Hi {$notifiable->name},")
            ->line("BMKG now forecasts heavy rain or thunderstorms at {$this->trip->trail->name} during your trip:");

        foreach ($this->severeDays as $day) {
            $mail->line('• '.Carbon::parse($day['date'])->format('D j M').": {$day['desc_en']} ({$day['desc_id']}), {$day['tmin']}–{$day['tmax']}°C, wind up to {$day['ws_max']} km/h");
        }

        return $mail
            ->line('Lightning on exposed ridges is the main cause of death on Javanese volcanoes. Talk to your organizer about summiting before noon or postponing.')
            ->action('Open trip', route('trips.show', $this->trip))
            ->line('Forecast is for the village nearest basecamp; the summit will be colder and wetter.');
    }
}
