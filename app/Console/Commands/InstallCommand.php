<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use PDO;
use PDOException;

class InstallCommand extends Command
{
    protected $signature = 'app:install {--fresh : Drop existing DB and reinstall (bypasses one-time lock)}';

    protected $description = 'Bootstrap the app: create DB from .env, migrate, seed, storage link. Runs once only.';

    public function handle(): int
    {
        $this->line('');
        $this->info('╔══════════════════════════════════════════╗');
        $this->info('║      Money Exchange — First-time Setup   ║');
        $this->info('╚══════════════════════════════════════════╝');
        $this->line('');

        $lockFile = storage_path('app/.installed');

        if (file_exists($lockFile) && ! $this->option('fresh')) {
            $installedAt = trim((string) @file_get_contents($lockFile));
            $this->error('✘ Application is already installed.');
            $this->line('');
            $this->line("  Installed at: <fg=cyan>{$installedAt}</>");
            $this->line("  Lock file   : <fg=cyan>{$lockFile}</>");
            $this->line('');
            $this->line('  To re-install (<fg=red>WIPES ALL DATA</>):');
            $this->line('    <fg=yellow>php artisan app:install --fresh</>');
            $this->line('');
            $this->line('  To unlock manually:');
            $this->line("    <fg=yellow>rm {$lockFile}</>");
            $this->line('');
            return self::FAILURE;
        }

        if (empty(config('app.key'))) {
            $this->warn('APP_KEY missing. Generating…');
            Artisan::call('key:generate', [], $this->getOutput());
        }

        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port');
        $name = config('database.connections.mysql.database');
        $user = config('database.connections.mysql.username');
        $pass = config('database.connections.mysql.password');
        $charset = config('database.connections.mysql.charset', 'utf8mb4');
        $collation = config('database.connections.mysql.collation', 'utf8mb4_unicode_ci');

        $this->line("  Host     : <fg=cyan>{$host}:{$port}</>");
        $this->line("  Database : <fg=cyan>{$name}</>");
        $this->line("  User     : <fg=cyan>{$user}</>");
        $this->line('');

        try {
            $pdo = new PDO(
                "mysql:host={$host};port={$port}",
                $user,
                $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            $this->error('✘ Cannot connect to MySQL server.');
            $this->error('  ' . $e->getMessage());
            $this->line('  Check DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD in .env and ensure MySQL is running.');
            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            $this->warn("Dropping database '{$name}' (--fresh)…");
            $pdo->exec("DROP DATABASE IF EXISTS `{$name}`");
        }

        $exists = (bool) $pdo->query(
            "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = " . $pdo->quote($name)
        )->fetchColumn();

        if ($exists) {
            $this->line("✓ Database '<fg=cyan>{$name}</>' already exists.");
        } else {
            $pdo->exec("CREATE DATABASE `{$name}` CHARACTER SET {$charset} COLLATE {$collation}");
            $this->info("✓ Database '<fg=cyan>{$name}</>' created.");
        }

        $this->line('');
        $this->info('→ Running migrations + seeders…');
        Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true], $this->getOutput());

        $this->line('');
        $this->info('→ Linking storage…');
        Artisan::call('storage:link', ['--force' => true], $this->getOutput());

        $dir = dirname($lockFile);
        if (! is_dir($dir)) mkdir($dir, 0755, true);
        file_put_contents($lockFile, now()->toDateTimeString() . "\n");

        $this->line('');
        $this->info('╔══════════════════════════════════════════╗');
        $this->info('║               Setup Complete             ║');
        $this->info('╚══════════════════════════════════════════╝');
        $this->line('');
        $this->line('  <fg=yellow>Demo accounts (password: password):</>');
        $this->line('    admin@moneyexchange.test   → /admin/dashboard');
        $this->line('    manager@moneyexchange.test → /branch/dashboard');
        $this->line('    staff@moneyexchange.test   → /pos');
        $this->line('');
        $this->line('  <fg=yellow>DB Vault PIN:</> <fg=cyan>123456</>  (change at /admin/database)');
        $this->line('');
        $this->line('  Next steps:');
        $this->line('    <fg=green>composer dev</>   — run PHP + Vite together');
        $this->line('    <fg=green>php artisan serve</>   — PHP only');
        $this->line('');

        return self::SUCCESS;
    }
}
