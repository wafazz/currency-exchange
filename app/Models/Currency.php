<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Currency extends Model
{
    protected $fillable = [
        'code',
        'name',
        'symbol',
        'flag_icon',
        'decimal_places',
        'unit',
        'display_order',
        'is_base',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'decimal_places' => 'integer',
            'unit' => 'integer',
            'display_order' => 'integer',
            'is_base' => 'boolean',
            'active' => 'boolean',
        ];
    }

    public function rates(): HasMany
    {
        return $this->hasMany(Rate::class);
    }

    public function margin(): HasOne
    {
        return $this->hasOne(RateMargin::class);
    }
}
