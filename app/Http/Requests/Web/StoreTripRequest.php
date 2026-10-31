<?php

namespace App\Http\Requests\Web;

use App\Models\Trip;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'trail_id'          => ['required', 'exists:trails,id'],
            'title'             => ['required', 'string', 'min:5', 'max:120'],
            'description'       => ['required', 'string', 'min:20', 'max:4000'],
            'type'              => ['required', Rule::in(Trip::TYPES)],
            'departure_at'      => ['required', 'date', 'after:now'],
            'return_at'         => ['required', 'date', 'after:departure_at'],
            'meeting_point'     => ['required', 'string', 'max:255'],
            'max_participants'  => ['required', 'integer', 'between:2,100'],
            'price_idr'         => ['required', 'integer', 'min:0', 'max:50000000'],
            'includes'          => ['nullable', 'string', 'max:1000'],
            'whatsapp_link'     => ['nullable', 'url', 'starts_with:https://chat.whatsapp.com/'],
            'qris_image'        => ['nullable', 'image', 'max:2048'],
            'beginner_friendly' => ['nullable', 'boolean'],
            'porter_ids'        => ['nullable', 'array', 'max:10'],
            'porter_ids.*'      => ['integer', 'exists:porters,id'],
        ];
    }
}
