// Builds project.json for "Banyak Referensi, Mana yang Tepat?" (B1 Minimal Line Art,
// 16:9, 12 adegan x 15 detik) for the directing-stickman-videos Code Engine renderer.
// Usage: node build-project.mjs [outFile]
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
// --part N (1..3) writes a re-timed 60 s draft of scenes 4N-3..4N into drafts/part-N/project.json,
// so the whole storyboard can be inspected through the runtime's 60 s preview limit.
const PART = Number((process.argv.find(a => a.startsWith('--part=')) || '').split('=')[1] || 0);
const argv = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : (process.argv.find(a => a.startsWith(k + '=')) || '').split('=')[1]; };
const OUT = path.resolve(argv('--out') || (PART ? path.join(HERE, '..', 'drafts', `part-${PART}`, 'project.json') : path.join(HERE, '..', 'project.json')));
const ASSET = PART ? '../../' : '';
const DUMP = argv('--dump-cues');            // write [{scene,text}] and exit (input for tools/align-cues.mjs)
const TIMING = argv('--timing') ? JSON.parse(fs.readFileSync(argv('--timing'), 'utf8')) : null; // output of align-cues.mjs
const SCENE = 15;
const RED = '#EC4338', YELLOW = '#F6D34A', NAVY = '#1F3A5F', GREEN = '#3E9B5F', GRAY = '#6b7280';

// ---------- layer helpers ----------
const img = (path, x, y, w, extra = {}) => ({type: 'image', path: `${ASSET}art/${path}.png`, x, y, w, ...extra});
// Default text width runs to the right frame edge (the renderer's own default, 1080 - x, collapses past x = 1080).
const txt = (text, x, y, size, extra = {}) => ({type: 'text', text, x, y, size, w: Math.max(1270 - x, 120), ...extra});
const line = (points, extra = {}) => ({type: 'line', points, ...extra});
const arrow = (x, y, w, extra = {}) => ({type: 'arrow', x, y, w, ...extra});
const underline = (x, y, w, extra = {}) => ({type: 'underline', x, y, w, ...extra});
// Declared local motion: id + role + reason are required by the renderer's 2.5 s gate.
let n = 0;
const mv = (layer, role, reason, keys) => ({...layer, id: `${role}-${++n}`, motion: {role, reason}, keys});
const draw = (layer, role, reason, t0, t1) => mv(layer, role, reason, [{t: t0, progress: 0}, {t: t1, progress: 1}]);
const slideX = (layer, role, reason, t0, t1, x0, x1, extra0 = {}, extra1 = {}) => mv(layer, role, reason, [{t: t0, x: x0, ...extra0}, {t: t1, x: x1, ...extra1}]);
const slideY = (layer, role, reason, t0, t1, y0, y1) => mv(layer, role, reason, [{t: t0, y: y0}, {t: t1, y: y1}]);
// Pencil/hand taps: small vertical oscillation, used only where the story has a thinking pause.
function tapKeys(t0, t1, y, amp = 10, period = 0.9) { const k = []; let t = t0, up = false; while (t <= t1) { k.push({t: +t.toFixed(2), y: up ? y - amp : y}); up = !up; t += period / 2; } return k; }
const tap = (layer, reason, t0, t1, amp) => mv(layer, 'prop', reason, tapKeys(t0, t1, layer.y, amp));
// Metronome arm swings around its top-left origin, so it is drawn pointing down and rotated by ~pi.
function swingKeys(t0, t1, period, amp = 0.42) { const k = []; let t = t0, s = 1; while (t <= t1 + 1e-9) { k.push({t: +t.toFixed(2), angle: +(Math.PI + s * amp).toFixed(3)}); s = -s; t += period / 2; } return k; }
const metronome = (x, y, w, t0, t1, period) => [img('metronome-body', x, y, w), mv(img('metronome-arm', x + w * .5 + 4, y + w * 1.2, 9), 'prop', 'Lengan metronom berayun menandai tempo latihan', swingKeys(t0, t1, period))];

// ---------- recurring stage (medium shot) ----------
// Floor is implied at y=600; the caption band starts at y=610.
const desk = () => img('desk', 100, 416, 760);
const laptopSide = () => img('laptop-side', 400, 344, 170);
// Figures stand/sit on the floor line (y = 600) whatever their width.
const FLOOR = 600;
const vidka = (pose, extra = {}) => { const w = extra.w ?? 280; return img(`vidka-${pose}`, 520, FLOOR - w * 560 / 420, w, extra); };
const herry = (pose, x = 960, extra = {}) => { const w = extra.w ?? 200; return img(`herry-${pose}`, x, FLOOR - w * 560 / 300, w, extra); };
const ardipal = (pose, x = 960, extra = {}) => { const w = extra.w ?? 200; return img(`ardipal-${pose}`, x, FLOOR - w * 560 / 300, w, extra); };
const simLabel = () => txt('Simulasi', 40, 30, 26, {color: GRAY});
const hand = (text, x, y, size = 34, extra = {}) => txt(text, x, y, size, {color: NAVY, ...extra}); // handwriting on paper

// ---------- scenes ----------
// Each scene: {title, shots: [{dur, layers}], cues: [[start, end, text]] relative to scene start, sfx: [[t, kind, gain]]}
const scenes = [];

// 1. Kebingungan awal
scenes.push({title: 'Kebingungan awal', shots: [
  {dur: 4, layers: [
    img('articles-pile', 110, 80, 420),
    mv(img('page-a', 430, 120, 180), 'prop', 'Satu artikel ditarik keluar dari tumpukan lalu diratakan', [{t: .3, x: 430, y: 120, angle: -.05}, {t: 1.6, x: 580, y: 330, angle: .04}, {t: 2.6, x: 580, y: 330, angle: .04}, {t: 3.4, x: 600, y: 330, angle: 0}]),

    txt('Banyak referensi...', 600, 90, 68, {bold: true, w: 660}),
    txt('Mana yang tepat?', 600, 190, 68, {bold: true, color: RED, w: 660, from: 1.8}),
  ]},
  {dur: 4, layers: [
    desk(), laptopSide(),
    vidka('type', {to: 2.2}), vidka('sigh', {from: 2.2}),
    slideX(img('page-a', 300, 300, 100), 'prop', 'Vidka menarik artikel ke dekat laptop lalu membukanya', 0.2, 1.4, 260, 590, {y: 380}, {y: 345}),
    slideY(img('page-b', 700, 280, 110), 'prop', 'Artikel kedua diletakkan menumpuk di meja', 2.4, 3.4, 220, 330),
    txt('Artikel ketiga pagi ini.', 60, 90, 44, {color: GRAY, w: 420}),
  ]},
  {dur: 3, layers: [
    desk(), laptopSide(), img('page-a', 250, 345, 100), img('page-b', 300, 360, 90),
    vidka('turn'),
    slideX(herry('listen'), 'actor', 'Herry mendekat ketika Vidka menoleh', 0.4, 2.6, 1200, 960),
  ]},
  {dur: 4, layers: [
    desk(), laptopSide(), img('page-a', 250, 345, 100), img('page-b', 300, 360, 90),
    vidka('listen'), herry('point'),
    img('notebook', 770, 330, 210), hand('Masalah penelitian?', 790, 368, 28, {from: 1.0}),
    draw(arrow(900, 380, 0.001), 'information', 'placeholder', 0, 0.01), // (replaced below)
  ]},
], cues: [
  [0.3, 3.2, 'Vidka membuka artikel ketiga pagi ini.'],
  [3.4, 6.6, 'Semua tentang musik, tak satu pun terasa tepat.'],
  [7.0, 10.4, 'Vidka: Pak, referensinya banyak sekali.'],
  [10.6, 12.4, 'Mana yang harus saya pakai?'],
  [12.6, 14.8, 'Herry: Mulai dari masalahmu, bukan tumpukannya.'],
], sfx: [[0.4, 'paper', .05], [4.3, 'paper', .05], [6.5, 'paper', .04], [12.2, 'tap', .05]]});
// Replace the placeholder arrow with Herry's pointing stroke + red ring around the note.
scenes[0].shots[3].layers.pop();
scenes[0].shots[3].layers.push(
  draw(line([[968, 386], [950, 380], [930, 372]], {color: RED, lineWidth: 5}), 'information', 'Herry mengetuk catatan masalah penelitian', 0.3, 1.0),
  draw(line([[780, 358], [985, 354], [990, 402], [780, 406], [780, 358]], {color: RED, lineWidth: 3}), 'information', 'Lingkaran merah mengunci perhatian pada catatan', 1.6, 2.6),
);

// 2. Memperbaiki kata kunci
scenes.push({title: 'Memperbaiki kata kunci', shots: [
  {dur: 4, layers: [ // over-the-shoulder: laptop screen large, Vidka in foreground
    img('laptop-front', 80, 60, 560), img('search-box', 160, 140, 420), hand('musik', 190, 146, 52),
    vidka('type', {x: 860, y: 170, w: 360}),
    ...[0, 1, 2].map(i => slideY(img('page-plain', 200 + i * 120, 215, 60), 'information', 'Hasil pencarian yang terlalu banyak berjatuhan di layar', 0.3 + i * 1.0, 1.2 + i * 1.0, 215, 280)),
    txt('terlalu banyak hasil', 200, 462, 40, {color: RED, bold: true}),
  ]},
  {dur: 5, layers: [ // close-up screen
    img('search-box', 160, 200, 960), hand('musik', 200, 222, 60, {to: 1.3}),
    {...draw(line([[195, 262], [340, 258]], {color: RED, lineWidth: 6}), 'information', 'Kata «musik» dicoret', 0.2, 0.8), to: 1.3},
    hand('kekompakan tempo', 200, 222, 52, {from: 1.4}), hand('ansambel', 600, 222, 52, {from: 2.3}), hand('siswa SMP', 820, 222, 52, {from: 3.2}),
    mv(img('cursor', 196, 228, 10), 'information', 'Kursor maju mengikuti kata kunci yang diketik', [{t: 1.3, x: 196}, {t: 1.5, x: 580}, {t: 2.2, x: 580}, {t: 2.4, x: 800}, {t: 3.1, x: 800}, {t: 3.3, x: 1030}]),
    txt('Lebih khusus, lebih tersaring.', 160, 400, 44, {color: GRAY, from: 3.6}),
  ]},
  {dur: 6, layers: [ // learning pause
    img('card', 120, 120, 760), txt('Tugasmu', 150, 140, 32, {color: RED, bold: true}),
    txt('Tulis tiga kata kunci khusus', 150, 190, 50, {bold: true, w: 700}),
    txt('untuk masalah penelitianmu.', 150, 262, 50, {bold: true, w: 700}),
    img('vidka-think', 920, 260, 240),
    tap(img('pencil', 850, 470, 90), 'Pensil Vidka mengetuk meja selama jeda berpikir', 0.4, 5.6, 8),
  ]},
], cues: [
  [0.3, 2.8, 'Kata kunci «musik» terlalu luas.'],
  [3.0, 5.8, 'Herry: Apa yang sebenarnya kamu amati?'],
  [6.2, 8.8, 'Vidka menghapus «musik» dan mengetik ulang:'],
  [9.0, 11.6, 'kekompakan tempo, ansambel, siswa SMP.'],
  [12.0, 14.6, 'Tugasmu: tulis tiga kata kunci khusus.'],
], sfx: [[4.3, 'tap', .05], [5.4, 'tap', .04], [6.3, 'tap', .04], [7.2, 'tap', .04], [9.2, 'pop', .04]]});

// 3. Memilih referensi relevan
const pagePair = (yOff = 0) => [img('page-a', 200, 80 + yOff, 300), img('page-b', 760, 80 + yOff, 300)];
scenes.push({title: 'Memilih referensi relevan', shots: [
  {dur: 4, layers: [
    ...pagePair(), hand('Peserta:', 230, 320, 30), hand('mahasiswa konservatori', 230, 356, 28), hand('Peserta:', 790, 320, 30), hand('siswa SMP, ansambel sekolah', 790, 356, 28),
    draw(line([[228, 374], [478, 374]], {color: YELLOW, lineWidth: 26, alpha: .55}), 'information', 'Stabilo menyorot baris peserta artikel pertama', 0.3, 1.2),
    slideX(img('highlighter', 230, 320, 90), 'prop', 'Stabilo bergerak di baris peserta', 0.3, 1.2, 230, 440),
    draw(line([[788, 374], [1040, 374]], {color: YELLOW, lineWidth: 26, alpha: .55}), 'information', 'Stabilo menyorot baris peserta artikel kedua', 2.0, 2.9),
    slideX(img('highlighter', 790, 320, 90), 'prop', 'Stabilo pindah ke artikel kedua', 2.0, 2.9, 790, 1000),
  ]},
  {dur: 4, layers: [
    desk(), laptopSide(), vidka('listen', {to: 3.0}), vidka('nod', {from: 3.0}), herry('point', 1000),
    img('page-a', 810, 335, 95), img('page-b', 890, 348, 95),
    draw(line([[1008, 386], [960, 372], [870, 345]], {color: RED, lineWidth: 4}), 'information', 'Herry menunjuk artikel pertama (konsep)', 0.2, 1.0),
    draw(line([[1008, 386], [975, 382], [945, 362]], {color: RED, lineWidth: 4}), 'information', 'Herry menunjuk artikel kedua (konteks)', 2.0, 2.8),
    txt('konsep', 790, 290, 32, {color: NAVY, bold: true, from: 1.0}), txt('konteks', 905, 262, 32, {color: NAVY, bold: true, from: 2.8}),
  ]},
  {dur: 7, layers: [
    ...pagePair(),
    mv(img('sticky-yellow', 60, 40, 130), 'prop', 'Vidka menempelkan catatan KONSEP pada artikel pertama', [{t: .3, x: 60, y: 40, angle: -.2}, {t: 1.2, x: 380, y: 60, angle: 0}]),
    txt('KONSEP', 398, 100, 30, {bold: true, from: 1.3}),
    mv(img('sticky-pink', 1120, 40, 130), 'prop', 'Vidka menempelkan catatan KONTEKS SISWA pada artikel kedua', [{t: 3.0, x: 1120, y: 40, angle: .2}, {t: 3.9, x: 940, y: 60, angle: 0}]),
    txt('KONTEKS', 952, 92, 26, {bold: true, from: 4.0}), txt('SISWA', 968, 124, 26, {bold: true, from: 4.0}),
    draw(line([[240, 520], [262, 548], [310, 490]], {color: GREEN, lineWidth: 7}), 'information', 'Tanda centang: artikel pertama dipakai', 4.6, 5.2),
    draw(line([[800, 520], [822, 548], [870, 490]], {color: GREEN, lineWidth: 7}), 'information', 'Tanda centang: artikel kedua dipakai', 5.7, 6.3),
    txt('dipakai', 330, 500, 30, {color: GREEN, from: 5.2}), txt('dipakai', 890, 500, 30, {color: GREEN, from: 6.3}),
  ]},
], cues: [
  [0.3, 2.6, 'Dua artikel lolos saringan.'],
  [2.8, 5.4, 'Vidka membandingkan bagian pesertanya.'],
  [5.6, 8.4, 'Herry: Yang pertama memberi konsep.'],
  [8.6, 11.0, 'Yang kedua memberi konteks siswamu.'],
  [11.4, 14.6, 'Keduanya dipakai, untuk tujuan yang berbeda.'],
], sfx: [[0.4, 'paper', .04], [9.2, 'pop', .05], [11.9, 'pop', .05], [12.7, 'tap', .05], [13.8, 'tap', .05]]});

// 4. Memeriksa isi sumber
scenes.push({title: 'Memeriksa isi sumber', shots: [
  {dur: 4, layers: [
    img('page-plain', 340, 30, 400), hand('Metode', 400, 150, 30, {bold: true}), hand('Hasil', 400, 330, 30, {bold: true}),
    txt('Baca bagian,', 40, 120, 44, {bold: true, w: 280}), txt('bukan semuanya.', 40, 180, 44, {bold: true, w: 280}),
    draw(line([[400, 200], [690, 200]], {color: YELLOW, lineWidth: 26, alpha: .55}), 'information', 'Stabilo menyorot bagian metode', 0.4, 1.6),
    mv(img('highlighter', 420, 150, 90), 'prop', 'Stabilo menelusuri bagian metode lalu turun ke hasil', [{t: .4, x: 420, y: 150}, {t: 1.6, x: 660, y: 150}, {t: 2.6, x: 660, y: 150}, {t: 3.6, x: 420, y: 330}]),
  ]},
  {dur: 4, layers: [
    img('page-plain', 340, 30, 400), hand('Metode', 400, 150, 30, {bold: true}), line([[400, 200], [690, 200]], {color: YELLOW, lineWidth: 26, alpha: .55}), hand('Hasil', 400, 330, 30, {bold: true}),
    draw(line([[400, 380], [690, 380]], {color: YELLOW, lineWidth: 26, alpha: .55}), 'information', 'Stabilo menandai satu temuan di bagian hasil', 0.2, 1.2),
    mv(img('highlighter', 420, 330, 90), 'prop', 'Stabilo menandai temuan lalu diangkat', [{t: .2, x: 420, y: 330}, {t: 1.2, x: 660, y: 330}, {t: 2.4, x: 660, y: 330}, {t: 3.2, x: 760, y: 250}]),
    hand('latihan bagian pendek', 400, 362, 26, {from: 1.3}), hand('membuat lebih kompak', 400, 392, 26, {from: 1.3}),
    txt('Satu temuan.', 40, 120, 44, {bold: true, w: 280, from: 1.4}),
  ]},
  {dur: 7, layers: [
    img('notebook', 200, 110, 600),
    hand('Mendukung', 260, 200, 48, {from: .6}), hand('pernyataan', 480, 200, 48, {from: 1.4}), hand('apa?', 700, 200, 48, {from: 2.2}),
    mv(img('pencil', 250, 170, 100), 'prop', 'Pensil Vidka menulis pertanyaan dari kiri ke kanan', [{t: .4, x: 250}, {t: 2.4, x: 720}, ...tapKeys(3.0, 6.8, 170, 8).map(k => ({...k, x: 760}))]),
    txt('Satu temuan, satu pertanyaan.', 860, 150, 36, {color: GRAY, w: 400, from: 3.5}),
  ]},
], cues: [
  [0.3, 3.2, 'Membaca artikel bukan mencatat semuanya.'],
  [3.4, 5.6, 'Vidka menelusuri bagian metode,'],
  [5.8, 7.8, 'lalu bagian hasil.'],
  [8.2, 11.2, 'Satu temuan ditandai, lalu satu pertanyaan:'],
  [11.6, 14.6, 'temuan ini mendukung pernyataan apa?'],
], sfx: [[0.5, 'paper', .04], [4.3, 'paper', .04], [8.6, 'tap', .05], [9.4, 'tap', .04], [10.2, 'tap', .04]]});

// 5. Menghubungkan bacaan dan masalah
const noteCards = (x1, x2) => [
  img('note-card', x1, 120, 300), hand('Konsep:', x1 + 20, 130, 26, {color: RED}), hand('tempo & sinkronisasi', x1 + 20, 178, 30),
  img('note-card', x2, 330, 300), hand('Konteks:', x2 + 20, 340, 26, {color: RED}), hand('siswa SMP, ansambel', x2 + 20, 388, 30),
];
scenes.push({title: 'Menghubungkan bacaan dan masalah', shots: [
  {dur: 5, layers: [ // top-down desk
    img('notebook', 700, 140, 480), hand('Pertanyaan penelitian', 730, 180, 30, {color: RED}), hand('Mengapa siswa', 730, 228, 42), hand('tidak kompak?', 730, 282, 42),
    mv(img('note-card', 60, 120, 300), 'prop', 'Catatan konsep digeser mendekati pertanyaan', [{t: .5, x: 60}, {t: 1.8, x: 380}]),
    hand('Konsep: tempo & sinkronisasi', 80, 128, 30, {to: .5}),
    mv(img('note-card', 60, 330, 300), 'prop', 'Catatan konteks digeser mendekati pertanyaan', [{t: 2.2, x: 60}, {t: 3.5, x: 380}]),
    hand('Konteks: siswa SMP', 80, 338, 30, {to: 2.2}),
    hand('Konsep: tempo & sinkronisasi', 400, 128, 30, {from: 1.8}), hand('Konteks: siswa SMP', 400, 338, 30, {from: 3.5}),
  ]},
  {dur: 5, layers: [
    img('notebook', 700, 140, 480), hand('Pertanyaan penelitian', 730, 180, 30, {color: RED}), hand('Mengapa siswa', 730, 228, 42, {to: 4.3}), hand('tidak kompak?', 730, 282, 42, {to: 4.3}),
    img('note-card', 380, 120, 300), hand('Konsep: tempo & sinkronisasi', 400, 128, 30), img('note-card', 380, 330, 300), hand('Konteks: siswa SMP', 400, 338, 30),
    draw(line([[680, 200], [740, 240]], {color: RED, lineWidth: 4}), 'information', 'Garis penghubung konsep ke pertanyaan', 0.3, 1.2),
    draw(line([[680, 400], [740, 300]], {color: RED, lineWidth: 4}), 'information', 'Garis penghubung konteks ke pertanyaan', 1.8, 2.7),
    draw(line([[725, 255], [990, 250], [725, 302], [980, 300]], {color: RED, lineWidth: 5}), 'information', 'Vidka mencoret kalimat lama', 3.4, 4.2),
    hand('Bagaimana siswa', 730, 228, 42, {from: 4.3}), hand('menjaga tempo bersama?', 730, 282, 40, {from: 4.3}),
  ]},
  {dur: 5, layers: [ // close-up face: bingung → paham
    img('vidka-sigh', 420, 60, 380, {to: 2.2}), img('vidka-aha', 420, 60, 380, {from: 2.2}),
    mv(img('notebook', 60, 330, 300), 'prop', 'Catatan yang sudah diperbaiki digeser ke depan Vidka', [{t: .2, x: 60}, {t: 1.0, x: 160}]),
    hand('tempo bersama', 200, 380, 30, {from: 1.0}),
    mv(img('pencil', 300, 300, 90), 'prop', 'Vidka mengangkat pensil begitu paham', [{t: 2.4, y: 300}, {t: 3.4, y: 230}, ...tapKeys(3.8, 4.8, 230, 8)]),
    txt('bingung', 900, 140, 40, {color: GRAY, to: 2.2}), txt('paham', 900, 140, 48, {color: GREEN, bold: true, from: 2.2}),
  ]},
], cues: [
  [0.3, 3.0, 'Dua catatan bacaan, satu pertanyaan penelitian.'],
  [3.2, 5.4, 'Vidka mendekatkan keduanya,'],
  [5.6, 8.2, 'menarik garis penghubung,'],
  [8.4, 10.8, 'lalu memperbaiki kalimat pertanyaannya.'],
  [11.0, 14.6, 'Vidka: Jadi masalah saya bukan «musik», tapi tempo.'],
], sfx: [[0.6, 'paper', .04], [2.3, 'paper', .04], [8.5, 'tap', .05], [12.3, 'chime', .05]]});

// 6. Memperjelas pernyataan masalah
scenes.push({title: 'Memperjelas pernyataan masalah', shots: [
  {dur: 4, layers: [
    img('notebook', 160, 70, 680), img('vidka-write', 820, 100, 420),
    hand('Siswa kurang kompak', 240, 170, 46),
    draw(line([[232, 200], [680, 196]], {color: RED, lineWidth: 6}), 'information', 'Kalimat umum dicoret', 0.8, 1.8),
    txt('terlalu umum', 700, 160, 30, {color: RED, from: 1.9}),
    mv(img('pencil', 640, 150, 100), 'prop', 'Pensil turun ke baris berikutnya', [{t: 2.4, x: 640, y: 150}, {t: 3.4, x: 240, y: 240}]),
  ]},
  {dur: 5, layers: [
    img('notebook', 160, 70, 680), img('vidka-write', 820, 100, 420),
    hand('Siswa kurang kompak', 240, 170, 46, {color: GRAY}), line([[232, 200], [680, 196]], {color: RED, lineWidth: 6}),
    hand('tempo meningkat', 240, 260, 40, {from: .3}), hand('lalu dua siswa tertinggal', 240, 330, 40, {from: 1.8}), hand('dan latihan berhenti', 240, 400, 40, {from: 3.3}),
    mv(img('pencil', 240, 240, 100), 'prop', 'Pensil menulis tiga frasa berurutan', [{t: .2, x: 240, y: 240}, {t: .8, x: 520, y: 240}, {t: 1.7, x: 240, y: 310}, {t: 2.3, x: 620, y: 310}, {t: 3.2, x: 240, y: 380}, {t: 3.8, x: 560, y: 380}, {t: 4.8, x: 700, y: 300}]),
  ]},
  {dur: 6, layers: [
    simLabel(), img('music-stand', 250, 330, 70), img('music-stand', 520, 330, 70),
    img('player-a', 300, 170, 170),
    mv(img('player-b-play', 560, 170, 170), 'actor', 'Pemain kedua tertinggal: mundur dari posisinya', [{t: 2.0, x: 560}, {t: 3.0, x: 640}]),
    ...metronome(900, 300, 130, 0, 4.0, 0.5),
    txt('tempo naik', 880, 220, 30, {color: RED, to: 4.0}), txt('latihan berhenti', 860, 220, 34, {color: RED, bold: true, from: 4.0}),
  ]},
], cues: [
  [0.3, 3.2, '«Siswa kurang kompak» masih terlalu umum.'],
  [3.4, 5.6, 'Apa yang sebenarnya terjadi?'],
  [5.8, 8.8, 'Vidka: Saat tempo naik, dua siswa tertinggal,'],
  [9.0, 10.8, 'dan latihan berhenti.'],
  [11.2, 14.6, 'Kejadian dan dampaknya kini terlihat jelas.'],
], sfx: [[0.9, 'tap', .05], [4.3, 'tap', .04], [5.8, 'tap', .04], [7.3, 'tap', .04], [13.0, 'pop', .05]]});

// 7. Menyusun pernyataan masalah (clean stacked build, then a hold)
const S7 = {
  k1: ['KEJADIAN', 'Saat tempo meningkat, beberapa siswa tertinggal.'],
  k2: ['DAMPAK', 'Latihan sering terhenti di tengah lagu.'],
  k3: ['BELUM DIPAHAMI', 'Bagaimana siswa menyesuaikan diri saat tempo berubah.'],
};
const row = (i, [label, text]) => [txt(label, 120, 84 + i * 136, 30, {color: RED, bold: true}), hand(text, 120, 120 + i * 136, 46, {w: 1040})];
const writePencil = (i, dur) => mv(img('pencil', 120, 106 + i * 136, 90), 'prop', 'Pensil menulis kalimat ' + (i + 1) + ' lalu berhenti di tepi halaman', [{t: .2, x: 120, y: 106 + i * 136}, {t: 1.6, x: 980, y: 106 + i * 136}, {t: 2.4, x: 1040, y: 106 + i * 136}, {t: dur - .4, x: 1040, y: 96 + i * 136}]);
scenes.push({title: 'Menyusun pernyataan masalah', shots: [
  {dur: 4, layers: [...row(0, S7.k1), writePencil(0, 4)]},
  {dur: 4, layers: [...row(0, S7.k1), ...row(1, S7.k2), writePencil(1, 4)]},
  {dur: 3, layers: [...row(0, S7.k1), ...row(1, S7.k2), ...row(2, S7.k3), writePencil(2, 3)]},
  {dur: 4, layers: [
    ...row(0, S7.k1), ...row(1, S7.k2), ...row(2, S7.k3),
    draw(line([[1190, 90], [1210, 90], [1210, 440], [1190, 440]], {color: NAVY, lineWidth: 4}), 'information', 'Kurung menyatukan tiga kalimat menjadi pernyataan masalah', 0.3, 1.8),
    txt('Pernyataan', 1040, 460, 32, {color: NAVY, bold: true, from: 1.8}), txt('masalah', 1070, 500, 32, {color: NAVY, bold: true, from: 1.8}),
    tap(img('pencil', 1090, 300, 80), 'Pensil diletakkan di tepi, mengetuk pelan selama jeda baca', 2.0, 3.8, 6),
  ]},
], cues: [
  [0.3, 3.0, 'Pernyataan masalah disusun dari tiga unsur.'],
  [3.2, 5.6, 'Pertama, kejadian yang diamati.'],
  [5.8, 8.0, 'Kedua, dampaknya pada latihan.'],
  [8.2, 10.8, 'Ketiga, hal yang belum dipahami.'],
  [11.4, 14.4, 'Tiga kalimat ini menjadi dasar pertanyaan.'],
], sfx: [[0.3, 'tap', .05], [4.3, 'tap', .05], [8.3, 'tap', .05], [12.8, 'pop', .05]]});

// 8. Merumuskan pertanyaan penelitian
const Q1 = 'Bagaimana siswa ansambel SMP', Q2 = 'menyesuaikan tempo saat latihan bersama?';
const bigQ = () => [hand(Q1, 120, 160, 50), hand(Q2, 120, 240, 50)];
scenes.push({title: 'Merumuskan pertanyaan penelitian', shots: [
  {dur: 4, layers: [ // over the shoulder: Vidka finishes writing before any highlight
    img('vidka-write', 20, 150, 400), img('notebook', 440, 130, 600),
    hand(Q1, 480, 190, 36, {from: .3}), hand(Q2, 480, 250, 31, {from: 1.8}),
    mv(img('pencil', 470, 170, 90), 'prop', 'Pensil menulis dua baris pertanyaan lalu diangkat', [{t: .2, x: 470, y: 170}, {t: 1.6, x: 940, y: 170}, {t: 1.8, x: 470, y: 230}, {t: 3.4, x: 1000, y: 230}, {t: 3.9, x: 1040, y: 150}]),
  ]},
  {dur: 3, layers: [...bigQ(), txt('PESERTA', 120, 100, 28, {color: RED, bold: true}), draw(underline(330, 228, 430, {color: YELLOW}), 'information', 'Sorotan peserta: siswa ansambel SMP', 0.2, 1.0)]},
  {dur: 3, layers: [...bigQ(), txt('PROSES', 120, 100, 28, {color: RED, bold: true}), draw(underline(120, 308, 360, {color: YELLOW}), 'information', 'Sorotan proses: menyesuaikan tempo', 0.2, 1.0)]},
  {dur: 2, layers: [...bigQ(), txt('KONTEKS', 120, 100, 28, {color: RED, bold: true}), draw(underline(500, 308, 420, {color: YELLOW}), 'information', 'Sorotan konteks: saat latihan bersama', 0.2, 1.0)]},
  {dur: 3, layers: [...bigQ(), draw(line([[1040, 200], [1066, 232], [1120, 170]], {color: GREEN, lineWidth: 7}), 'information', 'Centang: pertanyaan lengkap', 0.3, 0.9), txt('lengkap', 1020, 250, 30, {color: GREEN, from: .9})]},
], cues: [
  [0.3, 3.2, 'Vidka menulis satu pertanyaan yang lengkap.'],
  [3.6, 5.8, 'Pertanyaan ini menyebut pesertanya,'],
  [6.4, 8.8, 'proses yang ingin dipahami,'],
  [9.4, 11.6, 'dan konteks tempat proses itu terjadi.'],
  [12.2, 14.6, 'Satu kalimat, tiga unsur yang jelas.'],
], sfx: [[0.3, 'tap', .05], [4.3, 'pop', .04], [7.3, 'pop', .04], [10.3, 'pop', .04], [12.4, 'chime', .05]]});

// 9. Memilih data yang diperlukan
scenes.push({title: 'Memilih data yang diperlukan', shots: [
  {dur: 4, layers: [
    img('vidka-stand-read', 380, 208, 210), img('herry-listen', 760, 208, 210, {to: 2.0}), img('herry-nod', 760, 208, 210, {from: 2.0}),
    mv(img('questionnaire', 100, 150, 200), 'prop', 'Kuesioner dibaca, sedikit dimiringkan', [{t: .3, angle: -.04}, {t: 1.0, angle: .04}, {t: 2.0, angle: -.03}, {t: 2.8, angle: .03}]),
    txt('Kuesioner', 110, 430, 34, {color: NAVY, bold: true}),
    slideX(img('notebook', 1100, 300, 200), 'prop', 'Catatan pengamatan muncul sebagai pilihan kedua', 2.4, 3.2, 1300, 1040), txt('Catatan pengamatan', 1000, 460, 32, {color: NAVY, bold: true, from: 3.2}),
  ]},
  {dur: 4, layers: [
    img('vidka-stand-look', 380, 208, 210), img('herry-listen', 760, 208, 210, {to: 2.6}),
    slideY(img('questionnaire', 100, 150, 200), 'prop', 'Vidka menurunkan kuesioner', 0.2, 1.2, 150, 380),
    slideX(img('door', 1000, 160, 190), 'prop', 'Pintu ruang latihan masuk ke bidang pandang', 1.6, 2.6, 1120, 1000),
    txt('RUANG LATIHAN', 960, 110, 30, {color: NAVY, bold: true, from: 2.6}),
  ]},
  {dur: 4, layers: [ // learning pause
    img('card', 120, 110, 800), txt('Pikirkan', 150, 130, 30, {color: RED, bold: true}),
    txt('Data mana yang menjawab', 150, 180, 50, {bold: true, w: 740}), txt('pertanyaanmu?', 150, 252, 50, {bold: true, w: 740}),
    img('vidka-think', 960, 290, 220), tap(img('pencil', 900, 470, 90), 'Pensil mengetuk selama jeda berpikir', 0.4, 3.6, 8),
  ]},
  {dur: 3, layers: [
    txt('Pengamatan dulu, kuesioner menyusul.', 120, 80, 48, {bold: true, w: 1040}),
    mv(img('notebook', 160, 300, 260), 'prop', 'Catatan pengamatan ditempatkan sebagai data pertama', [{t: .2, y: 300}, {t: 1.0, y: 220}]), txt('1', 100, 230, 60, {color: RED, bold: true, from: 1.0}),
    mv(img('questionnaire', 640, 300, 200), 'prop', 'Kuesioner menyusul sebagai data kedua', [{t: 1.2, y: 300}, {t: 2.0, y: 220}]), txt('2', 580, 230, 60, {color: RED, bold: true, from: 2.0}),
    txt('tindakan saat latihan', 170, 440, 28, {color: GRAY, from: 1.0}), txt('pendapat setelah latihan', 650, 440, 28, {color: GRAY, from: 2.0}),
  ]},
], cues: [
  [0.3, 3.4, 'Data apa yang menjawab pertanyaan itu?'],
  [3.6, 5.8, 'Vidka: Apakah kuesioner saja cukup'],
  [6.0, 7.8, 'menunjukkan apa yang terjadi saat latihan?'],
  [8.4, 11.4, 'Pikirkan: data mana yang menjawab pertanyaanmu?'],
  [12.2, 14.6, 'Vidka: Pengamatan dulu, kuesioner menyusul.'],
], sfx: [[0.4, 'paper', .04], [4.3, 'paper', .04], [6.2, 'tap', .04], [12.4, 'pop', .05], [13.4, 'pop', .05]]});

// 10. Menghubungkan data dan analisis
scenes.push({title: 'Menghubungkan data dan analisis', shots: [
  {dur: 4, layers: [
    simLabel(), img('music-stand', 300, 330, 70), img('music-stand', 560, 330, 70),
    img('player-a', 360, 170, 170), img('player-b-play', 620, 170, 170, {to: 1.6}), img('player-b-turn', 620, 170, 170, {from: 1.6}),
    ...metronome(900, 300, 130, 0, 3.8, 0.5), txt('tempo naik', 880, 220, 30, {color: RED}),
    txt('menoleh', 700, 120, 30, {color: NAVY, from: 1.6}),
  ]},
  {dur: 3, layers: [
    img('clock-note', 240, 110, 640), hand('12:04', 420, 180, 48, {color: RED}), hand('P2 menoleh ke P1', 420, 250, 44, {from: 1.0}),
    mv(img('pencil', 400, 160, 90), 'prop', 'Vidka mencatat waktu dan kejadian', [{t: .2, x: 470, y: 160}, {t: .9, x: 600, y: 160}, {t: 1.0, x: 470, y: 230}, {t: 1.8, x: 860, y: 230}, {t: 2.4, x: 900, y: 160}]),
    txt('catatan pengamatan', 260, 520, 28, {color: GRAY}),
  ]},
  {dur: 4, layers: [
    img('player-b-play', 160, 208, 190), img('vidka-stand-read', 920, 208, 210),
    slideY(img('bubble', 380, 90, 520), 'information', 'Gelembung penjelasan pemain muncul', 0.2, 0.8, 130, 90),
    hand('Saya menoleh karena', 420, 112, 34, {from: .8}), hand('kehilangan hitungan.', 420, 156, 34, {from: .8}),
    tap(img('pencil', 860, 360, 80), 'Vidka mencatat jawaban wawancara', 1.5, 3.8, 10),
    txt('wawancara', 160, 540, 28, {color: GRAY}),
  ]},
  {dur: 4, layers: [
    img('note-card', 100, 150, 440), hand('Pengamatan', 130, 160, 26, {color: RED}), hand('12:04, P2 menoleh', 130, 215, 34), hand('ke P1', 130, 260, 34),
    img('note-card', 740, 150, 440), hand('Wawancara', 770, 160, 26, {color: RED}), hand('"kehilangan hitungan"', 770, 215, 34),
    draw(line([[540, 270], [740, 270]], {color: RED, lineWidth: 5}), 'information', 'Catatan dan penjelasan dihubungkan', 0.4, 1.4),
    txt('= analisis', 520, 330, 40, {color: NAVY, bold: true, from: 1.5}),
    draw(underline(520, 380, 240, {color: YELLOW}), 'information', 'Penekanan pada kata analisis', 2.0, 2.6),
  ]},
], cues: [
  [0.3, 3.6, 'Tempo naik; seorang pemain menoleh ke temannya.'],
  [4.2, 6.6, 'Vidka mencatat waktunya: menit kedua belas.'],
  [7.2, 10.4, 'Pemain: Saya menoleh karena kehilangan hitungan.'],
  [11.2, 14.6, 'Keduanya dibandingkan. Itulah analisisnya.'],
], sfx: [[1.6, 'pop', .04], [4.3, 'tap', .05], [7.3, 'pop', .04], [11.5, 'tap', .05], [12.6, 'chime', .05]]});

// 11. Pertanyaan berbeda, rancangan berbeda
scenes.push({title: 'Pertanyaan berbeda, rancangan berbeda', shots: [
  {dur: 4, layers: [
    img('page-plain', 120, 50, 360), hand('Bagaimana siswa', 150, 110, 34), hand('menyesuaikan tempo?', 150, 150, 34),
    mv(img('page-plain', 120, 50, 360), 'prop', 'Vidka membalik ke halaman pertanyaan kedua', [{t: 1.0, x: 120, angle: 0}, {t: 2.0, x: 560, angle: .02}]),
    hand('Apakah latihan metronom', 590, 110, 34, {from: 2.1}), hand('meningkatkan kestabilan', 590, 150, 34, {from: 2.1}), hand('tempo?', 590, 190, 34, {from: 2.1}),
    ...metronome(1000, 300, 130, 0, 3.8, 0.8),
  ]},
  {dur: 5, layers: [
    img('vidka-stand-look', 140, 208, 210), ardipal('point', 960),
    img('page-plain', 420, 180, 200), hand('memahami', 440, 262, 28), hand('proses', 440, 294, 28),
    img('page-plain', 660, 180, 200), hand('menguji', 680, 262, 28), hand('pengaruh', 680, 294, 28),
    draw(line([[975, 386], [870, 330]], {color: RED, lineWidth: 4}), 'information', 'Ardipal menunjuk perubahan pertanyaan', 0.3, 1.0),
    txt('memahami proses', 400, 460, 30, {color: NAVY, from: .2}), txt('menguji pengaruh', 640, 460, 30, {color: NAVY, bold: true, from: 1.2}),
    draw(underline(640, 500, 230, {color: YELLOW}), 'information', 'Penekanan pada pertanyaan yang menguji pengaruh', 2.4, 3.2),
    txt('bukan', 580, 440, 32, {color: RED, bold: true, from: 3.3}),
  ]},
  {dur: 6, layers: [
    txt('Menguji pengaruh = perbandingan', 120, 60, 48, {bold: true, w: 1040}),
    draw(line([[120, 180], [560, 180], [560, 320], [120, 320], [120, 180]], {color: NAVY, lineWidth: 4}), 'information', 'Kotak kelompok dengan metronom', 0.3, 1.2),
    hand('Kelompok', 150, 200, 34, {from: 1.2}), hand('dengan metronom', 150, 246, 34, {from: 1.2}),
    draw(line([[720, 180], [1160, 180], [1160, 320], [720, 320], [720, 180]], {color: NAVY, lineWidth: 4}), 'information', 'Kotak kelompok pembanding', 1.4, 2.3),
    hand('Kelompok', 750, 200, 34, {from: 2.3}), hand('tanpa metronom', 750, 246, 34, {from: 2.3}),
    draw(arrow(120, 420, 440, {color: RED, lineWidth: 4}), 'information', 'Ukur tempo sebelum lalu sesudah (kelompok 1)', 2.6, 3.4),
    draw(arrow(720, 420, 440, {color: RED, lineWidth: 4}), 'information', 'Ukur tempo sebelum lalu sesudah (kelompok 2)', 3.6, 4.4),
    txt('sebelum', 120, 430, 28, {color: GRAY, from: 2.6}), txt('sesudah', 470, 430, 28, {color: GRAY, from: 3.4}),
    txt('sebelum', 720, 430, 28, {color: GRAY, from: 3.6}), txt('sesudah', 1070, 430, 28, {color: GRAY, from: 4.4}),
    txt('ukur kestabilan tempo', 440, 500, 34, {color: RED, bold: true, from: 4.5}),
  ]},
], cues: [
  [0.3, 3.2, 'Pertanyaan berbeda menuntut rancangan berbeda.'],
  [4.2, 6.4, 'Ardipal: Pertanyaan kedua menguji pengaruh.'],
  [6.6, 8.8, 'Kamu perlu kelompok pembanding,'],
  [9.2, 11.8, 'dan ukuran tempo sebelum serta sesudah latihan.'],
  [12.2, 14.6, 'Bukan «membuktikan», melainkan menguji perbedaan.'],
], sfx: [[1.1, 'paper', .05], [4.4, 'tap', .04], [9.3, 'tap', .04], [10.4, 'tap', .04], [13.5, 'pop', .05]]});

// 12. Hasil belajar dan penutup
scenes.push({title: 'Hasil belajar dan penutup', shots: [
  {dur: 4, layers: [
    img('notebook', 180, 40, 760), txt('Rancangan Vidka', 220, 70, 30, {color: RED, bold: true}),
    hand('1. Masalah: tempo naik, siswa tertinggal', 220, 130, 34, {from: .3}),
    hand('2. Pertanyaan: bagaimana siswa menyesuaikan?', 220, 210, 34, {from: 1.5}),
    hand('3. Data: pengamatan, lalu wawancara', 220, 290, 34, {from: 2.7}),
    mv(img('pencil', 220, 110, 90), 'prop', 'Pensil mencentang tiga hasil berurutan', [{t: .2, x: 220, y: 110}, {t: 1.2, x: 860, y: 110}, {t: 1.4, x: 220, y: 190}, {t: 2.4, x: 900, y: 190}, {t: 2.6, x: 220, y: 270}, {t: 3.6, x: 820, y: 270}]),
  ]},
  {dur: 6, layers: [
    desk(), vidka('tidy', {x: 380, to: 3.6}), vidka('listen', {x: 380, from: 3.6}), herry('listen', 930, {w: 180}), ardipal('listen', 1090, {w: 180}),
    img('laptop-side', 300, 344, 170, {to: 3.2}), mv(img('laptop-closed', 300, 414, 170), 'prop', 'Vidka menutup laptop', [{t: 3.2, y: 380}, {t: 3.6, y: 414}]),
    mv(img('page-a', 820, 290, 100), 'prop', 'Artikel pertama dirapikan ke tumpukan', [{t: .3, x: 820, angle: .08}, {t: 1.3, x: 640, angle: 0}]),
    mv(img('page-b', 860, 320, 100), 'prop', 'Artikel kedua dirapikan ke tumpukan', [{t: 1.5, x: 860, angle: -.06}, {t: 2.5, x: 646, angle: 0}]),
    mv(img('notebook', 700, 160, 220), 'prop', 'Buku rancangan diangkat dan diperlihatkan kepada kedua dosen', [{t: 4.4, x: 700, y: 330}, {t: 5.2, x: 760, y: 200}]),
    hand('masalah, pertanyaan, data', 782, 240, 24, {from: 5.2}),
  ]},
  {dur: 5, layers: [
    img('card', 140, 110, 1000), txt('Tugas', 170, 130, 36, {color: RED, bold: true}),
    txt('Pilih data untuk pertanyaanmu.', 170, 190, 52, {bold: true, w: 940}), txt('Jelaskan alasannya.', 170, 268, 52, {bold: true, w: 940}),
    img('vidka-think', 980, 420, 160), tap(img('pencil', 920, 520, 70), 'Jeda tugas: pensil mengetuk pelan', 0.5, 4.6, 6),
  ]},
], cues: [
  [0.3, 2.6, 'Dalam satu sesi, Vidka memiliki tiga hal:'],
  [2.8, 4.2, 'masalah yang jelas,'],
  [4.4, 6.0, 'pertanyaan yang lengkap,'],
  [6.2, 8.6, 'dan alasan memilih datanya.'],
  [9.0, 10.6, 'Rancangan penelitiannya siap.'],
  [11.0, 12.8, 'Tugas: pilih data untuk pertanyaanmu.'],
  [13.0, 14.6, 'Jelaskan alasannya.'],
], sfx: [[0.3, 'tap', .05], [4.4, 'paper', .04], [5.6, 'paper', .04], [7.4, 'tap', .05], [10.4, 'chime', .06]]});

// ---------- assemble ----------
if (scenes.length !== 12) throw new Error(`expected 12 scenes, got ${scenes.length}`);
if (DUMP) { fs.writeFileSync(DUMP, JSON.stringify(scenes.flatMap((sc, i) => sc.cues.map(c => ({scene: i + 1, text: c[2]}))), null, 1)); console.log(`dumped ${scenes.reduce((n, sc) => n + sc.cues.length, 0)} cues → ${DUMP}`); process.exit(0); }
if (TIMING && TIMING.cues.length !== scenes.reduce((n, sc) => n + sc.cues.length, 0)) throw new Error('timing file cue count does not match the script');
// Scale every shot-relative time (keys, from, to) of a layer by f, so choreography keeps its shape when a scene's real length differs from 15 s.
const scaleLayer = (l, f) => ({...l, ...(l.from !== undefined ? {from: +(l.from * f).toFixed(3)} : {}), ...(l.to !== undefined ? {to: +(l.to * f).toFixed(3)} : {}), ...(l.keys ? {keys: l.keys.map(k => ({...k, t: +(k.t * f).toFixed(3)}))} : {})});
const shots = [], captions = [], sfx = [], ledger = [];
const selected = PART ? scenes.slice((PART - 1) * 4, PART * 4) : scenes;
let cueIndex = PART ? scenes.slice(0, (PART - 1) * 4).reduce((n, sc) => n + sc.cues.length, 0) : 0;
let partBase = 0;
selected.forEach((scene, k) => {
  const i = PART ? (PART - 1) * 4 + k : k;
  const total = scene.shots.reduce((a, s) => a + s.dur, 0);
  if (Math.abs(total - SCENE) > 1e-9) throw new Error(`Scene ${i + 1} "${scene.title}" lasts ${total}s, not ${SCENE}s`);
  const real = TIMING ? TIMING.scenes[i] : {start: i * SCENE, end: (i + 1) * SCENE};
  const length = real.end - real.start, f = length / SCENE;
  const base = PART ? partBase : real.start;      // draft parts stay re-timed to 0
  partBase += length;
  let t = base;
  scene.shots.forEach((s, j) => { const dur = s.dur * f; shots.push({start: +t.toFixed(3), end: +(t + dur).toFixed(3), layers: s.layers.map(l => scaleLayer(l, f))}); ledger.push({scene: i + 1, title: scene.title, shot: j + 1, start: +t.toFixed(2), end: +(t + dur).toFixed(2), scale: +f.toFixed(3)}); t += dur; });
  scene.cues.forEach(([a, b, text]) => {
    if (b > SCENE) throw new Error(`Cue beyond scene ${i + 1}: ${text}`);
    const c = TIMING ? TIMING.cues[cueIndex] : null; cueIndex++;
    captions.push(c ? {start: +(base + (c.start - real.start)).toFixed(3), end: +(base + (c.end - real.start)).toFixed(3), text} : {start: +(base + a).toFixed(3), end: +(base + b).toFixed(3), text});
  });
  for (const [at, kind, gain] of scene.sfx || []) sfx.push({time: +(base + at * f).toFixed(3), kind, gain});
});
for (let i = 1; i < captions.length; i++) if (captions[i].start < captions[i - 1].end) throw new Error(`Caption overlap at ${captions[i].start}: ${captions[i].text}`);
for (const c of captions) if (c.text.length > 56) throw new Error(`Caption too long (${c.text.length}): ${c.text}`);

fs.mkdirSync(path.dirname(OUT), {recursive: true});
const project = {
  version: 1, style: 'B1', width: 1280, height: 720, fps: 30,
  metadata: {
    title: 'Banyak Referensi, Mana yang Tepat?', language: 'id', scenes: ledger, ...(PART ? {draft_part: PART, note: 'Re-timed 60 s draft of four scenes for review only; the real timeline is ../../project.json'} : {}),
    timing: TIMING ? {mode: TIMING.mode, note: TIMING.note} : 'planned 12 x 15 s, no recording',
    working_note: TIMING ? 'Shots and cues are timed to the recorded narration (see metadata.timing). Scene choreography is scaled per scene from the 15 s plan.' : 'voice.path is a SILENT 180 s placeholder so the shot timing of the 12x15 s storyboard can be validated and previewed. Replace it with the real Indonesian narration (see narasi.md), re-align captions to the recording, then re-time shots.',
  },
  voice: {path: `${ASSET}${TIMING ? TIMING.voice : 'audio/placeholder-silent-180s.wav'}`, lead: 0, tail: 0},
  captions, shots, sfx,
  ambience: [{path: `${ASSET}audio/room-tone-180s.wav`, start: 0, end: TIMING ? TIMING.duration : 180, gain: 0.04, loop: false}],
  reference_review: {author_id: 'claude-code-draft', capability: {mode: 'limited', environment: 'Claude Code cloud container: Node 22, FFmpeg 6.1, @napi-rs/canvas; no image-generation tool, no authorized TTS call', limitations: [
    {capability: 'hand-drawn character and prop artwork', observed: 'No image-generation tool available in this environment; figures and props were drawn procedurally with canvas code (tools/make-art.mjs)', impact: 'Drawing quality is a readable draft, not equivalent to the B1 Ryan V4 baseline; replace or redraw assets before final acceptance'},
    {capability: 'Indonesian narration (TTS)', observed: 'Narration generation is billable and was not authorized in this session; voice.path is a silent 180 s placeholder', impact: 'Captions and shot timing follow the planned 12x15 s storyboard, not actual speech; re-align after recording narasi.md'},
    {capability: 'licensed background music', observed: 'No licensed track was available offline; only a procedural room-tone bed and procedural SFX are mixed', impact: 'Completeness gate for sample-directed music is not met until a licensed track is added'},
  ]}},
};
fs.writeFileSync(OUT, JSON.stringify(project, null, 1));
console.log(`wrote ${OUT}: ${shots.length} shots, ${captions.length} captions, ${sfx.length} sfx, ${shots.at(-1).end}s`);
