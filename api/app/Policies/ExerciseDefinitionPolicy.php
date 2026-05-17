<?php

namespace App\Policies;

use App\Models\ExerciseDefinition;
use App\Models\User;

class ExerciseDefinitionPolicy
{
    public function view(User $user, ExerciseDefinition $exerciseDefinition): bool
    {
        return $user->id === $exerciseDefinition->user_id;
    }

    public function update(User $user, ExerciseDefinition $exerciseDefinition): bool
    {
        return $user->id === $exerciseDefinition->user_id;
    }

    public function delete(User $user, ExerciseDefinition $exerciseDefinition): bool
    {
        return $user->id === $exerciseDefinition->user_id;
    }
}
