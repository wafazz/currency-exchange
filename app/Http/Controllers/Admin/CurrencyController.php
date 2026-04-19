<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class CurrencyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Currencies/Index', [
            'currencies' => Currency::orderBy('display_order')->orderBy('code')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:3', 'unique:currencies,code'],
            'name' => ['required', 'string', 'max:100'],
            'symbol' => ['nullable', 'string', 'max:10'],
            'flag_icon' => ['nullable', 'string', 'max:10'],
            'decimal_places' => ['required', 'integer', 'min:0', 'max:4'],
            'unit' => ['required', 'integer', 'min:1'],
            'display_order' => ['required', 'integer', 'min:0'],
            'active' => ['boolean'],
        ]);

        $data['code'] = strtoupper($data['code']);
        Currency::create($data);
        Cache::forget('public.rates.hq');

        return back()->with('success', "Currency {$data['code']} created.");
    }

    public function update(Request $request, Currency $currency): RedirectResponse
    {
        if ($currency->is_base) {
            return back()->with('error', 'Base currency cannot be edited.');
        }

        $data = $request->validate([
            'code' => ['required', 'string', 'size:3', 'unique:currencies,code,' . $currency->id],
            'name' => ['required', 'string', 'max:100'],
            'symbol' => ['nullable', 'string', 'max:10'],
            'flag_icon' => ['nullable', 'string', 'max:10'],
            'decimal_places' => ['required', 'integer', 'min:0', 'max:4'],
            'unit' => ['required', 'integer', 'min:1'],
            'display_order' => ['required', 'integer', 'min:0'],
            'active' => ['boolean'],
        ]);

        $data['code'] = strtoupper($data['code']);
        $currency->update($data);
        Cache::forget('public.rates.hq');

        return back()->with('success', "Currency {$currency->code} updated.");
    }

    public function destroy(Currency $currency): RedirectResponse
    {
        if ($currency->is_base) {
            return back()->with('error', 'Base currency cannot be deleted.');
        }
        if ($currency->rates()->exists()) {
            return back()->with('error', 'Cannot delete currency with existing rates.');
        }

        $code = $currency->code;
        $currency->delete();
        Cache::forget('public.rates.hq');

        return back()->with('success', "Currency {$code} deleted.");
    }
}
