<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class WebRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'min:2', 'max:255'],
            'email'       => ['required', 'string', 'email:rfc', 'max:255', 'unique:users'],
            'password'    => ['required', 'string', Password::min(8)->letters()->mixedCase()->numbers(), 'confirmed'],
            'nationality' => ['required', 'string', 'size:2', 'alpha'],
            'id_type'     => ['required', Rule::in(['ktp', 'passport'])],
            'phone'       => ['nullable', 'string', 'max:32'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['nationality' => strtoupper((string) $this->nationality)]);
    }
}
