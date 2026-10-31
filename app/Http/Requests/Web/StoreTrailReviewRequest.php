<?php

namespace App\Http\Requests\Web;

use App\Models\TrailReview;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTrailReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'rating'          => ['required', 'integer', 'between:1,5'],
            'condition'       => ['required', Rule::in(TrailReview::CONDITIONS)],
            'water_available' => ['nullable', 'boolean'],
            'body'            => ['required', 'string', 'min:10', 'max:2000'],
            'visited_at'      => ['required', 'date', 'before_or_equal:today'],
            'photos'          => ['nullable', 'array', 'max:4'],
            'photos.*'        => ['image', 'max:4096'],
        ];
    }
}
