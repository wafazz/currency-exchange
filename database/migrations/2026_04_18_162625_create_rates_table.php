<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained('currencies')->cascadeOnDelete();
            $table->decimal('buy_rate', 12, 4);
            $table->decimal('sell_rate', 12, 4);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['branch_id', 'currency_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rates');
    }
};
