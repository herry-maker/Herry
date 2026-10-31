<?php

namespace Database\Seeders;

use App\Models\Trail;
use Illuminate\Database\Seeder;

class TrailSeeder extends Seeder
{
    public function run(): void
    {
        $simaksi = 'https://bookingwisata.menlhk.go.id';

        $trails = [
            [
                'name' => 'Gunung Gede', 'slug' => 'gunung-gede', 'regency' => 'Cianjur', 'province' => 'Jawa Barat',
                'elevation_m' => 2958, 'length_km' => 16.0, 'difficulty' => 'sedang', 'hours_from_jakarta' => 3.0,
                'permit_type' => 'simaksi', 'permit_url' => $simaksi, 'daily_quota' => 300,
                'permit_fee_local_idr' => 29000, 'permit_fee_foreign_idr' => 320000,
                'basarnas_required' => true, 'guide_required' => false, 'lat' => -6.7872, 'lng' => 106.9817, 'cover_gradient' => 'gede',
                'description_en' => 'The most popular summit near Jakarta. The Cibodas route passes Telaga Biru, Cibeureum waterfall and the hot springs before the alun-alun Suryakencana edelweiss meadow. Quota of 300 hikers per day fills weeks ahead on weekends.',
                'description_id' => 'Puncak paling populer dekat Jakarta. Jalur Cibodas melewati Telaga Biru, Curug Cibeureum dan air panas sebelum alun-alun Suryakencana yang penuh edelweiss. Kuota 300 pendaki per hari sering penuh berminggu-minggu sebelumnya di akhir pekan.',
            ],
            [
                'name' => 'Gunung Pangrango', 'slug' => 'gunung-pangrango', 'regency' => 'Cianjur', 'province' => 'Jawa Barat',
                'elevation_m' => 3019, 'length_km' => 18.0, 'difficulty' => 'berat', 'hours_from_jakarta' => 3.0,
                'permit_type' => 'simaksi', 'permit_url' => $simaksi, 'daily_quota' => 300,
                'permit_fee_local_idr' => 29000, 'permit_fee_foreign_idr' => 320000,
                'basarnas_required' => true, 'guide_required' => false, 'lat' => -6.7800, 'lng' => 106.9700, 'cover_gradient' => 'gede',
                'description_en' => 'Gede\'s quieter twin. Steeper final push through mossy forest to Mandalawangi valley. Shares the Gede SIMAKSI quota.',
                'description_id' => 'Saudara kembar Gede yang lebih sunyi. Tanjakan akhir lebih curam melewati hutan lumut menuju lembah Mandalawangi. Berbagi kuota SIMAKSI dengan Gede.',
            ],
            [
                'name' => 'Gunung Salak', 'slug' => 'gunung-salak', 'regency' => 'Sukabumi', 'province' => 'Jawa Barat',
                'elevation_m' => 2211, 'length_km' => 10.0, 'difficulty' => 'berat', 'hours_from_jakarta' => 2.5,
                'permit_type' => 'simaksi', 'permit_url' => 'https://halimunsalak.org', 'daily_quota' => 150,
                'permit_fee_local_idr' => 20000, 'permit_fee_foreign_idr' => 250000,
                'basarnas_required' => true, 'guide_required' => true, 'lat' => -6.7178, 'lng' => 106.7333, 'cover_gradient' => 'salak',
                'description_en' => 'Dense, wet and technical for its height. Leeches in the rainy season, steep roots on the Cidahu route. A local guide is required on the Curug Nangka approach.',
                'description_id' => 'Lebat, basah dan teknis untuk ketinggiannya. Banyak pacet di musim hujan, akar curam di jalur Cidahu. Guide lokal wajib untuk pendekatan Curug Nangka.',
            ],
            [
                'name' => 'Gunung Halimun', 'slug' => 'gunung-halimun', 'regency' => 'Lebak', 'province' => 'Banten',
                'elevation_m' => 1929, 'length_km' => 14.0, 'difficulty' => 'sedang', 'hours_from_jakarta' => 3.0,
                'permit_type' => 'simaksi', 'permit_url' => 'https://halimunsalak.org', 'daily_quota' => 100,
                'permit_fee_local_idr' => 20000, 'permit_fee_foreign_idr' => 250000,
                'basarnas_required' => false, 'guide_required' => true, 'lat' => -6.7000, 'lng' => 106.4500, 'cover_gradient' => 'halimun',
                'description_en' => 'Primary rainforest and canopy walk inside Halimun-Salak National Park. Known for gibbons, hornbills and near-constant mist.',
                'description_id' => 'Hutan hujan primer dan canopy walk di dalam TN Halimun-Salak. Terkenal dengan owa, rangkong dan kabut hampir sepanjang hari.',
            ],
            [
                'name' => 'Gunung Papandayan', 'slug' => 'gunung-papandayan', 'regency' => 'Garut', 'province' => 'Jawa Barat',
                'elevation_m' => 2665, 'length_km' => 12.0, 'difficulty' => 'mudah', 'hours_from_jakarta' => 4.5,
                'permit_type' => 'ticket', 'permit_url' => null, 'daily_quota' => null,
                'permit_fee_local_idr' => 30000, 'permit_fee_foreign_idr' => 300000,
                'basarnas_required' => false, 'guide_required' => false, 'lat' => -7.3200, 'lng' => 107.7300, 'cover_gradient' => 'papandayan',
                'description_en' => 'Active crater, sulphur vents and the Tegal Alun edelweiss plain. Gentle gradient makes it the standard first mountain for Jakarta hikers.',
                'description_id' => 'Kawah aktif, semburan belerang dan padang edelweiss Tegal Alun. Gradien landai menjadikannya gunung pertama standar bagi pendaki Jakarta.',
            ],
            [
                'name' => 'Gunung Ciremai', 'slug' => 'gunung-ciremai', 'regency' => 'Kuningan', 'province' => 'Jawa Barat',
                'elevation_m' => 3078, 'length_km' => 20.0, 'difficulty' => 'ekstrem', 'hours_from_jakarta' => 5.0,
                'permit_type' => 'esimaksi', 'permit_url' => $simaksi, 'daily_quota' => 200,
                'permit_fee_local_idr' => 50000, 'permit_fee_foreign_idr' => 350000,
                'basarnas_required' => true, 'guide_required' => false, 'lat' => -6.8922, 'lng' => 108.4069, 'cover_gradient' => 'ciremai',
                'description_en' => 'Highest peak in West Java. Long, dry and relentless on the Linggarjati route; Palutungan is more forgiving. Carry all water from basecamp.',
                'description_id' => 'Puncak tertinggi Jawa Barat. Panjang, kering dan tanpa ampun di jalur Linggarjati; Palutungan lebih ramah. Bawa semua air dari basecamp.',
            ],
            [
                'name' => 'Gunung Prau', 'slug' => 'gunung-prau', 'regency' => 'Wonosobo', 'province' => 'Jawa Tengah',
                'elevation_m' => 2565, 'length_km' => 8.0, 'difficulty' => 'mudah', 'hours_from_jakarta' => 7.0,
                'permit_type' => 'ticket', 'permit_url' => null, 'daily_quota' => null,
                'permit_fee_local_idr' => 25000, 'permit_fee_foreign_idr' => 100000,
                'basarnas_required' => false, 'guide_required' => false, 'lat' => -7.1850, 'lng' => 109.9200, 'cover_gradient' => 'prau',
                'description_en' => 'Dieng plateau classic. Short climb, golden-hour view of Sindoro and Sumbing floating above the clouds. Very crowded on weekends.',
                'description_id' => 'Klasik dataran tinggi Dieng. Pendakian singkat, pemandangan golden hour Sindoro dan Sumbing mengapung di atas awan. Sangat ramai di akhir pekan.',
            ],
            [
                'name' => 'Gunung Puntang', 'slug' => 'gunung-puntang', 'regency' => 'Bandung', 'province' => 'Jawa Barat',
                'elevation_m' => 2223, 'length_km' => 9.0, 'difficulty' => 'sedang', 'hours_from_jakarta' => 3.5,
                'permit_type' => 'ticket', 'permit_url' => null, 'daily_quota' => null,
                'permit_fee_local_idr' => 15000, 'permit_fee_foreign_idr' => 50000,
                'basarnas_required' => false, 'guide_required' => false, 'lat' => -7.1300, 'lng' => 107.6200, 'cover_gradient' => 'halimun',
                'description_en' => 'Dutch-era radio station ruins at the base, pine forest and a compact summit with Bandung basin views.',
                'description_id' => 'Reruntuhan stasiun radio Belanda di kaki gunung, hutan pinus dan puncak kompak dengan pemandangan cekungan Bandung.',
            ],
            [
                'name' => 'Gunung Sumbing', 'slug' => 'gunung-sumbing', 'regency' => 'Magelang', 'province' => 'Jawa Tengah',
                'elevation_m' => 3371, 'length_km' => 16.0, 'difficulty' => 'berat', 'hours_from_jakarta' => 8.0,
                'permit_type' => 'ticket', 'permit_url' => null, 'daily_quota' => null,
                'permit_fee_local_idr' => 30000, 'permit_fee_foreign_idr' => 150000,
                'basarnas_required' => false, 'guide_required' => false, 'lat' => -7.3840, 'lng' => 110.0700, 'cover_gradient' => 'ciremai',
                'description_en' => 'Second-highest in Central Java. Exposed ridges above the tree line and a dramatic crater rim. Garung route is the standard.',
                'description_id' => 'Tertinggi kedua di Jawa Tengah. Punggungan terbuka di atas garis pohon dan bibir kawah dramatis. Jalur Garung adalah standar.',
            ],
            [
                'name' => 'Gunung Semeru', 'slug' => 'gunung-semeru', 'regency' => 'Lumajang', 'province' => 'Jawa Timur',
                'elevation_m' => 3676, 'length_km' => 36.0, 'difficulty' => 'ekstrem', 'hours_from_jakarta' => 14.0,
                'permit_type' => 'esimaksi', 'permit_url' => $simaksi, 'daily_quota' => 600,
                'permit_fee_local_idr' => 19000, 'permit_fee_foreign_idr' => 210000,
                'basarnas_required' => true, 'guide_required' => false, 'lat' => -8.1077, 'lng' => 112.9224, 'cover_gradient' => 'ciremai',
                'description_en' => 'Java\'s highest point and an active volcano. Ranu Kumbolo lake camp, then the sand slope to Mahameru before the 09:00 cut-off. Permit quotas open monthly.',
                'description_id' => 'Titik tertinggi Jawa dan gunung api aktif. Camp di Ranu Kumbolo, lalu lereng pasir ke Mahameru sebelum batas waktu 09.00. Kuota izin dibuka bulanan.',
            ],
            [
                'name' => 'Gunung Rinjani', 'slug' => 'gunung-rinjani', 'regency' => 'Lombok Timur', 'province' => 'Nusa Tenggara Barat',
                'elevation_m' => 3726, 'length_km' => 40.0, 'difficulty' => 'ekstrem', 'hours_from_jakarta' => 6.0,
                'permit_type' => 'esimaksi', 'permit_url' => 'https://erinjani.id', 'daily_quota' => 400,
                'permit_fee_local_idr' => 20000, 'permit_fee_foreign_idr' => 200000,
                'basarnas_required' => true, 'guide_required' => true, 'lat' => -8.4111, 'lng' => 116.4575, 'cover_gradient' => 'prau',
                'description_en' => 'Indonesia\'s most international trek. Crater lake Segara Anak, hot springs and a brutal scree summit. Guide and porter are mandatory; 2 hours by air from Jakarta plus 3 hours drive.',
                'description_id' => 'Trek paling internasional di Indonesia. Danau kawah Segara Anak, air panas dan puncak scree yang brutal. Guide dan porter wajib; 2 jam penerbangan dari Jakarta plus 3 jam perjalanan darat.',
            ],
            [
                'name' => 'Gunung Bromo', 'slug' => 'gunung-bromo', 'regency' => 'Probolinggo', 'province' => 'Jawa Timur',
                'elevation_m' => 2329, 'length_km' => 4.0, 'difficulty' => 'mudah', 'hours_from_jakarta' => 13.0,
                'permit_type' => 'ticket', 'permit_url' => $simaksi, 'daily_quota' => null,
                'permit_fee_local_idr' => 34000, 'permit_fee_foreign_idr' => 220000,
                'basarnas_required' => false, 'guide_required' => false, 'lat' => -7.9425, 'lng' => 112.9530, 'cover_gradient' => 'papandayan',
                'description_en' => 'Sea of sand, sunrise from Penanjakan and 250 steps to the crater rim. More viewpoint than hike, but the first volcano for many overseas visitors.',
                'description_id' => 'Lautan pasir, sunrise dari Penanjakan dan 250 anak tangga ke bibir kawah. Lebih ke viewpoint daripada pendakian, tapi gunung api pertama bagi banyak wisatawan mancanegara.',
            ],
        ];

        foreach ($trails as $trail) {
            Trail::updateOrCreate(['slug' => $trail['slug']], $trail);
        }
    }
}
