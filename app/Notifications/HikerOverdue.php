<?php

namespace App\Notifications;

use App\Models\CheckIn;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HikerOverdue extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public CheckIn $checkIn) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $user = $this->checkIn->user;
        $trail = $this->checkIn->trail;

        return (new MailMessage)
            ->subject("Overdue hiker: {$user->name} on {$trail->name}")
            ->greeting("Hello {$user->emergency_name},")
            ->line("{$user->name} checked in to {$trail->name} ({$trail->regency}, {$trail->province}) on {$this->checkIn->checkin_at->format('d M Y H:i')} and expected to return by {$this->checkIn->expected_return_at->format('d M Y H:i')}.")
            ->line('They have not checked out yet. Please try to reach them directly.')
            ->line("Hiker phone: {$user->phone}")
            ->line('If you cannot reach them, contact BASARNAS on 115 and the park ranger post for the trail.')
            ->line('This message was sent to the hiker\'s own email as well; the emergency contact phone on file is '.$user->emergency_phone.'.');
    }
}
