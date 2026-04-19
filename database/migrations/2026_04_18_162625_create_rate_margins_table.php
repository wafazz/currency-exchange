<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rate_margins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('currency_id')->constrained('currencies')->cascadeOnDelete();
            $table->decimal('max_margin_percent', 5, 2)->default(0.50);
            $table->timestamps();

            $table->unique('currency_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rate_margins');
    }
};
