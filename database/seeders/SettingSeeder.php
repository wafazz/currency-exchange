<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['key' => 'site_name', 'value' => 'Money Exchange', 'type' => 'string', 'group' => 'general'],
            ['key' => 'hq_logo', 'value' => '', 'type' => 'string', 'group' => 'branding'],
            ['key' => 'default_theme', 'value' => 'light', 'type' => 'string', 'group' => 'display'],
            ['key' => 'default_refresh_seconds', 'value' => '10', 'type' => 'integer', 'group' => 'display'],
            ['key' => 'default_display_mode', 'value' => 'grid', 'type' => 'string', 'group' => 'display'],
            ['key' => 'default_spread_percent', 'value' => '1.5', 'type' => 'decimal', 'group' => 'rates'],
        ];

        foreach ($defaults as $s) {
            Setting::updateOrCreate(['key' => $s['key']], $s);
        }

        Setting::firstOrCreate(
            ['key' => 'db_pin'],
            ['value' => Hash::make('123456'), 'type' => 'string', 'group' => 'security']
        );
    }
}
