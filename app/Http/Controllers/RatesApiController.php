<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Currency;
use App\Models\Rate;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class RatesApiController extends Controller
{
    public function __invoke(?string $branch = null): JsonResponse
    {
        $cacheKey = 'public.rates.' . ($branch ?? 'hq');

        $payload = Cache::remember($cacheKey, 1, function () use ($branch) {
            $branchModel = $branch ? Branch::where('slug', $branch)->where('active', true)->first() : null;
            $branchId = $branchModel?->id;

            $currencies = Currency::where('active', true)
                ->where('is_base', false)
                ->orderBy('display_order')
                ->get(['id', 'code', 'name', 'symbol', 'flag_icon', 'unit', 'decimal_places']);

            $rates = Rate::whereNull('branch_id')->get()->keyBy('currency_id');
            if ($branchId) {
                $override = Rate::where('branch_id', $branchId)->get()->keyBy('currency_id');
                foreach ($override as $cid => $r) {
                    $rates[$cid] = $r;
                }
            }

            $items = $currencies->map(function ($c) use ($rates) {
                $r = $rates[$c->id] ?? null;
                if (! $r) return null;
                return [
                    'code' => $c->code,
                    'name' => $c->name,
                    'symbol' => $c->symbol,
                    'flag' => $c->flag_icon,
                    'unit' => $c->unit,
                    'decimals' => $c->decimal_places,
                    'buy' => (float) $r->buy_rate,
                    'sell' => (float) $r->sell_rate,
                ];
            })->filter()->values();

            return [
                'branch' => $branchModel ? [
                    'name' => $branchModel->name,
                    'slug' => $branchModel->slug,
                    'logo' => $branchModel->logo,
                    'theme' => $branchModel->theme,
                ] : [
                    'name' => 'Headquarters',
                    'slug' => 'hq',
                    'logo' => null,
                    'theme' => 'light',
                ],
                'rates' => $items,
                'updated_at' => now()->toIso8601String(),
            ];
        });

        return response()->json($payload);
    }
}
