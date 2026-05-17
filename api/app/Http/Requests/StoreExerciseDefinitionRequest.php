<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExerciseDefinitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:1', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'categoryId' => ['nullable', 'integer', 'exists:categories,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('categoryId') && ! $this->has('category_id')) {
            $val = $this->input('categoryId');
            if ($val === 'uncategorized' || $val === '' || $val === null) {
                $this->merge(['category_id' => null]);
            } else {
                $this->merge(['category_id' => $val]);
            }
        }
    }
}
