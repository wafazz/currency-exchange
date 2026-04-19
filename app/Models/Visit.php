<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visit extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'visitor_id',
        'ip',
        'user_agent',
        'page_views',
        'first_seen_at',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'page_views' => 'integer',
        ];
    }
}
