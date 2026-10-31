<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'trail_id', 'trip_id', 'type', 'body', 'photo_paths'])]
class Post extends Model
{
    public const TYPES = ['story', 'condition_alert'];

    protected function casts(): array
    {
        return [
            'photo_paths' => 'array',
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

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->oldest();
    }

    public function likers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_likes');
    }

    public function isLikedBy(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($this->relationLoaded('likers')) {
            return $this->likers->contains('id', $user->id);
        }

        return $this->likers()->whereKey($user->id)->exists();
    }
}
