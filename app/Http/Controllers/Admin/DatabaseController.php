<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Process\Process;

class DatabaseController extends Controller
{
    public function unlock(): Response
    {
        return Inertia::render('Admin/Database/Unlock');
    }

    public function verify(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'pin' => ['required', 'string', 'digits:6'],
        ]);

        $hash = Setting::where('key', 'db_pin')->value('value');

        if (! $hash || ! Hash::check($data['pin'], $hash)) {
            return back()->withErrors(['pin' => 'Incorrect PIN.']);
        }

        $request->session()->put('db_pin_verified_at', time());

        return redirect()->route('admin.database.index')->with('success', 'Database vault unlocked.');
    }

    public function lock(Request $request): RedirectResponse
    {
        $request->session()->forget('db_pin_verified_at');
        return redirect()->route('admin.database.unlock')->with('success', 'Database vault locked.');
    }

    public function index(): Response
    {
        $database = config('database.connections.' . config('database.default') . '.database');

        $tables = [];
        $totalRows = 0;
        $totalSize = 0;

        $rows = DB::select(
            'SELECT table_name AS `name`, table_rows AS `row_count`, (data_length + index_length) AS `size`
             FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name',
            [$database]
        );

        foreach ($rows as $r) {
            $tables[] = [
                'name' => $r->name,
                'rows' => (int) $r->row_count,
                'size' => (int) $r->size,
            ];
            $totalRows += (int) $r->row_count;
            $totalSize += (int) $r->size;
        }

        return Inertia::render('Admin/Database/Index', [
            'database' => $database,
            'tables' => $tables,
            'totals' => [
                'tables' => count($tables),
                'rows' => $totalRows,
                'size' => $totalSize,
            ],
            'mysqldump_available' => $this->mysqldumpPath() !== null,
        ]);
    }

    public function backup(): BinaryFileResponse|RedirectResponse
    {
        $mysqldump = $this->mysqldumpPath();
        if (! $mysqldump) {
            return back()->with('error', 'mysqldump not found on server.');
        }

        $conn = config('database.connections.' . config('database.default'));
        $filename = 'backup_' . $conn['database'] . '_' . date('Ymd_His') . '.sql';
        $dir = storage_path('app/backups');
        if (! is_dir($dir)) mkdir($dir, 0755, true);
        $path = $dir . '/' . $filename;

        $cmd = [
            $mysqldump,
            '-h', $conn['host'],
            '-P', (string) $conn['port'],
            '-u', $conn['username'],
        ];
        if (! empty($conn['password'])) $cmd[] = '-p' . $conn['password'];
        $cmd[] = '--single-transaction';
        $cmd[] = '--routines';
        $cmd[] = '--triggers';
        $cmd[] = $conn['database'];

        $process = new Process($cmd);
        $process->setTimeout(300);
        $fh = fopen($path, 'w');
        $process->run(function ($type, $buffer) use ($fh) {
            if ($type === Process::OUT) fwrite($fh, $buffer);
        });
        fclose($fh);

        if (! $process->isSuccessful() || filesize($path) === 0) {
            @unlink($path);
            return back()->with('error', 'Backup failed: ' . trim($process->getErrorOutput()));
        }

        return response()->download($path, $filename, [
            'Content-Type' => 'application/sql',
        ])->deleteFileAfterSend(true);
    }

    public function clearCache(): RedirectResponse
    {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('view:clear');
        Artisan::call('route:clear');
        Cache::flush();
        return back()->with('success', 'All application caches cleared.');
    }

    public function optimize(): RedirectResponse
    {
        $conn = config('database.connections.' . config('database.default') . '.database');
        $tables = DB::select(
            'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?',
            [$conn]
        );
        foreach ($tables as $t) {
            DB::statement('OPTIMIZE TABLE `' . $t->name . '`');
        }
        return back()->with('success', 'Database tables optimized.');
    }

    public function changePin(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_pin' => ['required', 'string', 'digits:6'],
            'new_pin' => ['required', 'string', 'digits:6', 'different:current_pin'],
            'new_pin_confirmation' => ['required', 'same:new_pin'],
        ]);

        $hash = Setting::where('key', 'db_pin')->value('value');

        if (! $hash || ! Hash::check($data['current_pin'], $hash)) {
            return back()->withErrors(['current_pin' => 'Current PIN is incorrect.']);
        }

        Setting::set('db_pin', Hash::make($data['new_pin']), 'string', 'security');

        return back()->with('success', 'PIN updated successfully.');
    }

    public function showTable(Request $request, string $table): Response|RedirectResponse
    {
        if (! $this->tableExists($table)) {
            return redirect()->route('admin.database.index')->with('error', "Table '{$table}' not found.");
        }

        $perPage = 25;
        $page = max(1, (int) $request->query('page', 1));
        $offset = ($page - 1) * $perPage;

        $columns = $this->tableColumns($table);
        $pk = $this->tablePrimaryKey($table);

        $total = (int) DB::table($table)->count();
        $rows = DB::table($table)->offset($offset)->limit($perPage)->get()->map(fn ($r) => (array) $r)->all();

        return Inertia::render('Admin/Database/Table', [
            'table' => $table,
            'columns' => $columns,
            'primary_key' => $pk,
            'rows' => $rows,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ],
        ]);
    }

    public function createTable(): Response
    {
        return Inertia::render('Admin/Database/CreateTable');
    }

    public function storeTable(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/', 'max:64'],
            'columns' => ['required', 'array', 'min:1'],
            'columns.*.name' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/', 'max:64'],
            'columns.*.type' => ['required', 'string', 'in:integer,bigInteger,string,text,boolean,date,dateTime,decimal,float,json'],
            'columns.*.length' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'columns.*.nullable' => ['boolean'],
            'columns.*.default' => ['nullable', 'string'],
            'columns.*.primary' => ['boolean'],
            'columns.*.auto_increment' => ['boolean'],
            'timestamps' => ['boolean'],
        ]);

        if (Schema::hasTable($data['name'])) {
            return back()->withErrors(['name' => 'Table already exists.']);
        }

        try {
            Schema::create($data['name'], function ($t) use ($data) {
                $hasPrimary = false;
                foreach ($data['columns'] as $c) {
                    $col = match ($c['type']) {
                        'integer' => $t->integer($c['name'], $c['auto_increment'] ?? false),
                        'bigInteger' => $t->bigInteger($c['name'], $c['auto_increment'] ?? false),
                        'string' => $t->string($c['name'], $c['length'] ?? 255),
                        'text' => $t->text($c['name']),
                        'boolean' => $t->boolean($c['name']),
                        'date' => $t->date($c['name']),
                        'dateTime' => $t->dateTime($c['name']),
                        'decimal' => $t->decimal($c['name'], 10, 2),
                        'float' => $t->float($c['name']),
                        'json' => $t->json($c['name']),
                    };
                    if (! empty($c['nullable'])) $col->nullable();
                    if (isset($c['default']) && $c['default'] !== '' && $c['default'] !== null) $col->default($c['default']);
                    if (! empty($c['primary']) && ! $hasPrimary) {
                        $col->primary();
                        $hasPrimary = true;
                    }
                }
                if (! empty($data['timestamps'])) $t->timestamps();
            });
        } catch (\Throwable $e) {
            return back()->with('error', 'Create failed: ' . $e->getMessage())->withInput();
        }

        return redirect()->route('admin.database.table.show', $data['name'])
            ->with('success', "Table '{$data['name']}' created.");
    }

    public function editTable(string $table): Response|RedirectResponse
    {
        if (! $this->tableExists($table)) {
            return redirect()->route('admin.database.index')->with('error', "Table '{$table}' not found.");
        }

        return Inertia::render('Admin/Database/EditTable', [
            'table' => $table,
            'columns' => $this->tableColumns($table),
        ]);
    }

    public function addColumn(Request $request, string $table): RedirectResponse
    {
        if (! $this->tableExists($table)) return back()->with('error', 'Table not found.');

        $c = $request->validate([
            'name' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/', 'max:64'],
            'type' => ['required', 'string', 'in:integer,bigInteger,string,text,boolean,date,dateTime,decimal,float,json'],
            'length' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'nullable' => ['boolean'],
            'default' => ['nullable', 'string'],
        ]);

        try {
            Schema::table($table, function ($t) use ($c) {
                $col = match ($c['type']) {
                    'integer' => $t->integer($c['name']),
                    'bigInteger' => $t->bigInteger($c['name']),
                    'string' => $t->string($c['name'], $c['length'] ?? 255),
                    'text' => $t->text($c['name']),
                    'boolean' => $t->boolean($c['name']),
                    'date' => $t->date($c['name']),
                    'dateTime' => $t->dateTime($c['name']),
                    'decimal' => $t->decimal($c['name'], 10, 2),
                    'float' => $t->float($c['name']),
                    'json' => $t->json($c['name']),
                };
                if (! empty($c['nullable'])) $col->nullable();
                if (isset($c['default']) && $c['default'] !== '' && $c['default'] !== null) $col->default($c['default']);
            });
        } catch (\Throwable $e) {
            return back()->with('error', 'Add column failed: ' . $e->getMessage());
        }

        return back()->with('success', "Column '{$c['name']}' added.");
    }

    public function dropColumn(Request $request, string $table): RedirectResponse
    {
        if (! $this->tableExists($table)) return back()->with('error', 'Table not found.');

        $data = $request->validate([
            'column' => ['required', 'string'],
        ]);

        try {
            Schema::table($table, fn ($t) => $t->dropColumn($data['column']));
        } catch (\Throwable $e) {
            return back()->with('error', 'Drop column failed: ' . $e->getMessage());
        }

        return back()->with('success', "Column '{$data['column']}' dropped.");
    }

    public function renameTable(Request $request, string $table): RedirectResponse
    {
        if (! $this->tableExists($table)) return back()->with('error', 'Table not found.');

        $data = $request->validate([
            'new_name' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/', 'max:64'],
        ]);

        if (Schema::hasTable($data['new_name'])) {
            return back()->withErrors(['new_name' => 'Target table already exists.']);
        }

        Schema::rename($table, $data['new_name']);

        return redirect()->route('admin.database.table.edit', $data['new_name'])
            ->with('success', "Table renamed to '{$data['new_name']}'.");
    }

    public function dropTable(string $table): RedirectResponse
    {
        if (! $this->tableExists($table)) return back()->with('error', 'Table not found.');

        try {
            Schema::drop($table);
        } catch (\Throwable $e) {
            return back()->with('error', 'Drop failed: ' . $e->getMessage());
        }

        return redirect()->route('admin.database.index')
            ->with('success', "Table '{$table}' dropped.");
    }

    public function queryForm(): Response
    {
        return Inertia::render('Admin/Database/Query', [
            'result' => null,
            'sql' => '',
        ]);
    }

    public function runQuery(Request $request): Response
    {
        $data = $request->validate([
            'sql' => ['required', 'string', 'max:20000'],
        ]);

        $sql = trim($data['sql']);
        $start = microtime(true);
        $result = [
            'type' => 'error',
            'message' => '',
            'columns' => [],
            'rows' => [],
            'affected' => 0,
            'duration_ms' => 0,
        ];

        try {
            $first = strtolower(strtok($sql, " \t\n"));
            if (in_array($first, ['select', 'show', 'describe', 'desc', 'explain'], true)) {
                $rows = DB::select($sql);
                $rows = array_map(fn ($r) => (array) $r, $rows);
                $result['type'] = 'select';
                $result['columns'] = $rows ? array_keys($rows[0]) : [];
                $result['rows'] = $rows;
            } else {
                $affected = DB::affectingStatement($sql);
                $result['type'] = 'modify';
                $result['affected'] = (int) $affected;
                $result['message'] = "{$affected} row(s) affected.";
            }
        } catch (\Throwable $e) {
            $result['type'] = 'error';
            $result['message'] = $e->getMessage();
        }

        $result['duration_ms'] = round((microtime(true) - $start) * 1000, 2);

        return Inertia::render('Admin/Database/Query', [
            'sql' => $sql,
            'result' => $result,
        ]);
    }

    public function insertRow(Request $request, string $table): RedirectResponse
    {
        if (! $this->tableExists($table)) return back()->with('error', 'Table not found.');

        $cols = collect($this->tableColumns($table))->pluck('name')->all();
        $payload = collect($request->input('row', []))
            ->only($cols)
            ->filter(fn ($v) => $v !== '' && $v !== null)
            ->all();

        try {
            DB::table($table)->insert($payload);
        } catch (\Throwable $e) {
            return back()->with('error', 'Insert failed: ' . $e->getMessage())->withInput();
        }

        return redirect()->route('admin.database.table.show', $table)
            ->with('success', 'Row inserted.');
    }

    public function copyRow(Request $request, string $table): RedirectResponse
    {
        if (! $this->tableExists($table)) return back()->with('error', 'Table not found.');

        $data = $request->validate([
            'pk_column' => ['required', 'string'],
            'pk_value' => ['required'],
        ]);

        $row = DB::table($table)->where($data['pk_column'], $data['pk_value'])->first();
        if (! $row) return back()->with('error', 'Source row not found.');

        $arr = (array) $row;
        $pkCol = $data['pk_column'];
        $colInfo = collect($this->tableColumns($table))->firstWhere('name', $pkCol);
        if ($colInfo && ! empty($colInfo['auto_increment'])) {
            unset($arr[$pkCol]);
        }

        foreach ($this->tableColumns($table) as $c) {
            if (in_array($c['name'], ['created_at', 'updated_at'], true)) {
                $arr[$c['name']] = now();
            }
        }

        try {
            DB::table($table)->insert($arr);
        } catch (\Throwable $e) {
            return back()->with('error', 'Copy failed: ' . $e->getMessage());
        }

        return back()->with('success', 'Row copied.');
    }

    public function deleteRow(Request $request, string $table): RedirectResponse
    {
        if (! $this->tableExists($table)) return back()->with('error', 'Table not found.');

        $data = $request->validate([
            'pk_column' => ['required', 'string'],
            'pk_value' => ['required'],
        ]);

        $deleted = DB::table($table)->where($data['pk_column'], $data['pk_value'])->delete();

        return back()->with($deleted ? 'success' : 'error', $deleted ? 'Row deleted.' : 'No row deleted.');
    }

    private function tableExists(string $table): bool
    {
        return Schema::hasTable($table);
    }

    private function tableColumns(string $table): array
    {
        $db = config('database.connections.' . config('database.default') . '.database');
        $rows = DB::select(
            'SELECT column_name AS `name`, column_type AS `type`, is_nullable AS `nullable`,
                    column_default AS `default`, column_key AS `key`, extra AS `extra`
             FROM information_schema.columns
             WHERE table_schema = ? AND table_name = ?
             ORDER BY ordinal_position',
            [$db, $table]
        );

        return array_map(fn ($r) => [
            'name' => $r->name,
            'type' => $r->type,
            'nullable' => strtoupper($r->nullable) === 'YES',
            'default' => $r->default,
            'key' => $r->key,
            'auto_increment' => str_contains(strtolower($r->extra ?? ''), 'auto_increment'),
        ], $rows);
    }

    private function tablePrimaryKey(string $table): ?string
    {
        foreach ($this->tableColumns($table) as $c) {
            if ($c['key'] === 'PRI') return $c['name'];
        }
        return null;
    }

    private function mysqldumpPath(): ?string
    {
        $candidates = [
            '/Applications/XAMPP/xamppfiles/bin/mysqldump',
            '/Applications/XAMPP/bin/mysqldump',
            '/usr/local/bin/mysqldump',
            '/usr/bin/mysqldump',
            '/opt/homebrew/bin/mysqldump',
        ];
        foreach ($candidates as $p) {
            if (is_executable($p)) return $p;
        }
        return null;
    }
}
