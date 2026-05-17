<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkoutRequest;
use App\Http\Requests\UpdateWorkoutRequest;
use App\Http\Resources\WorkoutResource;
use App\Models\Workout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkoutController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $workouts = Workout::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('recorded_at')
            ->get();

        return WorkoutResource::collection($workouts);
    }

    public function store(StoreWorkoutRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $workout = Workout::create([
            'user_id' => $request->user()->id,
            'exercise' => $validated['exercise'],
            'sets' => $validated['sets'] ?? null,
            'reps' => $validated['reps'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'input_type' => $validated['input_type'],
            'recorded_at' => $validated['recorded_at'] ?? now(),
        ]);

        return (new WorkoutResource($workout))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateWorkoutRequest $request, Workout $workout): WorkoutResource
    {
        $this->authorize('update', $workout);

        $workout->update($request->validated());

        return new WorkoutResource($workout->fresh());
    }

    public function destroy(Request $request, Workout $workout): JsonResponse
    {
        $this->authorize('delete', $workout);
        $workout->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
