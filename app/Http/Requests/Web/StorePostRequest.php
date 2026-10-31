<?php

namespace App\Http\Requests\Web;

use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'body'     => ['required', 'string', 'min:3', 'max:3000'],
            'type'     => ['required', Rule::in(Post::TYPES)],
            'trail_id' => ['nullable', 'exists:trails,id'],
            'trip_id'  => ['nullable', 'exists:trips,id'],
            'photos'   => ['nullable', 'array', 'max:4'],
            'photos.*' => ['image', 'max:4096'],
        ];
    }
}
