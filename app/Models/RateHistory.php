<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RateHistory extends Model
{
    protected $table = 'rate_history';

    public $timestamps = false;

    protected $fillable = [
        'branch_id',
        'currency_id',
        'old_buy',
        'old_sell',
        'new_buy',
        'new_sell',
        'changed_by',
        'source',
        'note',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_buy' => 'decimal:4',
            'old_sell' => 'decimal:4',
            'new_buy' => 'decimal:4',
            'new_sell' => 'decimal:4',
            'created_at' => 'datetime',
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

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
