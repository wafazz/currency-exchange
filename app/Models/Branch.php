<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'address',
        'phone',
        'logo',
        'theme',
        'is_hq',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'is_hq' => 'boolean',
            'active' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function rates(): HasMany
    {
        return $this->hasMany(Rate::class);
    }
}
