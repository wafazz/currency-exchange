<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VisitorController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $cookieName = 'mex_vid';
        $visitorId = $request->cookie($cookieName);

        if (! $visitorId) {
            $visitorId = (string) Str::uuid();
        }

        $visit = Visit::where('visitor_id', $visitorId)->first();

        if ($visit) {
            $visit->update([
                'last_seen_at' => now(),
                'page_views' => $visit->page_views + 1,
            ]);
        } else {
            Visit::create([
                'visitor_id' => $visitorId,
                'ip' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
                'page_views' => 1,
                'first_seen_at' => now(),
                'last_seen_at' => now(),
            ]);
        }

        $live = Visit::where('last_seen_at', '>=', now()->subMinutes(2))->count();
        $today = Visit::whereDate('last_seen_at', today())->count();
        $total = Visit::count();
        $firstEver = Visit::min('first_seen_at');

        return response()->json([
            'live' => $live,
            'today' => $today,
            'total' => $total,
            'since' => $firstEver ? date('j M Y', strtotime($firstEver)) : date('j M Y'),
        ])->cookie($cookieName, $visitorId, 60 * 24 * 365, '/', null, false, true);
    }
}
