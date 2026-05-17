<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CategoryBootstrapService;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function config()
    {
        $clientId = config('services.google.client_id');

        return response()->json([
            'google_enabled' => filled($clientId),
            'redirect_uri' => config('services.google.redirect'),
        ]);
    }

    public function redirect()
    {
        if (! filled(config('services.google.client_id')) || ! filled(config('services.google.client_secret'))) {
            $frontend = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

            return redirect("{$frontend}/?auth_error=google_not_configured");
        }

        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    public function callback(CategoryBootstrapService $bootstrap)
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $user = User::query()
            ->where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            $user->update([
                'google_id' => $googleUser->getId(),
                'name' => $user->name ?: $googleUser->getName(),
                'avatar' => $googleUser->getAvatar() ?? $user->avatar,
            ]);
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?? 'User',
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
            ]);
        }

        $bootstrap->bootstrapForUser($user);

        // Session on :8000 is not visible to the SPA on :3000 — pass a Sanctum token instead.
        $token = $user->createToken('google-login')->plainTextToken;

        $frontend = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

        return redirect("{$frontend}/?auth=success&token=".urlencode($token));
    }
}
