<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 3)->unique();
            $table->string('name');
            $table->string('symbol', 10)->nullable();
            $table->string('flag_icon', 10)->nullable();
            $table->unsignedTinyInteger('decimal_places')->default(2);
            $table->unsignedInteger('unit')->default(1);
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_base')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
