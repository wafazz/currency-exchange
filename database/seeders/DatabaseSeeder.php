<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CurrencySeeder::class,
            BranchSeeder::class,
            UserSeeder::class,
            RateSeeder::class,
            SettingSeeder::class,
            PageSeeder::class,
        ]);
    }
}
