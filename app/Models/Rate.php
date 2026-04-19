<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rate extends Model
{
    protected $fillable = [
        'branch_id',
        'currency_id',
        'buy_rate',
        'sell_rate',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'buy_rate' => 'decimal:4',
            'sell_rate' => 'decimal:4',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
