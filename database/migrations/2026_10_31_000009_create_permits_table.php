<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permits', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trail_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trip_id')->nullable()->constrained()->nullOnDelete();
            $table->date('hike_date');
            $table->unsignedSmallInteger('party_size')->default(1);
            $table->string('status', 16)->default('planned');
            $table->string('simaksi_code')->nullable();
            $table->timestamp('booked_at')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'hike_date']);
            $table->index(['status', 'hike_date', 'reminder_sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permits');
    }
};
