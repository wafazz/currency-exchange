<?php

use App\Http\Controllers\Admin\BranchController;
use App\Http\Controllers\Admin\CurrencyController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DatabaseController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\PublicPageController;
use App\Http\Controllers\Admin\RateController;
use App\Http\Controllers\Admin\RateHistoryController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\RatesApiController;
use App\Http\Controllers\VisitorController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome'))->name('home');

Route::get('/display', fn () => Inertia::render('Display/Index'))->name('display');
Route::get('/display/{branch}', fn (string $branch) => Inertia::render('Display/Index', ['branch' => $branch]))
    ->name('display.branch');

Route::get('/api/rates/{branch?}', RatesApiController::class)->name('api.rates');
Route::get('/api/visitor-stats', VisitorController::class)->name('api.visitor');

Route::get('/about', fn () => app(PublicPageController::class)('about'))->name('page.about');
Route::get('/terms', fn () => app(PublicPageController::class)('terms'))->name('page.terms');
Route::get('/contact', fn () => app(PublicPageController::class)('contact'))->name('page.contact');
Route::get('/p/{slug}', PublicPageController::class)->name('page.show');

require __DIR__.'/auth.php';

Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/rates', [RateController::class, 'index'])->name('rates.index');
    Route::put('/rates/{currency}', [RateController::class, 'update'])->name('rates.update');
    Route::post('/rates/bulk', [RateController::class, 'bulkUpdate'])->name('rates.bulk');

    Route::get('/rate-history', [RateHistoryController::class, 'index'])->name('rate-history.index');

    Route::get('/currencies', [CurrencyController::class, 'index'])->name('currencies.index');
    Route::post('/currencies', [CurrencyController::class, 'store'])->name('currencies.store');
    Route::put('/currencies/{currency}', [CurrencyController::class, 'update'])->name('currencies.update');
    Route::delete('/currencies/{currency}', [CurrencyController::class, 'destroy'])->name('currencies.destroy');

    Route::get('/branches', [BranchController::class, 'index'])->name('branches.index');
    Route::post('/branches', [BranchController::class, 'store'])->name('branches.store');
    Route::post('/branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
    Route::delete('/branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');

    Route::get('/pages', [PageController::class, 'index'])->name('pages.index');
    Route::get('/pages/create', [PageController::class, 'create'])->name('pages.create');
    Route::post('/pages', [PageController::class, 'store'])->name('pages.store');
    Route::get('/pages/{page}/edit', [PageController::class, 'edit'])->name('pages.edit');
    Route::put('/pages/{page}', [PageController::class, 'update'])->name('pages.update');
    Route::delete('/pages/{page}', [PageController::class, 'destroy'])->name('pages.destroy');

    Route::get('/database/unlock', [DatabaseController::class, 'unlock'])->name('database.unlock');
    Route::post('/database/verify', [DatabaseController::class, 'verify'])->name('database.verify');
    Route::post('/database/lock', [DatabaseController::class, 'lock'])->name('database.lock');

    Route::middleware('db.pin')->group(function () {
        Route::get('/database', [DatabaseController::class, 'index'])->name('database.index');
        Route::get('/database/backup', [DatabaseController::class, 'backup'])->name('database.backup');
        Route::post('/database/clear-cache', [DatabaseController::class, 'clearCache'])->name('database.clear-cache');
        Route::post('/database/optimize', [DatabaseController::class, 'optimize'])->name('database.optimize');
        Route::post('/database/change-pin', [DatabaseController::class, 'changePin'])->name('database.change-pin');

        Route::get('/database/query', [DatabaseController::class, 'queryForm'])->name('database.query');
        Route::post('/database/query', [DatabaseController::class, 'runQuery'])->name('database.query.run');

        Route::get('/database/tables/create', [DatabaseController::class, 'createTable'])->name('database.table.create');
        Route::post('/database/tables', [DatabaseController::class, 'storeTable'])->name('database.table.store');
        Route::get('/database/tables/{table}', [DatabaseController::class, 'showTable'])->name('database.table.show');
        Route::get('/database/tables/{table}/edit', [DatabaseController::class, 'editTable'])->name('database.table.edit');
        Route::post('/database/tables/{table}/columns', [DatabaseController::class, 'addColumn'])->name('database.table.column.add');
        Route::delete('/database/tables/{table}/columns', [DatabaseController::class, 'dropColumn'])->name('database.table.column.drop');
        Route::post('/database/tables/{table}/rename', [DatabaseController::class, 'renameTable'])->name('database.table.rename');
        Route::delete('/database/tables/{table}', [DatabaseController::class, 'dropTable'])->name('database.table.drop');

        Route::post('/database/tables/{table}/rows', [DatabaseController::class, 'insertRow'])->name('database.row.insert');
        Route::post('/database/tables/{table}/rows/copy', [DatabaseController::class, 'copyRow'])->name('database.row.copy');
        Route::delete('/database/tables/{table}/rows', [DatabaseController::class, 'deleteRow'])->name('database.row.delete');
    });
});

Route::middleware(['auth', 'role:admin,manager'])->prefix('branch')->name('branch.')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Branch/Dashboard'))->name('dashboard');
});

Route::middleware(['auth', 'role:admin,manager,staff'])->prefix('pos')->name('pos.')->group(function () {
    Route::get('/', fn () => Inertia::render('Pos/Index'))->name('index');
});
