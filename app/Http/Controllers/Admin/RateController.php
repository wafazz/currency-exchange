<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\Rate;
use App\Models\RateHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RateController extends Controller
{
    public function index(): Response
    {
        $currencies = Currency::where('active', true)
            ->where('is_base', false)
            ->orderBy('display_order')
            ->get();

        $rates = Rate::whereNull('branch_id')
            ->get()
            ->keyBy('currency_id');

        $rows = $currencies->map(fn ($c) => [
            'currency_id' => $c->id,
            'code' => $c->code,
            'name' => $c->name,
            'flag_icon' => $c->flag_icon,
            'unit' => $c->unit,
            'decimal_places' => $c->decimal_places,
            'buy_rate' => $rates[$c->id]->buy_rate ?? null,
            'sell_rate' => $rates[$c->id]->sell_rate ?? null,
            'updated_at' => optional($rates[$c->id]->updated_at ?? null)->diffForHumans(),
        ]);

        return Inertia::render('Admin/Rates/Index', [
            'rates' => $rows,
            'defaultSpread' => (float) \App\Models\Setting::get('default_spread_percent', 1.5),
        ]);
    }

    public function update(Request $request, Currency $currency): RedirectResponse
    {
        $data = $request->validate([
            'buy_rate' => ['required', 'numeric', 'min:0'],
            'sell_rate' => ['required', 'numeric', 'min:0', 'gte:buy_rate'],
        ]);

        DB::transaction(function () use ($currency, $data, $request) {
            $existing = Rate::whereNull('branch_id')
                ->where('currency_id', $currency->id)
                ->first();

            RateHistory::create([
                'branch_id' => null,
                'currency_id' => $currency->id,
                'old_buy' => $existing?->buy_rate,
                'old_sell' => $existing?->sell_rate,
                'new_buy' => $data['buy_rate'],
                'new_sell' => $data['sell_rate'],
                'changed_by' => $request->user()->id,
                'source' => 'manual',
                'created_at' => now(),
            ]);

            Rate::updateOrCreate(
                ['branch_id' => null, 'currency_id' => $currency->id],
                ['buy_rate' => $data['buy_rate'], 'sell_rate' => $data['sell_rate'], 'updated_by' => $request->user()->id]
            );
        });

        Cache::forget('public.rates.hq');

        return back()->with('success', "{$currency->code} rate updated.");
    }

    public function bulkUpdate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'entries' => ['required', 'array', 'min:1'],
            'entries.*.currency_id' => ['required', 'exists:currencies,id'],
            'entries.*.mid' => ['required', 'numeric', 'min:0'],
            'spread_percent' => ['required', 'numeric', 'min:0', 'max:20'],
        ]);

        $spread = (float) $data['spread_percent'];
        $count = 0;

        DB::transaction(function () use ($data, $spread, $request, &$count) {
            foreach ($data['entries'] as $entry) {
                $mid = (float) $entry['mid'];
                $buy = round($mid * (1 - $spread / 200), 4);
                $sell = round($mid * (1 + $spread / 200), 4);

                $existing = Rate::whereNull('branch_id')
                    ->where('currency_id', $entry['currency_id'])
                    ->first();

                if ($existing && (float) $existing->buy_rate === $buy && (float) $existing->sell_rate === $sell) {
                    continue;
                }

                RateHistory::create([
                    'branch_id' => null,
                    'currency_id' => $entry['currency_id'],
                    'old_buy' => $existing?->buy_rate,
                    'old_sell' => $existing?->sell_rate,
                    'new_buy' => $buy,
                    'new_sell' => $sell,
                    'changed_by' => $request->user()->id,
                    'source' => 'bulk',
                    'note' => "mid={$mid}, spread={$spread}%",
                    'created_at' => now(),
                ]);

                Rate::updateOrCreate(
                    ['branch_id' => null, 'currency_id' => $entry['currency_id']],
                    ['buy_rate' => $buy, 'sell_rate' => $sell, 'updated_by' => $request->user()->id]
                );
                $count++;
            }
        });

        Cache::forget('public.rates.hq');

        return back()->with('success', "Bulk update: {$count} rate(s) updated at {$spread}% spread.");
    }
}
