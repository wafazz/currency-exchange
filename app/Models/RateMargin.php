<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RateMargin extends Model
{
    protected $fillable = [
        'currency_id',
        'max_margin_percent',
    ];

    protected function casts(): array
    {
        return [
            'max_margin_percent' => 'decimal:2',
        ];
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }
}
