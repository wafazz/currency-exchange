<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $currencies = [
            ['code' => 'MYR', 'name' => 'Malaysian Ringgit', 'symbol' => 'RM', 'flag_icon' => 'my', 'is_base' => true, 'display_order' => 0],
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'flag_icon' => 'us', 'display_order' => 1],
            ['code' => 'SGD', 'name' => 'Singapore Dollar', 'symbol' => 'S$', 'flag_icon' => 'sg', 'display_order' => 2],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'flag_icon' => 'eu', 'display_order' => 3],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£', 'flag_icon' => 'gb', 'display_order' => 4],
            ['code' => 'AUD', 'name' => 'Australian Dollar', 'symbol' => 'A$', 'flag_icon' => 'au', 'display_order' => 5],
            ['code' => 'JPY', 'name' => 'Japanese Yen', 'symbol' => '¥', 'flag_icon' => 'jp', 'decimal_places' => 2, 'unit' => 100, 'display_order' => 6],
            ['code' => 'CNY', 'name' => 'Chinese Yuan', 'symbol' => '¥', 'flag_icon' => 'cn', 'display_order' => 7],
            ['code' => 'HKD', 'name' => 'Hong Kong Dollar', 'symbol' => 'HK$', 'flag_icon' => 'hk', 'display_order' => 8],
            ['code' => 'THB', 'name' => 'Thai Baht', 'symbol' => '฿', 'flag_icon' => 'th', 'display_order' => 9],
            ['code' => 'IDR', 'name' => 'Indonesian Rupiah', 'symbol' => 'Rp', 'flag_icon' => 'id', 'unit' => 100, 'display_order' => 10],
            ['code' => 'SAR', 'name' => 'Saudi Riyal', 'symbol' => '﷼', 'flag_icon' => 'sa', 'display_order' => 11],
        ];

        foreach ($currencies as $c) {
            Currency::updateOrCreate(['code' => $c['code']], $c);
        }
    }
}
