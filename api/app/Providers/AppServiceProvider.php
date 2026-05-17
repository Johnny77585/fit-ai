<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\ExerciseDefinition;
use App\Models\Workout;
use App\Policies\CategoryPolicy;
use App\Policies\ExerciseDefinitionPolicy;
use App\Policies\WorkoutPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Workout::class, WorkoutPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(ExerciseDefinition::class, ExerciseDefinitionPolicy::class);
    }
}
