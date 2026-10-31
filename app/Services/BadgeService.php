<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\User;
use Illuminate\Support\Collection;

class BadgeService
{
    /** @return Collection<int, Badge> newly awarded badges */
    public function evaluate(User $user): Collection
    {
        $owned = $user->badges()->pluck('badges.id');

        $earned = Badge::whereNotIn('id', $owned)
            ->get()
            ->filter(fn (Badge $badge) => $badge->qualifies($user));

        if ($earned->isNotEmpty()) {
            $user->badges()->attach($earned->pluck('id')->all(), ['earned_at' => now()]);
        }

        return $earned->values();
    }
}
