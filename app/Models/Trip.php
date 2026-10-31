<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'trail_id', 'organizer_id', 'title', 'description', 'type', 'departure_at', 'return_at',
    'meeting_point', 'max_participants', 'price_idr', 'includes', 'whatsapp_link',
    'qris_image_path', 'beginner_friendly', 'status',
])]
class Trip extends Model
{
    public const TYPES = ['open', 'private'];

    public const STATUSES = ['open', 'full', 'done', 'cancelled'];

    protected function casts(): array
    {
        return [
            'departure_at'      => 'datetime',
            'return_at'         => 'datetime',
            'includes'          => 'array',
            'beginner_friendly' => 'boolean',
        ];
    }

    public function trail(): BelongsTo
    {
        return $this->belongsTo(Trail::class);
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(TripMember::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'trip_members')
            ->withPivot(['role', 'status', 'payment_proof_path', 'paid_at', 'confirmed_at'])
            ->withTimestamps();
    }

    public function porters(): BelongsToMany
    {
        return $this->belongsToMany(Porter::class);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->whereIn('status', ['open', 'full'])->where('departure_at', '>', now())->orderBy('departure_at');
    }

    public function activeMemberCount(): int
    {
        return $this->memberships()->whereIn('status', ['pending', 'paid', 'confirmed'])->count();
    }

    public function seatsLeft(): int
    {
        return max(0, $this->max_participants - $this->activeMemberCount());
    }

    public function isFull(): bool
    {
        return $this->seatsLeft() === 0;
    }

    public function membershipFor(?User $user): ?TripMember
    {
        if (! $user) {
            return null;
        }

        return $this->memberships->firstWhere('user_id', $user->id)
            ?? $this->memberships()->where('user_id', $user->id)->first();
    }

    public function durationLabel(): string
    {
        $nights = $this->departure_at->startOfDay()->diffInDays($this->return_at->startOfDay());

        return ($nights + 1).'D'.$nights.'N';
    }
}
