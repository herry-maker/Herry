<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trails', function (Blueprint $table): void {
            $table->string('bmkg_adm4', 16)->nullable()->after('lng');
        });

        Schema::table('trips', function (Blueprint $table): void {
            $table->timestamp('weather_alert_sent_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('trips', fn (Blueprint $table) => $table->dropColumn('weather_alert_sent_at'));
        Schema::table('trails', fn (Blueprint $table) => $table->dropColumn('bmkg_adm4'));
    }
};
