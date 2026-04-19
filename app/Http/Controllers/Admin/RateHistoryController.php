<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\RateHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RateHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = RateHistory::with(['currency:id,code,name,flag_icon', 'changedBy:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('currency_id')) {
            $query->where('currency_id', $request->integer('currency_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }

        $history = $query->paginate(25)->withQueryString();

        return Inertia::render('Admin/RateHistory/Index', [
            'history' => $history,
            'currencies' => Currency::where('is_base', false)
                ->orderBy('display_order')
                ->get(['id', 'code', 'name']),
            'filters' => $request->only(['currency_id', 'from', 'to']),
        ]);
    }
}
