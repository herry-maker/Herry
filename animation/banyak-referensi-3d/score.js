// BANYAK REFERENSI, MANA YANG TEPAT? (16:9, 3 menit = 180 s, 24 fps)
// Sambungan dari "Kenapa Temponya Lari?". Tokoh: mahasiswa Vidka, dosen Herry, Prof. Ardipal.
// 12 adegan x 15 s: ~10 s dialog (direkam dengan ElevenLabs, assets/vo/*.mp3) + ~5 s tindakan/jeda
// berfikir. Buku Vidka adalah pengikat cerita: dari tumpukan catatan menjadi rancangan penelitian.
// Semua watak dan bacaan rekaan/ilustratif; contoh pernyataan masalah di akhir filem adalah fiksyen.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, makeChords } = MU;

  const FPS = 24;
  const FORMAT = '16:9';
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const clock = makeClock({ bpm: 92, offset: 0 }); // a calm study-room pulse under the scenes
  const { T, BEAT, BAR } = clock;
  const DURATION = 180.0;
  const SCENE = 15; // every scene is exactly 15 s
  const scene = (n) => (n - 1) * SCENE; // start time of scene n (1-indexed, matches the brief)

  // ---------- the 12 scenes: start time, title, and which dialogue lines (ids into VO_TEXT) ----------
  const SCENES = [
    { n: 1, title: 'Artikel bertumpuk', lines: ['v1', 'h1'] },
    { n: 2, title: 'Kata kunci yang terlalu luas', lines: ['a1', 'v2', 'a2'], task: 'Sebutkan dua kata kunci topikmu.' },
    { n: 3, title: 'Terkenal belum tentu relevan', lines: ['v3', 'h2'] },
    { n: 4, title: 'Memeriksa isi sumber', lines: ['v4', 'a3'] },
    { n: 5, title: 'Membaca untuk membentuk pertanyaan', lines: ['v5', 'h3', 'v6'] },
    { n: 6, title: 'Keluhan belum menjadi pernyataan masalah', lines: ['v7', 'h4', 'v8'], task: 'Sebutkan satu dampak masalah pilihanmu.' },
    { n: 7, title: 'Menulis apa yang belum dipahami', lines: ['a4', 'v9', 'a5'] },
    { n: 8, title: 'Pertanyaan yang dapat diteliti', lines: ['v10', 'h5'] },
    { n: 9, title: 'Memilih berdasarkan tujuan', lines: ['v11', 'a6', 'v12', 'a7'], task: 'Data apa yang menunjukkan tindakan pemain?' },
    { n: 10, title: 'Merancang cara menjawab', lines: ['h6', 'v13', 'h7'] },
    { n: 11, title: 'Pertanyaan berbeda, rancangan berbeda', lines: ['v14', 'a8', 'v15'] },
    { n: 12, title: 'Rancangan yang mulai jelas', lines: ['v16', 'h8', 'a9'] },
  ];

  // ---------- every line of dialogue: who speaks, and the exact ElevenLabs take (assets/vo/<id>.mp3) ----------
  // `who` drives both the voice clip and which character's mouth moves (Subs.mouth / mouthOf in film.js).
  const VO_TEXT = {
    v1: { who: 'v', text: 'Pak, referensinya sudah banyak. Tapi saya malah bingung mulai dari mana.' },
    h1: { who: 'h', text: 'Mari kembali ke masalah kelompokmu. Apa yang ingin kamu pahami?' },
    a1: { who: 'a', text: 'Kamu mencari dengan kata apa?' },
    v2: { who: 'v', text: "'Musik', Prof." },
    a2: { who: 'a', text: 'Coba lebih khusus: siswa pemula, ansambel, dan sinkronisasi ritmis. Gunakan padanan bahasa Inggris juga.' },
    v3: { who: 'v', text: 'Yang ini sering dikutip, tetapi membahas musisi profesional.' },
    h2: { who: 'h', text: 'Bisa membantu memahami konsep. Untuk konteks kelasmu, cari juga penelitian tentang siswa pemula.' },
    v4: { who: 'v', text: 'Judulnya cocok. Langsung saya kutip?' },
    a3: { who: 'a', text: 'Baca dulu. Periksa penulis, tempat terbit, peserta, metode, dan temuannya. Tahun terbit saja tidak menentukan kecocokan.' },
    v5: { who: 'v', text: 'Dua bacaan ini menyoroti mendengar teman dan melihat isyarat.' },
    h3: { who: 'h', text: 'Apa hubungannya dengan kelompokmu?' },
    v6: { who: 'v', text: 'Saya belum tahu bagaimana siswa menggunakan keduanya saat latihan.' },
    v7: { who: 'v', text: "'Siswa kami kurang kompak.' Sudah cukup?" },
    h4: { who: 'h', text: 'Perjelas kejadian dan dampaknya.' },
    v8: { who: 'v', text: 'Tempo meningkat, beberapa siswa tertinggal, dan latihan berulang kali berhenti.' },
    a4: { who: 'a', text: 'Lalu, apa yang belum kamu pahami?' },
    v9: { who: 'v', text: 'Bagaimana mereka mengikuti tempo teman.' },
    a5: { who: 'a', text: "Hubungkan itu dengan bacaan dan bukti awal. Jangan mengklaim 'belum pernah diteliti' tanpa dasar." },
    v10: { who: 'v', text: 'Bagaimana siswa pemula menggunakan isyarat bunyi dan gerak untuk menjaga tempo saat latihan ansambel?' },
    h5: { who: 'h', text: 'Lebih terarah. Pertanyaanmu menyebut peserta, proses, dan konteks.' },
    v11: { who: 'v', text: 'Saya pakai kuesioner saja?' },
    a6: { who: 'a', text: 'Kamu ingin menghitung pendapat, atau memahami tindakan saat latihan?' },
    v12: { who: 'v', text: 'Memahami tindakan.' },
    a7: { who: 'a', text: 'Berarti kamu perlu melihat prosesnya secara langsung.' },
    h6: { who: 'h', text: 'Studi kasus kualitatif dapat sesuai untuk memahami kelompok ini.' },
    v13: { who: 'v', text: 'Saya mengamati latihan dan mewawancarai siswa?' },
    h7: { who: 'h', text: 'Ya. Lalu analisis pola penggunaan isyarat, dan bandingkan kedua sumber data.' },
    v14: { who: 'v', text: 'Kalau ingin membuktikan latihan metronom lebih efektif?' },
    a8: { who: 'a', text: 'Itu pertanyaan berbeda. Perlu rancangan perbandingan, ukuran kestabilan tempo, dan pengendalian faktor lain.' },
    v15: { who: 'v', text: 'Jadi, metodologi mengikuti pertanyaan.' },
    v16: { who: 'v', text: 'Sekarang saya tahu fungsi setiap bacaan, dan alasan memilih cara penelitian.' },
    h8: { who: 'h', text: 'Bagus. Siapkan persetujuan sebelum mengumpulkan data.' },
    a9: { who: 'a', text: 'Lalu periksa kembali kesesuaiannya dengan pertanyaanmu.' },
  };
  const CAPTION_COLOR = { v: '#FFFFFF', h: '#9EDCC6', a: '#F2D08A' };
  const NAME = { v: 'Vidka', h: 'Dr. Herry', a: 'Prof. Ardipal' };

  // Each scene's dialogue is packed by song.js into its own ~10 s window (at scene start + 0.3 s),
  // trimmed of silence and, only if the real takes overrun, sped up together (max 1.25x) so every
  // scene still ends with a real, wordless action beat before the next scene's hard cut.
  const DIALOGUE_GAP = 0.3; // between two lines in the same scene
  const DIALOGUE_LEAD = 0.3; // from scene start to the first word
  const DIALOGUE_BUDGET = 10; // target seconds of speech per scene
  const MAX_TEMPO = 1.25;

  // ---------- visual beats (read by film.js), one block per scene ----------
  // Times below are hand-tuned against the real, measured ElevenLabs takes (see song.js's printed
  // report): each scene's takes have a fixed raw duration, so the fitted start/end times are the same
  // on every run. Beats either sit *under* a line that is naturally describing them, or in the quiet
  // action/thinking seconds after the scene's last line ends (never on top of a different line).
  // Scene 1: the stack of articles, pages sliding to the floor, the notebook opening (h1 ends ~8.4).
  const s1 = { slideStart: 1.0, slideCount: 4, noteOpen: 9.2 };
  // Scene 2: the search box shows 'Musik' as v2 says it (~17.5), then the English equivalent after
  // a2 ends (~25.4); the task line follows in the clear.
  const s2 = { searchBroad: scene(2) + 2.2, searchNarrow: scene(2) + 10.6, taskAt: scene(2) + 12.0 };
  // Scene 3: two reading cards compared as v3 shows them (~30.3); sticky notes after h2 ends (~40.3).
  const s3 = { cardsAt: scene(3) + 0.6, stickyAt: scene(3) + 10.6 };
  // Scene 4: the article opens as v4 speaks (~45.3); the highlight lands just after a3 ends (~55.3).
  const s4 = { openAt: scene(4) + 0.6, markAt: scene(4) + 10.6 };
  // Scene 5: two reading notes beside an illustrative photo as v5 speaks; the question mark after v6 ends (~70.4).
  const s5 = { notesAt: scene(5) + 0.6, qmarkAt: scene(5) + 10.7 };
  // Scene 6: the vague sentence as v7 speaks it (~75.3); replaced as v8 states the specifics (~80.5); task after (~85.4).
  const s6 = { draftAt: scene(6) + 0.6, replaceAt: scene(6) + 5.6, taskAt: scene(6) + 11.0 };
  // Scene 7: the three note pieces combine after a5 ends (~100.4), reread a moment later.
  const s7 = { combineAt: scene(7) + 10.7, rereadAt: scene(7) + 12.5 };
  // Scene 8: the question is written as v10 speaks it (~105.3-111.0); participant/process/context
  // highlighted across h5 (~111.3-115.4), then held whole for the rest of the scene.
  const s8 = { writeAt: scene(8) + 0.4, hiP: scene(8) + 6.3, hiPr: scene(8) + 7.6, hiC: scene(8) + 8.9 };
  // Scene 9: the questionnaire lowers, then the door, then the task -- all after a7 ends (~130.5).
  const s9 = { formDownAt: scene(9) + 10.7, doorAt: scene(9) + 12.0, taskAt: scene(9) + 13.0 };
  // Scene 10: the sketch and its link, after h7 ends (~145.9).
  const s10 = { sketchAt: scene(10) + 11.1, linkAt: scene(10) + 12.8 };
  // Scene 11: the flip and the arrow note, after v15 ends (~161.5).
  const s11 = { flipAt: scene(11) + 11.7, backAt: scene(11) + 13.0, noteAt: scene(11) + 14.0 };
  // Scene 12: the laptop closes and the book is carried, after a9 ends (~175.4); the final task card.
  const s12 = { closeAt: scene(12) + 10.7, bookAt: scene(12) + 12.0, taskAt: scene(12) + 13.0 };

  const markers = {
    s1_fall: { t: s1.slideStart, sync: 'av' }, // the first page slides off and lands
    s2_task: { t: s2.taskAt, sync: 'v' },
    s3_cards: { t: s3.cardsAt, sync: 'v' },
    s4_mark: { t: s4.markAt, sync: 'av' }, // the highlight pen taps down
    s6_replace: { t: s6.replaceAt, sync: 'av' }, // the crossed-out line is struck through
    s6_task: { t: s6.taskAt, sync: 'v' },
    s8_write: { t: s8.writeAt, sync: 'v' },
    s9_task: { t: s9.taskAt, sync: 'v' },
    s11_flip: { t: s11.flipAt, sync: 'av' }, // the page flips
    s12_close: { t: s12.closeAt, sync: 'av' }, // the laptop lid closes
    s12_task: { t: s12.taskAt, sync: 'v' },
  };

  const { chords, chordAt } = makeChords(clock, {
    Cmaj7: { notes: ['E3', 'G3', 'B3', 'D4'], bass: 'C2' }, Am7: { notes: ['E3', 'G3', 'A3', 'C4'], bass: 'A1' },
    Fmaj7: { notes: ['F3', 'A3', 'C4', 'E4'], bass: 'F1' }, G6: { notes: ['D3', 'G3', 'B3', 'E4'], bass: 'G1' },
    Dm7: { notes: ['D3', 'F3', 'A3', 'C4'], bass: 'D2' },
  }, Array.from({ length: Math.ceil(DURATION / BAR) + 1 }, (_, b) => [b, 0, 4, ['Cmaj7', 'Am7', 'Fmaj7', 'G6', 'Dm7', 'Am7', 'Fmaj7', 'G6'][b % 8]]));

  const SCORE = {
    FPS, FORMAT, W, H, SAFE, DURATION, SCENE, scene, clock, T, BEAT, BAR, m, chords, chordAt,
    SCENES, VO_TEXT, CAPTION_COLOR, NAME, DIALOGUE_GAP, DIALOGUE_LEAD, DIALOGUE_BUDGET, MAX_TEMPO,
    s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, markers,
  };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
