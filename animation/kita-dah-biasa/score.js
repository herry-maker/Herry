// KITA DAH BIASA (9:16, 63 s): satira akademik. Lima pensyarah dalam mesyuarat fakulti; seorang
// mempersoalkan keutamaan kerja, dan jawapannya ialah "dari dulu memang begini" (justifikasi sistem,
// Jost & Banaji 1994). Dialog dirakam dengan ElevenLabs (assets/vo/*.mp3); setiap isyarat visual dan
// bunyi (slaid, kilat kamera, pen berhenti, fail ditutup, label, cop) dijadualkan DI SINI sahaja.
// Semua watak rekaan.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, makeChords } = MU;

  const FPS = 30;
  const FORMAT = '9:16'; // TikTok
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const clock = makeClock({ bpm: 100, offset: 0 }); // BEAT 0.6 s, BAR 2.4 s: the lofi groove under the meeting
  const { T, BEAT, BAR } = clock;
  const DURATION = 63.0; // ends exactly at 01:03

  // ---------- the beats of the scene (seconds, from the script's timecodes) ----------
  const ev = {
    agenda: 0, // the chair at the slide, everyone writing
    eager: 7.1, // two-shot: A and B jump in
    flash1: 11.55, flash2: 12.45, // B photographs the slide "for the report"
    hand: 13.3, // C raises a hand: every pen stops, the music drops out, the wall clock ticks
    question: 15.6, // C close-up
    pushback: 24.1, // A leans back, D shakes his head
    shake: 26.0,
    sheet: 31.2, // C lifts her timetable
    insert: 33.0, // the page fills the frame: admin blocks land, "PENYELIDIKAN" is shoved off
    chairClose: 38.55, // the chair closes the file: thud
    wide2: 41.2, // everyone nods
    freeze: 45.3, // the frame freezes and drains of colour
    label1: 45.55, // "KITA DAH BIASA"
    label2: 50.9, // "MAKA, MESTI BETUL?"
    cite: 53.2, // Jost & Banaji (1994)
    resume: 56.2, // colour returns, the chair clicks to the next slide
    stamp: 61.6, // LULUS
    endText: 61.85, // "Sudah biasa. Tetapi adakah wajar?"
  };
  const S = {
    agenda: [0, ev.eager], eager: [ev.eager, ev.hand], hand: [ev.hand, ev.question], question: [ev.question, ev.pushback],
    pushback: [ev.pushback, ev.sheet], sheet: [ev.sheet, ev.chairClose], close: [ev.chairClose, ev.freeze],
    freeze: [ev.freeze, ev.resume], resume: [ev.resume, DURATION],
  };

  // ---------- the dialogue: ElevenLabs takes, placed on the timeline ----------
  // `until` is the latest the line may end; song.js shortens the pauses and nudges the tempo so it fits.
  const vo = [
    { id: 'chair1', who: 'chair', at: 0.4, until: 7.0, text: 'Bulan ini, tiga program. Kita perlu jawatankuasa, laporan, dokumentasi, dan majlis penutup.' },
    { id: 'a1', who: 'a', at: 7.2, until: 10.3, text: 'Backdrop dan jemputan VIP, siapa urus?' },
    { id: 'b1', who: 'b', at: 10.45, until: 13.25, text: 'Gambar kena banyak. Senang buat laporan.' },
    { id: 'c1', who: 'c', at: 13.75, until: 24.0, text: 'Maaf, bila kita bincang pengajaran dan penyelidikan? Kita perlu membimbing pelajar, mengembangkan ilmu, menulis artikel. Semua itu juga perlukan masa.' },
    { id: 'a2', who: 'a', at: 24.3, until: 31.0, text: 'Kami pun penat. Tapi dari dulu memang begini. Kalau semua persoalkan, susahlah fakulti berjalan.' },
    { id: 'c2', who: 'c', at: 31.3, until: 38.4, text: 'Pentadbiran memang perlu. Tetapi kalau kerja akademik sentiasa ditangguhkan, bukankah pembahagian tugas ini perlu disemak?' },
    { id: 'chair2', who: 'chair', at: 38.8, until: 45.2, text: 'Semua orang ada beban. Kita kena positif. Jangan sebab seorang, semangat satu pasukan terjejas.' },
    { id: 'narr', who: 'narr', at: 45.85, until: 56.05, text: 'Inilah justifikasi sistem: mempertahankan aturan sedia ada sebagai wajar, walaupun kita sendiri terbeban. Kebiasaan menjadi alasan; kritikan dianggap ancaman.' },
    { id: 'chair3', who: 'chair', at: 56.45, until: 61.5, text: 'Baik. Kita tubuh jawatankuasa khas, untuk mengkaji masalah terlalu banyak jawatankuasa.' },
  ];
  const CAPTION_COLOR = { chair: '#F2D08A', a: '#9EDCC6', b: '#F4B6C2', c: '#FFFFFF', narr: '#CFE3FF' };

  // ---------- what the picture does, and what the music hears ----------
  // the agenda slide fills in as the chair lists it (soft pen ticks)
  const slideItems = [
    { t: 1.05, kind: 'prog', text: 'PROGRAM 1' }, { t: 1.75, kind: 'prog', text: 'PROGRAM 2' }, { t: 2.45, kind: 'prog', text: 'PROGRAM 3' },
    { t: 3.75, kind: 'bullet', text: 'Jawatankuasa' }, { t: 4.55, kind: 'bullet', text: 'Laporan' }, { t: 5.3, kind: 'bullet', text: 'Dokumentasi' }, { t: 6.1, kind: 'bullet', text: 'Majlis penutup' },
  ];
  // the three things C asks for, popping up beside her (music-box notes)
  const icons = [
    { t: 18.0, text: 'PELAJAR', midi: m('E5') }, { t: 19.9, text: 'ILMU', midi: m('G5') }, { t: 21.5, text: 'ARTIKEL', midi: m('B5') },
  ];
  // her timetable: every block is admin (paper fwips), then the research note is shoved off the page
  // (the insert at ev.insert shows the page itself: 5 days x 3 slots; nine admin blocks land, then the
  // research note is shoved off the page and a meeting takes its cell)
  const sheetBlocks = [['JK', 0, 0], ['LAPORAN', 1, 0], ['MAJLIS', 2, 1], ['DOKUMEN', 3, 0], ['JK', 4, 1], ['BACKDROP', 1, 2], ['MINIT', 0, 1], ['JK', 3, 2], ['JEMPUTAN', 2, 0]]
    .map(([label, col, row], i) => ({ t: +(33.35 + i * 0.4).toFixed(2), label, cell: [col, row] }));
  const shove = 37.1; // "PENYELIDIKAN" (cell 4,2) is pushed off the page
  const lastBlock = { t: 37.55, label: 'MESYUARAT', cell: [4, 2] };
  // the nods after "kita kena positif"
  const nods = [41.6, 42.4, 43.2, 44.0];
  // the wall clock ticks in the silence after the hand goes up
  const ticks = []; for (let t = 13.9; t < 24.0; t += 0.6) ticks.push(+t.toFixed(2));

  const { chords, chordAt } = makeChords(clock, {
    Am7: { notes: ['A3', 'C4', 'E4', 'G4'], bass: 'A1' }, Dm7: { notes: ['D4', 'F4', 'A4', 'C5'], bass: 'D2' },
    G7: { notes: ['G3', 'B3', 'D4', 'F4'], bass: 'G1' }, Cmaj7: { notes: ['C4', 'E4', 'G4', 'B4'], bass: 'C2' },
    Fmaj7: { notes: ['F3', 'A3', 'C4', 'E4'], bass: 'F1' }, E7: { notes: ['E4', 'G#4', 'B4', 'D5'], bass: 'E2' },
  }, Array.from({ length: 27 }, (_, b) => [b, 0, 4, ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Dm7', 'E7', 'Am7'][b % 8]]));

  const markers = {
    flash1: { t: ev.flash1, sync: 'av' }, // camera flash + click
    hand: { t: ev.hand, sync: 'av' }, // cut to the room, the pens stop: a tick, then silence
    chairClose: { t: ev.chairClose, sync: 'av' }, // the file shuts: thud
    label1: { t: ev.label1, sync: 'av' }, // the first label slams in
    label2: { t: ev.label2, sync: 'av' }, // the second
    resume: { t: ev.resume, sync: 'av' }, // colour back, next slide: click
    stamp: { t: ev.stamp, sync: 'av' }, // LULUS
    freeze: ev.freeze, question: ev.question, pushback: ev.pushback, sheet: ev.sheet, endText: ev.endText,
  };

  const SCORE = { FPS, FORMAT, W, H, SAFE, DURATION, clock, T, BEAT, BAR, S, m, chords, chordAt, ev, vo, CAPTION_COLOR, slideItems, icons, sheetBlocks, shove, lastBlock, nods, ticks, markers };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
