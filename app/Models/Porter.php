<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'user_id', 'name', 'slug', 'phone', 'role', 'base_area', 'rate_idr_per_day', 'languages',
    'bio_en', 'bio_id', 'is_verified', 'license_no', 'rating_avg', 'rating_count', 'trips_led',
])]
class Porter extends Model
{
    public const ROLES = ['porter', 'guide'];

    protected function casts(): array
    {
        return [
            'languages'   => 'array',
            'is_verified' => 'boolean',
            'rating_avg'  => 'float',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trails(): BelongsToMany
    {
        return $this->belongsToMany(Trail::class)->orderBy('name');
    }

    public function trips(): BelongsToMany
    {
        return $this->belongsToMany(Trip::class);
    }

    public function scopeForTrail(Builder $query, Trail|int $trail): Builder
    {
        $id = $trail instanceof Trail ? $trail->id : $trail;

        return $query->whereHas('trails', fn ($q) => $q->where('trails.id', $id));
    }

    public function bio(): string
    {
        return app()->getLocale() === 'id' ? $this->bio_id : $this->bio_en;
    }

    public function roleLabel(): string
    {
        return __($this->role === 'guide' ? 'Guide' : 'Porter');
    }

    public function whatsappUrl(): string
    {
        return 'https://wa.me/'.preg_replace('/\D+/', '', $this->phone);
    }

    public function speaksEnglish(): bool
    {
        return in_array('en', $this->languages, true);
    }
}
