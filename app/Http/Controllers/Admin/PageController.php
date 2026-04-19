<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    private const RESERVED_SLUGS = [
        'admin', 'api', 'login', 'logout', 'register', 'dashboard',
        'display', 'branch', 'pos', 'storage', 'up', 'p', 'vendor',
        'build', 'favicon', 'robots',
    ];

    public function index(): Response
    {
        return Inertia::render('Admin/Pages/Index', [
            'pages' => Page::orderBy('title')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Pages/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);
        $page = Page::create($data);

        return redirect()->route('admin.pages.edit', $page)
            ->with('success', "{$page->title} created.");
    }

    public function edit(Page $page): Response
    {
        return Inertia::render('Admin/Pages/Edit', [
            'page' => $page,
        ]);
    }

    public function update(Request $request, Page $page): RedirectResponse
    {
        $data = $this->validateData($request, $page);
        $page->update($data);

        return back()->with('success', "{$page->title} updated.");
    }

    public function destroy(Page $page): RedirectResponse
    {
        if (in_array($page->slug, ['about', 'terms', 'contact'], true)) {
            return back()->with('error', 'Default pages (About, Terms, Contact) cannot be deleted.');
        }

        $title = $page->title;
        $page->delete();

        return redirect()->route('admin.pages.index')
            ->with('success', "{$title} deleted.");
    }

    private function validateData(Request $request, ?Page $page = null): array
    {
        $reserved = implode(',', self::RESERVED_SLUGS);
        $slugRule = ['required', 'string', 'max:60', 'regex:/^[a-z0-9-]+$/', "not_in:{$reserved}", 'unique:pages,slug'];
        if ($page) $slugRule[count($slugRule) - 1] .= ',' . $page->id;

        return $request->validate([
            'slug' => $slugRule,
            'title' => ['required', 'string', 'max:150'],
            'icon' => ['nullable', 'string', 'max:30'],
            'content' => ['nullable', 'string'],
            'map_embed' => ['nullable', 'string', 'max:4000'],
            'meta_description' => ['nullable', 'string', 'max:255'],
            'published' => ['boolean'],
        ]);
    }
}
