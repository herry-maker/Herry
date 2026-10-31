<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'trail_id', 'trip_id', 'checkin_at', 'expected_return_at', 'checkout_at', 'reached_summit', 'overdue_alert_sent'])]
class CheckIn extends Model
{
    public const OVERDUE_GRACE_HOURS = 6;

    protected function casts(): array
    {
        return [
            'checkin_at'         => 'datetime',
            'expected_return_at' => 'datetime',
            'checkout_at'        => 'datetime',
            'reached_summit'     => 'boolean',
            'overdue_alert_sent' => 'boolean',
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

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('checkout_at');
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->active()
            ->where('overdue_alert_sent', false)
            ->where('expected_return_at', '<', now()->subHours(self::OVERDUE_GRACE_HOURS));
    }

    public function isOverdue(): bool
    {
        return $this->checkout_at === null
            && $this->expected_return_at->addHours(self::OVERDUE_GRACE_HOURS)->isPast();
    }
}
