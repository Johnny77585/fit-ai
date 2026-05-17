<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exercise' => ['required', 'string', 'min:1', 'max:100'],
            'sets' => ['nullable', 'integer', 'min:0', 'max:999'],
            'reps' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:9999'],
            'input_type' => ['required', Rule::in(['voice', 'photo', 'manual', 'text'])],
            'inputType' => ['sometimes', Rule::in(['voice', 'photo', 'manual', 'text'])],
            'recorded_at' => ['nullable', 'date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('inputType') && ! $this->has('input_type')) {
            $this->merge(['input_type' => $this->input('inputType')]);
        }
    }
}
