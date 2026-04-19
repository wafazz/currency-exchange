<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        Branch::updateOrCreate(
            ['slug' => 'hq'],
            [
                'name' => 'Headquarters',
                'address' => 'Kuala Lumpur, Malaysia',
                'phone' => '+60 3-0000 0000',
                'theme' => 'light',
                'is_hq' => true,
                'active' => true,
            ]
        );
    }
}
