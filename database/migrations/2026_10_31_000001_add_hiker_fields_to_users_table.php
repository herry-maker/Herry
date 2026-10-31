<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('phone', 32)->nullable()->after('email');
            $table->string('nationality', 2)->default('ID')->after('phone');
            $table->string('id_type', 16)->default('ktp')->after('nationality');
            $table->string('preferred_locale', 5)->default('id')->after('id_type');
            $table->text('bio')->nullable()->after('preferred_locale');
            $table->string('avatar_path')->nullable()->after('bio');
            $table->string('experience_level', 16)->default('pemula')->after('avatar_path');
            $table->string('emergency_name')->nullable()->after('experience_level');
            $table->string('emergency_phone', 32)->nullable()->after('emergency_name');
            $table->unsignedInteger('summit_count')->default(0)->after('emergency_phone');
            $table->unsignedInteger('total_elevation_m')->default(0)->after('summit_count');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'phone', 'nationality', 'id_type', 'preferred_locale', 'bio', 'avatar_path',
                'experience_level', 'emergency_name', 'emergency_phone', 'summit_count', 'total_elevation_m',
            ]);
        });
    }
};
