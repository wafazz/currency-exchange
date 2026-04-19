<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rate_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained('currencies')->cascadeOnDelete();
            $table->decimal('old_buy', 12, 4)->nullable();
            $table->decimal('old_sell', 12, 4)->nullable();
            $table->decimal('new_buy', 12, 4);
            $table->decimal('new_sell', 12, 4);
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('source', ['manual', 'bulk', 'api'])->default('manual');
            $table->string('note')->nullable();
            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rate_history');
    }
};
