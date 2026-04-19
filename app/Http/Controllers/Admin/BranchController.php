<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Branches/Index', [
            'branches' => Branch::orderByDesc('is_hq')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);
        if (! empty($data['is_hq'])) {
            Branch::where('is_hq', true)->update(['is_hq' => false]);
        }

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('branches', 'public');
        }

        $data['slug'] = $data['slug'] ?: Str::slug($data['name']);
        Branch::create($data);

        return back()->with('success', "Branch {$data['name']} created.");
    }

    public function update(Request $request, Branch $branch): RedirectResponse
    {
        $data = $this->validateData($request, $branch);
        if (! empty($data['is_hq'])) {
            Branch::where('is_hq', true)->where('id', '!=', $branch->id)->update(['is_hq' => false]);
        }

        if ($request->hasFile('logo')) {
            if ($branch->logo) Storage::disk('public')->delete($branch->logo);
            $data['logo'] = $request->file('logo')->store('branches', 'public');
        }

        $data['slug'] = $data['slug'] ?: Str::slug($data['name']);
        $branch->update($data);

        return back()->with('success', "Branch {$branch->name} updated.");
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        if ($branch->is_hq) {
            return back()->with('error', 'HQ branch cannot be deleted.');
        }
        if ($branch->users()->exists() || $branch->rates()->exists()) {
            return back()->with('error', 'Cannot delete branch with assigned users or rates.');
        }

        if ($branch->logo) Storage::disk('public')->delete($branch->logo);
        $name = $branch->name;
        $branch->delete();

        return back()->with('success', "Branch {$name} deleted.");
    }

    private function validateData(Request $request, ?Branch $branch = null): array
    {
        $slugRule = 'unique:branches,slug';
        if ($branch) $slugRule .= ',' . $branch->id;

        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9-]+$/', $slugRule],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'theme' => ['required', 'in:light,dark'],
            'is_hq' => ['boolean'],
            'active' => ['boolean'],
        ]);
    }
}
