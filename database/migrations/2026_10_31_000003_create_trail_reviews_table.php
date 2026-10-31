<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trail_reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('trail_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('condition', 16);
            $table->boolean('water_available')->nullable();
            $table->text('body');
            $table->json('photo_paths')->nullable();
            $table->date('visited_at');
            $table->timestamps();

            $table->index(['trail_id', 'visited_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trail_reviews');
    }
};
