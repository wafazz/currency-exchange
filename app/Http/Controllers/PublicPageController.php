<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Inertia\Inertia;
use Inertia\Response;

class PublicPageController extends Controller
{
    public function __invoke(string $slug): Response
    {
        $page = Page::where('slug', $slug)->where('published', true)->firstOrFail();

        return Inertia::render('Public/Page', [
            'page' => [
                'slug' => $page->slug,
                'title' => $page->title,
                'icon' => $page->icon,
                'content' => $page->content,
                'map_embed' => $page->map_embed,
                'meta_description' => $page->meta_description,
                'updated_at' => $page->updated_at?->diffForHumans(),
            ],
        ]);
    }
}
