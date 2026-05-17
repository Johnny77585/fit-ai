<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RenameExerciseRequest;
use App\Http\Requests\StoreExerciseDefinitionRequest;
use App\Http\Resources\ExerciseDefinitionResource;
use App\Models\ExerciseDefinition;
use App\Models\Workout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExerciseDefinitionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $items = ExerciseDefinition::query()
            ->where('user_id', $request->user()->id)
            ->with('category')
            ->orderBy('name')
            ->get();

        return ExerciseDefinitionResource::collection($items);
    }

    public function store(StoreExerciseDefinitionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $categoryId = $validated['category_id'] ?? null;

        if ($categoryId) {
            $ownsCategory = $request->user()->categories()->where('id', $categoryId)->exists();
            if (! $ownsCategory) {
                return response()->json(['message' => 'Invalid category'], 422);
            }
        }

        $existing = ExerciseDefinition::query()
            ->where('user_id', $request->user()->id)
            ->whereRaw('LOWER(name) = ?', [strtolower($validated['name'])])
            ->first();

        if ($existing) {
            $existing->update(['category_id' => $categoryId]);

            return response()->json(new ExerciseDefinitionResource($existing->fresh()));
        }

        $item = ExerciseDefinition::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'category_id' => $categoryId,
        ]);

        return (new ExerciseDefinitionResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(StoreExerciseDefinitionRequest $request, ExerciseDefinition $exerciseDefinition): ExerciseDefinitionResource
    {
        $this->authorize('update', $exerciseDefinition);

        $validated = $request->validated();
        $categoryId = $validated['category_id'] ?? $exerciseDefinition->category_id;

        if ($categoryId) {
            $ownsCategory = $request->user()->categories()->where('id', $categoryId)->exists();
            if (! $ownsCategory) {
                abort(422, 'Invalid category');
            }
        }

        $exerciseDefinition->update([
            'name' => $validated['name'] ?? $exerciseDefinition->name,
            'category_id' => $categoryId,
        ]);

        return new ExerciseDefinitionResource($exerciseDefinition->fresh());
    }

    public function rename(RenameExerciseRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $userId = $request->user()->id;

        Workout::query()
            ->where('user_id', $userId)
            ->whereRaw('LOWER(exercise) = ?', [strtolower($validated['old_name'])])
            ->update(['exercise' => $validated['new_name']]);

        ExerciseDefinition::query()
            ->where('user_id', $userId)
            ->whereRaw('LOWER(name) = ?', [strtolower($validated['old_name'])])
            ->update(['name' => $validated['new_name']]);

        return response()->json([
            'old_name' => $validated['old_name'],
            'new_name' => $validated['new_name'],
        ]);
    }
}
