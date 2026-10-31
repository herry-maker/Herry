<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'trail_id', 'trip_id', 'hike_date', 'party_size', 'status', 'simaksi_code', 'booked_at', 'reminder_sent_at', 'notes'])]
class Permit extends Model
{
    public const STATUSES = ['planned', 'booked', 'approved', 'used', 'expired'];

    /** Days before the hike when national-park quotas typically open for booking. */
    public const BOOKING_WINDOW_DAYS = 60;

    protected function casts(): array
    {
        return [
            'hike_date'        => 'date',
            'booked_at'        => 'datetime',
            'reminder_sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trail(): BelongsTo
    {
        return $this->belongsTo(Trail::class);
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('hike_date', '>=', today())->orderBy('hike_date');
    }

    public function scopeDueForReminder(Builder $query): Builder
    {
        return $query->where('status', 'planned')
            ->whereNull('reminder_sent_at')
            ->whereDate('hike_date', '<=', today()->addDays(self::BOOKING_WINDOW_DAYS))
            ->whereDate('hike_date', '>=', today());
    }

    public function bookingOpensOn(): \Illuminate\Support\Carbon
    {
        return $this->hike_date->copy()->subDays(self::BOOKING_WINDOW_DAYS);
    }

    public function bookingWindowOpen(): bool
    {
        return $this->bookingOpensOn()->lte(today()) && $this->hike_date->gte(today());
    }

    public function daysUntilHike(): int
    {
        return (int) today()->diffInDays($this->hike_date, false);
    }

    public function statusLabel(): string
    {
        return __(match ($this->status) {
            'booked'   => 'Booked',
            'approved' => 'Approved',
            'used'     => 'Used',
            'expired'  => 'Expired',
            default    => 'Planned',
        });
    }

    public function feeFor(User $user): ?int
    {
        $fee = $this->trail->permitFeeFor($user);

        return $fee === null ? null : $fee * $this->party_size;
    }
}
