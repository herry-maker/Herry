<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['trail_id', 'user_id', 'rating', 'condition', 'water_available', 'body', 'photo_paths', 'visited_at'])]
class TrailReview extends Model
{
    public const CONDITIONS = ['baik', 'sedang', 'buruk'];

    protected function casts(): array
    {
        return [
            'photo_paths'     => 'array',
            'water_available' => 'boolean',
            'visited_at'      => 'date',
        ];
    }

    public function trail(): BelongsTo
    {
        return $this->belongsTo(Trail::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conditionLabel(): string
    {
        return __(match ($this->condition) {
            'baik'   => 'Good',
            'sedang' => 'Fair',
            default  => 'Poor',
        });
    }
}
