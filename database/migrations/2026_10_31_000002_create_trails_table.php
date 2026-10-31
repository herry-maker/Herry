<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trails', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('regency');
            $table->string('province');
            $table->unsignedSmallInteger('elevation_m');
            $table->decimal('length_km', 5, 1);
            $table->string('difficulty', 16);
            $table->decimal('hours_from_jakarta', 3, 1);
            $table->string('permit_type', 16)->default('none');
            $table->string('permit_url')->nullable();
            $table->unsignedSmallInteger('daily_quota')->nullable();
            $table->unsignedInteger('permit_fee_local_idr')->nullable();
            $table->unsignedInteger('permit_fee_foreign_idr')->nullable();
            $table->boolean('basarnas_required')->default(false);
            $table->boolean('guide_required')->default(false);
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->text('description_en');
            $table->text('description_id');
            $table->string('cover_path')->nullable();
            $table->string('cover_gradient', 16)->default('gede');
            $table->timestamps();

            $table->index(['difficulty', 'hours_from_jakarta']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trails');
    }
};
