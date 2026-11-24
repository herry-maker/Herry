// script.mjs — the revised dialogue script (user's table, 2026-11-24). Single source of truth for
// recording (tts), captions (cues) and the on-screen hold text of each scene.
// Each line: role, tts (exact words to record), cues (caption phrases shown while the line plays).
export const VOICES = {
  Vidka: {name: 'Mona - Storyteller', id: 'zjmMdjff4JG35O3EQJBV'},
  Herry: {name: 'Bayu - academic, calm and clear', id: 'saYZ00LWtwkN6VaX46N9'},
  Ardipal: {name: 'Dito - Indonesian Narrator', id: 'RPwoahKEr9WZSgNHBLbp'},
};
export const HOLD = 5; // seconds of silence after the last line of every scene (the table's "Jeda 5 detik")
export const GAP = 0.55; // seconds between consecutive lines
export const SCENE_MIN = 15; // a scene never runs shorter than its planned 15 s; the hold absorbs the rest

export const SCENES = [
  {title: 'Kebingungan awal', lines: [
    {role: 'Vidka', tts: 'Pak, artikel saya banyak, tetapi saya bingung memilih.', cues: ['Vidka: Pak, artikel saya banyak,', 'tetapi saya bingung memilih.']},
    {role: 'Herry', tts: 'Buka lagi catatanmu. Apa yang ingin kamu pahami?', cues: ['Herry: Buka lagi catatanmu.', 'Apa yang ingin kamu pahami?']},
  ], hold: {kind: 'text', text: 'Bagaimana kelompok kami menjaga tempo?'}},
  {title: 'Memperbaiki pencarian', lines: [
    {role: 'Ardipal', tts: 'Apa kata kuncimu?', cues: ['Ardipal: Apa kata kuncimu?']},
    {role: 'Vidka', tts: 'Musik, Prof.', cues: ['Vidka: «Musik», Prof.']},
    {role: 'Ardipal', tts: 'Persempit: siswa pemula, ansambel, dan koordinasi tempo. Coba juga padanan bahasa Inggris.', cues: ['Ardipal: Persempit: siswa pemula, ansambel,', 'dan koordinasi tempo.', 'Coba juga padanan bahasa Inggris.']},
  ], hold: {kind: 'task', text: 'Sebutkan dua kata kunci topikmu.'}},
  {title: 'Menentukan kegunaan referensi', lines: [
    {role: 'Vidka', tts: 'Artikel terkenal ini membahas musisi profesional.', cues: ['Vidka: Artikel terkenal ini', 'membahas musisi profesional.']},
    {role: 'Herry', tts: 'Bisa membantu menjelaskan konsep. Cari juga penelitian siswa pemula agar konteks pembelajaranmu terwakili.', cues: ['Herry: Bisa membantu menjelaskan konsep.', 'Cari juga penelitian siswa pemula', 'agar konteks pembelajaranmu terwakili.']},
  ], hold: {kind: 'highlight', text: 'Peserta'}},
  {title: 'Memeriksa dukungan sumber', lines: [
    {role: 'Vidka', tts: 'Judulnya cocok. Langsung saya kutip?', cues: ['Vidka: Judulnya cocok. Langsung saya kutip?']},
    {role: 'Ardipal', tts: 'Baca metode dan hasilnya dulu. Apakah temuannya mendukung pernyataanmu? Periksa juga kredibilitas sumbernya.', cues: ['Ardipal: Baca metode dan hasilnya dulu.', 'Apakah temuannya mendukung pernyataanmu?', 'Periksa juga kredibilitas sumbernya.']},
  ], hold: {kind: 'text', text: 'Mendukung kalimat yang mana?'}},
  {title: 'Menghubungkan bacaan', lines: [
    {role: 'Vidka', tts: 'Bacaan ini membahas mendengar teman; yang lain, isyarat gerak.', cues: ['Vidka: Bacaan ini membahas mendengar teman;', 'yang lain, isyarat gerak.']},
    {role: 'Herry', tts: 'Apa yang ingin kamu telusuri?', cues: ['Herry: Apa yang ingin kamu telusuri?']},
    {role: 'Vidka', tts: 'Bagaimana kelompok kami menggunakan keduanya.', cues: ['Vidka: Bagaimana kelompok kami', 'menggunakan keduanya.']},
  ], hold: {kind: 'text', text: 'Contoh bacaan ilustratif.'}},
  {title: 'Mengubah keluhan menjadi masalah', lines: [
    {role: 'Vidka', tts: 'Siswa kurang kompak. Cukup, Pak?', cues: ['Vidka: «Siswa kurang kompak.» Cukup, Pak?']},
    {role: 'Herry', tts: 'Apa yang terjadi dan dampaknya?', cues: ['Herry: Apa yang terjadi dan dampaknya?']},
    {role: 'Vidka', tts: 'Tempo meningkat, beberapa siswa tertinggal, dan latihan berhenti.', cues: ['Vidka: Tempo meningkat,', 'beberapa siswa tertinggal,', 'dan latihan berhenti.']},
  ], hold: {kind: 'task', text: 'Sebutkan satu dampak masalahmu.'}},
  {title: 'Menyusun pernyataan masalah', lines: [
    {role: 'Ardipal', tts: 'Apa yang belum jelas?', cues: ['Ardipal: Apa yang belum jelas?']},
    {role: 'Vidka', tts: 'Bagaimana siswa mengikuti tempo teman.', cues: ['Vidka: Bagaimana siswa mengikuti tempo teman.']},
    {role: 'Ardipal', tts: 'Hubungkan dengan bukti awal dan bacaan. Jelaskan mengapa penting dipahami.', cues: ['Ardipal: Hubungkan dengan bukti awal dan bacaan.', 'Jelaskan mengapa penting dipahami.']},
  ], hold: {kind: 'text', text: 'Belum jelas bagaimana siswa mengikuti tempo teman saat latihan.'}},
  {title: 'Merumuskan pertanyaan penelitian', lines: [
    {role: 'Vidka', tts: 'Bagaimana siswa pemula menggunakan isyarat bunyi dan gerak untuk menjaga tempo dalam ansambel?', cues: ['Vidka: Bagaimana siswa pemula', 'menggunakan isyarat bunyi dan gerak', 'untuk menjaga tempo dalam ansambel?']},
    {role: 'Herry', tts: 'Jelas: siapa, proses apa, dan dalam konteks apa.', cues: ['Herry: Jelas: siapa, proses apa,', 'dan dalam konteks apa.']},
  ], hold: {kind: 'text', text: 'Bagaimana siswa pemula menggunakan isyarat bunyi dan gerak untuk menjaga tempo dalam ansambel?'}},
  {title: 'Memilih data yang diperlukan', lines: [
    {role: 'Vidka', tts: 'Saya gunakan kuesioner saja?', cues: ['Vidka: Saya gunakan kuesioner saja?']},
    {role: 'Ardipal', tts: 'Apakah itu menunjukkan tindakan saat latihan?', cues: ['Ardipal: Apakah itu menunjukkan', 'tindakan saat latihan?']},
    {role: 'Vidka', tts: 'Belum cukup. Saya perlu mengamati, lalu menanyakan alasannya.', cues: ['Vidka: Belum cukup.', 'Saya perlu mengamati,', 'lalu menanyakan alasannya.']},
  ], hold: {kind: 'task', text: 'Data apa yang diperlukan untuk pertanyaanmu?'}},
  {title: 'Menjelaskan alasan metodologi', lines: [
    {role: 'Herry', tts: 'Studi kasus kualitatif dapat sesuai untuk memahami kelompok ini.', cues: ['Herry: Studi kasus kualitatif dapat sesuai', 'untuk memahami kelompok ini.']},
    {role: 'Vidka', tts: 'Saya membandingkan pengamatan dengan wawancara?', cues: ['Vidka: Saya membandingkan pengamatan', 'dengan wawancara?']},
    {role: 'Herry', tts: 'Ya, untuk menelaah pola penggunaan isyarat.', cues: ['Herry: Ya, untuk menelaah pola penggunaan isyarat.']},
  ], hold: {kind: 'text', text: 'Simulasi'}},
  {title: 'Menyesuaikan rancangan dengan pertanyaan', lines: [
    {role: 'Vidka', tts: 'Kalau menguji apakah latihan metronom meningkatkan kestabilan tempo?', cues: ['Vidka: Kalau menguji apakah latihan metronom', 'meningkatkan kestabilan tempo?']},
    {role: 'Ardipal', tts: 'Pertanyaannya berubah. Perlu ukuran tempo, perbandingan yang sesuai, dan perhatian pada faktor lain.', cues: ['Ardipal: Pertanyaannya berubah.', 'Perlu ukuran tempo, perbandingan yang sesuai,', 'dan perhatian pada faktor lain.']},
  ], hold: {kind: 'text', text: 'Pertanyaan menentukan rancangan.'}},
  {title: 'Menunjukkan hasil belajar', lines: [
    {role: 'Vidka', tts: 'Sekarang bacaan, masalah, pertanyaan, dan cara penelitian saya saling terhubung.', cues: ['Vidka: Sekarang bacaan, masalah, pertanyaan,', 'dan cara penelitian saya saling terhubung.']},
    {role: 'Herry', tts: 'Siapkan persetujuan sebelum mengumpulkan data.', cues: ['Herry: Siapkan persetujuan', 'sebelum mengumpulkan data.']},
    {role: 'Ardipal', tts: 'Dan jelaskan alasan setiap pilihanmu.', cues: ['Ardipal: Dan jelaskan alasan setiap pilihanmu.']},
  ], hold: {kind: 'task', text: 'Tulis pertanyaanmu. Pilih data dan jelaskan alasannya.'}},
];

// Stable clip ids: s01-l1, s01-l2, ...
export const LINES = SCENES.flatMap((s, i) => s.lines.map((l, j) => ({...l, id: `s${String(i + 1).padStart(2, '0')}-l${j + 1}`, scene: i + 1, index: j})));
