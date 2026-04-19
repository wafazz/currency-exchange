<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => User::with('branch:id,name,slug')->orderBy('name')->get(),
            'branches' => Branch::where('active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:admin,manager,staff'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'active' => ['boolean'],
        ]);

        if ($data['role'] === 'admin') $data['branch_id'] = null;
        $data['password'] = Hash::make($data['password']);
        $data['email_verified_at'] = now();
        User::create($data);

        return back()->with('success', "User {$data['name']} created.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email,' . $user->id],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', 'in:admin,manager,staff'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'active' => ['boolean'],
        ]);

        if ($data['role'] === 'admin') $data['branch_id'] = null;

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return back()->with('success', "User {$user->name} updated.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "User {$name} deleted.");
    }
}
