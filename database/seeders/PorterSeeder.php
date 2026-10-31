<?php

namespace Database\Seeders;

use App\Models\Porter;
use App\Models\Trail;
use Illuminate\Database\Seeder;

class PorterSeeder extends Seeder
{
    public function run(): void
    {
        $t = Trail::pluck('id', 'slug');

        $porters = [
            ['slug' => 'pak-ujang-cibodas', 'name' => 'Pak Ujang', 'phone' => '+62 857-2211-0931', 'role' => 'porter', 'base_area' => 'Cibodas, Cianjur',
                'rate_idr_per_day' => 200000, 'languages' => ['id'], 'is_verified' => true, 'license_no' => null, 'rating_avg' => 4.9, 'rating_count' => 112, 'trips_led' => 340,
                'trails' => ['gunung-gede', 'gunung-pangrango'],
                'bio_en' => 'Twenty years carrying for Gede-Pangrango. Knows every water point on the Cibodas and Gunung Putri routes. Carries up to 25 kg.',
                'bio_id' => 'Dua puluh tahun jadi porter Gede-Pangrango. Hafal semua titik air di jalur Cibodas dan Gunung Putri. Angkut sampai 25 kg.'],
            ['slug' => 'dede-firmansyah', 'name' => 'Dede Firmansyah', 'phone' => '+62 812-9087-4455', 'role' => 'guide', 'base_area' => 'Cipanas, Cianjur',
                'rate_idr_per_day' => 450000, 'languages' => ['id', 'en'], 'is_verified' => true, 'license_no' => 'HPI-JB-2019-0412', 'rating_avg' => 4.8, 'rating_count' => 76, 'trips_led' => 190,
                'trails' => ['gunung-gede', 'gunung-pangrango', 'gunung-salak'],
                'bio_en' => 'Licensed HPI guide, fluent English. Handles SIMAKSI paperwork for foreign visitors and runs small-group summit pushes with a 100% safe-return record.',
                'bio_id' => 'Guide berlisensi HPI, bahasa Inggris lancar. Mengurus SIMAKSI untuk WNA dan memimpin summit grup kecil dengan rekor pulang selamat 100%.'],
            ['slug' => 'asep-cidahu', 'name' => 'Asep Saepudin', 'phone' => '+62 859-3341-7720', 'role' => 'guide', 'base_area' => 'Cidahu, Sukabumi',
                'rate_idr_per_day' => 350000, 'languages' => ['id'], 'is_verified' => true, 'license_no' => 'TNGHS-G-077', 'rating_avg' => 4.7, 'rating_count' => 41, 'trips_led' => 95,
                'trails' => ['gunung-salak', 'gunung-halimun'],
                'bio_en' => 'Park-registered guide for Halimun-Salak, required on the Curug Nangka approach. Expert in wet-season route finding and leech management.',
                'bio_id' => 'Guide terdaftar TNGHS, wajib untuk jalur Curug Nangka. Ahli navigasi musim hujan dan penanganan pacet.'],
            ['slug' => 'yayan-cisurupan', 'name' => 'Yayan Hermawan', 'phone' => '+62 821-7765-3108', 'role' => 'porter', 'base_area' => 'Cisurupan, Garut',
                'rate_idr_per_day' => 150000, 'languages' => ['id'], 'is_verified' => true, 'license_no' => null, 'rating_avg' => 4.8, 'rating_count' => 58, 'trips_led' => 210,
                'trails' => ['gunung-papandayan'],
                'bio_en' => 'Papandayan basecamp porter. Sets up Pondok Saladah camp before you arrive, cooks a mean nasi goreng at 2,300 m.',
                'bio_id' => 'Porter basecamp Papandayan. Menyiapkan camp Pondok Saladah sebelum kamu tiba, masak nasi goreng enak di 2.300 m.'],
            ['slug' => 'rudi-linggarjati', 'name' => 'Rudi Setiawan', 'phone' => '+62 813-2290-6641', 'role' => 'porter', 'base_area' => 'Linggarjati, Kuningan',
                'rate_idr_per_day' => 250000, 'languages' => ['id'], 'is_verified' => false, 'license_no' => null, 'rating_avg' => 4.6, 'rating_count' => 19, 'trips_led' => 60,
                'trails' => ['gunung-ciremai'],
                'bio_en' => 'Ciremai water specialist: hauls 20 L past Pos 5 where nothing flows. Linggarjati and Palutungan routes.',
                'bio_id' => 'Spesialis air Ciremai: angkut 20 L melewati Pos 5 yang kering. Jalur Linggarjati dan Palutungan.'],
            ['slug' => 'lalu-sembalun', 'name' => 'Lalu Wirya', 'phone' => '+62 878-6410-2255', 'role' => 'guide', 'base_area' => 'Sembalun Lawang, Lombok',
                'rate_idr_per_day' => 500000, 'languages' => ['id', 'en'], 'is_verified' => true, 'license_no' => 'TNGR-TO-2021-118', 'rating_avg' => 4.9, 'rating_count' => 203, 'trips_led' => 410,
                'trails' => ['gunung-rinjani'],
                'bio_en' => 'Licensed Rinjani trekking organiser. Full Sembalun-Senaru traverse with porters, tents and eRinjani permits included for international guests.',
                'bio_id' => 'Trekking organizer berlisensi Rinjani. Lintas penuh Sembalun-Senaru dengan porter, tenda dan izin eRinjani untuk tamu mancanegara.'],
            ['slug' => 'amaq-senaru', 'name' => 'Amaq Rudi', 'phone' => '+62 819-0733-8891', 'role' => 'porter', 'base_area' => 'Senaru, Lombok',
                'rate_idr_per_day' => 250000, 'languages' => ['id'], 'is_verified' => true, 'license_no' => null, 'rating_avg' => 4.8, 'rating_count' => 140, 'trips_led' => 380,
                'trails' => ['gunung-rinjani'],
                'bio_en' => 'Rinjani porter in sandals. 30 kg loads, crater rim camp set before sunset, hot tea at Segara Anak.',
                'bio_id' => 'Porter Rinjani bersandal. Beban 30 kg, camp bibir kawah siap sebelum senja, teh panas di Segara Anak.'],
            ['slug' => 'bambang-ranu-pani', 'name' => 'Bambang Sutrisno', 'phone' => '+62 852-3178-9902', 'role' => 'guide', 'base_area' => 'Ranu Pani, Lumajang',
                'rate_idr_per_day' => 400000, 'languages' => ['id', 'en'], 'is_verified' => true, 'license_no' => 'TNBTS-G-0455', 'rating_avg' => 4.7, 'rating_count' => 88, 'trips_led' => 150,
                'trails' => ['gunung-semeru', 'gunung-bromo'],
                'bio_en' => 'TNBTS guide for Semeru and Bromo. Times the Mahameru push to clear the 09:00 cut-off; arranges Ranu Pani briefing and health check.',
                'bio_id' => 'Guide TNBTS untuk Semeru dan Bromo. Mengatur summit Mahameru sebelum batas 09.00; mengurus briefing dan cek kesehatan di Ranu Pani.'],
        ];

        foreach ($porters as $data) {
            $trailSlugs = $data['trails'];
            unset($data['trails']);

            $porter = Porter::updateOrCreate(['slug' => $data['slug']], $data);
            $porter->trails()->sync(collect($trailSlugs)->map(fn ($s) => $t[$s])->filter()->all());
        }
    }
}
