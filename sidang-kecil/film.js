'use strict';
// «Sidang Kecil Sebelum Sidang» — Cerita 3. The film: one room, one table, three people, and the five chapters of a thesis
// standing hand in hand on the ground line. Timeline comes from timeline.js (built from the measured voice durations).
const TL = window.TL, DUR = TL.dur, SC = TL.scenes, LINES = TL.lines;
const QF = new URLSearchParams(location.search);
const FROM = +(QF.get('from') ?? 0), TO = +(QF.get('to') ?? DUR);
const LINE = {}; LINES.forEach(l => { LINE[l.id] = l; l.end = l.t + l.d; });
const lt = id => LINE[id].t, le = id => LINE[id].end;
function scn(T) { let s = SC[SC.length - 1]; for (const x of SC) if (T < x.t1) { s = x; break; } return s; }
const NAME = { V: 'VIDKA', H: 'DR. HERRY', A: 'PROF. ARDIPAL' };

// ---------------- the room (world coordinates; the camera moves) ----------------
const GY = 900;                                     // ground line (feet)
const TB = { x0: 860, x1: 1800, top: 770 };          // table
const PV = 920, PH = 1200, PA = 1470;                // where a page lies when it is near Vidka / Herry / Ardipal
const PG = { w: 230, h: 290 };                       // a page, standing on the table top
const BIG = [ { who: 'V', x: 1040, S: 380 }, { who: 'H', x: 1330, S: 406 }, { who: 'A', x: 1600, S: 426 } ];
const CH = { xs: [250, 336, 422, 508, 594], S: 150, lab: ['I', 'II', 'III', 'IV', 'V'] };
let Z = 1;                                           // current camera zoom (props scale their line width with it)
const PW = () => 6 / Math.sqrt(Z);

// ---------------- camera ----------------
const WIDE = { x: 980, y: 600, z: 1 };
const camPage = (cx, z, sx = 1500) => ({ x: cx - (sx - 960) / z, y: TB.top - 400 / z, z });   // the table edge sits just above the subtitles
const CHAINCAM = { x: 640, y: 700, z: 1.15 };
function kf(u, K) {                                   // keyframes [[u, cam], …], eased in between, zoom in log space
  if (u <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (u <= K[i][0]) {
    const [a, A] = K[i - 1], [b, B] = K[i], k = eio(seg(u, a, b));
    return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), z: lerpZ(A.z, B.z, k) };
  }
  return K[K.length - 1][1];
}
// Camera grammar, revision 2 (TREATMENT.md §11): the reference studied for this revision holds almost every shot
// locked and cuts between compositions rather than panning or pushing through them — the grammar of a slide board,
// not a documentary. Mayer's coherence principle (reduce processing that doesn't serve the lesson) is the nearest
// research footing for "fewer moving parts reads easier", though the search behind that citation found no study of
// camera motion specifically, so the inference from "extraneous pictures" to "extraneous camera drift" is mine, not
// theirs. Three moments still get a real, held camera MOVE rather than a cut — scene 3 (the goal/conclusion gap),
// scene 6 (the turn: "my claim is too wide"), scene 12 (the finale) — each the emotional peak of its half of the
// film, so the move itself becomes a signal ("this matters") rather than wallpaper. Every other scene is a locked
// hold or a hard cut between two holds (two keyframes a millisecond apart: kf() eases over that gap, which at 60
// fps is sub-frame, i.e. a cut).
const CAMS = {
  1: () => [[0, WIDE]],
  2: (s) => { const a = camPage(PA, 2.0), b = camPage(PA, 2.22), cut = lt('s02c') - s.t0 - .4; return [[0, a], [cut, a], [cut + .001, b]]; },
  3: (s) => { const c = camPage(PH + 125, 1.7, 1470), p = le('s03c') - s.t0 + .9; return [[0, c], [p, c], [p + 1.2, CHAINCAM]]; },   // earned move #1: the gap
  4: (s) => { const a = camPage(PA, 2.1), b = camPage(PV, 2.1), cut = le('s04c') - s.t0 + .1; return [[0, a], [cut, a], [cut + .001, b]]; },
  5: () => [[0, { x: 1180, y: 474, z: 1.35 }]],
  6: (s) => { const a = camPage(PV, 2.3), p = lt('s06b') - s.t0 + LINE.s06b.d * .75; return [[0, a], [p, a], [p + 1.1, { x: 1150, y: 680, z: 1.0 }]]; },   // earned move #2: the turn
  7: (s) => { const a = { x: 1200, y: 660, z: 1.1 }, b = camPage(PH, 2.1), cut = lt('s07b') - s.t0; return [[0, a], [cut, a], [cut + .001, b]]; },
  8: (s) => {
    const L = camPage(PH, 1.8, 1420), R = camPage(PH + 250, 1.8, 1420);
    const a = lt('s08a') - s.t0, b = lt('s08b') - s.t0, c = lt('s08c') - s.t0, D = LINE.s08a.d, w = le('s08c') - s.t0 + .4, t1 = a + D * .45;
    return [[0, L], [t1, L], [t1 + .001, R], [b, R], [b + .001, L], [c, L], [c + .001, R], [w - .3, R], [w - .299, L]];
  },
  9: () => [[0, camPage(PV, 2.1)]],
  10: (s) => { const a = { x: 1060, y: 600, z: 1.2 }, b = camPage(PV, 2.0), cut = B.s10.cut - s.t0; return [[0, a], [cut, a], [cut + .001, b]]; },   // the cut lands on the same beat as the jargon → plain-sentence swap
  11: (s) => { const a = camPage(PH, 1.8), b = camPage(PH + 250, 1.8), c = camPage(1660, 1.8);
    const t1 = lt('s11c') - s.t0 + .3, t2 = t1 + 1.1, t3 = t2 + 1.1; return [[0, a], [t1, a], [t1 + .001, b], [t2, b], [t2 + .001, c], [t3, c]]; },
  12: (s) => { const a = { x: 1040, y: 620, z: 1.3 }, p = le('s12d') - s.t0 - .2; return [[0, a], [p, a], [p + 1.4, { x: 960, y: 640, z: .95 }]]; },   // earned move #3: the finale
};
function camera(T) { const s = scn(T); return kf(T - s.t0, CAMS[s.n](s)); }

// ---------------- story beats (absolute seconds), derived from the voice timeline ----------------
const S = {}; SC.forEach(s => S[s.n] = s);
const B = {
  s1: { mapHand: lt('s01b') - .3, chair: lt('s01c') - .5 },
  s2: { cut: lt('s02c') - .4 },
  s3: { pull: le('s03c') + .9, pencil: le('s03c') + .7 },
  s4: { rel: lt('s04a') + 1.0, slide: le('s04c') + .1, write: le('s04c') + .9 },
  s5: { drag: le('s05c') + .4 },
  s6: { pull: lt('s06b') + LINE.s06b.d * .75 },
  s7: { rows: lt('s07c') + LINE.s07c.d * .7, caption: le('s07c') + .5 },
  s8: { write: le('s08c') + .5 },
  s9: { under0: S[9].t0 + .3, under1: S[9].t0 + 1.0, swap: le('s09d') + .3 },
  s10: { cut: lt('s10d') - .2 },
  s11: { write: le('s11c') + .35 },
  s12: { map: S[12].t0 + .1, open: lt('s12b') + .2, pull: le('s12d') - .2 },
};
B.s3.pulse = B.s3.pull + .2;                          // the accent leaves Bab I when the chain is in frame
B.s4.clasp = B.s4.write + 2.3;                        // once the pull-back has the chain in frame
B.s12.clasp = B.s12.pull + .6; B.s12.pulse = B.s12.pull + .9; B.s12.turn = B.s12.pulse + 1.7;

// ---------------- the chain of chapters ----------------
const CHP = CH.xs.map((x, i) => ({ x, y: GY, rot: 0, S: CH.S, appear: -3, k: i,
  pose: T => chapterPose(i, T),
  col: T => (i === 0 && T >= B.s3.pulse - .05 && T < S[3].t1) || (i === 0 && T >= B.s12.pulse - .05) || (i === 4 && T >= B.s12.pulse + 1.6) ? C.sig : C.ink,
  fill: T => (i === 0 && T >= B.s3.pulse - .05 && T < S[3].t1) || (i === 0 && T >= B.s12.pulse - .05) || (i === 4 && T >= B.s12.pulse + 1.6) ? C.sig : C.paper }));
const STEP3 = .42, STEP12 = .4;
const CHL = [
  { a: 0, b: 1, c: -3, over: [{ t0: B.s3.pulse, t1: B.s3.pulse + STEP3, f0: S[3].t1 - .4, f1: S[3].t1 }, { t0: B.s12.pulse, t1: B.s12.pulse + STEP12 }] },
  { a: 1, b: 2, c: -3, rel: B.s4.rel, over: [{ t0: B.s3.pulse + STEP3, t1: B.s3.pulse + 2 * STEP3, f0: S[3].t1 - .4, f1: S[3].t1 }] },
  { a: 1, b: 2, c: B.s4.clasp, over: [{ t0: B.s12.pulse + STEP12, t1: B.s12.pulse + 2 * STEP12 }] },
  { a: 2, b: 3, c: -3, over: [{ t0: B.s3.pulse + 2 * STEP3, t1: B.s3.pulse + 3 * STEP3, f0: S[3].t1 - .4, f1: S[3].t1 }, { t0: B.s12.pulse + 2 * STEP12, t1: B.s12.pulse + 3 * STEP12 }] },
  { a: 3, b: 4, c: -3, rel: B.s3.pulse + 3 * STEP3 },
  { a: 3, b: 4, c: B.s12.clasp, over: [{ t0: B.s12.pulse + 3 * STEP12, t1: B.s12.pulse + 4 * STEP12 }] },
];
function chapterPose(i, T) {
  const p = idle(i + 3, T);
  // the accent reaches a chapter: a small dip and a nod
  for (const [t0, st] of [[B.s3.pulse, STEP3], [B.s12.pulse, STEP12]]) {
    const tp = t0 + st * i; if (i === 4 && t0 === B.s3.pulse) continue;
    p.hy += .02 * bell(T, tp - .03, tp + .24); p.head += .05 * bell(T, tp - .03, tp + .3);
  }
  // Bab V, let go in scene 3: leans away a little, looks down
  if (i === 4) { const k = ss(seg(T, B.s3.pulse + 3 * STEP3, B.s3.pulse + 3 * STEP3 + .6)) * (1 - ss(seg(T, B.s12.clasp - .5, B.s12.clasp))); p.lean += .06 * k; p.head += .12 * k; }
  // Bab II, let go in scene 4
  if (i === 2) { const k = ss(seg(T, B.s4.rel, B.s4.rel + .6)) * (1 - ss(seg(T, B.s4.clasp - .5, B.s4.clasp))); p.lean += .05 * k; p.head += .1 * k; }
  // the finale: everyone in the chain turns towards the table
  const L = ss(seg(T, B.s12.turn, B.s12.turn + .6)); p.lean += .08 * L; p.head += .18 * L;
  return p;
}
function drawChain(T) {
  const a = 1 - seg(Z, 1.22, 1.34); if (a <= 0) return;          // the chain is a diagram of the whole: it leaves in close-ups
  g.save(); g.globalAlpha = a; g.lineCap = 'round'; g.strokeStyle = C.tint; g.lineWidth = LW;
  g.beginPath(); g.moveTo(140, GY + 34); g.lineTo(1840, GY + 34); g.stroke(); g.restore();   // the ground line, under the whole room
  g.save(); g.globalAlpha = a; drawGroup(CHP, CHL, T);
  CH.xs.forEach((x, i) => text(CH.lab[i], x, GY + 76, { size: 18, w: 600, col: C.mute, align: 'center', track: 2, a }));
  text('BAB', CH.xs[0] - 60, GY + 76, { size: 16, w: 500, col: C.mute, align: 'right', track: 3, a });
  g.restore();
}

// ---------------- props ----------------
function rrect(x0, y0, w, h, r, fill, stroke, lw) { g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = lw ?? PW(); g.beginPath(); g.roundRect(x0, y0, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.stroke(); } g.restore(); }
function line(x0, y0, x1, y1, col, lw) { g.save(); g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = lw ?? PW(); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); }
function table() {
  line(TB.x0, TB.top, TB.x1, TB.top, C.ink, LW);
  line(TB.x0 + 30, TB.top, TB.x0 + 30, GY, C.ink, LW); line(TB.x1 - 30, TB.top, TB.x1 - 30, GY, C.ink, LW);
}
function chair(x, a = 1) { if (a <= 0) return; g.save(); g.globalAlpha = a; line(x - 40, GY - 150, x - 40, GY, C.ink, LW * .8); line(x - 40, GY - 150, x + 30, GY - 150, C.ink, LW * .8); line(x - 40, GY - 320, x - 40, GY - 150, C.ink, LW * .8); g.restore(); }
// the binding folder: a box on the table; its lid is a line that opens (ang = 0 closed, 1 open)
function folder(x, ang, a = 1) {
  if (a <= 0) return; g.save(); g.globalAlpha = a;
  const w = 170, h = 96, y0 = TB.top - h;
  rrect(x - w / 2, y0, w, h, 6, C.tint, C.ink);
  const an = -Math.PI * .62 * ang; g.save(); g.translate(x - w / 2, y0); g.rotate(an); rrect(0, -8, w, 10, 4, C.paper, C.ink); g.restore();
  g.restore();
}
// a page: rows of text as strokes. o = {rows, accent:[] (red by default, accentCol overrides), accent2:[] (a second
// marked set, green by default via accent2Col — e.g. the fix that answers the gap on the same page), grow:{row,f},
// blocks:[[a,b],…], blank:[a,b], words:[[row,text,col]], tint:bool}. Three colours, three reading-comprehension
// actions: red marks a gap, gold a phrase worth a second look, green a repair now in place (TREATMENT.md §11).
function page(x, o = {}, a = 1) {
  if (a <= 0) return; g.save(); g.globalAlpha = a;
  const w = o.w ?? PG.w, h = o.h ?? PG.h, x0 = x - w / 2, y0 = TB.top - h, rows = o.rows ?? 13, step = (h - 50) / rows;
  rrect(x0, y0, w, h, 5, C.paper, o.tint ? C.mute : C.ink);
  const rnd = mulberry(o.seed ?? 3);
  const inBlocks = r => !o.blocks || o.blocks.some(([a, b]) => r >= a && r <= b);
  for (let r = 0; r < rows; r++) {
    if (o.blank && r >= o.blank[0] && r <= o.blank[1]) continue;
    if (!inBlocks(r)) continue;
    if (o.words && o.words.some(wd => wd[0] === r)) continue;
    const y = y0 + 30 + r * step, len = (.62 + .36 * rnd()) * (w - 40), last = o.lastShort && o.lastShort.includes(r);
    let f = 1; if (o.grow && o.grow.row === r) f = o.grow.f; if (f <= 0) continue;
    const acc = o.accent && o.accent.includes(r), acc2 = o.accent2 && o.accent2.includes(r), struck = o.struck && o.struck.includes(r);
    const L = (last ? len * .45 : len) * f;
    const col = acc2 ? (o.accent2Col ?? C.leaf) : acc ? (o.accentCol ?? C.sig) : C.tint;
    line(x0 + 20, y, x0 + 20 + L, y, col, (acc || acc2) ? PW() * 1.15 : PW() * .9);
    if (struck) line(x0 + 14, y - 1, x0 + 20 + L + 6, y + 1, C.ink, PW() * .8);
  }
  if (o.words) for (const [r, s, col, f] of o.words) { const y = y0 + 30 + r * step + 5; text(s, x0 + 20, y, { size: o.wsize ?? 15, w: 500, col: col ?? C.ink, a: f ?? 1, font: RND }); }
  if (o.label) text(o.label, x0, y0 - 44, { size: 15, w: 600, col: C.mute, track: 3 });
  if (o.sub) text(o.sub, x0, y0 - 18, { size: 20, w: 500, col: o.subCol ?? C.ink, font: RND });
  g.restore();
}
function fileBox(x, a = 1) { if (a <= 0) return; g.save(); g.globalAlpha = a; rrect(x - 40, TB.top - 150, 80, 150, 5, C.tint, C.mute); line(x - 28, TB.top - 128, x + 28, TB.top - 128, C.mute); g.restore(); }
function laptop(x, o = {}) {
  const w = 270, h = 180, x0 = x - w / 2, y0 = TB.top - h - 10, col = o.col ?? C.gold;
  rrect(x0, y0, w, h, 8, C.paper, C.ink); line(x0 - 20, TB.top, x0 + w + 20, TB.top, C.ink, PW() * 1.2);
  const cols = 7, rowsN = 6, gx0 = x0 + 22, gy0 = y0 + 22, gw = w - 44, gh = h - 60, cw = gw / cols, rh = gh / rowsN;
  for (let c = 0; c <= cols; c++) line(gx0 + c * cw, gy0, gx0 + c * cw, gy0 + gh, C.tint, PW() * .6);
  for (let r = 0; r <= rowsN; r++) line(gx0, gy0 + r * rh, gx0 + gw, gy0 + r * rh, C.tint, PW() * .6);
  if (o.rows) for (const r of o.rows) { const k = o.rowsK ?? 1; rrect(gx0, gy0 + r * rh, gw * k, rh, 0, null, col, PW() * 1.1); }
  if (o.caption > 0) line(gx0, y0 + h - 18, gx0 + gw * .7 * o.caption, y0 + h - 18, col, PW() * 1.1);
}
function book(x, w, h, col, lab) { rrect(x - w / 2, TB.top - h, w, h, 4, C.paper, col); line(x - w / 2 + 14, TB.top - h + 4, x - w / 2 + 14, TB.top - 4, col, PW() * .8); if (lab) text(lab, x - w / 2, TB.top - h - 18, { size: 15, w: 600, col: C.mute, track: 3 }); }
function pencil(hand, towards) { const ang = Math.atan2(towards[1] - hand[1], towards[0] - hand[0]); line(hand[0] - Math.cos(ang) * 22, hand[1] - Math.sin(ang) * 22, hand[0] + Math.cos(ang) * 24, hand[1] + Math.sin(ang) * 24, C.ink, PW() * .9); }

// ---------------- the three people: target poses per scene, springs in between ----------------
const Fv = { x: BIG[0].x, gy: GY, S: BIG[0].S, look: 'V' }, Fh = { x: BIG[1].x, gy: GY, S: BIG[1].S, look: 'H' }, Fa = { x: BIG[2].x, gy: GY, S: BIG[2].S, look: 'A' };
const FB = [Fv, Fh, Fa];
const P = (o) => Object.assign(rest(), o);
const HOLD = { la: -1.05, lb: 1.25, ra: 1.05, rb: -1.25 };                              // the draft between the palms
function speakerAt(T) { for (const l of LINES) if (T >= l.t - .1 && T < l.end + .15) return l; return null; }
function rowY(row, rows = 13, h = PG.h) { return TB.top - h + 30 + row * ((h - 50) / rows); }
function bigTarget(i, T) {
  const s = scn(T), u = T - s.t0, n = s.n, p = idle(i * 7 + 1, T), F = FB[i];
  const V = i === 0, Hh = i === 1, A = i === 2;
  if (Hh) { p.lean -= .04; p.head -= .06; }                     // the two lecturers face Vidka (to their left)
  if (A) { p.lean -= .02; p.bend += .018; p.head -= .1; }       // Ardipal: a little stooped
  const look = (dl, dh) => { p.lean += dl; p.head += dh; };
  const reachL = (pt, k = 1) => { const q = P({}); armTo(F, q, -1, pt); p.la = lerp(p.la, q.la, k); p.lb = lerp(p.lb, q.lb, k); };
  const reachR = (pt, k = 1) => { const q = P({}); armTo(F, q, 1, pt); p.ra = lerp(p.ra, q.ra, k); p.rb = lerp(p.rb, q.rb, k); };
  const hold = (k = 1) => { for (const key in HOLD) p[key] = lerp(p[key], HOLD[key], k); };
  const curious = (k = 1) => { p.lean += .13 * k; p.head += .17 * k; };
  const defensive = (k = 1) => { p.lean -= .06 * k; p.head -= .09 * k; p.hy += .008 * k; };
  const reflective = (k = 1) => { reachL([F.x - .07 * F.S, TB.top + 6], k); reachR([F.x + .08 * F.S, TB.top + 6], k); p.head += .1 * k; p.lean += .03 * k; };
  const on = (t0, t1 = 1e9) => ss(seg(T, t0, t0 + .35)) * (1 - ss(seg(T, t1, t1 + .35)));
  switch (n) {
    case 1:
      if (V) { hold(); p.head -= .06 * on(0, lt('s01c')); p.hy -= .01 * bell(T, .3, 1.1);
        if (T >= 1.0) { const k = ss(seg(T, 1.0, 1.7)); reachL([PV - 20 - 40 * k, TB.top - 60], k); reachR([PV + 60 - 40 * k, TB.top - 56], k); }   // lowers the draft into the folder
        defensive(on(lt('s01c') - .2)); }
      if (Hh) { if (T >= B.s1.mapHand - .35) { reachL([PV + 70, TB.top - 96], ss(seg(T, B.s1.mapHand - .35, B.s1.mapHand))); }
        if (T >= B.s1.chair - .3) { reachR([1180 - 80 * ss(seg(T, B.s1.chair, B.s1.chair + .6)), GY - 150], ss(seg(T, B.s1.chair - .3, B.s1.chair))); } }
      if (A) look(-.02 * on(.5), -.06 * on(.5));
      break;
    case 2:
      if (A) { const k = on(s.t0 + .3); const tr = seg(T, lt('s02a'), B.s2.cut - .3), row = T < B.s2.cut ? 1 + 9 * tr : 4; reachL([PA + 60, rowY(row)], k); }
      if (V) { hold(1 - on(lt('s02b') - .2)); curious(on(lt('s02b') - .2)); }
      if (Hh) look(-.02 * on(lt('s02b')), -.05 * on(lt('s02b')));
      break;
    case 3:
      if (Hh) { const k = on(s.t0 + .3); const sw = ss(seg(T, lt('s03a') + LINE.s03a.d * .5, lt('s03a') + LINE.s03a.d * .5 + .5)); reachL([lerp(PH + 70, PH + 250 - 60, sw), lerp(rowY(3), rowY(8), sw)], k); }
      if (V) { const w = on(B.s3.pencil - .5); hold(1 - w); p.head -= .06 * on(lt('s03b') - .1, B.s3.pencil - .6); curious(on(lt('s03c')) * (1 - w) * .6);
        if (w > 0) { const f = seg(T, B.s3.pencil, B.s3.pencil + .8), stop = T >= B.s3.pencil + .55; reachR([PH - 95 + 140 * Math.min(f, .45), rowY(3)], w); if (stop) { p.head += .14; p.lean += .06; } } }
      if (A) look(-.02 * on(lt('s03c')), -.05 * on(lt('s03c')));
      break;
    case 4:
      if (A) { const k = on(s.t0 + .3, B.s4.slide - .2); const d = LINE.s04a.d, tr = T - lt('s04a'), blk = tr < d * .4 ? 1 : tr < d * .7 ? 4 : T < lt('s04c') ? 7 : 11; reachL([PA + 70, rowY(blk)], k); }
      if (V) { curious(on(lt('s04b') - .3, B.s4.write - .6) * .8); const w = on(B.s4.write - .5); const f = seg(T, B.s4.write, B.s4.write + .9); reachR([PV - 95 + 20 + 150 * f, rowY(11)], w); }
      if (Hh) look(-.02 * on(lt('s04b')), -.06 * on(lt('s04b')));
      break;
    case 5:
      if (Hh) { const k = on(s.t0 + .3, le('s05c') + .3); const tr = seg(T, lt('s05a'), le('s05a')); reachL([1180 + 260 * tr, TB.top - 40], k); }
      if (V) { const k1 = on(lt('s05b') - .3, B.s5.drag - .6); reachR([1120, TB.top - 50], k1); const w = on(B.s5.drag - .5); const f = eio(seg(T, B.s5.drag, B.s5.drag + .7)); reachL([880 + 170 * f, TB.top - 40], w); hold((1 - k1) * (1 - w) * 0); }
      if (A) look(-.01 * on(lt('s05c')), -.05 * on(lt('s05c')));
      break;
    case 6:
      if (V) { const k = on(s.t0 + .2, lt('s06c') - .2); reachR([PV + 70, rowY(5)], k); p.lean += .05 * k; p.head -= .06 * k; const r = on(lt('s06c') - .2); p.head += .14 * r; p.lean -= .03 * r; }
      if (A) { const k = on(lt('s06b') + LINE.s06b.d * .45); reachL([1480 - 60 * ss(seg(T, B.s6.pull + .2, B.s6.pull + .8)), TB.top - 110], k); }
      if (Hh) look(-.02 * on(lt('s06b')), -.05 * on(lt('s06b')));
      break;
    case 7:
      if (Hh) { const k = on(s.t0 + .3, B.s7.caption); reachL([PH + 40, TB.top - 120], k); }
      if (V) { const k = on(lt('s07b') - .2, le('s07b') + .6); reachR([PH - 110, TB.top - 100], k); const w = on(B.s7.caption - .5); const f = seg(T, B.s7.caption, B.s7.caption + .8); reachR([PH - 110 + 60 * f, TB.top - 30], w); curious(on(lt('s07c')) * .5); }
      if (A) look(-.01 * on(lt('s07c')), -.04 * on(lt('s07c')));
      break;
    case 8: {
      const K = CAMS[8](s), cx = kf(u, K).x, right = cx > camPage(PH, 1.8).x + 100;
      if (A) { const k = on(s.t0 + .3, B.s8.write - .3); reachL([PH + 250 + 50, rowY(5)], k * (right ? 1 : .35)); p.head -= .12 * (right ? 0 : 1) * k; }
      if (V) { p.head += (right ? -.04 : .12) * on(s.t0 + .3); const w = on(B.s8.write - .5); const f = seg(T, B.s8.write, B.s8.write + .9); reachR([PH - 95 + 20 + 120 * f, rowY(11)], w); }
      if (Hh) look(-.02 * on(lt('s08b')), -.06 * on(lt('s08b')));
      break; }
    case 9:
      if (V) { const k = on(s.t0 + .1); const f = Math.min(seg(T, B.s9.under0, B.s9.under1), .45); const hover = T >= lt('s09b') && T < B.s9.swap - .4;
        reachR([PV - 95 + 20 + 150 * (T < B.s9.swap - .4 ? f : seg(T, B.s9.swap, B.s9.swap + .9)), rowY(T < B.s9.swap - .4 ? 6.5 : 8)], k); if (hover) { p.head += .1; } p.lean -= .03 * on(lt('s09b'), B.s9.swap); }
      if (Hh) { p.rb += .25 * on(lt('s09b'), le('s09b')); look(-.02 * on(lt('s09b')), -.05 * on(lt('s09b'))); }
      if (A) look(0, -.04 * on(lt('s09b')));
      break;
    case 10:
      if (V) { const k = on(s.t0, lt('s10c') - .3); hold(k); p.head -= .09 * k; p.lean -= .03 * k; curious(on(lt('s10c') - .3) * .7); p.head += .05 * bell(T, B.s10.cut, B.s10.cut + .5); }
      if (A) { look(-.04 * on(lt('s10b') - .2), -.08 * on(lt('s10b') - .2)); p.lb -= .2 * on(lt('s10b'), le('s10b')); }
      if (Hh) look(-.02 * on(lt('s10b')), -.04 * on(lt('s10b')));
      break;
    case 11: {
      const K = CAMS[11](s);
      if (Hh) { const k = on(s.t0 + .3, B.s11.write - .4); const t1 = K[1][0], t2 = K[2][0]; const sw = ss(seg(u, t1, t2)); reachL([lerp(PH + 60, PH + 250 - 90, sw), lerp(rowY(7), rowY(4), sw)], k); }
      if (A) { const k = on(s.t0 + K[3][0] + .2, B.s11.write - .4); reachL([1660 - 40, TB.top - 100], k); }
      if (V) { const w = on(B.s11.write - .5); const f = seg(T, B.s11.write, B.s11.write + .6); reachR([PH - 95 + 10 + 30 * f, rowY(7)], w); curious(on(lt('s11b') - .2, B.s11.write - .6) * .5); }
      break; }
    case 12:
      if (V) { const m = on(B.s12.map - .3, B.s12.open - .4); reachL([PV - 40, TB.top - 70], m); const o = on(B.s12.open - .3, lt('s12d') - .2); hold(o); reachL([PV + 40, TB.top - 150], o * .9); reachR([PV + 110, TB.top - 150], o * .9);
        const r = on(lt('s12d') - .3); reflective(r); p.head += .05 * on(B.s12.turn); }
      if (Hh) { look(-.03 * on(lt('s12c') - .2), -.06 * on(lt('s12c') - .2)); const t = on(B.s12.turn); p.lean -= .07 * t; p.head -= .18 * t; }
      if (A) { look(-.02 * on(s.t0 + .3), -.05 * on(s.t0 + .3)); const t = on(B.s12.turn + .1); p.lean -= .07 * t; p.head -= .18 * t; }
      break;
  }
  // speaking: a small nod and, when the hand is free, a forearm gesture
  const l = speakerAt(T); if (l && l.who === BIG[i].who) {
    const e = ss(seg(T, l.t, l.t + .3)) * (1 - ss(seg(T, l.end - .2, l.end + .15))), ph = (T - l.t);
    p.head += .035 * Math.sin(2 * Math.PI * 2.1 * ph) * e; p.hy += .003 * Math.sin(2 * Math.PI * 2.1 * ph + 1) * e;
    if (!V) p.rb += .2 * Math.sin(2 * Math.PI * 1.6 * ph + .5) * e;
  }
  return p;
}
let SIMB = null;

// ---------------- scenes: props in the world ----------------
function props(T) {
  const s = scn(T), u = T - s.t0, n = s.n;
  switch (n) {
    case 1: {
      if (T >= 1.75) { rrect(PV - 20 - 52, TB.top - 96 - 70, 104, 110, 4, C.paper, C.ink); }   // the draft, half into the folder
      folder(PV - 20, 1);                                                  // the folder, open, waiting for the draft
      chair(1180 - 80 * ss(seg(T, B.s1.chair, B.s1.chair + .6)), 1);
      break; }
    case 2: {
      if (T < B.s2.cut) page(PA, { seed: 2, label: 'HALAMAN 1–2' });
      else page(PA, { seed: 4, accent: T >= B.s2.cut + .2 ? [4] : [], label: 'HALAMAN 7' });
      folder(PV - 20, 0); break; }
    case 3: {
      const sl = eio(seg(u, .2, .9));
      page(PH, { seed: 5, accent: [3], label: 'TUJUAN' });
      page(lerp(PH + 160, PH + 250, sl), { seed: 6, accent: [8], label: 'KESIMPULAN' });
      // Vidka's pencil line from the goal towards the conclusion: starts, then stops
      const f = Math.min(seg(T, B.s3.pencil, B.s3.pencil + .8), .45);
      if (f > 0) line(PH - 75, rowY(3) + 10, PH - 75 + 140 * f, rowY(3) + 10 + 40 * f, C.ink, PW() * .9);
      folder(PV - 20, 0); break; }
    case 4: {
      const x = lerp(PA, PV, eio(seg(T, B.s4.slide, B.s4.slide + .7)));
      page(x, { seed: 7, blocks: [[0, 2], [4, 6], [8, 10], [11, 12]], blank: T < B.s4.write ? [11, 12] : [12, 12], accent: T >= B.s4.write ? [11] : [], accentCol: C.leaf, grow: { row: 11, f: seg(T, B.s4.write, B.s4.write + .9) }, label: 'BAB II · KAJIAN TEORI',
        words: [[0, 'menurut A …', C.navy], [4, 'menurut B …', C.navy], [8, 'menurut C …', C.navy]] });
      folder(PV - 20, 0); break; }
    case 5: {   // three chosen sessions as gold sticky notes; the excluded one turns green once Vidka folds it back in
      [1180, 1310, 1440].forEach((x, i) => sticky(x, TB.top - 40, 104, 66, (i - 1) * .055, C.gold, '★', 1));
      const f = eio(seg(T, B.s5.drag, B.s5.drag + .7)), included = T >= B.s5.drag + .4;
      sticky(lerp(880, 1050, f), TB.top - 40, 104, 66, -.08, included ? C.leaf : C.tint, included ? '✓' : '–', 1);
      break; }
    case 6: {
      page(PV, { seed: 8, blocks: [[0, 1], [3, 6], [8, 12]], accent: [4, 5], label: 'KUTIPAN PEMAIN 1' });
      const a = ss(seg(T, B.s6.pull + .3, B.s6.pull + .9)); [1300, 1390, 1480].forEach((x, i) => fileBox(x, Math.min(1, a * 3 - i * .4)));
      if (a > 0) text('PEMAIN 2–4 · BELUM DIBUKA', 1260, TB.top - 170, { size: 15, w: 600, col: C.mute, track: 3, a });
      break; }
    case 7: {   // gold, not red: a pattern worth noticing, not a gap
      const rows = T >= B.s7.rows ? [2, 4] : [], cap = seg(T, B.s7.caption, B.s7.caption + .8);
      laptop(PH, { rows, caption: cap, col: C.gold });
      break; }
    case 8: {
      page(PH, { seed: 9, accent: [5], label: 'HASIL', sub: 'pemain saling melihat', grow: { row: 11, f: seg(T, B.s8.write, B.s8.write + .9) }, blank: T < B.s8.write ? [11, 12] : [12, 12],
        words: T >= B.s8.write + .5 ? [[12, 'Dalam situasi apa?', C.gold, seg(T, B.s8.write + .5, B.s8.write + .9)]] : [], accent2: T >= B.s8.write ? [11] : [], accent2Col: C.gold });
      page(PH + 250, { seed: 10, accent: [5], label: 'PEMBAHASAN', sub: 'pemain menggunakan pandangan' });
      break; }
    case 9: {   // red marks the overclaim as it's struck; the rewritten line comes back in green — a repair, not just an edit
      const f = Math.min(seg(T, B.s9.under0, B.s9.under1), .45), sw = T >= B.s9.swap;
      page(PV, { seed: 11, accent: [6], struck: sw ? [6] : [], accent2: sw ? [8] : [], grow: sw ? { row: 8, f: seg(T, B.s9.swap, B.s9.swap + .9) } : null, blank: sw ? null : [8, 8], label: 'SARAN',
        words: [[7, sw ? '' : '', C.ink]] });
      if (f > 0 && !sw) line(PV - 75, rowY(6) + 9, PV - 75 + 150 * f, rowY(6) + 9, C.ink, PW() * 1.3);
      if (sw) line(PV - 75, rowY(6) + 9, PV - 75 + 68, rowY(6) + 9, C.ink, PW() * 1.3);
      break; }
    case 10: {   // jargon in red, the plain sentence that replaces it in green — the cut (CAMS §10) lands on the same beat
      const cut = T >= B.s10.cut;
      page(PV, { seed: 12, rows: 13, blocks: [[0, 1], [6, 12]], label: 'BAB IV · PEMBAHASAN', wsize: 15,
        words: cut ? [[2, 'Pemain masuk bersama', C.leaf], [3, 'setelah anggukan.', C.leaf]] : [[2, 'Implementasi koordinatif', C.sig], [3, 'menghasilkan optimalisasi', C.sig], [4, 'temporal.', C.sig]] });
      folder(PV - 20 - 400, 0, 0); break; }
    case 11: {
      page(PH, { seed: 13, accent: [7], label: 'KUTIPAN', words: T >= B.s11.write + .3 ? [[8, 'hlm. ?', C.sig, seg(T, B.s11.write + .3, B.s11.write + .6)]] : [], blank: [8, 8] });
      page(PH + 250, { seed: 14, rows: 10, accent: [4], label: 'DAFTAR PUSTAKA', lastShort: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] });
      book(1660, 120, 160, C.ink, 'SUMBER'); book(1750, 60, 140, C.mute, 'PEDOMAN');
      break; }
    case 12: {
      folder(PV - 20, 1 - eio(seg(T, B.s12.map, B.s12.map + .7)));
      const o = eio(seg(T, B.s12.open, B.s12.open + .8));
      if (o > 0) { g.save(); g.globalAlpha = o; page(PV + 80, { seed: 15, h: 250, w: 200, rows: 11, accent: [2, 9], label: 'DRAF REVISI' }); g.restore(); }
      break; }
  }
}
function propsFront(T) {           // drawn in front of the people: the table hides their legs
  table();
}

// ---------------- screen: title, name labels, question cards, subtitles ----------------
function wrapCardHold(s) { return s.t1 - s.card; }
// a title in the handwriting font, with a hand-drawn underline that grows in under it (the title-card convention
// borrowed for this revision: TREATMENT.md §11)
function titleCard(big, small, x, y, tin, hold, underCol = C.gold) {
  hud(big, x, y, { size: 108, w: 700, font: HAND, track: -1 }, tin, tin + hold);
  hud(small, x, y + 92, { size: 56, w: 500, font: HAND, col: '#5B6B86' }, tin + .12, tin + hold);
  const a = eo(seg(T_NOW, tin + .5, tin + .9)) * (1 - seg(T_NOW, tin + hold, tin + hold + .3));
  if (a > 0) { const f = clamp(seg(T_NOW, tin + .55, tin + 1.15)); growStroke(x, y + 116, x + 540, y + 116, f, underCol, 5, 7); }
}
function hudScreen(T) {
  const s = scn(T), u = T - s.t0;
  if (s.n === 1) {
    hud('CERITA 3   ·   VIDKA, DR. HERRY, PROF. ARDIPAL', 124, 150, { size: 20, w: 500, col: C.mute, track: 3 }, .3, 4.3, 10);
    titleCard('Sidang Kecil', 'sebelum sidang', 116, 300, .5, 3.8);
  }
  if (s.n === 3) metronome(1812, 190, 150, T, 72, eo(seg(T, s.t0 + .6, s.t0 + 1.1)) * (1 - seg(T, s.t1 - .3, s.t1)));   // “koordinasi tempo” — the film’s own tempo, made visible
  if (s.n === 6) hud('CONTOH SIMULASI', 1796, 150, { size: 20, w: 500, col: C.mute, track: 3, align: 'right' }, s.t0 + .4, s.t1 - .3);
  // the self-check, just before the last card: four repairs, ticked off in the same rhythm as the chain's own accent
  if (s.n === 12) {
    const t0 = B.s12.pulse - .15, items = ['Tujuan ↔ kesimpulan', 'Suara penulis dalam kajian teori', 'Klaim dibatasi oleh bukti', 'Sumber dapat ditelusuri'];
    const a = eo(seg(T, t0, t0 + .3)) * (1 - seg(T, s.card - .1, s.card + .2));
    if (a > 0) { text('SATU PER SATU', 1460, 420, { size: 18, w: 600, col: C.mute, track: 3, a });
      checklist(1460, 460, items, clamp((T - B.s12.pulse) / STEP12), a); }
  }
  // question card: the viewer is the fourth reader
  const tc = s.card, a = eo(seg(T, tc, tc + .4));
  if (a > 0) {
    const final = s.n === 12;
    hud(final ? 'TUGAS AKHIR   ·   PEMBACA KEEMPAT' : 'PEMBACA KEEMPAT   ·   JEDA UNTUK BERPIKIR', 124, 150, { size: 20, w: 500, col: C.mute, track: 3 }, tc, 1e9, 10);
    const rem = 1 - seg(T, tc + .4, s.t1 - .1);
    if (rem > 0) growStroke(124, 174, 124 + 420, 174, rem, C.gold, 4, s.n + 2);
    s.q.forEach((ln, i) => hud(ln, 116, 272 + i * 78, { size: 62, w: 700, font: HAND, track: -1, col: final && i === 0 ? C.sig : C.ink }, tc + .08 * i, 1e9, 18));
    if (final) {
      hud('Contoh struktur lima bab · sesuaikan dengan pedoman kampus', 124, 556, { size: 21, w: 500, col: C.mute, font: RND }, tc + .6);
      hud('Pertanyaan tersisip: Szpunar, Khan & Schacter 2013 · Brame 2016', 124, 590, { size: 21, w: 500, col: C.mute, font: RND }, tc + .7);
    }
  }
}
// name labels in the world, above each head the first time the person speaks
function nameLabels(T) {
  BIG.forEach((b, i) => { const t0 = 1.0 + .25 * i, a = ss(seg(T, t0, t0 + .4)) * (1 - ss(seg(T, 4.6, 5.1))); if (a <= 0) return;
    text(NAME[b.who], b.x, GY - b.S - 26, { size: 18, w: 600, col: C.mute, align: 'center', track: 3, a }); });
}
// Captions, revision 2: a single plain line at bottom-centre in the rounded caption face, no colour bar — the
// reference's convention. Three speakers still need telling apart, so a small muted name sits above the line
// rather than inside a coloured tag; colour itself stays reserved for the annotation system (red/navy/gold/green),
// so a speaker label never competes with what the annotations mean (TREATMENT.md §11).
const SUBS = LINES.map(l => ({ ...l, t0: +(l.t - .2).toFixed(3), t1: +(Math.max(l.end + .5, l.t + 1.8)).toFixed(3) }));
function drawSubs(T) {
  const s = SUBS.find(s => T >= s.t0 && T < s.t1); if (!s) return;
  const a = ss(seg(T, s.t0, s.t0 + .12)) * (1 - ss(seg(T, s.t1 - .12, s.t1)));
  const keep = TXT; TXT = null;
  // a soft plate behind the caption: at a close camera a character can stand tall enough to reach the caption band,
  // and a filled torso (unlike the old bare line) truly hides text behind it — so the strip gets its own backing,
  // like a sentence strip laid over the page, rather than trusting empty space that a push-in might fill.
  g.save(); g.font = `600 33px ${RND}`; const w1 = g.measureText(s.text).width; g.font = `600 17px ${RND}`; const w2 = g.measureText(NAME[s.who]).width; g.restore();
  const w = Math.max(w1, w2) + 72, x0 = 960 - w / 2;
  g.save(); g.globalAlpha = a * .92; g.fillStyle = C.paper; g.beginPath(); g.roundRect(x0, 964, w, 92, 14); g.fill();
  g.strokeStyle = C.tint; g.lineWidth = 2; g.beginPath(); g.roundRect(x0, 964, w, 92, 14); g.stroke(); g.restore();
  text(NAME[s.who], 960, 992, { size: 17, w: 600, col: C.mute, align: 'center', track: 3, a, font: RND });
  text(s.text, 960, 1034, { size: 33, w: 600, col: C.ink, align: 'center', a, font: RND });
  TXT = keep;
}

// ---------------- render ----------------
function drawFilm(T) {
  T_NOW = T; paper();
  const cam = camera(T); Z = cam.z;
  g.save(); g.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, H / 2 - cam.y * cam.z); SCR = cam;
  drawChain(T);
  const PB = SIMB.at(Math.min(T, DUR + .2));
  const J = BIG.map((b, i) => figure(FB[i], PB[i]));
  nameLabels(T);
  // the pencil in Vidka's right hand while she writes
  const s = scn(T), writing = (s.n === 3 && T >= B.s3.pencil - .2 && T < s.t1) || (s.n === 4 && T >= B.s4.write - .3 && T < s.card) || (s.n === 7 && T >= B.s7.caption - .3 && T < s.card) || (s.n === 8 && T >= B.s8.write - .3 && T < s.card) || (s.n === 9) || (s.n === 11 && T >= B.s11.write - .3 && T < s.card);
  if (writing) { const hand = J[0].aR[1]; pencil(hand, [hand[0] + 30, hand[1] + 40]); }
  if (s.n === 1) {
    if (T < 1.75) { const a = J[0].aL[1], b = J[0].aR[1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 10], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      g.save(); g.translate(m[0], m[1]); g.rotate(ang * .5); rrect(-52, -62, 104, 124, 4, C.paper, C.ink); for (let r = 0; r < 5; r++) line(-34, -40 + r * 18, 10 + 14 * ((r * 7) % 3), -40 + r * 18, C.tint, PW() * .8); g.restore(); }
  }
  props(T);
  propsFront(T);
  SCR = null; g.restore();
  hudScreen(T);
  drawSubs(T);
}

// ---------------- sound events for mix.py ----------------
function events() {
  const E = [];
  SC.forEach(s => { E.push({ t: s.t0, type: 'cut', n: s.n }); E.push({ t: s.card, type: 'card', n: s.n, hold: s.t1 - s.card }); });
  LINES.forEach(l => E.push({ t: l.t, type: 'line', id: l.id, who: l.who, d: l.d }));
  E.push({ t: .3, type: 'title' });
  E.push({ t: 1.0, type: 'paper' }); E.push({ t: B.s1.mapHand, type: 'tap' }); E.push({ t: B.s1.chair, type: 'chair', d: .6 });
  E.push({ t: lt('s02a'), type: 'trace', d: B.s2.cut - .3 - lt('s02a') }); E.push({ t: B.s2.cut, type: 'flip' }); E.push({ t: B.s2.cut + .2, type: 'tick' });
  E.push({ t: S[3].t0 + .2, type: 'paper' }); E.push({ t: B.s3.pencil, type: 'pencil', d: .5 }); E.push({ t: B.s3.pull, type: 'pullback', d: 1.2 });
  for (const t of metronomeTicks(S[3].t0 + .7, S[3].t1 - .4, 72)) E.push({ t, type: 'metronome' });   // the metronome prop (hudScreen, scene 3), ticking in view
  for (let k = 0; k < 3; k++) E.push({ t: B.s3.pulse + STEP3 * (k + 1), type: 'node', k: k + 1 });
  E.push({ t: B.s3.pulse, type: 'pulse', d: 3 * STEP3 }); E.push({ t: B.s3.pulse + 3 * STEP3, type: 'letgo' });
  E.push({ t: lt('s04a') + LINE.s04a.d * .05, type: 'tick' }); E.push({ t: lt('s04a') + LINE.s04a.d * .4, type: 'tick' }); E.push({ t: lt('s04a') + LINE.s04a.d * .7, type: 'tick' });
  E.push({ t: B.s4.rel, type: 'letgo' }); E.push({ t: B.s4.slide, type: 'paper' }); E.push({ t: B.s4.write, type: 'pencil', d: .9 }); E.push({ t: B.s4.clasp - .3, type: 'reach' }); E.push({ t: B.s4.clasp, type: 'clasp' });
  E.push({ t: B.s5.drag, type: 'paper', d: .7 });
  E.push({ t: B.s6.pull, type: 'pullback', d: 1.1 }); E.push({ t: B.s6.pull + .4, type: 'tick' });
  E.push({ t: lt('s07b') - .3, type: 'pushin', d: 1.6 }); E.push({ t: B.s7.rows, type: 'tick' }); E.push({ t: B.s7.rows + .15, type: 'tick' }); E.push({ t: B.s7.caption, type: 'pencil', d: .8 });
  E.push({ t: lt('s08a') + LINE.s08a.d * .45, type: 'tick' }); E.push({ t: lt('s08b'), type: 'tick' }); E.push({ t: lt('s08b') + .6, type: 'tick' }); E.push({ t: lt('s08c'), type: 'tick' }); E.push({ t: B.s8.write, type: 'pencil', d: .9 });
  E.push({ t: B.s9.under0, type: 'pencil', d: .7 }); E.push({ t: B.s9.swap, type: 'strike' }); E.push({ t: B.s9.swap + .1, type: 'pencil', d: .9 });
  E.push({ t: lt('s10b') - .3, type: 'pushin', d: 1.2 }); E.push({ t: B.s10.cut, type: 'hit' });
  E.push({ t: S[11].t0 + lt('s11c') - S[11].t0 + .3, type: 'track', d: 1.4 }); E.push({ t: lt('s11c') + 2.1, type: 'track', d: 1.4 }); E.push({ t: lt('s11c') + 3.3, type: 'book' }); E.push({ t: B.s11.write, type: 'pencil', d: .6 });
  E.push({ t: B.s12.map, type: 'folder' }); E.push({ t: B.s12.open, type: 'paper' }); E.push({ t: B.s12.pull, type: 'pullback', d: 1.4 }); E.push({ t: B.s12.clasp - .3, type: 'reach' }); E.push({ t: B.s12.clasp, type: 'clasp' });
  E.push({ t: B.s12.pulse, type: 'pulse', d: 4 * STEP12 }); for (let k = 1; k <= 4; k++) E.push({ t: B.s12.pulse + STEP12 * k, type: 'node', k }); E.push({ t: B.s12.pulse + 4 * STEP12, type: 'arrive' }); E.push({ t: B.s12.turn, type: 'turn' });
  return E.sort((a, b) => a.t - b.t);
}

// ---------------- page contract ----------------
window.DUR = TO - FROM;
window.EV = events().filter(e => e.t >= FROM - 1e-6 && e.t <= TO + 1e-6).map(e => ({ ...e, t: +(e.t - FROM).toFixed(4) }));
window.BEATS = B;
window.render = t => drawFilm(FROM + t);
window.TEXTS = t => { TXT = []; window.render(t); const o = TXT; TXT = null; return o.filter(o => o.x1 > 0 && o.x0 < W && o.y1 > 0 && o.y0 < H); };
Promise.all([
  document.fonts.load(`600 40px ${EN}`), document.fonts.load(`500 40px ${EN}`), document.fonts.load(`400 40px ${EN}`),
  document.fonts.load(`700 80px ${HAND}`), document.fonts.load(`500 40px ${HAND}`), document.fonts.load(`600 40px ${HAND}`),
  document.fonts.load(`400 40px ${RND}`), document.fonts.load(`500 40px ${RND}`), document.fonts.load(`600 40px ${RND}`), document.fonts.load(`700 40px ${RND}`),
]).then(() => {
  SIMB = simulate(3, bigTarget, -2.0, DUR + .5);
  window.render(0); window.READY = true;
});
