<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ExerciseDefinition */
class ExerciseDefinitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'uid' => (string) $this->user_id,
            'name' => $this->name,
            'categoryId' => $this->category_id ? (string) $this->category_id : null,
        ];
    }
}
