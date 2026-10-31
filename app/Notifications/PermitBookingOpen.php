<?php

namespace App\Notifications;

use App\Models\Permit;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PermitBookingOpen extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Permit $permit) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $trail = $this->permit->trail;
        $date = $this->permit->hike_date->translatedFormat('l, j F Y');

        $mail = (new MailMessage)
            ->subject("Book your {$trail->name} permit for {$date}")
            ->greeting("Hi {$notifiable->name},")
            ->line("Quota for {$trail->name} on {$date} is normally open for booking from about ".Permit::BOOKING_WINDOW_DAYS.' days out, and that window has now opened.')
            ->line("Party size: {$this->permit->party_size}. Daily quota: ".($trail->daily_quota ? "{$trail->daily_quota} hikers" : 'no fixed quota').'. Weekend slots fill fast.');

        if ($trail->permit_url) {
            $mail->action('Book permit', $trail->permit_url);
        }

        return $mail
            ->line('When you have your SIMAKSI code, mark the permit as booked in Arda Traveling: '.route('permits.index'))
            ->line('Bring your '.($notifiable->isForeign() ? 'passport' : 'KTP').' to the ranger post; the code is checked against it.');
    }
}
