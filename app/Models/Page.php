<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'icon',
        'content',
        'map_embed',
        'meta_description',
        'published',
    ];

    protected function casts(): array
    {
        return [
            'published' => 'boolean',
        ];
    }
}
