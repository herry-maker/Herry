# Banyak Referensi, Mana yang Tepat? — proyek stickman-video-director

Skenario 12 adegan × 15 detik tentang memilih referensi dan menyusun rancangan penelitian (Vidka, Herry, Ardipal), diterapkan pada skill **[kaomei/stickman-video-director](https://github.com/kaomei/stickman-video-director)** mode **B · Code Engine, gaya B1 Minimal Line Art, 16:9**.

## Jawaban singkat: bisa, dengan tiga catatan

Skill ini bukan program yang menerima naskah lalu mengeluarkan video. Ia adalah paket instruksi untuk agen AI (Claude Code/Codex) ditambah **renderer lokal** (Node 20+, FFmpeg, `@napi-rs/canvas`) yang membaca satu berkas `project.json`: daftar *shot*, lapisan gambar/teks/garis dengan *keyframe*, subtitel bertanda waktu, dan satu rekaman narasi. Gambar aset dan suara **tidak** dibuat oleh skill; keduanya datang dari alat yang Anda konfigurasi (model gambar, TTS) atau dari berkas yang Anda sediakan.

Yang sudah dikerjakan di folder ini:

1. **Seluruh storyboard Anda dipindahkan ke `project.json`** (42 shot, 61 subtitel, 57 efek suara, tepat 180 detik), dengan keempat prioritas perbaikan Anda diterapkan: tidak ada kartu yang bertumpuk (kartu lama dihapus sebelum kartu baru masuk), informasi utama diperbesar (teks tulisan tangan 40–68 unit, kartu tugas satu kalimat), sudut kamera divariasikan per adegan (close-up objek, bidikan atas meja, dua tokoh, over-the-shoulder, insert simulasi berlabel), dan setiap adegan memperlihatkan **tindakan** membaca/menyusun (stabilo menyapu baris, pensil mencoret lalu menulis ulang, catatan digeser dan dihubungkan garis, kuesioner diturunkan, halaman dibalik).
2. **Berkas lolos validasi penuh renderer** (`validate` 180 detik: `valid: true`), termasuk gerbang paling ketat skill ini: gambar utama tidak boleh diam lebih dari 2,5 detik, diperiksa per piksel. Karena itu "jeda belajar" 4–5 detik dipertahankan dengan gerak kecil yang bermotif cerita (pensil mengetuk saat Vidka berpikir), bukan layar beku.
3. **Pratinjau sudah dirender**, lihat `preview/` (dan `review/pra-render.md` untuk tinjauan pra-render):
   - `sample-00-60s-scenes-1-4.mp4` — pratinjau resmi 60 detik (batas maksimum `preview` di runtime) dari timeline sebenarnya.
   - `draft-scenes-5-8.mp4`, `draft-scenes-9-12.mp4` — draf adegan 5–12 yang **diatur ulang waktunya** ke 0–60 detik agar bisa dilihat; timeline aslinya tetap `project.json`.
   - tiga *contact sheet* PNG untuk tinjauan cepat.

Status komponen (semua gerbang kelengkapan skill terpenuhi; yang tersisa adalah tinjauan independen dan persetujuan sampel):

| Komponen | Keadaan sekarang | Yang perlu Anda lakukan |
|---|---|---|
| Narasi dan dialog | **Selesai, versi dialog revisi** (24 Nov 2026). Tidak ada narator: 31 baris dialog dari tabel Anda direkam **per baris** lewat konektor ElevenLabs (Vidka = *Mona*, Herry = *Bayu*, Ardipal = *Dito*; 1.678 kredit). `tools/build-audio.mjs` menyusun `audio/narasi-dialog.wav` (181,0 s): tiap adegan = baris-baris dengan jeda 0,55 s, lalu hening sampai 5 detik jeda terpenuhi dan adegan minimal 15 s. Waktu cue **tepat** karena tiap baris adalah klipnya sendiri; baris berisi dua frasa dipecah pada jeda internal klip. SHA di `audio/narasi-dialog.sha256`. Take narator Bayu yang lama (`audio/take1/`) disimpan sebagai arsip. | Untuk mengganti satu baris: rekam ulang klipnya saja, jalankan `build-audio.mjs`, lalu `build-project.mjs --timing audio/timing-dialog.json`. |
| Gambar tokoh dan properti | **Tokoh dan properti utama** dari lembar hasil `gemini-3-pro-image` (3 lembar pose + 1 lembar properti, 4 × 1.218 kredit; sumber di `art-src/`), dipotong dan dibuat transparan oleh `tools/import-art.mjs` (isian berwarna dipertahankan). Masih buatan kode: meja, kotak pencarian, catatan tempel, kartu tugas, kursor. | Properti kode yang tersisa bersifat garis sederhana dan menyatu secara visual; ganti bila diinginkan. |
| Musik latar | **Terpasang**: "Easy Lemon" (Kevin MacLeod, incompetech.com, CC BY 4.0) dari pustaka audio upstream (`bootstrap.sh --with-audio-library`, `audio-library.mjs recommend --style B1 --beat opening`), berkas, lisensi, dan bukti akuisisi di `audio/music/`, gain 0,09, kredit tercantum di kartu tugas akhir dan `audio/music/CREDITS.md`. | Ganti trek hanya lewat pustaka yang sama agar bukti lisensi ikut tersalin. |

Keterbatasan yang tersisa dideklarasikan di `project.json → reference_review.capability` (mode `limited`), sesuai kontrak skill: hasil ini **tidak** boleh diklaim setara sampel resmi sebelum tinjauan independen dan persetujuan Anda.

## Struktur folder

```
video/banyak-referensi/
├── project.json            manifest final (180 s) — dihasilkan, jangan edit langsung
├── narasi.md               teks narasi/dialog per adegan untuk direkam
├── tools/
│   ├── script.mjs          naskah dialog revisi: 31 baris, cue subtitel, teks jeda per adegan
│   ├── build-audio.mjs     klip per baris → narasi-dialog.wav + timing-dialog.json (talk/hold per adegan)
│   ├── build-project.mjs   koreografi 12 adegan (talk 10 s + hold 5 s, diskalakan ke rekaman) → project.json
│   ├── align-cues.mjs      (arsip) penyelarasan cue untuk trek narator tunggal
│   ├── mix-dialogue.mjs    (arsip) penyisipan klip ke trek narator
│   ├── make-art.mjs        menggambar properti di art/ (deterministik; --with-figures untuk tokoh placeholder)
│   ├── import-art.mjs      lembar pose (grid di latar putih) → PNG transparan dengan rasio kanvas asal
│   └── motion-gaps.mjs     diagnosis gerbang 2,5 detik (mencetak jeda gerak)
├── art/                    45 PNG: 21 tokoh hasil generasi (via import-art) + properti buatan kode
├── art-src/                tiga lembar pose asli dari gemini-3-pro-image (sumber art/)
├── audio/                  lines/ (31 klip dialog), timing-dialog.json, *.sha256; take1/ dan dialogue/ = arsip versi narator; WAV tidak di-commit
├── drafts/part-1..3/       proyek draf 60 s (adegan 1–4, 5–8, 9–12)
└── preview/                MP4, SRT, contact sheet hasil render
```

Folder `output/`, `drafts/*/output/` (cache render) dan `audio/*.wav` tidak di-commit; jalankan `tools/make-audio.sh` sekali setelah clone (membuat room tone dan placeholder, serta `narasi.wav` dari `audio/take1/narasi-take1.mp3`).

## Cara menjalankan ulang

Prasyarat: Node 20+, FFmpeg + FFprobe, Git, Python 3.9+. Pasang runtime upstream sekali dengan skrip bootstrap repo ini (sparse checkout minimal ke `~/.cache/stickman-video-director`, `npm ci`, venv Python, `doctor`, lalu mencatat commit upstream di `b6-bootstrap.json`):

```bash
.claude/skills/stickman-video/scripts/bootstrap.sh install --style B1
```

```bash
.claude/skills/stickman-video/scripts/check.sh --project video/banyak-referensi
```

`check.sh` tidak memasang apa pun dan diakhiri satu baris `READY` atau `NOT READY`. Rute layanan (narasi lewat konektor ElevenLabs dengan ID suara terdaftar, satu take berbayar dengan SHA dipin; gambar lewat ElevenLabs/Figma atau raster buatan sendiri; mixing lewat FFmpeg) didokumentasikan di `.claude/skills/stickman-video/SKILL.md`.

Dari folder skill upstream (`SKILL` = `~/.cache/stickman-video-director/skills/directing-stickman-videos`; `PROJ` = path absolut folder ini):

```bash
# 1. buat audio placeholder (sekali), lalu (opsional) gambar ulang aset dan bangun ulang manifest
$PROJ/tools/make-audio.sh
SKILL_DIR=$SKILL node $PROJ/tools/make-art.mjs $PROJ/art
node $PROJ/tools/build-project.mjs --timing $PROJ/audio/timing-dialog.json && node $PROJ/tools/motion-gaps.mjs $PROJ/project.json
```

```bash
# 2. validasi 180 s, lalu pratinjau 60 s pertama
node scripts/autopilot.mjs validate $PROJ/project.json
node scripts/autopilot.mjs preview  $PROJ/project.json --seconds 60 --replace
```

```bash
# 3. draf adegan 5–8 dan 9–12
node $PROJ/tools/build-project.mjs --part=2 --timing $PROJ/audio/timing-dialog.json && node scripts/autopilot.mjs preview $PROJ/drafts/part-2/project.json --seconds 60 --replace
node $PROJ/tools/build-project.mjs --part=3 --timing $PROJ/audio/timing-dialog.json && node scripts/autopilot.mjs preview $PROJ/drafts/part-3/project.json --seconds 60 --replace
```

## Alur menuju film jadi (sesuai kontrak skill)

1. ~~Rekam narasi~~ Selesai: `audio/take1/narasi-take1.mp3` → `audio/narasi.wav`, SHA dipin.
2. ~~Selaraskan~~ Tidak diperlukan lagi: `build-audio.mjs` menata klip per baris, jadi waktu cue mengikuti rekaman secara langsung. Membangun ulang: `node tools/build-audio.mjs && node tools/build-project.mjs --timing audio/timing-dialog.json`. Untuk stempel kata: `node tools/align-cues.mjs --cues audio/cues.json --words audio/take1/words.json --duration 170.295 --out audio/timing.json`, lalu `node tools/build-project.mjs --timing audio/timing.json`. Koreografi tiap adegan diskalakan otomatis ke panjang adegan nyata (11,9–17,6 detik).
3. ~~Ganti aset tokoh~~ Selesai lewat lembar pose + `import-art.mjs`. Properti opsional.
4. **Pratinjau 20–60 detik**, tinjau MP4 sebenarnya (bukan contact sheet) dengan suara; isi `output/preview-reference/review-template.json` secara independen.
5. **Persetujuan Anda** direkam dengan `approve … --visual-review …` lalu `render` menghasilkan film 180 detik penuh beserta SRT/VTT. Langkah ini sengaja **tidak** dijalankan di sini: skill mensyaratkan persetujuan sampel oleh pengguna, bukan oleh agen.

## Pemetaan kritik → keputusan desain

| Kritik Anda | Penerapan di manifest |
|---|---|
| Gambar lebar menenggelamkan ekspresi; rak/jendela mendominasi | Tidak ada rak/jendela. Latar hanya meja dan kursi; tokoh berdiri di garis lantai (y = 600), laptop di atas meja. Close-up objek dipakai untuk 24 dari 42 shot. |
| Kartu bertumpuk (01:43) | Adegan 7 menyusun tiga kalimat **berurutan di halaman yang sama**, tokoh tidak ada di frame, lalu kurung "Pernyataan masalah" menutup. Semua kartu lain dibatasi `from`/`to` sehingga tidak pernah dua kartu bersamaan. |
| Tulisan pencarian terlalu kecil | Adegan 2: kotak pencarian 960 unit lebar, teks 52–60 unit, kata lama dicoret lalu hilang sebelum kata baru diketik; kursor mengikuti. |
| Daftar penulis/metode/temuan seperti checklist | Adegan 4: hanya dua bagian (metode, hasil) disorot stabilo satu per satu, satu temuan ditulis, lalu pertanyaan "Mendukung pernyataan apa?". |
| Hubungan bacaan–fokus masih abstrak | Adegan 5: dua kartu catatan **bergerak** mendekati buku, garis penghubung digambar, kalimat lama dicoret, kalimat baru muncul; ekspresi Vidka berganti dari *sigh* ke *aha*. |
| Kontras "menghitung pendapat vs memahami tindakan" terlalu membatasi | Adegan 9: dialog Vidka berupa pertanyaan terbuka, jeda 4 detik, jawaban "pengamatan dulu, kuesioner menyusul" dengan label fungsi masing-masing, bukan dikotomi. |
| "Membuktikan lebih efektif" mengarahkan hasil | Adegan 11: label **menguji pengaruh**, diagram dua kelompok + ukuran sebelum/sesudah, subtitel "bukan membuktikan, melainkan menguji perbedaan". |
| Tugas kurang menonjol | Kartu tugas (adegan 2, 9, 12) memenuhi 60–80 % lebar layar, satu kalimat, tanpa informasi baru selama ditahan. |
| Posisi sejajar seperti ceramah bergiliran | Tokoh pendengar diberi pose *listen*/*nod* dan pose pembicara *point*/*talk*; Herry masuk frame saat Vidka menoleh (adegan 1), Ardipal menunjuk halaman yang dibahas (adegan 11). |
