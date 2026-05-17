<?php

namespace App\Services;

use App\Models\Category;
use App\Models\User;

class CategoryBootstrapService
{
    /** @var list<string> */
    public const DEFAULT_CATEGORIES = ['手', '腳', '胸', '背', '腿', '核心'];

    public function bootstrapForUser(User $user): void
    {
        if ($user->categories()->exists()) {
            return;
        }

        foreach (self::DEFAULT_CATEGORIES as $name) {
            Category::create([
                'user_id' => $user->id,
                'name' => $name,
            ]);
        }
    }
}
