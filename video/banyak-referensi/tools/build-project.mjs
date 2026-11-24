// Builds project.json for "Banyak Referensi, Mana yang Tepat?" (B1 Minimal Line Art, 16:9) from the
// revised dialogue script (tools/script.mjs) and the dialogue timing file (tools/build-audio.mjs).
//
//   node tools/build-project.mjs --timing audio/timing-dialog.json [--part=N] [--out FILE]
//
// Every scene has a TALK part (the recorded lines) and a HOLD part (the table's "Jeda 5 detik").
// Shots are authored on a 10 s talk plan and a 5 s hold plan; each part is scaled to its real length.
import fs from 'node:fs';
import path from 'node:path';
import {SCENES} from './script.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const argv = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : (process.argv.find(a => a.startsWith(k + '=')) || '').split('=')[1]; };
const PART = Number(argv('--part') || 0);
const OUT = path.resolve(argv('--out') || (PART ? path.join(HERE, '..', 'drafts', `part-${PART}`, 'project.json') : path.join(HERE, '..', 'project.json')));
const ASSET = PART ? '../../' : '';
const TIMING = JSON.parse(fs.readFileSync(argv('--timing') || path.join(HERE, '..', 'audio', 'timing-dialog.json'), 'utf8'));
const TALK = 10, HOLDP = 5; // plan seconds
const RED = '#EC4338', YELLOW = '#F6D34A', NAVY = '#1F3A5F', GREEN = '#3E9B5F', GRAY = '#6b7280';

// ---------- layer helpers ----------
const img = (p, x, y, w, extra = {}) => ({type: 'image', path: `${ASSET}art/${p}.png`, x, y, w, ...extra});
const txt = (text, x, y, size, extra = {}) => ({type: 'text', text, x, y, size, w: Math.max(1270 - x, 120), ...extra});
const line = (points, extra = {}) => ({type: 'line', points, ...extra});
const arrow = (x, y, w, extra = {}) => ({type: 'arrow', x, y, w, ...extra});
const underline = (x, y, w, extra = {}) => ({type: 'underline', x, y, w, ...extra});
let n = 0;
const mv = (layer, role, reason, keys) => ({...layer, id: `${role}-${++n}`, motion: {role, reason}, keys});
const draw = (layer, role, reason, t0, t1) => mv(layer, role, reason, [{t: t0, progress: 0}, {t: t1, progress: 1}]);
const slideX = (layer, role, reason, t0, t1, x0, x1, e0 = {}, e1 = {}) => mv(layer, role, reason, [{t: t0, x: x0, ...e0}, {t: t1, x: x1, ...e1}]);
const slideY = (layer, role, reason, t0, t1, y0, y1) => mv(layer, role, reason, [{t: t0, y: y0}, {t: t1, y: y1}]);
function tapKeys(t0, t1, y, amp = 8, period = 0.9) { const k = []; let t = t0, up = false; while (t <= t1 + 1e-9) { k.push({t: +t.toFixed(2), y: up ? y - amp : y}); up = !up; t += period / 2; } return k; }
const tap = (layer, reason, t0, t1, amp) => mv(layer, 'prop', reason, tapKeys(t0, t1, layer.y, amp));
function swingKeys(t0, t1, period, amp = 0.42) { const k = []; let t = t0, s = 1; while (t <= t1 + 1e-9) { k.push({t: +t.toFixed(2), angle: +(Math.PI + s * amp).toFixed(3)}); s = -s; t += period / 2; } return k; }
const metronome = (x, y, w, t0, t1, period) => [img('metronome-body', x, y, w), mv(img('metronome-arm', x + w * .5 + 4, y + w * 1.2, 9), 'prop', 'Lengan metronom berayun menandai tempo', swingKeys(t0, t1, period))];
// writing pencil: moves along a row (x0→x1) between t0 and t1, then lifts a little
const write = (x0, x1, y, t0, t1, reason = 'Pensil Vidka menulis') => mv(img('pencil', x0, y, 90), 'prop', reason, [{t: t0, x: x0, y}, {t: t1, x: x1, y}, {t: +(t1 + 0.4).toFixed(2), x: x1 + 30, y: y - 40}]);
// a hold needs motion too: the pencil rests at (x,y) and taps gently for the whole hold plan
const restTap = (x, y, until = HOLDP - 0.2) => tap(img('pencil', x, y, 80), 'Jeda: pensil mengetuk pelan sementara penonton membaca', 0.3, until, 6);

// ---------- stage ----------
const FLOOR = 600;
const desk = () => img('desk', 100, 416, 760);
const laptopSide = () => img('laptop-side', 400, 344, 170);
const vidka = (pose, extra = {}) => { const w = extra.w ?? 280; return img(`vidka-${pose}`, extra.x ?? 520, FLOOR - w * 560 / 420, w, extra); };
const standing = (who, pose, x, extra = {}) => { const w = extra.w ?? 200; return img(`${who}-${pose}`, x, FLOOR - w * 560 / 300, w, extra); };
const herry = (pose, x = 960, extra = {}) => standing('herry', pose, x, extra);
const ardipal = (pose, x = 960, extra = {}) => standing('ardipal', pose, x, extra);
const hand = (text, x, y, size = 34, extra = {}) => txt(text, x, y, size, {color: NAVY, ...extra});
const label = (text, x, y, size = 30) => txt(text, x, y, size, {color: GRAY});
const taskCard = (title, l1, l2) => [
  img('card', 120, 110, 820), txt(title, 150, 130, 32, {color: RED, bold: true}),
  txt(l1, 150, 182, 50, {bold: true, w: 760}), ...(l2 ? [txt(l2, 150, 254, 50, {bold: true, w: 760})] : []),
  img('vidka-think', 980, 290, 220), restTap(900, 470),
];

const scenes = [];
// 1. Kebingungan awal  (V: artikel banyak, bingung memilih | H: buka catatanmu, apa yang ingin kamu pahami?)
scenes.push({talk: [
  {dur: 3, layers: [
    img('articles-pile', 110, 80, 420),
    mv(img('page-a', 430, 120, 180), 'prop', 'Vidka menggeser tumpukan artikel', [{t: .2, x: 430, y: 120, angle: -.05}, {t: 1.4, x: 600, y: 320, angle: .04}, {t: 2.2, x: 620, y: 320, angle: 0}]),
    txt('Banyak artikel...', 620, 90, 66, {bold: true, w: 640}), txt('bingung memilih', 620, 190, 66, {bold: true, color: RED, w: 640, from: 1.2}),
  ]},
  {dur: 3, layers: [ // close-up on Vidka's confusion
    img('vidka-sigh', 380, 50, 400), mv(img('page-b', 120, 200, 200), 'prop', 'Artikel lain masih tergeletak, Vidka menghela napas', [{t: .2, x: 120, angle: -.06}, {t: 1.2, x: 160, angle: .02}, {t: 2.4, x: 150, angle: -.03}]),
  ]},
  {dur: 4, layers: [ // medium: Herry arrives, points at the notebook
    desk(), laptopSide(), img('page-a', 250, 345, 100), img('page-b', 300, 360, 90),
    vidka('turn', {to: 1.6}), vidka('listen', {from: 1.6}),
    slideX(herry('point'), 'actor', 'Herry mendekat sambil menunjuk buku catatan', 0.2, 1.4, 1180, 960),
    img('notebook', 770, 330, 210), hand('catatanmu', 800, 372, 28),
    draw(line([[780, 358], [985, 354], [990, 402], [780, 406], [780, 358]], {color: RED, lineWidth: 3}), 'information', 'Buku catatan dilingkari', 2.0, 3.0),
  ]},
], hold: [
  {dur: 1.5, layers: [ // table: Vidka menggeser tumpukan artikel dan membuka buku
    desk(), laptopSide(), vidka('tidy'), herry('listen'),
    mv(img('page-a', 250, 345, 100), 'prop', 'Vidka menggeser tumpukan artikel ke tepi', [{t: .1, x: 250, angle: 0}, {t: .9, x: 150, angle: -.08}]),
    mv(img('page-b', 300, 360, 90), 'prop', 'Artikel kedua ikut digeser', [{t: .3, x: 300}, {t: 1.1, x: 190}]),
    mv(img('notebook', 770, 330, 210), 'prop', 'Buku catatan ditarik mendekat', [{t: .5, x: 790}, {t: 1.4, x: 730}]),
  ]},
  {dur: 3.5, layers: [ // notebook close-up: the question Vidka wrote earlier
    txt('catatan awal Vidka', 200, 36, 30, {color: RED}), img('notebook', 160, 70, 720),
    hand('Bagaimana kelompok kami', 230, 170, 50, {from: .2}), hand('menjaga tempo?', 230, 250, 50, {from: .8}),
    mv(img('pencil', 230, 150, 90), 'prop', 'Vidka menunjuk tulisannya lalu pensil beristirahat', [{t: .1, x: 230, y: 150}, {t: .8, x: 700, y: 150}, {t: 1.1, x: 760, y: 300}, ...tapKeys(1.4, 3.3, 300, 6).map(k => ({...k, x: 760}))]),
    img('vidka-think', 960, 290, 220),
  ]},
], sfx: [[0.3, 'paper', .05, 'talk'], [3.2, 'paper', .04, 'talk'], [8.3, 'tap', .05, 'talk'], [0.4, 'paper', .04, 'hold']]});

// 2. Memperbaiki pencarian (A: apa kata kuncimu? | V: musik | A: persempit ... padanan Inggris)
scenes.push({talk: [
  {dur: 3, layers: [
    img('laptop-front', 80, 60, 560), img('search-box', 160, 140, 420), hand('musik', 190, 146, 52),
    vidka('listen', {x: 700, w: 300}), ardipal('talk', 1040, {w: 190}),
    ...[0, 1, 2].map(i => slideY(img('page-plain', 200 + i * 120, 215, 60), 'information', 'Hasil pencarian yang terlalu banyak', 0.3 + i * .8, 1.0 + i * .8, 215, 280)),
    txt('terlalu luas', 200, 462, 40, {color: RED, bold: true}),
  ]},
  {dur: 7, layers: [ // screen close-up: narrow the keywords, then English equivalents
    img('search-box', 160, 150, 960), hand('musik', 200, 172, 56, {to: 1.1}),
    {...draw(line([[195, 212], [340, 208]], {color: RED, lineWidth: 6}), 'information', 'Kata musik dicoret', 0.2, 0.8), to: 1.1},
    hand('siswa pemula', 200, 172, 48, {from: 1.2}), hand('ansambel', 470, 172, 48, {from: 2.2}), hand('koordinasi tempo', 670, 172, 48, {from: 3.2}),
    mv(img('cursor', 196, 178, 10), 'information', 'Kursor maju mengikuti kata kunci', [{t: 1.1, x: 196}, {t: 1.3, x: 450}, {t: 2.1, x: 450}, {t: 2.3, x: 650}, {t: 3.1, x: 650}, {t: 3.3, x: 985}]),
    label('padanan bahasa Inggris:', 200, 336, 30),
    txt('beginner students', 200, 380, 40, {color: GRAY, from: 4.4}), txt('ensemble', 520, 380, 40, {color: GRAY, from: 5.0}), txt('tempo coordination', 700, 380, 40, {color: GRAY, from: 5.6}),
    mv(img('cursor', 196, 386, 10), 'information', 'Kursor berpindah ke padanan Inggris', [{t: 4.3, x: 196}, {t: 4.5, x: 500}, {t: 4.9, x: 500}, {t: 5.1, x: 680}, {t: 5.5, x: 680}, {t: 5.7, x: 1030}, {t: 6.4, x: 1030}, {t: 6.8, x: 1040}]),
  ]},
], hold: [{dur: 5, layers: taskCard('Tugas', 'Sebutkan dua kata kunci', 'topikmu.')}],
sfx: [[0.4, 'tap', .04, 'talk'], [3.3, 'tap', .05, 'talk'], [4.3, 'tap', .04, 'talk'], [5.3, 'tap', .04, 'talk'], [7.5, 'pop', .04, 'talk'], [0.3, 'pop', .05, 'hold']]});

// 3. Menentukan kegunaan referensi (V: artikel terkenal, musisi profesional | H: konsep; cari penelitian siswa pemula)
const pagePair = () => [img('page-a', 200, 50, 300), img('page-b', 760, 50, 300), hand('Peserta: musisi profesional', 200, 462, 32), hand('Peserta: siswa pemula', 760, 462, 32)];
scenes.push({talk: [
  {dur: 3.5, layers: [
    desk(), vidka('listen', {to: 1.0}), vidka('turn', {from: 1.0}), herry('listen', 1000),
    mv(img('page-a', 330, 240, 170), 'prop', 'Vidka mengangkat artikel terkenal itu', [{t: .2, y: 340, angle: .06}, {t: 1.0, y: 240, angle: 0}, {t: 2.6, y: 246, angle: .01}]),
    txt('artikel terkenal', 120, 90, 44, {bold: true}), txt('musisi profesional', 120, 150, 44, {color: GRAY}),
  ]},
  {dur: 6.5, layers: [
    ...pagePair(),
    mv(img('sticky-yellow', 60, 40, 130), 'prop', 'Catatan KONSEP ditempelkan pada artikel pertama', [{t: .4, x: 60, y: 40, angle: -.2}, {t: 1.3, x: 380, y: 60, angle: 0}]),
    txt('KONSEP', 398, 100, 30, {bold: true, from: 1.4}),
    mv(img('sticky-pink', 1120, 40, 130), 'prop', 'Catatan KONTEKS SISWA ditempelkan pada artikel kedua', [{t: 3.2, x: 1120, y: 40, angle: .2}, {t: 4.1, x: 940, y: 60, angle: 0}]),
    txt('KONTEKS', 948, 88, 30, {bold: true, from: 4.2}), txt('SISWA', 966, 124, 30, {bold: true, from: 4.2}),
    txt('menjelaskan konsep', 200, 520, 32, {color: GRAY, from: 1.4}), txt('konteks pembelajaranmu', 760, 520, 32, {color: GRAY, from: 4.2}),
    draw(underline(760, 562, 320, {color: YELLOW}), 'information', 'Penekanan pada konteks pembelajaran', 5.0, 5.8),
  ]},
], hold: [
  {dur: 5, layers: [ // highlight the participant lines on both articles
    ...pagePair(), img('sticky-yellow', 380, 60, 130), txt('KONSEP', 398, 100, 30, {bold: true}), img('sticky-pink', 940, 60, 130), txt('KONTEKS', 948, 88, 30, {bold: true}), txt('SISWA', 966, 124, 30, {bold: true}),
    draw(line([[198, 482], [560, 482]], {color: YELLOW, lineWidth: 30, alpha: .55}), 'information', 'Sorot bagian peserta artikel pertama', 0.3, 1.3),
    slideX(img('highlighter', 200, 430, 90), 'prop', 'Stabilo menyapu baris peserta', 0.3, 1.3, 200, 520),
    draw(line([[758, 482], [1060, 482]], {color: YELLOW, lineWidth: 30, alpha: .55}), 'information', 'Sorot bagian peserta artikel kedua', 2.3, 3.3),
    slideX(img('highlighter', 760, 430, 90), 'prop', 'Stabilo pindah ke artikel kedua', 2.3, 3.3, 760, 1020),
    txt('Peserta', 590, 530, 40, {color: RED, bold: true, from: 3.4}), draw(underline(590, 575, 150, {color: RED}), 'information', 'Label peserta digarisbawahi', 3.6, 4.2),
  ]},
], sfx: [[0.4, 'paper', .05, 'talk'], [4.8, 'pop', .05, 'talk'], [7.6, 'pop', .05, 'talk'], [0.4, 'paper', .04, 'hold'], [2.4, 'paper', .04, 'hold']]});

// 4. Memeriksa dukungan sumber (V: judul cocok, langsung kutip? | A: baca metode dan hasil; mendukung? kredibilitas)
scenes.push({talk: [
  {dur: 3, layers: [
    desk(), vidka('turn'), ardipal('talk', 1000),
    mv(img('page-plain', 330, 240, 170), 'prop', 'Vidka menunjukkan judul artikel yang cocok', [{t: .2, y: 340, angle: .05}, {t: 1.0, y: 240, angle: 0}, {t: 2.4, y: 246, angle: -.01}]),
    txt('judulnya cocok', 120, 80, 48, {bold: true}), txt('langsung dikutip?', 120, 145, 48, {color: RED, bold: true, from: 1.2}),
  ]},
  {dur: 7, layers: [ // page close-up: method, result, finding, credibility
    img('page-plain', 340, 30, 400),
    draw(line([[400, 200], [690, 200]], {color: YELLOW, lineWidth: 26, alpha: .55}), 'information', 'Stabilo menyorot bagian metode', 0.3, 1.4),
    draw(line([[400, 380], [690, 380]], {color: YELLOW, lineWidth: 26, alpha: .55}), 'information', 'Stabilo menandai satu temuan di hasil', 3.2, 4.2),
    hand('Metode', 400, 150, 34, {bold: true, color: RED}), hand('Hasil', 400, 330, 34, {bold: true, color: RED}),
    mv(img('highlighter', 420, 150, 90), 'prop', 'Stabilo menelusuri metode lalu hasil', [{t: .3, x: 420, y: 150}, {t: 1.4, x: 660, y: 150}, {t: 2.4, x: 660, y: 150}, {t: 3.2, x: 420, y: 330}, {t: 4.2, x: 660, y: 330}, {t: 5.6, x: 760, y: 250}]),
    hand('temuan: latihan bagian pendek', 380, 420, 32, {from: 4.3, bold: true}),
    txt('Baca metode', 40, 110, 42, {bold: true, w: 280}), txt('dan hasilnya.', 40, 165, 42, {bold: true, w: 280}),
    txt('Kredibel?', 790, 110, 40, {bold: true, color: RED, w: 440, from: 5.0}), txt('jurnal, penulis, tahun', 790, 165, 32, {color: GRAY, w: 440, from: 5.4}),
    draw(underline(790, 210, 300, {color: RED}), 'information', 'Pertanyaan kredibilitas digarisbawahi', 5.8, 6.6),
  ]},
], hold: [
  {dur: 5, layers: [ // finding matched against the claim note
    txt('catatan klaim', 150, 56, 30, {color: RED}), img('notebook', 120, 90, 520), hand('Siswa pemula butuh', 160, 170, 36), hand('latihan bagian pendek.', 160, 220, 36),
    txt('temuan artikel', 790, 56, 30, {color: RED}), img('note-card', 760, 120, 420), label('contoh ilustratif', 790, 380, 30), hand('latihan bagian pendek', 790, 180, 32), hand('membuat lebih kompak', 790, 223, 32),
    draw(line([[640, 210], [760, 210]], {color: RED, lineWidth: 5}), 'information', 'Temuan dicocokkan dengan klaim', 0.4, 1.2),
    txt('Mendukung kalimat yang mana?', 120, 500, 50, {bold: true, w: 1100, from: 1.3}), restTap(1080, 440),
  ]},
], sfx: [[0.4, 'paper', .05, 'talk'], [3.4, 'paper', .04, 'talk'], [6.3, 'paper', .04, 'talk'], [0.5, 'tap', .05, 'hold'], [1.4, 'pop', .05, 'hold']]});

// 5. Menghubungkan bacaan (V: mendengar teman / isyarat gerak | H: apa yang ingin kamu telusuri? | V: bagaimana kelompok kami menggunakan keduanya)
const cards = (x) => [img('note-card', x, 120, 300), hand('Bacaan 1:', x + 20, 126, 30, {color: RED}), hand('mendengar teman', x + 20, 175, 32), img('note-card', x, 330, 300), hand('Bacaan 2:', x + 20, 336, 30, {color: RED}), hand('isyarat gerak', x + 20, 385, 32)];
scenes.push({talk: [
  {dur: 4, layers: [ // top-down: two reading notes move toward the research notebook
    img('notebook', 700, 140, 480), hand('pertanyaan sementara', 730, 180, 30, {color: RED}),
    mv(img('note-card', 60, 120, 300), 'prop', 'Catatan bacaan pertama digeser mendekat', [{t: .4, x: 60}, {t: 1.6, x: 380}]),
    hand('Bacaan 1:', 80, 126, 30, {color: RED, to: .4}), hand('mendengar teman', 80, 175, 32, {to: .4}),
    hand('Bacaan 1:', 400, 126, 30, {color: RED, from: 1.6}), hand('mendengar teman', 400, 175, 32, {from: 1.6}),
    mv(img('note-card', 60, 330, 300), 'prop', 'Catatan bacaan kedua digeser mendekat', [{t: 2.2, x: 60}, {t: 3.4, x: 380}]),
    hand('Bacaan 2:', 80, 336, 30, {color: RED, to: 2.2}), hand('isyarat gerak', 80, 385, 32, {to: 2.2}),
    hand('Bacaan 2:', 400, 336, 30, {color: RED, from: 3.4}), hand('isyarat gerak', 400, 385, 32, {from: 3.4}),
  ]},
  {dur: 2, layers: [ // Herry asks; Vidka thinks
    desk(), vidka('think'), herry('talk'),
    mv(img('notebook', 300, 330, 200), 'prop', 'Buku penelitian didorong ke depan Vidka', [{t: .2, x: 300}, {t: 1.0, x: 340}, {t: 1.8, x: 344}]),
  ]},
  {dur: 4, layers: [ // Vidka writes the provisional question, connectors drawn
    img('notebook', 700, 140, 480), hand('pertanyaan sementara', 730, 180, 30, {color: RED}), ...cards(380),
    hand('Bagaimana kelompok kami', 730, 230, 36, {from: .4}), hand('menggunakan keduanya?', 730, 282, 36, {from: 1.6}),
    {...write(730, 1120, 210, 0.3, 1.5), to: 1.6}, mv(img('pencil', 730, 262, 90), 'prop', 'Pensil menulis baris kedua', [{t: 1.6, x: 730}, {t: 2.8, x: 1080}, {t: 3.3, x: 1110, y: 220}]),
    draw(line([[680, 200], [740, 250]], {color: RED, lineWidth: 4}), 'information', 'Garis penghubung bacaan 1', 2.9, 3.5),
    draw(line([[680, 400], [740, 300]], {color: RED, lineWidth: 4}), 'information', 'Garis penghubung bacaan 2', 3.4, 3.9),
  ]},
], hold: [
  {dur: 5, layers: [
    img('notebook', 700, 140, 480), hand('pertanyaan sementara', 730, 180, 30, {color: RED}), hand('Bagaimana kelompok kami', 730, 230, 36), hand('menggunakan keduanya?', 730, 282, 36), ...cards(380),
    line([[680, 200], [740, 250]], {color: RED, lineWidth: 4}), line([[680, 400], [740, 300]], {color: RED, lineWidth: 4}),
    label('Contoh bacaan ilustratif.', 40, 40, 26), restTap(1100, 330),
  ]},
], sfx: [[0.5, 'paper', .04, 'talk'], [2.3, 'paper', .04, 'talk'], [6.4, 'tap', .05, 'talk'], [9.0, 'pop', .04, 'talk']]});

// 6. Mengubah keluhan menjadi masalah (V: siswa kurang kompak, cukup? | H: apa yang terjadi dan dampaknya? | V: tempo meningkat...)
scenes.push({talk: [
  {dur: 2.5, layers: [
    img('notebook', 160, 70, 680), img('vidka-write', 820, 100, 420),
    hand('Siswa kurang kompak', 240, 170, 46), txt('cukup?', 240, 240, 40, {color: RED, from: 1.2}),
    mv(img('pencil', 640, 150, 100), 'prop', 'Pensil Vidka berhenti di ujung kalimat', [{t: .2, x: 640, y: 150}, {t: 1.0, x: 660, y: 140}, {t: 2.2, x: 650, y: 150}]),
  ]},
  {dur: 2, layers: [
    img('notebook', 160, 70, 680), img('vidka-write', 820, 100, 420),
    hand('Siswa kurang kompak', 240, 170, 46), txt('apa yang terjadi? dampaknya?', 240, 420, 34, {color: RED, from: .3}),
    draw(line([[232, 200], [680, 196]], {color: RED, lineWidth: 6}), 'information', 'Penilaian umum dicoret', 0.4, 1.4),
  ]},
  {dur: 5.5, layers: [
    img('notebook', 160, 70, 680), img('vidka-write', 820, 100, 420),
    hand('Siswa kurang kompak', 240, 170, 46, {color: GRAY}), line([[232, 200], [680, 196]], {color: RED, lineWidth: 6}),
    hand('tempo meningkat', 240, 250, 40, {from: .3}), hand('beberapa siswa tertinggal', 240, 320, 40, {from: 1.9}), hand('latihan berhenti', 240, 390, 40, {from: 3.6}),
    txt('kejadian', 640, 256, 30, {color: GRAY, from: .3}), txt('dampak', 700, 396, 30, {color: RED, from: 3.6}),
    mv(img('pencil', 240, 230, 100), 'prop', 'Pensil menulis kejadian lalu dampak', [{t: .2, x: 240, y: 230}, {t: 1.0, x: 540, y: 230}, {t: 1.8, x: 240, y: 300}, {t: 2.8, x: 700, y: 300}, {t: 3.5, x: 240, y: 370}, {t: 4.3, x: 560, y: 370}, {t: 5.2, x: 620, y: 330}]),
  ]},
], hold: [{dur: 5, layers: taskCard('Tugas', 'Sebutkan satu dampak', 'masalahmu.')}],
sfx: [[0.3, 'tap', .05, 'talk'], [2.9, 'tap', .05, 'talk'], [4.7, 'tap', .04, 'talk'], [6.3, 'tap', .04, 'talk'], [8.0, 'tap', .04, 'talk'], [0.3, 'pop', .05, 'hold']]});

// 7. Menyusun pernyataan masalah (A: apa yang belum jelas? | V: bagaimana siswa mengikuti tempo teman | A: hubungkan bukti awal & bacaan; mengapa penting)
const row = (i, lab, text, from) => [txt(lab, 120, 84 + i * 120, 28, {color: RED, bold: true, ...(from !== undefined ? {from} : {})}), hand(text, 120, 118 + i * 120, 40, {w: 1040, ...(from !== undefined ? {from} : {})})];
scenes.push({talk: [
  {dur: 3, layers: [desk(), vidka('listen', {to: 1.3}), vidka('think', {from: 1.3}), ardipal('talk', 1000), mv(img('notebook', 700, 330, 220), 'prop', 'Ardipal mendorong buku ke arah Vidka', [{t: .3, x: 760}, {t: 1.2, x: 700}, {t: 2.6, x: 704}])]},
  {dur: 7, layers: [
    ...row(0, 'BELUM JELAS', 'Bagaimana siswa mengikuti tempo teman.'), {...write(120, 900, 104, 0.2, 1.4), to: 2.0},
    ...row(1, 'BUKTI AWAL', 'Tempo naik, siswa tertinggal, latihan berhenti.', 2.0), {...mv(img('pencil', 120, 224, 90), 'prop', 'Pensil menulis bukti awal', [{t: 2.0, x: 120}, {t: 3.4, x: 940}, {t: 3.8, x: 960, y: 200}]), from: 2.0, to: 4.2},
    ...row(2, 'BACAAN', 'Mendengar teman dan isyarat gerak.', 4.2), {...mv(img('pencil', 120, 344, 90), 'prop', 'Pensil menulis bacaan', [{t: 4.2, x: 120}, {t: 5.4, x: 800}, {t: 5.8, x: 820, y: 320}]), from: 4.2},
    txt('mengapa penting dipahami?', 120, 470, 34, {color: RED, from: 6.0}), draw(underline(120, 512, 420, {color: RED}), 'information', 'Alasan pentingnya digarisbawahi', 6.2, 6.9),
  ]},
], hold: [
  {dur: 5, layers: [
    txt('PERNYATAAN MASALAH', 120, 90, 28, {color: RED, bold: true}),
    hand('Belum jelas bagaimana siswa', 120, 150, 54, {w: 1040}), hand('mengikuti tempo teman saat latihan.', 120, 230, 54, {w: 1040}),
    draw(line([[1190, 140], [1210, 140], [1210, 310], [1190, 310]], {color: NAVY, lineWidth: 4}), 'information', 'Kurung menandai pernyataan masalah', 0.3, 1.3),
    txt('dari bukti awal dan bacaan', 120, 340, 32, {color: GRAY, from: 1.4}), restTap(1080, 420),
  ]},
], sfx: [[0.3, 'paper', .04, 'talk'], [3.2, 'tap', .05, 'talk'], [5.0, 'tap', .05, 'talk'], [7.2, 'tap', .05, 'talk'], [0.4, 'pop', .05, 'hold']]});

// 8. Merumuskan pertanyaan penelitian (V reads the question | H: jelas: siapa, proses apa, konteks apa)
const Q = ['Bagaimana siswa pemula menggunakan', 'isyarat bunyi dan gerak untuk menjaga', 'tempo dalam ansambel?'];
const bigQ = (size = 46) => Q.map((q, i) => hand(q, 120, 130 + i * 80, size));
scenes.push({talk: [
  {dur: 5.5, layers: [ // over the shoulder: Vidka finishes writing before any highlight
    img('vidka-write', 20, 150, 400), img('notebook', 440, 110, 620),
    hand(Q[0], 480, 160, 32, {from: .3}), hand(Q[1], 480, 212, 32, {from: 1.9}), hand(Q[2], 480, 264, 32, {from: 3.5}),
    mv(img('pencil', 470, 140, 90), 'prop', 'Pensil menulis tiga baris pertanyaan lalu diangkat', [{t: .2, x: 470, y: 140}, {t: 1.8, x: 1000, y: 140}, {t: 1.9, x: 470, y: 192}, {t: 3.4, x: 1010, y: 192}, {t: 3.5, x: 470, y: 244}, {t: 4.6, x: 860, y: 244}, {t: 5.2, x: 900, y: 170}]),
  ]},
  {dur: 4.5, layers: [ // highlights: siapa, proses apa, konteks apa (one at a time)
    ...bigQ(),
    txt('SIAPA', 120, 80, 28, {color: RED, bold: true, to: 1.5}), {...draw(underline(330, 180, 300, {color: YELLOW}), 'information', 'Sorotan peserta: siswa pemula', 0.2, 1.0), to: 1.5},
    txt('PROSES APA', 120, 80, 28, {color: RED, bold: true, from: 1.5, to: 3.0}), {...draw(underline(120, 262, 760, {color: YELLOW}), 'information', 'Sorotan proses: menggunakan isyarat bunyi dan gerak untuk menjaga', 1.7, 2.5), from: 1.5, to: 3.0},
    txt('KONTEKS APA', 120, 80, 28, {color: RED, bold: true, from: 3.0}), {...draw(underline(120, 342, 470, {color: YELLOW}), 'information', 'Sorotan konteks: tempo dalam ansambel', 3.2, 4.0), from: 3.0},
  ]},
], hold: [
  {dur: 5, layers: [...bigQ(), draw(line([[1040, 150], [1066, 182], [1120, 120]], {color: GREEN, lineWidth: 7}), 'information', 'Centang: pertanyaan lengkap', 0.3, 0.9), txt('lengkap', 1020, 200, 30, {color: GREEN, from: .9}), restTap(1100, 420)]},
], sfx: [[0.3, 'tap', .05, 'talk'], [5.7, 'pop', .04, 'talk'], [7.2, 'pop', .04, 'talk'], [8.7, 'pop', .04, 'talk'], [0.4, 'chime', .05, 'hold']]});

// 9. Memilih data yang diperlukan (V: kuesioner saja? | A: menunjukkan tindakan saat latihan? | V: belum cukup; mengamati, lalu menanyakan alasannya)
scenes.push({talk: [
  {dur: 2, layers: [
    img('vidka-stand-read', 380, 208, 210), ardipal('listen', 760, {w: 210}),
    mv(img('questionnaire', 100, 150, 200), 'prop', 'Kuesioner diangkat dan dibaca', [{t: .2, angle: -.04, y: 170}, {t: 1.0, angle: .03, y: 150}, {t: 1.8, angle: -.02, y: 152}]), txt('Kuesioner', 110, 430, 34, {color: NAVY, bold: true}),
  ]},
  {dur: 2.5, layers: [
    img('vidka-stand-look', 380, 208, 210), ardipal('talk', 760, {w: 210}),
    slideX(img('door', 1000, 160, 190), 'prop', 'Pintu ruang latihan masuk ke bidang pandang', 0.3, 1.3, 1120, 1000), txt('RUANG LATIHAN', 960, 110, 30, {color: NAVY, bold: true, from: 1.3}),
    slideY(img('questionnaire', 100, 150, 200), 'prop', 'Kuesioner diturunkan', 1.2, 2.2, 150, 380),
  ]},
  {dur: 5.5, layers: [ // questionnaire placed beside the observation book, order 1-2
    txt('Belum cukup.', 120, 70, 46, {bold: true, color: RED}),
    mv(img('notebook', 160, 300, 260), 'prop', 'Buku pengamatan ditempatkan pertama', [{t: .4, y: 300}, {t: 1.4, y: 200}]), txt('1', 100, 210, 60, {color: RED, bold: true, from: 1.4}), txt('mengamati tindakan saat latihan', 170, 400, 30, {color: GRAY, from: 1.4}),
    mv(img('questionnaire', 640, 300, 200), 'prop', 'Kuesioner diletakkan di samping buku pengamatan', [{t: 2.4, x: 900, y: 300}, {t: 3.4, x: 640, y: 200}]), txt('2', 580, 210, 60, {color: RED, bold: true, from: 3.4}), txt('menanyakan alasannya', 650, 480, 30, {color: GRAY, from: 3.4}),
    draw(arrow(430, 300, 200, {color: RED, lineWidth: 4}), 'information', 'Urutan: mengamati lalu menanyakan', 3.8, 4.6),
  ]},
], hold: [{dur: 5, layers: taskCard('Tugas', 'Data apa yang diperlukan', 'untuk pertanyaanmu?')}],
sfx: [[0.3, 'paper', .04, 'talk'], [2.4, 'paper', .04, 'talk'], [5.6, 'pop', .05, 'talk'], [7.8, 'pop', .05, 'talk'], [0.3, 'pop', .05, 'hold']]});

// 10. Menjelaskan alasan metodologi (H: studi kasus kualitatif | V: membandingkan pengamatan dengan wawancara? | H: ya, pola penggunaan isyarat)
const pair = () => [
  img('note-card', 100, 150, 440), hand('Pengamatan', 130, 158, 30, {color: RED}), hand('12:04, P2 menoleh', 130, 215, 34), hand('ke P1', 130, 260, 34),
  img('note-card', 740, 150, 440), hand('Wawancara', 770, 158, 30, {color: RED}), hand('"kehilangan hitungan,', 770, 215, 32), hand('lihat tangan teman"', 770, 258, 32),
];
scenes.push({talk: [
  {dur: 3.2, layers: [
    txt('rencana penelitian', 220, 24, 30, {color: RED}), img('notebook', 180, 60, 700),
    hand('Studi kasus kualitatif', 240, 150, 48, {from: .3}), hand('memahami kelompok ini', 240, 230, 40, {from: 1.6}),
    {...write(240, 800, 130, 0.2, 1.4), to: 1.6}, mv(img('pencil', 240, 210, 90), 'prop', 'Pensil menulis tujuan', [{t: 1.6, x: 240}, {t: 2.6, x: 760}, {t: 3.0, x: 790, y: 180}]),
    img('herry-talk', 960, 227, 200),
  ]},
  {dur: 3, layers: [ // simulation insert
    label('Simulasi', 40, 30, 26), img('music-stand', 300, 330, 70), img('music-stand', 560, 330, 70),
    img('player-a', 360, 170, 170), img('player-b-play', 620, 170, 170, {to: 1.2}), img('player-b-turn', 620, 170, 170, {from: 1.2}),
    ...metronome(900, 300, 130, 0, 2.9, 0.5), txt('menoleh', 700, 120, 30, {color: NAVY, from: 1.2}),
    mv(img('clock-note', 60, 420, 200), 'prop', 'Vidka mencatat waktunya', [{t: 1.3, x: 60, y: 460}, {t: 2.0, x: 60, y: 420}]), hand('12:04', 120, 436, 30, {color: RED, from: 2.0}),
  ]},
  {dur: 3.8, layers: [
    ...pair(),
    draw(line([[540, 270], [740, 270]], {color: RED, lineWidth: 5}), 'information', 'Pengamatan dibandingkan dengan wawancara', 0.4, 1.4),
    txt('pola penggunaan isyarat', 420, 440, 40, {color: NAVY, bold: true, from: 1.5}), draw(underline(420, 490, 440, {color: YELLOW}), 'information', 'Penekanan pada pola isyarat', 2.2, 3.0),
  ]},
], hold: [
  {dur: 5, layers: [...pair(), line([[540, 270], [740, 270]], {color: RED, lineWidth: 5}), txt('pola penggunaan isyarat', 420, 440, 40, {color: NAVY, bold: true}), label('Simulasi', 40, 30, 26), restTap(1100, 480)]},
], sfx: [[0.3, 'tap', .05, 'talk'], [4.4, 'pop', .04, 'talk'], [6.6, 'tap', .05, 'talk'], [7.7, 'chime', .05, 'talk']]});

// 11. Menyesuaikan rancangan dengan pertanyaan (V: kalau menguji metronom? | A: pertanyaannya berubah: ukuran tempo, perbandingan, faktor lain)
scenes.push({talk: [
  {dur: 4, layers: [ // page flip: memahami proses → menguji pengaruh
    img('note-card', 120, 80, 380), hand('memahami proses', 150, 100, 34, {color: RED}), hand('Bagaimana siswa pemula', 150, 160, 32), hand('menjaga tempo?', 150, 200, 32),
    mv(img('note-card', 120, 80, 380), 'prop', 'Vidka membalik ke halaman pertanyaan kedua', [{t: .8, x: 120, angle: 0}, {t: 1.8, x: 560, angle: .02}]),
    hand('menguji pengaruh', 590, 100, 34, {color: RED, from: 1.9}), hand('Apakah latihan metronom', 590, 160, 32, {from: 1.9}), hand('meningkatkan kestabilan tempo?', 590, 200, 30, {from: 1.9}),
    ...metronome(1000, 300, 130, 0, 3.8, 0.8),
  ]},
  {dur: 6, layers: [ // Ardipal lists what changes
    img('vidka-stand-look', 100, 208, 210), ardipal('point', 1000),
    txt('Pertanyaannya berubah.', 380, 70, 44, {bold: true}),
    draw(line([[380, 160], [900, 160], [900, 230], [380, 230], [380, 160]], {color: NAVY, lineWidth: 4}), 'information', 'Kotak: ukuran tempo', 0.8, 1.6), hand('ukuran tempo', 400, 172, 36, {from: 1.6}),
    draw(line([[380, 260], [900, 260], [900, 330], [380, 330], [380, 260]], {color: NAVY, lineWidth: 4}), 'information', 'Kotak: perbandingan yang sesuai', 2.4, 3.2), hand('perbandingan yang sesuai', 400, 272, 36, {from: 3.2}),
    draw(line([[380, 360], [900, 360], [900, 430], [380, 430], [380, 360]], {color: NAVY, lineWidth: 4}), 'information', 'Kotak: perhatian pada faktor lain', 4.0, 4.8), hand('perhatian pada faktor lain', 400, 372, 36, {from: 4.8}),
    txt('bukan membuktikan', 380, 470, 30, {color: GRAY, from: 5.0}),
  ]},
], hold: [
  {dur: 5, layers: [
    img('notebook', 180, 90, 760), hand('Pertanyaan menentukan', 240, 170, 54, {from: .3}), hand('rancangan.', 240, 250, 54, {from: 1.6}),
    {...write(240, 920, 150, 0.2, 1.5), to: 1.6}, mv(img('pencil', 240, 230, 90), 'prop', 'Pensil menulis kata terakhir lalu diam', [{t: 1.6, x: 240}, {t: 2.4, x: 540}, ...tapKeys(3.0, 4.8, 230, 6).map(k => ({...k, x: 580}))]),
    img('vidka-think', 980, 290, 220),
  ]},
], sfx: [[0.9, 'paper', .05, 'talk'], [4.9, 'tap', .04, 'talk'], [6.5, 'tap', .04, 'talk'], [8.1, 'tap', .04, 'talk'], [0.3, 'tap', .05, 'hold']]});

// 12. Menunjukkan hasil belajar (V: semuanya saling terhubung | H: siapkan persetujuan | A: jelaskan alasan setiap pilihan)
const chainBox = (x, text, t0) => [draw(line([[x, 200], [x + 230, 200], [x + 230, 290], [x, 290], [x, 200]], {color: NAVY, lineWidth: 4}), 'information', 'Kotak ' + text, t0, t0 + .5), hand(text, x + 16, 222, 32, {from: t0 + .5})];
scenes.push({talk: [
  {dur: 5, layers: [
    txt('Rancangan Vidka', 120, 80, 40, {bold: true, color: RED}),
    ...chainBox(120, 'bacaan', .3), draw(arrow(355, 245, 50, {color: RED, lineWidth: 4}), 'information', 'Panah 1', .9, 1.2),
    ...chainBox(410, 'masalah', 1.3), draw(arrow(645, 245, 50, {color: RED, lineWidth: 4}), 'information', 'Panah 2', 1.9, 2.2),
    ...chainBox(700, 'pertanyaan', 2.3), draw(arrow(935, 245, 50, {color: RED, lineWidth: 4}), 'information', 'Panah 3', 2.9, 3.2),
    ...chainBox(990, 'cara', 3.3), hand('penelitian', 1006, 256, 30, {from: 3.8}),
    txt('saling terhubung', 120, 360, 44, {bold: true, from: 4.0}), draw(underline(120, 410, 330, {color: YELLOW}), 'information', 'Penekanan keterhubungan', 4.2, 4.8),
  ]},
  {dur: 5, layers: [
    desk(), vidka('tidy', {x: 380, to: 3.2}), vidka('listen', {x: 380, from: 3.2}), herry('talk', 930, {w: 180, to: 2.6}), herry('listen', 930, {w: 180, from: 2.6}), ardipal('listen', 1090, {w: 180, to: 2.6}), ardipal('talk', 1090, {w: 180, from: 2.6}),
    img('laptop-side', 300, 344, 170, {to: 2.8}), mv(img('laptop-closed', 300, 414, 170), 'prop', 'Vidka menutup laptop', [{t: 2.8, y: 380}, {t: 3.2, y: 414}]),
    mv(img('page-a', 820, 290, 100), 'prop', 'Artikel pertama dirapikan', [{t: .3, x: 820, angle: .08}, {t: 1.2, x: 640, angle: 0}]),
    mv(img('page-b', 860, 320, 100), 'prop', 'Artikel kedua dirapikan', [{t: 1.3, x: 860, angle: -.06}, {t: 2.2, x: 646, angle: 0}]),
    txt('persetujuan dulu', 880, 150, 30, {color: NAVY, from: .4, to: 2.6}), txt('alasan setiap pilihan', 1000, 150, 30, {color: NAVY, from: 2.7}),
    draw(underline(1000, 190, 240, {color: YELLOW}), 'information', 'Penekanan pada alasan pilihan', 3.6, 4.4),
  ]},
], hold: [{dur: 5, layers: [...taskCard('Tugas akhir', 'Tulis pertanyaanmu. Pilih data', 'dan jelaskan alasannya.'), label('Musik: "Easy Lemon" Kevin MacLeod (incompetech.com), CC BY 4.0', 120, 560, 24)]}],
sfx: [[0.4, 'tap', .05, 'talk'], [5.4, 'paper', .04, 'talk'], [6.4, 'paper', .04, 'talk'], [7.9, 'tap', .05, 'talk'], [0.4, 'chime', .06, 'hold']]});

// ---------- assemble ----------
if (scenes.length !== SCENES.length) throw new Error(`expected ${SCENES.length} scenes, got ${scenes.length}`);
const scaleLayer = (l, f) => ({...l, ...(l.from !== undefined ? {from: +(l.from * f).toFixed(3)} : {}), ...(l.to !== undefined ? {to: +(l.to * f).toFixed(3)} : {}), ...(l.keys ? {keys: l.keys.map(k => ({...k, t: +(k.t * f).toFixed(3)}))} : {})});
const shots = [], captions = [], sfx = [], ledger = [];
const sel = PART ? [...Array(SCENES.length).keys()].slice((PART - 1) * 4, PART * 4) : [...Array(SCENES.length).keys()];
let partBase = 0;
for (const i of sel) {
  const plan = scenes[i], real = TIMING.scenes[i];
  const talkLen = real.talk_end - real.start, holdLen = real.end - real.talk_end;
  const base = PART ? partBase : real.start; partBase += real.end - real.start;
  const planTalk = plan.talk.reduce((a, s) => a + s.dur, 0), planHold = plan.hold.reduce((a, s) => a + s.dur, 0);
  if (Math.abs(planTalk - TALK) > 1e-9 || Math.abs(planHold - HOLDP) > 1e-9) throw new Error(`Scene ${i + 1}: talk plan ${planTalk}s / hold plan ${planHold}s, expected ${TALK}/${HOLDP}`);
  const fT = talkLen / TALK, fH = holdLen / HOLDP;
  let t = base;
  const push = (s, f, phase, j) => { const dur = s.dur * f; shots.push({start: +t.toFixed(3), end: +(t + dur).toFixed(3), layers: s.layers.map(l => scaleLayer(l, f))}); ledger.push({scene: i + 1, title: SCENES[i].title, phase, shot: j + 1, start: +t.toFixed(2), end: +(t + dur).toFixed(2), scale: +f.toFixed(3)}); t += dur; };
  plan.talk.forEach((s, j) => push(s, fT, 'talk', j));
  t = base + talkLen; shots.at(-1).end = +t.toFixed(3); // snap the talk/hold boundary exactly
  plan.hold.forEach((s, j) => push(s, fH, 'hold', j));
  shots.at(-1).end = +(base + (real.end - real.start)).toFixed(3);
  for (const c of TIMING.cues.filter(c => c.scene === i + 1)) captions.push({start: +(base + (c.start - real.start)).toFixed(3), end: +(base + (c.end - real.start)).toFixed(3), text: c.text});
  for (const [at, kind, gain, phase] of plan.sfx || []) sfx.push({time: +(base + (phase === 'hold' ? talkLen + at * fH : at * fT)).toFixed(3), kind, gain});
}
shots.at(-1).end = +(PART ? partBase : TIMING.duration).toFixed(3);
for (let i = 1; i < captions.length; i++) if (captions[i].start < captions[i - 1].end) throw new Error(`Caption overlap at ${captions[i].start}: ${captions[i].text}`);
for (const c of captions) if (c.text.length > 58) throw new Error(`Caption too long (${c.text.length}): ${c.text}`);
fs.mkdirSync(path.dirname(OUT), {recursive: true});
const project = {
  version: 1, style: 'B1', width: 1280, height: 720, fps: 30,
  metadata: {
    title: 'Banyak Referensi, Mana yang Tepat?', language: 'id', script: 'tools/script.mjs (dialog revisi)', scenes: ledger,
    timing: {mode: TIMING.mode, note: TIMING.note}, ...(PART ? {draft_part: PART, note: 'Re-timed draft of four scenes for review only; the real timeline is ../../project.json'} : {}),
    working_note: 'Dialogue-led: every line is its own recording (Vidka = Mona, Herry = Bayu, Ardipal = Dito); each scene ends with the table\'s 5 s hold. Talk/hold choreography is scaled from a 10 s + 5 s plan to the recorded lengths.',
  },
  voice: {path: `${ASSET}${TIMING.voice}`, lead: 0, tail: 0},
  captions, shots, sfx,
  music: {path: `${ASSET}audio/music/audio/music/bgm-easy-lemon.mp3`, gain: 0.09},  // "Easy Lemon" Kevin MacLeod (incompetech.com), CC BY 4.0; credits in audio/music/CREDITS.md
  ambience: [{path: `${ASSET}audio/room-tone-180s.wav`, start: 0, end: PART ? +partBase.toFixed(3) : TIMING.duration, gain: 0.04, loop: true}],
  reference_review: {author_id: 'claude-code-draft', capability: {mode: 'limited', environment: 'Claude Code cloud container: Node 22, FFmpeg 6.1, @napi-rs/canvas; ElevenLabs connector for speech and images', limitations: [
    {capability: 'hand-drawn artwork', observed: 'Characters and most props come from generated pose/prop sheets (gemini-3-pro-image) cropped by tools/import-art.mjs; the desk, search box, sticky notes, task card and cursor remain procedural', impact: 'Drawing is consistent line art but not the B1 Ryan V4 hand-inked baseline; review the encoded frames rather than assuming equivalence'},
  ]}},
};
fs.writeFileSync(OUT, JSON.stringify(project, null, 1));
console.log(`wrote ${OUT}: ${shots.length} shots, ${captions.length} captions, ${sfx.length} sfx, ${shots.at(-1).end}s`);
