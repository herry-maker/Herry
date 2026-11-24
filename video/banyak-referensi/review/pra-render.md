# Tinjauan pra-render — "Banyak Referensi, Mana yang Tepat?" (versi dialog revisi)

Tanggal: 24 Nov 2026. Objek: `project.json` (41 shot, 58 cue, 181,0 s), `audio/narasi-dialog.wav`, pratinjau `preview/`. Metode: statistik timeline dan subtitel dari manifest, pengukuran audio per baris (FFmpeg `ebur128`, `volumedetect`), frame tengah dari semua 41 shot, dan gerbang mutu B1 upstream (`autopilot-production-qa.md`, `b-delivery-completeness.md`, `b1-production-qa.md`). Yang **tidak** dapat saya periksa: hasil dengar sebenarnya (intonasi, kewajaran sambungan antarsuara).

## Status gerbang teknis

| Gerbang | Status |
|---|---|
| `validate` 181 s | lolos |
| Gerak gambar utama tiap ≤ 2,5 s | lolos (`motion-gaps.mjs`: 0 celah) |
| Subtitel satu baris ≤ 1120 unit | lolos |
| Musik latar (gerbang kelengkapan B) | **belum ada** |
| Tinjauan referensi independen + persetujuan sampel pengguna | **belum** (syarat `approve` dan `render`) |

## P0 — harus diperbaiki sebelum render

1. **Klip Herry di adegan 8 terpotong (clipping).** `s08-l2` "Jelas: siapa, proses apa, dan dalam konteks apa." diberi gain +8,9 dB oleh penyamaan level dan puncaknya mencapai 0,0 dBTP. Sebelas dari 31 baris butuh koreksi ≥ 6 dB (Ardipal −6,7 sampai −8,8 dB; Herry +6,9 sampai +8,9 dB), tanda penyamaan berbasis *mean volume* terlalu kasar. Puncak antarbaris berkisar −3,6 sampai −11,5 dBTP; LRA sampel 7,7 LU. Perbaikan: normalisasi per klip ke target loudness (misalnya −20 LUFS jangka pendek) dengan pembatas true-peak −2 dBTP (`loudnorm` dua tahap per klip), lalu ukur ulang.
2. **Subtitel terlalu cepat untuk dibaca.** Median 19,2 karakter/detik, maksimum 30; 40 dari 58 cue di atas 18 cps (ambang nyaman 12–17 cps). Dua penyebab: awalan nama pembicara menambah 6–9 karakter, dan cue berakhir tepat saat ucapan berakhir. Perbaikan tanpa merekam ulang: (a) perpanjang cue terakhir tiap baris ke dalam jeda 0,55 s dan jeda adegan (tersedia 22,9 s total), (b) gabungkan dua frasa pendek satu baris bila muat ≤ 1120 unit, (c) pertimbangkan menghapus awalan nama karena suara sudah berbeda, atau hanya menampilkannya saat pembicara berganti.
3. **Musik latar belum ada.** Gerbang kelengkapan B menolak film tanpa musik berlisensi. Rute gratis dan terdokumentasi: `bootstrap.sh install --with-audio-library` lalu `node scripts/audio-library.mjs recommend --style B1 --beat opening` (31 trek dengan arsip lisensi), ekspor ke `audio/`, pasang di `music: {path, gain ≤ 0.2}`, dan tulis `intentional_silence` untuk jeda yang sengaja hening.
4. **Tumpang tindih visual yang terlihat di frame.**
   - Adegan 3 dan 4, shot pertama: artikel yang "diangkat" Vidka menutupi wajah dan badannya (prop di x 560–730 menimpa tokoh di x 520–800).
   - Adegan 6, shot pertama: teks merah "cukup?" bertabrakan dengan pensil di ujung kalimat.
   - Adegan 8, sorotan: garis "PROSES APA" dan "KONTEKS APA" jatuh di baris yang salah (proses seharusnya baris 2, konteks baris 3). Ini kesalahan makna, bukan sekadar estetika.
   - Adegan 11, halaman pertanyaan: tulisan tangan "memahami proses" / "menguji pengaruh" menimpa garis judul tercetak pada prop halaman.
   - Adegan 10, buku "rencana penelitian": label merah menimpa spiral buku.
   - Empat shot menampilkan 2–3 pensil sekaligus (pensil penulis baris sebelumnya tidak disembunyikan): shot 15, 22, 31, 37.

## P1 — sebaiknya diperbaiki

5. **Ritme dialog mekanis.** Semua 31 pergantian pembicara berjarak persis 0,55 s; tidak ada "waktu reaksi" setelah pertanyaan. Saran: jeda 0,4–0,9 s mengikuti tanda baca (lebih panjang setelah "?"), dan 0,3 s sebelum tokoh baru pertama kali bicara di adegan itu.
6. **Jeda adegan tidak rata:** adegan 1 ditahan 8,1 s karena aturan minimum 15 s (ucapan hanya 6,9 s); adegan 5 dan 7 di atas 6 s. Pilihan: izinkan adegan 1 lebih pendek (13–14 s) atau tambahkan satu beat visual (misalnya Vidka menggeser tumpukan, sesuai kolom "Gerakan" tabel) sebelum teks jeda.
7. **Prosodi antarbaris.** Tiap baris dibangkitkan sendiri, sehingga pertanyaan dan jawaban tidak saling "mendengar". Tidak bisa diperbaiki dari sisi mixing; hanya mode dialog multi-pembicara (eleven v3 *text to dialogue*) yang menyelesaikannya, dan konektor saat ini tidak menyediakannya. Dengarkan sampel untuk memutuskan apakah ini dapat diterima.
8. **Teks sekunder terlalu kecil untuk ponsel:** 30 lapisan teks di bawah 28 unit desain (sekitar 7 px pada layar 360 px): label "KONTEKS/SISWA" 26, "temuan:" 24, "Bacaan 1:" 26, "kejadian/dampak" 26, "Contoh bacaan ilustratif." 26. Naikkan ke ≥ 30 atau hapus yang tidak esensial (label abu-abu "Vidka" di adegan 1).
9. **Kehadiran tokoh 42 % durasi.** Pedoman B1 (60–70 %) berlaku untuk format promosi, bukan wajib, tetapi kritik awal Anda meminta kebingungan Vidka menjadi pusat. Jeda bertipe teks (adegan 1, 3, 4, 5, 7, 8, 10, 11) tanpa tokoh; jeda bertipe tugas sudah memuat Vidka berpikir. Pertimbangkan reaksi kecil Vidka di sisi kanan jeda teks bila ruang ada.
10. **Dua contoh isi masih rekaan** dan perlu label agar tidak dibaca sebagai temuan nyata: adegan 4 (klaim "siswa pemula butuh latihan bagian pendek" dan temuan artikel) belum berlabel; adegan 10 sudah berlabel "Simulasi"; adegan 5 sudah berlabel "Contoh bacaan ilustratif". Tambahkan "contoh ilustratif" di adegan 4.
11. **Properti masih buatan kode** (laptop, halaman, buku, pintu, metronom) berdampingan dengan tokoh hasil generasi; perbedaan gaya terlihat pada close-up. Satu lembar properti ≈ 1.218 kredit, lalu `import-art.mjs`.
12. **Awal dan akhir film:** kata pertama mulai pada 0,00 s tanpa *lead* (pemutar tertentu memotong 100–200 ms pertama); film berakhir 0,9 s setelah cue terakhir tanpa fade. Tambahkan lead 0,4 s dan tail 1,0 s dengan fade.

## P2 — opsional

13. Kartu judul 2 detik di awal (tabel tidak memintanya; gerbang "30 detik pertama" upstream lebih menghargai konflik yang langsung, jadi boleh dilewati).
14. Adegan 8: tabel meminta "tanpa gerakan tambahan" saat pertanyaan utuh ditahan; renderer mewajibkan gerak lokal tiap 2,5 s, sehingga ada ketukan pensil kecil di pojok. Deklarasikan dalam catatan tinjauan.
15. Draf bagian 1–4/5–8/9–12 terpotong 0,2–0,7 s di ujung karena batas pratinjau 60 s; tidak memengaruhi film penuh.

## Urutan kerja yang saya usulkan

1. Perbaiki audio (P0-1), subtitel (P0-2), tumpang tindih (P0-4), ritme (P1-5, P1-6), teks kecil (P1-8), label ilustratif (P1-10), lead/tail (P1-12): semuanya lokal dan gratis, sekitar satu putaran render ulang.
2. Pasang musik dari pustaka upstream (P0-3): gratis, perlu unduhan 250 MB sekali.
3. Opsional berbayar: lembar properti (P1-11).
4. Anda mendengarkan sampel 60 s baru; bila diterima, saya isi `output/preview-reference/review-template.json` sebagai tinjauan independen, lalu `approve --visual-review` dan `render` 181 s, disusul `accept-visual` atas film penuh.
