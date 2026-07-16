<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TranscriptionJob extends Model
{
    protected $fillable = [
        'user_id',
        'original_filename',
        'title',
        'output_format',
        'status',
        'pages_processed',
        'notes_detected',
        'output_file',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processingSeconds(): ?int
    {
        if ($this->started_at && $this->completed_at) {
            return (int) $this->started_at->diffInSeconds($this->completed_at);
        }

        return null;
    }
}
