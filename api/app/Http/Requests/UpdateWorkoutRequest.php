<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exercise' => ['sometimes', 'string', 'min:1', 'max:100'],
            'sets' => ['nullable', 'integer', 'min:0', 'max:999'],
            'reps' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:9999'],
        ];
    }
}
