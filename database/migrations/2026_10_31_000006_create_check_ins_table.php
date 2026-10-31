<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('check_ins', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trail_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trip_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('checkin_at');
            $table->dateTime('expected_return_at');
            $table->dateTime('checkout_at')->nullable();
            $table->boolean('reached_summit')->default(false);
            $table->boolean('overdue_alert_sent')->default(false);
            $table->timestamps();

            $table->index(['checkout_at', 'expected_return_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};
