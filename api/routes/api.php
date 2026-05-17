<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExerciseDefinitionController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\WorkoutController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/auth/google/config', [GoogleAuthController::class, 'config']);
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::apiResource('workouts', WorkoutController::class)->except(['show']);

    Route::apiResource('categories', CategoryController::class)->except(['show']);

    Route::get('exercise-definitions', [ExerciseDefinitionController::class, 'index']);
    Route::post('exercise-definitions', [ExerciseDefinitionController::class, 'store']);
    Route::patch('exercise-definitions/rename', [ExerciseDefinitionController::class, 'rename']);
    Route::patch('exercise-definitions/{exercise_definition}', [ExerciseDefinitionController::class, 'update']);

    Route::post('ai/extract-voice', [AiController::class, 'extractVoice']);
    Route::post('ai/extract-image', [AiController::class, 'extractImage']);
    Route::post('ai/extract-text', [AiController::class, 'extractText']);
});
