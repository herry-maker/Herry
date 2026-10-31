<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['trip_id', 'user_id', 'role', 'status', 'payment_proof_path', 'paid_at', 'confirmed_at'])]
class TripMember extends Model
{
    public const STATUSES = ['pending', 'paid', 'confirmed', 'cancelled'];

    protected function casts(): array
    {
        return [
            'paid_at'      => 'datetime',
            'confirmed_at' => 'datetime',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['pending', 'paid', 'confirmed'], true);
    }
}
