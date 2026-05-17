<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RenameExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'old_name' => ['required', 'string', 'min:1', 'max:100'],
            'new_name' => ['required', 'string', 'min:1', 'max:100'],
        ];
    }
}
