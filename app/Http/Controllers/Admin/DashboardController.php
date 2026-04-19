<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Currency;
use App\Models\Rate;
use App\Models\RateHistory;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $lastRate = Rate::whereNull('branch_id')->orderByDesc('updated_at')->first();

        $topActivity = RateHistory::with(['currency:id,code,flag_icon', 'changedBy:id,name'])
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();

        $snapshot = Rate::whereNull('branch_id')
            ->with('currency:id,code,name,flag_icon,unit,display_order')
            ->get()
            ->sortBy(fn ($r) => $r->currency->display_order)
            ->take(6)
            ->values();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'currencies' => Currency::where('active', true)->count(),
                'branches' => Branch::where('active', true)->count(),
                'users' => User::where('active', true)->count(),
                'rate_changes_today' => RateHistory::whereDate('created_at', today())->count(),
            ],
            'lastRateUpdate' => $lastRate ? [
                'at' => $lastRate->updated_at?->toIso8601String(),
                'diff' => $lastRate->updated_at?->diffForHumans(),
            ] : null,
            'activity' => $topActivity->map(fn ($h) => [
                'id' => $h->id,
                'code' => $h->currency->code,
                'flag' => $h->currency->flag_icon,
                'old_buy' => $h->old_buy,
                'new_buy' => $h->new_buy,
                'old_sell' => $h->old_sell,
                'new_sell' => $h->new_sell,
                'by' => $h->changedBy?->name,
                'source' => $h->source,
                'at' => $h->created_at?->diffForHumans(),
            ]),
            'snapshot' => $snapshot->map(fn ($r) => [
                'code' => $r->currency->code,
                'name' => $r->currency->name,
                'flag' => $r->currency->flag_icon,
                'unit' => $r->currency->unit,
                'buy' => (float) $r->buy_rate,
                'sell' => (float) $r->sell_rate,
            ]),
        ]);
    }
}
