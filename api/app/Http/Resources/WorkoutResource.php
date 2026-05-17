<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Workout */
class WorkoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'uid' => (string) $this->user_id,
            'exercise' => $this->exercise,
            'sets' => $this->sets,
            'reps' => $this->reps,
            'weight' => $this->weight,
            'inputType' => $this->input_type,
            'timestamp' => $this->recorded_at?->toIso8601String(),
            'recorded_at' => $this->recorded_at?->toIso8601String(),
        ];
    }
}
