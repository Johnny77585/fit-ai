<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiService
{
    private string $apiKey;

    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', '');
        $this->model = config('services.gemini.model', 'gemini-2.0-flash');
    }

    /**
     * @return array{exercise: string, sets?: int|null, reps?: int|null, weight?: float|null}|null
     */
    public function extractFromVoice(string $base64, string $mimeType, string $language = 'en'): ?array
    {
        $langPrompt = $language === 'zh'
            ? '你是一個健身教練。請務必使用『繁體中文』返回動作名稱（例如：『臥推』而不是『Bench Press』）。'
            : "You are a fitness coach. Please return the exercise name in English (e.g., 'Bench Press').";

        return $this->generate([
            ['inline_data' => ['mime_type' => $mimeType, 'data' => $base64]],
            ['text' => "Extract the workout details (exercise, reps, sets, weight) from this audio recording. {$langPrompt} Return as JSON."],
        ]);
    }

    /**
     * @return array{exercise: string, sets?: int|null, reps?: int|null, weight?: float|null}|null
     */
    public function extractFromImage(string $base64, string $mimeType, string $language = 'en'): ?array
    {
        $langPrompt = $language === 'zh'
            ? '你是一個健身教練。請務必使用『繁體中文』返回動作名稱（例如：『臥推』而不是『Bench Press』）。'
            : "You are a fitness coach. Please return the exercise name in English (e.g., 'Bench Press').";

        return $this->generate([
            ['inline_data' => ['mime_type' => $mimeType, 'data' => $base64]],
            ['text' => "Identify the exercise and any visible workout details (reps, sets, weight) from this photo. {$langPrompt} Return as JSON."],
        ]);
    }

    /**
     * @return array{exercise: string, sets?: int|null, reps?: int|null, weight?: float|null}|null
     */
    public function extractFromText(string $text, string $language = 'en'): ?array
    {
        $langPrompt = $language === 'zh'
            ? '你是一個健身教練。請務必使用『繁體中文』返回動作名稱（例如：『臥推』而不是『Bench Press』）。'
            : "You are a fitness coach. Please return the exercise name in English (e.g., 'Bench Press').";

        return $this->generate([
            ['text' => "Extract workout details from this text: \"{$text}\". {$langPrompt} Return as JSON."],
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $parts
     * @return array{exercise: string, sets?: int|null, reps?: int|null, weight?: float|null}|null
     */
    private function generate(array $parts): ?array
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('GEMINI_API_KEY is not configured.');
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'exercise' => ['type' => 'STRING', 'description' => 'The name of the exercise or equipment used.'],
                'reps' => ['type' => 'INTEGER', 'description' => 'Number of repetitions.'],
                'sets' => ['type' => 'INTEGER', 'description' => 'Number of sets.'],
                'weight' => ['type' => 'NUMBER', 'description' => 'Weight used in kg or lbs.'],
            ],
            'required' => ['exercise'],
        ];

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(60)->post($url, [
            'contents' => [
                ['parts' => $parts],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseSchema' => $schema,
            ],
        ]);

        if (! $response->successful()) {
            return null;
        }

        $text = $response->json('candidates.0.content.parts.0.text');
        if (! is_string($text) || $text === '') {
            return null;
        }

        $data = json_decode($text, true);
        if (! is_array($data) || empty($data['exercise'])) {
            return null;
        }

        return [
            'exercise' => (string) $data['exercise'],
            'sets' => isset($data['sets']) ? (int) $data['sets'] : null,
            'reps' => isset($data['reps']) ? (int) $data['reps'] : null,
            'weight' => isset($data['weight']) ? (float) $data['weight'] : null,
        ];
    }
}
