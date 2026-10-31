<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['slug', 'name_en', 'name_id', 'description_en', 'description_id', 'icon', 'criteria'])]
class Badge extends Model
{
    protected function casts(): array
    {
        return [
            'criteria' => 'array',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_badges')->withPivot('earned_at');
    }

    public function name(): string
    {
        return app()->getLocale() === 'id' ? $this->name_id : $this->name_en;
    }

    public function description(): string
    {
        return app()->getLocale() === 'id' ? $this->description_id : $this->description_en;
    }

    public function qualifies(User $user): bool
    {
        foreach ($this->criteria as $key => $threshold) {
            $value = match ($key) {
                'summits'       => $user->summit_count,
                'elevation_m'   => $user->total_elevation_m,
                'trips'         => $user->trips()->wherePivot('status', 'confirmed')->count(),
                'reviews'       => $user->reviews()->count(),
                'posts'         => $user->posts()->count(),
                'max_elevation' => (int) $user->summits()->join('trails', 'trails.id', '=', 'check_ins.trail_id')->max('trails.elevation_m'),
                default         => 0,
            };

            if ($value < $threshold) {
                return false;
            }
        }

        return true;
    }
}
