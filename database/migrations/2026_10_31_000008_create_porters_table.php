<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('porters', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('phone', 32);
            $table->string('role', 16)->default('porter');
            $table->string('base_area');
            $table->unsignedInteger('rate_idr_per_day');
            $table->json('languages');
            $table->text('bio_en');
            $table->text('bio_id');
            $table->boolean('is_verified')->default(false);
            $table->string('license_no')->nullable();
            $table->decimal('rating_avg', 2, 1)->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedSmallInteger('trips_led')->default(0);
            $table->timestamps();

            $table->index(['role', 'is_verified']);
        });

        Schema::create('porter_trail', function (Blueprint $table): void {
            $table->foreignId('porter_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trail_id')->constrained()->cascadeOnDelete();
            $table->primary(['porter_id', 'trail_id']);
        });

        Schema::create('porter_trip', function (Blueprint $table): void {
            $table->foreignId('porter_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->primary(['porter_id', 'trip_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('porter_trip');
        Schema::dropIfExists('porter_trail');
        Schema::dropIfExists('porters');
    }
};
