<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $hq = Branch::where('slug', 'hq')->first();

        User::updateOrCreate(
            ['email' => 'admin@moneyexchange.test'],
            [
                'name' => 'HQ Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'branch_id' => null,
                'active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'manager@moneyexchange.test'],
            [
                'name' => 'HQ Manager',
                'password' => Hash::make('password'),
                'role' => 'manager',
                'branch_id' => $hq?->id,
                'active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@moneyexchange.test'],
            [
                'name' => 'Counter Staff',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'branch_id' => $hq?->id,
                'active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
