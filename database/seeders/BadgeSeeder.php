<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            ['slug' => 'first-summit', 'icon' => '🌋', 'criteria' => ['summits' => 1],
                'name_en' => 'First Summit', 'name_id' => 'Summit Perdana',
                'description_en' => 'Checked out from your first summit.', 'description_id' => 'Check-out dari puncak pertamamu.'],
            ['slug' => 'five-summits', 'icon' => '⛰️', 'criteria' => ['summits' => 5],
                'name_en' => 'Five Peaks', 'name_id' => 'Lima Puncak',
                'description_en' => 'Five summits logged.', 'description_id' => 'Lima puncak tercatat.'],
            ['slug' => 'three-thousand', 'icon' => '🏔️', 'criteria' => ['max_elevation' => 3000],
                'name_en' => '3000 m Club', 'name_id' => 'Pejuang 3000 m',
                'description_en' => 'Summited a peak above 3,000 m.', 'description_id' => 'Mencapai puncak di atas 3.000 m.'],
            ['slug' => 'ten-trips', 'icon' => '🤝', 'criteria' => ['trips' => 10],
                'name_en' => 'Ten Trips Together', 'name_id' => '10 Trip Bareng',
                'description_en' => 'Confirmed on ten open trips.', 'description_id' => 'Terkonfirmasi di sepuluh open trip.'],
            ['slug' => 'trail-reporter', 'icon' => '📝', 'criteria' => ['reviews' => 3],
                'name_en' => 'Trail Reporter', 'name_id' => 'Pelapor Jalur',
                'description_en' => 'Three trail condition reports.', 'description_id' => 'Tiga laporan kondisi jalur.'],
            ['slug' => 'storyteller', 'icon' => '📷', 'criteria' => ['posts' => 5],
                'name_en' => 'Storyteller', 'name_id' => 'Pencerita',
                'description_en' => 'Five stories shared with the community.', 'description_id' => 'Lima cerita dibagikan ke komunitas.'],
            ['slug' => 'everest-gain', 'icon' => '🧭', 'criteria' => ['elevation_m' => 8849],
                'name_en' => 'Everest of Gain', 'name_id' => 'Setara Everest',
                'description_en' => 'Cumulative summit elevation past 8,849 m.', 'description_id' => 'Akumulasi ketinggian puncak melewati 8.849 m.'],
        ];

        foreach ($badges as $badge) {
            Badge::updateOrCreate(['slug' => $badge['slug']], $badge);
        }
    }
}
