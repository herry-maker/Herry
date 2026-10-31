<?php

namespace App\Console\Commands;

use App\Models\CheckIn;
use App\Notifications\HikerOverdue;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class AlertOverdueCheckIns extends Command
{
    protected $signature = 'checkins:alert-overdue';

    protected $description = 'Notify emergency contacts of hikers who have not checked out past the grace period';

    public function handle(): int
    {
        $overdue = CheckIn::overdue()->with(['user', 'trail'])->get();

        foreach ($overdue as $checkIn) {
            Notification::route('mail', $checkIn->user->email)
                ->notify(new HikerOverdue($checkIn));

            $checkIn->update(['overdue_alert_sent' => true]);

            $this->line("Alert sent for {$checkIn->user->name} on {$checkIn->trail->name}");
        }

        $this->info("{$overdue->count()} overdue check-in(s) processed.");

        return self::SUCCESS;
    }
}
