<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\Rate;
use Illuminate\Database\Seeder;

class RateSeeder extends Seeder
{
    public function run(): void
    {
        $mids = [
            'USD' => 4.4500,
            'SGD' => 3.3200,
            'EUR' => 4.8200,
            'GBP' => 5.6500,
            'AUD' => 2.9100,
            'JPY' => 2.9500,
            'CNY' => 0.6150,
            'HKD' => 0.5720,
            'THB' => 0.1310,
            'IDR' => 0.0273,
            'SAR' => 1.1870,
        ];

        $spreadPct = 1.5;

        foreach ($mids as $code => $mid) {
            $currency = Currency::where('code', $code)->first();
            if (! $currency) continue;

            $buy = round($mid * (1 - $spreadPct / 200), 4);
            $sell = round($mid * (1 + $spreadPct / 200), 4);

            Rate::updateOrCreate(
                ['branch_id' => null, 'currency_id' => $currency->id],
                ['buy_rate' => $buy, 'sell_rate' => $sell, 'updated_by' => null]
            );
        }
    }
}
