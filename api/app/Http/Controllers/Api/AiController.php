<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function extractVoice(Request $request, GeminiService $gemini): JsonResponse
    {
        $request->validate([
            'audio' => ['required', 'file', 'max:10240'],
            'language' => ['nullable', 'in:en,zh'],
        ]);

        $file = $request->file('audio');
        $base64 = base64_encode(file_get_contents($file->getRealPath()));
        $mimeType = $file->getMimeType() ?: 'audio/webm';
        $language = $request->input('language', 'en');

        $data = $gemini->extractFromVoice($base64, $mimeType, $language);

        if (! $data) {
            return response()->json(['message' => 'Could not extract workout from audio'], 422);
        }

        return response()->json($data);
    }

    public function extractImage(Request $request, GeminiService $gemini): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'max:10240'],
            'language' => ['nullable', 'in:en,zh'],
        ]);

        $file = $request->file('image');
        $base64 = base64_encode(file_get_contents($file->getRealPath()));
        $mimeType = $file->getMimeType() ?: 'image/jpeg';
        $language = $request->input('language', 'en');

        $data = $gemini->extractFromImage($base64, $mimeType, $language);

        if (! $data) {
            return response()->json(['message' => 'Could not extract workout from image'], 422);
        }

        return response()->json($data);
    }

    public function extractText(Request $request, GeminiService $gemini): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:1000'],
            'language' => ['nullable', 'in:en,zh'],
        ]);

        $data = $gemini->extractFromText(
            $validated['text'],
            $validated['language'] ?? 'en'
        );

        if (! $data) {
            return response()->json(['message' => 'Could not extract workout from text'], 422);
        }

        return response()->json($data);
    }
}
