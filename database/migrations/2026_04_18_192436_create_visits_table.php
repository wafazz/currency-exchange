<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->string('visitor_id', 40)->unique();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->unsignedInteger('page_views')->default(1);
            $table->timestamp('first_seen_at')->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
