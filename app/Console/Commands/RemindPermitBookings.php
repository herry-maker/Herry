<?php

namespace App\Console\Commands;

use App\Models\Permit;
use App\Notifications\PermitBookingOpen;
use Illuminate\Console\Command;

class RemindPermitBookings extends Command
{
    protected $signature = 'permits:remind';

    protected $description = 'Email hikers whose planned permits have entered the booking window';

    public function handle(): int
    {
        $due = Permit::dueForReminder()->with(['user', 'trail'])->get();

        foreach ($due as $permit) {
            $permit->user->notify(new PermitBookingOpen($permit));
            $permit->update(['reminder_sent_at' => now()]);
            $this->line("Reminded {$permit->user->name}: {$permit->trail->name} on {$permit->hike_date->toDateString()}");
        }

        $this->info("{$due->count()} reminder(s) sent.");

        return self::SUCCESS;
    }
}
