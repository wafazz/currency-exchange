<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $settings = Setting::all()->keyBy('key');

        return Inertia::render('Admin/Settings/Index', [
            'settings' => [
                'site_name' => $settings['site_name']->value ?? 'Money Exchange',
                'hq_logo' => $settings['hq_logo']->value ?? '',
                'default_theme' => $settings['default_theme']->value ?? 'light',
                'default_refresh_seconds' => (int) ($settings['default_refresh_seconds']->value ?? 10),
                'default_display_mode' => $settings['default_display_mode']->value ?? 'grid',
                'default_spread_percent' => (float) ($settings['default_spread_percent']->value ?? 1.5),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'site_name' => ['required', 'string', 'max:100'],
            'default_theme' => ['required', 'in:light,dark'],
            'default_refresh_seconds' => ['required', 'integer', 'min:1', 'max:300'],
            'default_display_mode' => ['required', 'in:grid,ticker'],
            'default_spread_percent' => ['required', 'numeric', 'min:0', 'max:20'],
            'hq_logo_file' => ['nullable', 'image', 'max:2048'],
        ]);

        Setting::set('site_name', $data['site_name']);
        Setting::set('default_theme', $data['default_theme']);
        Setting::set('default_refresh_seconds', $data['default_refresh_seconds'], 'integer');
        Setting::set('default_display_mode', $data['default_display_mode']);
        Setting::set('default_spread_percent', $data['default_spread_percent'], 'decimal', 'rates');

        if ($request->hasFile('hq_logo_file')) {
            $existing = Setting::where('key', 'hq_logo')->value('value');
            if ($existing) Storage::disk('public')->delete($existing);
            $path = $request->file('hq_logo_file')->store('branding', 'public');
            Setting::set('hq_logo', $path, 'string', 'branding');
        }

        Cache::flush();

        return back()->with('success', 'Settings saved.');
    }
}
