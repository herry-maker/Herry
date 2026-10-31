<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('trail_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('type', 16)->default('open');
            $table->dateTime('departure_at');
            $table->dateTime('return_at');
            $table->string('meeting_point');
            $table->unsignedSmallInteger('max_participants');
            $table->unsignedInteger('price_idr')->default(0);
            $table->json('includes')->nullable();
            $table->string('whatsapp_link')->nullable();
            $table->string('qris_image_path')->nullable();
            $table->boolean('beginner_friendly')->default(false);
            $table->string('status', 16)->default('open');
            $table->timestamps();

            $table->index(['status', 'departure_at']);
        });

        Schema::create('trip_members', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 16)->default('member');
            $table->string('status', 16)->default('pending');
            $table->string('payment_proof_path')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->unique(['trip_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_members');
        Schema::dropIfExists('trips');
    }
};
