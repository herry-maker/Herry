# Sidang Kecil Sebelum Sidang — Treatment (naskah produksi)

Cerita 3 dari seri *Vidka menulis skripsi*. Gaya: **Stick-figure Explainer** (火柴人讲解, pustaka Lemo-Opuscar, `styles/stick-explainer/STYLE.md`). Bahasa film: Indonesia. Durasi 180 s = 12 adegan × 15 s (≈ 10 s dialog + 5 s jeda berpikir). 1920×1080, 60 fps (ditetapkan STYLE.md). Suara: tiga karakter berdialog, tanpa narator. Pertanyaan jeda tampil sebagai teks dan **tidak dibacakan**.

Tokoh tetap dari Cerita 1 dan 2: **Vidka** (mahasiswi, sedang menyelesaikan skripsi lima bab tentang koordinasi tempo dalam ansambel), **Dr. Herry** (dosen pembimbing), **Prof. Ardipal** (penguji senior). Tidak ada tokoh baru. Penonton berperan sebagai **pembaca keempat**.

---

## 0. Ringkasan brief dan keputusan yang diambil sendiri

| Hal | Keputusan |
|---|---|
| Gaya | Stick-figure Explainer. Semua invarian STYLE.md dipertahankan: kertas hangat, tinta satu bobot, satu warna aksen, tubuh "selang" kontinu, tangan yang bergandengan menjadi satu kurva. |
| Bahasa | Indonesia untuk dialog, subtitle, judul, kartu pertanyaan. Satu baris subtitle (36 px) di tempat baris atas versi demo. |
| Suara | Tiga suara ElevenLabs (bahasa Indonesia), satu berkas per kalimat. Alasan: layanan Microsoft (edge-tts) dan Hugging Face tidak dapat dijangkau dari lingkungan ini, Kokoro tidak punya bahasa Indonesia. |
| Musik | Disintesis dari kode (numpy) dalam palet STYLE.md §7: kalimba, celesta, marimba, vibrafon. Tanpa pustaka sampel (unduhannya terblokir). |
| Storyboard | Tidak diminta; produksi langsung. |
| Panjang | 3 menit berada di batas atas anjuran DIRECTOR.md §1 (biaya render dan token berlipat). Diterima karena struktur 12 × 15 s adalah permintaan eksplisit. |
| Contoh skripsi | Struktur lima bab, label kecil *Contoh simulasi* pada adegan 6; harus disesuaikan dengan pedoman kampus (disebut pada kartu penutup). |

---

## 1. Tiga kandidat struktur, dan pilihan

**A. Dua belas meja periksa (katalog).** Setiap adegan berdiri sendiri: satu masalah, satu perbaikan. Kuat untuk dipotong per adegan di kelas, lemah sebagai film: tidak ada yang berubah dari adegan 1 ke 12 selain daftar.

**B. Rantai bab yang putus dan disambung kembali (before/after).** Skripsi Vidka digambar sebagai **lima figur kecil berpegangan tangan di atas garis meja** (Bab I–V). Di adegan pembuka mereka tampak sudah bergandengan. Setiap pertanyaan dosen menunjukkan satu pegangan yang sebenarnya **lepas** (tujuan ↔ kesimpulan, teori ↔ suara penulis, data ↔ klaim). Vidka memperbaiki, pegangan tersambung, dan di akhir **denyut aksen** berjalan dari Bab I sampai Bab V tanpa putus. Dua belas adegan tetap utuh, tetapi semuanya menggerakkan satu bentuk.

**C. Hitung mundur sidang.** Jam di sudut, dua belas kesalahan dikurangi satu per satu sampai nol. Dramatis, tetapi menjadikan pembacaan kritis sebagai lomba melawan waktu, berlawanan dengan pesan cerita (membaca pelan, memeriksa hubungan).

**Pilihan: B.** Alasannya: (1) ia menjadikan *pesan utama cerita* ("pembaca dapat mengikuti hubungan antara persoalan, keputusan, bukti, dan kesimpulan") sebagai **bentuk yang terlihat**, bukan nasihat; (2) ia memakai gerak asli medium ini (*let go*, *the chain*, *the accent run*) tepat pada isinya: hubungan antarbab adalah pegangan tangan; (3) ia memberi arah emosi Vidka: percaya diri → defensif → penasaran → reflektif, dibaca dari postur, karena figur tidak punya wajah.

Pembuka dipilih dari ruang variasi STYLE.md §11: *barisan orang yang sudah bergandengan, lalu satu melepaskan*. Penutup: *semua berpaling menghadap satu orang* (ketiga tokoh dan kelima bab menghadap draf revisi yang dibuka Vidka), ditutup denyut yang mengalir sepanjang rantai.

## 2. Logline dan alur

**Logline.** Vidka yakin skripsinya selesai karena lima bab sudah terisi; dua dosen membaca ulang sebagai orang asing dan menunjukkan bahwa bab-bab itu berdiri berdampingan tetapi belum saling berpegangan, sampai Vidka memilih satu perbaikan terpenting: kesimpulan harus menjawab tujuan.

**Setup (adegan 1).** Map penjilidan, draf tebal, lima figur bab bergandengan di garis meja. Herry menahan map, menarik kursi.
**Turn (adegan 2–11).** Setiap pertanyaan membuka satu pegangan yang lepas; setiap perbaikan menyambungnya kembali. Titik balik emosi di adegan 6 ("Klaim saya terlalu luas"): pertama kali Vidka menyebut masalahnya sendiri.
**Ending (adegan 12).** Vidka menutup map, membuka draf revisi. Rantai lima bab tersambung penuh; denyut aksen berjalan Bab I → V. Tugas akhir untuk pembaca keempat.

**Arti aksen (satu arti sepanjang film):** *bagian draf yang sedang diperiksa pembaca* — kalimat yang disorot, pegangan yang lepas, lalu hubungan yang baru dibuat. Tidak pernah dekorasi, tidak pernah menandai pembicara.

## 3. Tolok ukur

Dipilih untuk gaya **dan** topik ini:

- **Explainer bergaya figur tongkat satu warna aksen** (kanal penjelasan yang berargumen dengan orang-orangan dan satu warna). *Dipelajari:* satu ide per layar, ruang kosong, naskah membawa logika, aksen hanya untuk satu hal. *Tidak diambil:* karakter, tata letak, huruf, musik, nama kanal.
- **Film pembelajaran dengan pertanyaan tersisip** (kuliah daring yang dijeda oleh soal). *Dipelajari:* letak jeda setelah masalah terlihat tetapi sebelum dijelaskan; pertanyaan tampil, tidak dibacakan. *Tidak diambil:* bentuk kuis pilihan ganda.
- **Komedi kantor dua kamera, adegan meja** (percakapan tiga orang di satu meja). *Dipelajari:* reaksi sebelum jawaban; kamera menahan ekspresi; kesalahan tidak dipermalukan. *Tidak diambil:* dialog, tokoh, blocking spesifik.

Landasan pedagogis yang disebut pada kartu penutup: Szpunar, Khan & Schacter (2013), *PNAS* 110(16): 6313–6317, pertanyaan tersisip mengurangi pikiran melantur dan meningkatkan pembelajaran kuliah daring; Brame (2016), *CBE—Life Sciences Education* 15(4): es6, fokus visual (signaling), segmentasi, dan aktivitas pengolahan. Penerapan pada cerita ini belum diuji pada mahasiswa dan dinyatakan demikian.

## 4. Lembar tokoh (model sheet)

Figur tidak berwajah, tanpa properti di kepala. Pembeda hanya dari tinggi, bobot garis, lengkung tulang punggung, dan kebiasaan pose; nama tampil sebagai label kapital kecil kelabu di dekat figur ketika pertama bicara.

| Tokoh | Tinggi (unit meja) | Bobot | Tulang punggung | Kebiasaan pose | Busur emosi |
|---|---|---|---|---|---|
| **Vidka** | 1.00 | A (tipis-sedang) | tegak, pinggul maju saat yakin | memegang draf di antara dua telapak; menunjuk dengan tangan penuh | yakin → defensif (bahu naik, draf ditarik ke dada) → penasaran (badan condong ke halaman) → reflektif (duduk, dua tangan di meja) |
| **Dr. Herry** | 1.07 | B (sedang) | tegak lembut, condong 4° ke lawan bicara | tangan terbuka, satu tangan di sandaran kursi | tetap ramah; gerak paling sedikit |
| **Prof. Ardipal** | 1.12 | C (paling tebal) | melengkung 8° ke depan (usia) | jari (ujung lengan) menelusuri halaman; berhenti lama sebelum bicara | tetap kritis; kepala miring saat bertanya |
| **Lima bab** | 0.30 | A (diskalakan √) | tegak | berdiri di garis meja, bergandengan; pegangan yang lepas digambar dua tangan jatuh | I: masalah · II: teori · III: metode · IV: hasil · V: pembahasan–kesimpulan |

Properti dalam satu bobot tinta: **meja** (garis sistem, y ≈ 700 px dunia), **dua kursi**, **map penjilidan** (persegi panjang isi warna kertas-tint), **draf** (tumpukan halaman, garis teks kelabu), **laptop** (satu persegi miring) di adegan 7, **pedoman kampus** (buku tipis) di adegan 11. Rekaman di adegan 5 digambar sebagai empat kartu kecil, tiga bertanda ★ kelabu.

## 5. Daftar shot (12 adegan)

Semua waktu absolut. Ukuran figur: subjek ≥ ⅓ tinggi bingkai pada momen kunci; semua subjek di atas y ≈ 920 px layar.

| # | Waktu | Framing & sudut | Gerak kamera | Isi | Mengapa dibingkai begitu |
|---|---|---|---|---|---|
| 1 | 0:00–0:15 | Wide → medium | **Locked**, lalu **push in** pelan ke Vidka (zoom log 1.0→1.35) selama "Boleh… asal jangan terlalu sulit." | Vidka memasukkan draf ke map. Herry menahan map, menarik kursi. Ardipal duduk. Lima bab bergandengan di garis meja. | Aturan dibuat dalam bingkai terkunci; push in menyimpan satu ekspresi tubuh: postur yakin melunak. |
| 2 | 0:15–0:30 | Close pada halaman, dari atas | **Pan mengikuti jari** Ardipal melewati paragraf, lalu **cut** ke halaman tujuh; satu kalimat masalah menyala aksen. | Dua halaman pertama penuh garis kelabu; kalimat masalah baru muncul di halaman tujuh. | Jarak antarhalaman harus *terlihat*, bukan disebut. |
| 3 | 0:30–0:45 | Dua halaman berdampingan, medium | **Match transform**: dua halaman meluncur menjauh → menjadi Bab I dan Bab V di rantai; tangan keduanya **let go**. | Istilah *koordinasi tempo* dan *percaya diri* ditahan di dua kolom. Vidka menarik pensil, berhenti. | Shot tanda tangan: ketidakselarasan tujuan–kesimpulan menjadi bentuk yang bisa dilihat. |
| 4 | 0:45–1:00 | Close-up tiga kutipan | **Locked**, lalu **tilt** ke ruang kosong di bawahnya. | "Menurut A, B, C" sebagai tiga blok kelabu terpisah; ruang kosong; Vidka menulis *Dari perbandingan tersebut…* (aksen). Bab II melepas pegangan, lalu menyambung saat kalimat ditulis. | Ruang kosong adalah kekurangannya; biarkan ia memenuhi bingkai. |
| 5 | 1:00–1:15 | Medium, meja | **Locked**; objek bergerak, kamera tidak. | Tiga kartu rekaman ★ di depan, satu tersisih di tepi (kelabu). Vidka menarik yang tersisih ke tengah. | Pilihan bahan terlihat dari susunan benda. |
| 6 | 1:15–1:30 | Close ke satu kutipan → **pull back** | Kamera mundur (zoom 1.5→0.8) memperlihatkan berkas peserta lain yang belum dibuka. | Vidka menunjuk satu kutipan (aksen); berkas lain kelabu, tertutup. Label kecil *Contoh simulasi*. | Pull back = "satu kasus menjadi banyak". Titik balik emosi. |
| 7 | 1:30–1:45 | Insert laptop, lalu medium | **Push in** ke dua baris tabel, **hold**. | Tabel padat (kisi kelabu). Dua baris menyala aksen; satu kalimat penjelas ditulis di bawah tabel. | Pembaca perlu diberi tahu di mana melihat. |
| 8 | 1:45–2:00 | Dua halaman, pan | **Pan** kiri–kanan dua kali mengikuti mata Vidka. Bab IV ↔ Bab V pegangan longgar. | "Pemain saling melihat" / "pemain menggunakan pandangan". Vidka menulis *Dalam situasi apa?* | Pengulangan terasa saat mata bolak-balik. |
| 9 | 2:00–2:15 | Close pada kalimat rekomendasi | **Locked**. | Garis bawah tebal hampir ditarik; berhenti; *harus memakai* diganti *dapat dipertimbangkan untuk diuji*. | Satu keputusan kecil, satu bingkai. |
| 10 | 2:15–2:30 | Medium Vidka → close kalimat | **Push in** ke kalimat panjang, **cut** ke kalimat konkret. | "Implementasi koordinatif…" → "Pemain masuk bersama setelah anggukan." | Kejelasan dirasakan sebagai pergantian panjang kalimat. |
| 11 | 2:30–2:45 | **Track** mengikuti Herry | Kamera **track** dari sitasi → daftar pustaka → sumber; pedoman kampus di samping. | Vidka menambah penunjuk halaman (aksen). | Penelusuran adalah perjalanan; kamera ikut berjalan. |
| 12 | 2:45–3:00 | Medium → **pull back** wide | Kamera mundur ke bingkai pembuka; **accent run** Bab I → V; semua berpaling ke draf. | Map ditutup, draf revisi dibuka. Kartu tugas akhir. | Bookend; skala terlihat; pesan utama sebagai bentuk. |

Enam gerak kamera berbeda terpakai: locked, push in, pull back, pan/tilt, match transform, track.

## 6. Beat sheet (detik demi detik)

Pola tiap adegan (15 s): **0.0–0.6** masuk (aksi tanpa bicara) · **0.6–≈10.0** dialog · **≈10.0–10.6** reaksi Vidka tanpa kata · **10.6–15.0** kartu pertanyaan + jeda (≥ 4.4 s), musik berhenti, hanya nada ruang.

Detail per adegan (t relatif):

**1.** 0.0 Vidka mengangkat draf → 0.6 V: "Lima bab sudah lengkap. Tinggal dijilid!" → 3.4 Herry menahan map (foley tepuk lembut) → 3.8 H: "Sebelum itu, boleh kami menjadi pembaca yang belum mengenal penelitianmu?" → 7.6 kursi ditarik (foley) → 8.0 V: "Boleh… asal jangan terlalu sulit." → 10.2 push in selesai → 10.6 kartu: *Apa yang membuat pembaca percaya pada sebuah skripsi?* → 15.0.
**2.** 0.0 jari Ardipal di halaman 1 → 0.6 A: "Saya sudah membaca dua halaman. Mengapa penelitian ini perlu dilakukan?" → 4.6 V: "Masalahnya baru muncul di halaman tujuh." → 6.8 cut ke hal. 7, kalimat masalah menyala → 7.2 A: "Apa yang membuat pembaca menunggu sejauh itu?" → 10.6 kartu.
**3.** 0.0 dua halaman diletakkan → 0.6 H: "Tujuanmu memahami koordinasi tempo. Kesimpulanmu menyebut siswa lebih percaya diri." → 5.0 V: "Keduanya menarik." → 6.4 H: "Tetapi, apakah yang kedua menjawab tujuan pertama?" → 8.8 match transform: halaman → Bab I & V, tangan lepas (foley let-go) → 9.6 pensil Vidka berhenti → 10.6 kartu. **Hening penuh** sampai 15.0.
**4.** 0.6 A: "Di sini banyak 'menurut peneliti A, B, dan C'. Apa kesimpulanmu dari percakapan mereka?" → 5.4 V: "Saya belum menuliskannya." → 6.8 A: "Itulah hubungan yang dibutuhkan pembaca." → 8.8 Vidka menulis *Dari perbandingan tersebut…* (Bab II menyambung, tepuk kecil) → 10.6 kartu.
**5.** 0.6 H: "Mengapa memilih tiga sesi latihan ini?" → 2.8 V: "Rekamannya paling jelas." → 4.4 H: "Apakah sesi yang sulit atau berbeda justru terlewat?" → 7.8 Vidka menarik kartu tersisih (foley kertas) → 10.6 kartu.
**6.** 0.6 V: "Kutipan ini membuktikan semua pemain bergantung pada isyarat visual." → 4.2 A: "Ini ucapan satu pemain. Bagaimana pengalaman pemain lainnya?" → 7.4 pull back, berkas lain tampak → 8.2 V: "Klaim saya terlalu luas." → 10.6 kartu + label *Contoh simulasi*.
**7.** 0.6 H: "Tabel ini menunjukkan apa?" → 2.2 V: "Semua kejadian yang saya catat." → 4.0 H: "Pola mana yang perlu diperhatikan pembaca, dan mengapa pola itu penting?" → 7.8 dua baris menyala; kalimat penjelas ditulis → 10.6 kartu.
**8.** 0.6 A: "Hasilmu: pemain saling melihat. Pembahasanmu: pemain menggunakan pandangan." → 4.8 V: "Artinya sama." → 6.0 A: "Lalu, apa yang tindakan itu jelaskan tentang koordinasi mereka?" → 9.0 Vidka menulis *Dalam situasi apa?* → 10.6 kartu.
**9.** 0.6 V: "Semua guru harus memakai latihan ini." → 2.8 H: "Apakah efektivitasnya sudah kamu uji?" → 4.6 V: "Belum." → 5.4 H: "Tulis sebagai usulan yang perlu diuji." → 7.6 kata diganti (aksen) → 10.6 kartu.
**10.** 0.6 V: "'Implementasi koordinatif menghasilkan optimalisasi temporal.'" → 4.0 A: "Apa maksudnya dalam kejadian yang kamu amati?" → 6.4 V: "Pemain masuk bersama setelah anggukan." → 8.4 A: "Mulai dari kejelasan itu." → 10.6 kartu.
**11.** 0.6 H: "Saya ingin memeriksa kutipan ini. Halamannya di mana?" → 3.4 V: "Belum tercatat." → 4.6 H: "Lengkapi penunjuk sumber sesuai pedoman. Pembaca perlu bisa menelusurinya." → 8.6 Vidka menulis nomor halaman → 10.6 kartu.
**12.** 0.6 A: "Masih ingin langsung dijilid?" → 2.4 V: "Saya ingin memperbaiki hubungan antarbab dulu." → 5.0 H: "Pilih satu perbaikan terpenting." → 6.6 **hening 0.8 s** → 7.4 V: "Memastikan kesimpulan benar-benar menjawab tujuan." → 9.6 accent run Bab I→V (glockenspiel 5 nada naik), semua berpaling → 10.8 kartu tugas akhir (ditahan sampai 15.0, lalu kartu kredit 0 s tambahan: kredit masuk ke 14.0–15.0 sebagai baris kecil).

Waktu dialog disesuaikan dengan durasi suara TTS yang terukur (`voice/dur.json`); kartu pertanyaan tidak pernah tampil kurang dari 4.4 s.

## 7. Peta cue (musik)

Tempo **72 BPM** (satu ketuk = 0.833 s; 15 s = 18 ketuk). Grid per adegan: ketuk 1 masuk, ketuk 13 (10.0 s) reaksi, ketuk 13.7 kartu, ketuk 18 cut.

| Bagian | Adegan | Instrumen | Keadaan musik |
|---|---|---|---|
| Pembuka | 1 | kalimba motif 4 nada (D–F#–A–B), celesta | ringan, bergerak; duck di bawah dialog |
| Pemeriksaan I | 2–5 | kalimba + marimba (nada rendah tiap pegangan lepas) | satu nada marimba per masalah yang terlihat; **berhenti total** di jeda |
| Titik balik | 6 | vibrafon akor minor terbuka saat pull back | lalu hening sampai kartu |
| Pemeriksaan II | 7–11 | kalimba motif dibalik (B–A–F#–D), celesta untuk perbaikan | tiap perbaikan: celesta dua nada naik |
| Penutup | 12 | glockenspiel 5 nada naik mengikuti denyut; vibrafon + string lembut akor D mayor | satu akor ditahan di bawah kartu tugas akhir |

Setiap cut adegan jatuh pada ketuk 1. Kartu pertanyaan masuk pada 10.6 s (ketuk 13.7): musik sudah hening sejak 10.0 s, sehingga kemunculan teks hanya ditandai satu *paper tick*.

## 8. Tabel desain suara

| Bagian | Ambiens | Foley utama | Musik |
|---|---|---|---|
| 1 | ruang kerja pelan (noise terfilter, −38 dB) | tepuk map, geser kursi, kertas | kalimba masuk |
| 2 | sama | jari menelusuri kertas (gesek halus), *tick* saat kalimat menyala | kalimba, marimba 1 nada |
| 3 | sama | dua halaman meluncur, **let-go** (tepuk balik), pensil berhenti | marimba; **hening** 8.8–15.0 |
| 4 | sama | *tick* tiga kutipan, pensil menulis, **clasp** kecil | kalimba |
| 5 | sama | kartu ditarik di meja | kalimba |
| 6 | sama | *whoosh* lembut pull back, berkas kelabu diam | vibrafon akor |
| 7 | sama + kipas laptop sangat halus | dua *tick* baris tabel, pensil | kalimba balik |
| 8 | sama | pan: dua *tick* bolak-balik, pensil | kalimba |
| 9 | sama | pensil ditekan, berhenti; coretan ganti kata | celesta dua nada |
| 10 | sama | *tick* kalimat panjang, cut (hit rendah lembut) | celesta |
| 11 | sama | langkah kamera (gesek kertas tiga kali), buku tipis dibuka | kalimba |
| 12 | sama | map ditutup, draf dibuka, **accent run** (glockenspiel 5 nada), tepuk 4 clasp | akor D mayor ditahan |

Suara: dikompresi, ≈ 10 dB RMS di atas musik; musik mengalah 300 Hz–4 kHz dan duck di bawah tiap kalimat. Master −14 LUFS, true peak ≤ −1 dBTP. Dua hening nyata: adegan 3 (8.8–15.0) dan adegan 12 (6.6–7.4) sebelum kalimat terpenting. Transisi suara: J-cut (gesek kertas adegan 2 masuk 0.3 s sebelum cut) dan L-cut (akor vibrafon adegan 6 mengalir 0.6 s ke adegan 7).

## 9. Desain subtitle, kartu, dan judul

- Huruf: **Jost** (OFL) untuk semua teks. Judul 600/84 px tracking −2; kartu pertanyaan 600/64–72 px; label kapital kecil 500/21 px tracking +3; subtitle 400/36 px.
- Semua rata kiri pada margin 124 px, kecuali teks di dalam bentuk tertutup (tidak ada dalam film ini).
- **Subtitle**: kiri bawah, batang aksen 4 px di margin, satu baris Indonesia 36 px tinta; nama pembicara sebagai kapital kecil kelabu di atas baris. Tahan ≥ max(1.8 s, durasi ucapan + 0.6 s). Subjek selalu di atas y ≈ 920.
- **Kartu pertanyaan**: muncul pada 10.6 s setiap adegan, meluncur naik 18 px sambil fade 0.4 s, kolom kiri; label kapital kecil kelabu *pembaca keempat · jeda 5 detik*; garis kelabu tipis di bawah label memendek selama jeda (bukan angka, bukan jam). Kartu tidak dibacakan.
- **Kartu judul** 0.0–3.0 s di atas adegan 1 (bukan sebelum aksi): *Sidang Kecil Sebelum Sidang* + baris kecil *Cerita 3 · Vidka, Dr. Herry, Prof. Ardipal*.
- **Kartu penutup** (adegan 12, 10.8–15.0): tugas akhir dua baris, lalu baris kecil kelabu: *Contoh struktur lima bab; sesuaikan dengan pedoman kampus. Pola pertanyaan tersisip: Szpunar, Khan & Schacter 2013; Brame 2016.*

## 10. Catatan untuk pengajar (ikut dalam deskripsi film)

Jeda lima detik tidak menuntut jawaban lengkap; ia memberi waktu mulai mempertimbangkan. Untuk diskusi kelas, jeda video pada adegan **3, 6, dan 8**, minta mahasiswa menjelaskan alasannya kepada teman. Format pertanyaan tersisip mengikuti bukti Szpunar dkk. (2013) dan prinsip fokus visual Brame (2016); penerapannya pada cerita ini belum diuji pada mahasiswa.

## 11. Pemeriksaan "bukan demo lagi" (diisi setelah DEMO.md dibaca)

| Unsur | Demo (*Six Hands Away*) | Film ini |
|---|---|---|
| Struktur | rantai → cincin → globe | before/after: rantai lima bab putus–tersambung |
| Pembuka | rantai terbentuk di antara dua ujung | barisan sudah bergandengan, satu melepaskan |
| Shot tanda tangan | fractal pull back cincin | match transform dua halaman → dua bab yang lepas tangan |
| Jalur kamera | zoom orde besaran, dive | locked/push/pan/track dalam satu ruang meja |
| Bentuk skor | tumbuh menuju akor global | motif–hening–motif dibalik; dua hening |
| Penutup | bentuk penuh menutup globe | semua berpaling ke draf; denyut sepanjang rantai |
