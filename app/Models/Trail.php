<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'name', 'slug', 'regency', 'province', 'elevation_m', 'length_km', 'difficulty',
    'hours_from_jakarta', 'permit_type', 'permit_url', 'daily_quota',
    'permit_fee_local_idr', 'permit_fee_foreign_idr', 'basarnas_required', 'guide_required',
    'lat', 'lng', 'description_en', 'description_id', 'cover_path', 'cover_gradient',
])]
class Trail extends Model
{
    use HasFactory;

    public const DIFFICULTIES = ['mudah', 'sedang', 'berat', 'ekstrem'];

    public const PERMIT_TYPES = ['none', 'ticket', 'simaksi', 'esimaksi'];

    protected function casts(): array
    {
        return [
            'basarnas_required' => 'boolean',
            'guide_required'    => 'boolean',
            'length_km'         => 'float',
            'hours_from_jakarta' => 'float',
            'lat'               => 'float',
            'lng'               => 'float',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(TrailReview::class)->latest('visited_at');
    }

    public function latestReview(): HasOne
    {
        return $this->hasOne(TrailReview::class)->latestOfMany('visited_at');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function upcomingTrips(): HasMany
    {
        return $this->trips()->where('status', 'open')->where('departure_at', '>', now())->orderBy('departure_at');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class)->latest();
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    public function description(): string
    {
        return app()->getLocale() === 'id' ? $this->description_id : $this->description_en;
    }

    public function permitFeeFor(User $user): ?int
    {
        return $user->isForeign() ? $this->permit_fee_foreign_idr : $this->permit_fee_local_idr;
    }

    public function difficultyLabel(): string
    {
        return __(match ($this->difficulty) {
            'mudah'   => 'Easy',
            'sedang'  => 'Moderate',
            'berat'   => 'Hard',
            default   => 'Extreme',
        });
    }

    public function permitLabel(): string
    {
        return __(match ($this->permit_type) {
            'ticket'   => 'Entry ticket',
            'simaksi'  => 'SIMAKSI',
            'esimaksi' => 'e-SIMAKSI (online)',
            default    => 'None',
        });
    }

    public function requiresPermit(): bool
    {
        return in_array($this->permit_type, ['simaksi', 'esimaksi'], true);
    }
}
