<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DbPinMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $verifiedAt = $request->session()->get('db_pin_verified_at');

        if (! $verifiedAt || (time() - (int) $verifiedAt) > 1800) {
            $request->session()->forget('db_pin_verified_at');
            return redirect()->route('admin.database.unlock');
        }

        $request->session()->put('db_pin_verified_at', time());

        return $next($request);
    }
}
