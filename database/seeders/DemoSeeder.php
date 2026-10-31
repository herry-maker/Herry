<?php

namespace Database\Seeders;

use App\Models\CheckIn;
use App\Models\Post;
use App\Models\Trail;
use App\Models\TrailReview;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        $budi = User::updateOrCreate(['email' => 'budi@example.com'], [
            'name' => 'Budi Santoso', 'password' => $password, 'phone' => '+62 812-3456-7890',
            'nationality' => 'ID', 'id_type' => 'ktp', 'preferred_locale' => 'id', 'experience_level' => 'madya',
            'bio' => 'Weekend summiter from Depok. Gede is home.',
            'emergency_name' => 'Sari Santoso', 'emergency_phone' => '+62 813-9876-5432', 'email_verified_at' => now(),
        ]);
        $rina = User::updateOrCreate(['email' => 'rina@example.com'], [
            'name' => 'Rina Novita', 'password' => $password, 'phone' => '+62 821-1111-2222',
            'nationality' => 'ID', 'id_type' => 'ktp', 'preferred_locale' => 'id', 'experience_level' => 'ahli',
            'bio' => 'Open-trip organizer, Jelajah Nusantara. 60+ trips led.',
            'emergency_name' => 'Dedi Novita', 'emergency_phone' => '+62 822-3333-4444', 'email_verified_at' => now(),
        ]);
        $emma = User::updateOrCreate(['email' => 'emma@example.com'], [
            'name' => 'Emma Clarke', 'password' => $password, 'phone' => '+61 400 123 456',
            'nationality' => 'AU', 'id_type' => 'passport', 'preferred_locale' => 'en', 'experience_level' => 'pemula',
            'bio' => 'Melbourne → Jakarta for six months. Collecting volcanoes.',
            'emergency_name' => 'Tom Clarke', 'emergency_phone' => '+61 400 654 321', 'email_verified_at' => now(),
        ]);

        $gede = Trail::where('slug', 'gunung-gede')->first();
        $pangrango = Trail::where('slug', 'gunung-pangrango')->first();
        $salak = Trail::where('slug', 'gunung-salak')->first();
        $papandayan = Trail::where('slug', 'gunung-papandayan')->first();
        $prau = Trail::where('slug', 'gunung-prau')->first();
        $rinjani = Trail::where('slug', 'gunung-rinjani')->first();

        // Budi's summit history drives his profile stats and badges.
        foreach ([[$gede, -108], [$salak, -53], [$prau, -17], [$papandayan, -8]] as [$trail, $daysAgo]) {
            CheckIn::firstOrCreate(
                ['user_id' => $budi->id, 'trail_id' => $trail->id, 'checkin_at' => now()->addDays($daysAgo)->setTime(6, 0)],
                ['expected_return_at' => now()->addDays($daysAgo + 1)->setTime(16, 0), 'checkout_at' => now()->addDays($daysAgo + 1)->setTime(14, 30), 'reached_summit' => true],
            );
        }
        $budi->update([
            'summit_count' => 4,
            'total_elevation_m' => $gede->elevation_m + $salak->elevation_m + $prau->elevation_m + $papandayan->elevation_m,
        ]);
        $budi->badges()->syncWithoutDetaching(
            \App\Models\Badge::whereIn('slug', ['first-summit'])->pluck('id')->all()
        );

        TrailReview::firstOrCreate(
            ['trail_id' => $salak->id, 'user_id' => $rina->id, 'visited_at' => now()->subDays(3)->toDateString()],
            ['rating' => 4, 'condition' => 'sedang', 'water_available' => true,
                'body' => 'Pos 3 to Pos 4 has a fallen tree, passable with care. Spring at Pos 2 still flowing. Leech season, wear gaiters.'],
        );
        TrailReview::firstOrCreate(
            ['trail_id' => $gede->id, 'user_id' => $budi->id, 'visited_at' => now()->subDays(8)->toDateString()],
            ['rating' => 5, 'condition' => 'baik', 'water_available' => true,
                'body' => 'Cibodas route clear, Suryakencana edelweiss in bloom. Cold at night, 6°C at camp.'],
        );
        TrailReview::firstOrCreate(
            ['trail_id' => $papandayan->id, 'user_id' => $emma->id, 'visited_at' => now()->subDays(1)->toDateString()],
            ['rating' => 5, 'condition' => 'baik', 'water_available' => false,
                'body' => 'Perfect first volcano. Sulphur smell is strong near the crater, bring a buff. No water past the basecamp.'],
        );

        $tripA = Trip::firstOrCreate(
            ['organizer_id' => $rina->id, 'trail_id' => $papandayan->id, 'title' => 'Papandayan via Cisurupan: Sunrise Camp'],
            ['description' => 'Classic beginner-friendly camp at Pondok Saladah. We leave Jakarta Friday night, summit for sunrise Saturday, back in the city Sunday evening. Porters carry group gear; you carry your own daypack.',
                'type' => 'open', 'departure_at' => now()->addDays(23)->setTime(21, 0), 'return_at' => now()->addDays(25)->setTime(20, 0),
                'meeting_point' => 'Terminal Pasar Rebo, Jakarta Timur', 'max_participants' => 20, 'price_idr' => 275000,
                'includes' => ['Transport PP Jakarta–Garut', 'Porter grup', 'Makan 3x', 'Tenda & matras', 'Tiket masuk'],
                'whatsapp_link' => 'https://chat.whatsapp.com/example-papandayan', 'beginner_friendly' => true, 'status' => 'open'],
        );
        $tripB = Trip::firstOrCreate(
            ['organizer_id' => $rina->id, 'trail_id' => $gede->id, 'title' => 'Gede 2.958 mdpl via Cibodas'],
            ['description' => 'SIMAKSI quota already secured for 10. Certified guide, camp at Kandang Badak, summit at dawn, down via Suryakencana.',
                'type' => 'open', 'departure_at' => now()->addDays(30)->setTime(22, 0), 'return_at' => now()->addDays(32)->setTime(19, 0),
                'meeting_point' => 'Stasiun Bogor, pintu utara', 'max_participants' => 10, 'price_idr' => 450000,
                'includes' => ['SIMAKSI', 'Guide bersertifikat', 'Porter', 'Makan 4x', 'Tenda'],
                'whatsapp_link' => 'https://chat.whatsapp.com/example-gede', 'beginner_friendly' => false, 'status' => 'open'],
        );
        $tripC = Trip::firstOrCreate(
            ['organizer_id' => $budi->id, 'trail_id' => $rinjani->id, 'title' => 'Rinjani 4D3N: Sembalun to Senaru'],
            ['description' => 'Full traverse. Fly CGK–LOP together or meet in Sembalun. Licensed trekking organizer, porters and guide included. Foreign-visitor permit handled on your behalf.',
                'type' => 'open', 'departure_at' => now()->addDays(45)->setTime(5, 0), 'return_at' => now()->addDays(48)->setTime(18, 0),
                'meeting_point' => 'Sembalun Lawang basecamp (or CGK Terminal 3, 05:00)', 'max_participants' => 12, 'price_idr' => 3250000,
                'includes' => ['Permit TNGR', 'Guide & 2 porter', 'Makan penuh', 'Tenda, sleeping bag', 'Transport Lombok'],
                'whatsapp_link' => null, 'beginner_friendly' => false, 'status' => 'open'],
        );

        foreach ([[$tripA, $budi, 'confirmed'], [$tripA, $emma, 'paid'], [$tripB, $emma, 'pending'], [$tripC, $rina, 'confirmed']] as [$trip, $user, $status]) {
            $trip->memberships()->firstOrCreate(['user_id' => $user->id], [
                'status' => $status,
                'paid_at' => $status !== 'pending' ? now()->subDays(2) : null,
                'confirmed_at' => $status === 'confirmed' ? now()->subDay() : null,
            ]);
        }

        Post::firstOrCreate(
            ['user_id' => $budi->id, 'trail_id' => $pangrango->id, 'body' => 'Summit Pangrango 3.019 mdpl. Trek dari Cibodas cukup menantang tapi view Mandalawangi luar biasa. Jalur licin setelah hujan, hati-hati ya.'],
            ['type' => 'story', 'likes_count' => 24, 'comments_count' => 0, 'created_at' => now()->subHours(2)],
        );
        Post::firstOrCreate(
            ['user_id' => $rina->id, 'trail_id' => $salak->id, 'body' => 'Trail update Salak via Cidahu: fallen tree between Pos 3 and Pos 4, passable with care. Pos 2 spring still flowing. SIMAKSI now fully online at halimunsalak.org.'],
            ['type' => 'condition_alert', 'likes_count' => 41, 'comments_count' => 0, 'created_at' => now()->subHours(5)],
        );
        Post::firstOrCreate(
            ['user_id' => $emma->id, 'trail_id' => $papandayan->id, 'body' => 'First Indonesian volcano done. Papandayan was the perfect intro: easy gradient, otherworldly crater, and the open-trip crew made a solo traveller feel like part of the family. Already booked Gede.'],
            ['type' => 'story', 'likes_count' => 67, 'comments_count' => 0, 'created_at' => now()->subDay()],
        );
    }
}
