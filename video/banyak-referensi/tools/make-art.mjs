// Code-drawn B1-style line art for "Banyak Referensi, Mana yang Tepat?"
// Usage: NODE_PATH=<skill>/node_modules node make-art.mjs <outDir>
// Everything is drawn at 2x and saved as transparent PNG.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
// Resolve @napi-rs/canvas from the installed stickman Skill: SKILL_DIR, else the bootstrap cache
// (B6_UPSTREAM_DIR or ~/.cache/stickman-video-director, see .claude/skills/stickman-video/scripts/bootstrap.sh).
import os from 'node:os';
const CACHE = process.env.B6_UPSTREAM_DIR || path.join(os.homedir(), '.cache', 'stickman-video-director');
const SKILL_DIR = process.env.SKILL_DIR || path.join(CACHE, 'skills', 'directing-stickman-videos');
if (!fs.existsSync(path.join(SKILL_DIR, 'package.json'))) { console.error(`stickman Skill not found at ${SKILL_DIR}; run .claude/skills/stickman-video/scripts/bootstrap.sh install, or set SKILL_DIR`); process.exit(1); }
const {createCanvas} = createRequire(path.join(SKILL_DIR, 'package.json'))('@napi-rs/canvas');

const OUT = path.resolve(process.argv[2] || '../art');
fs.mkdirSync(OUT, {recursive: true});
const INK = '#191916', S = 2;

// Deterministic jitter so re-running gives identical files.
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };

function pen(ctx, pts, {width = 3, color = INK, jitter = 1.1, close = false} = {}) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  const j = p => [p[0] + rnd() * jitter, p[1] + rnd() * jitter];
  const first = j(pts[0]); ctx.moveTo(...first);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(...j(pts[i]));
  if (close) ctx.closePath();
  ctx.stroke();
}
// A curve through a→(control)→b, sampled then jittered.
function curve(ctx, a, c, b, opts = {}, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
  pen(ctx, pts, opts);
}
function circle(ctx, cx, cy, r, opts = {}) {
  const pts = []; const n = 40;
  for (let i = 0; i <= n + 2; i++) { const a = -Math.PI / 2 + i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  pen(ctx, pts, {jitter: 1.4, ...opts});
}
function blob(ctx, cx, cy, rx, ry, color = INK, rot = 0) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function oval(ctx, cx, cy, rx, ry, opts = {}) {
  const pts = []; for (let i = 0; i <= 26; i++) { const a = i / 24 * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  pen(ctx, pts, {jitter: .8, ...opts});
}
function rect(ctx, x, y, w, h, opts = {}) { pen(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], {close: true, ...opts}); }
function fillRect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

// ---------- character rig ----------
function head(ctx, {cx, cy, r = 42, gaze = [-0.6, 0.1], brows = 'neutral', mouth = 'line', hair = 'tufts', glasses = false, beard = false, tilt = 0}) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  circle(ctx, 0, 0, r, {width: 3.2});
  // hair
  if (hair === 'tufts' || hair === 'ponytail') for (const [dx, h] of [[-14, 26], [0, 32], [14, 24]]) curve(ctx, [dx, -r + 6], [dx + 6, -r - h / 2], [dx + 14, -r - h], {width: 2.6});
  if (hair === 'ponytail') { curve(ctx, [r - 6, -r * .35], [r + 30, -r * .1], [r + 22, r * .55], {width: 2.8}); curve(ctx, [r - 2, -r * .25], [r + 36, 0], [r + 28, r * .5], {width: 2.4}); }
  if (hair === 'short') { for (let i = -3; i <= 3; i++) curve(ctx, [i * 10, -r + 4], [i * 10 + 3, -r - 9], [i * 10 + 8, -r - 4], {width: 2.6}); }
  if (hair === 'curly') { for (let i = -4; i <= 4; i++) circle(ctx, i * 9, -r + 2 - Math.abs(i) * .5, 7, {width: 2.2, jitter: .6}); }
  const ex = gaze[0] * r * .28, ey = gaze[1] * r * .2;
  // eyes
  blob(ctx, -r * .32 + ex, -r * .08 + ey, r * .08, r * .17);
  blob(ctx, r * .32 + ex, -r * .08 + ey, r * .08, r * .17);
  if (glasses) { circle(ctx, -r * .32, -r * .06, r * .3, {width: 2.2, jitter: .6}); circle(ctx, r * .32, -r * .06, r * .3, {width: 2.2, jitter: .6}); pen(ctx, [[-r * .02, -r * .06], [r * .02, -r * .06]], {width: 2.2}); }
  // brows
  const by = -r * .4 + ey * .5;
  const browSet = {
    neutral: [[[-r * .5, by], [-r * .15, by - 2]], [[r * .15, by - 2], [r * .5, by]]],
    raised: [[[-r * .5, by - 4], [-r * .15, by - 12]], [[r * .15, by - 12], [r * .5, by - 4]]],
    pinched: [[[-r * .5, by - 6], [-r * .15, by + 4]], [[r * .15, by + 4], [r * .5, by - 6]]],
    sad: [[[-r * .5, by + 2], [-r * .15, by - 8]], [[r * .15, by - 8], [r * .5, by + 2]]],
  }[brows];
  for (const b of browSet) pen(ctx, b, {width: 3});
  // mouth
  const my = r * .45;
  if (mouth === 'line') pen(ctx, [[-r * .18 + ex * .5, my], [r * .18 + ex * .5, my]], {width: 2.6});
  if (mouth === 'smile') curve(ctx, [-r * .3 + ex * .4, my - 4], [ex * .4, my + 14], [r * .3 + ex * .4, my - 4], {width: 2.8});
  if (mouth === 'grin') { curve(ctx, [-r * .4 + ex * .4, my - 8], [ex * .4, my + 22], [r * .4 + ex * .4, my - 8], {width: 3}); pen(ctx, [[-r * .36 + ex * .4, my - 6], [r * .36 + ex * .4, my - 6]], {width: 2.4}); }
  if (mouth === 'frown') curve(ctx, [-r * .26 + ex * .4, my + 6], [ex * .4, my - 8], [r * .26 + ex * .4, my + 6], {width: 2.8});
  if (mouth === 'open') oval(ctx, ex * .5, my + 2, r * .14, r * .2, {width: 2.6});
  if (mouth === 'o') oval(ctx, ex * .5, my + 2, r * .09, r * .11, {width: 2.6});
  if (beard) for (let i = -3; i <= 3; i++) curve(ctx, [i * 9, r * .62], [i * 9 + 2, r + 10], [i * 9 + 6, r * .7], {width: 2.4});
  ctx.restore();
}
function limb(ctx, pts, {hand = true, width = 3.4} = {}) {
  pen(ctx, pts, {width});
  if (hand) blob(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1], 9, 6, 'transparent');
  if (hand) oval(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1], 9, 6, {width: 2.6});
}
function torso(ctx, a, b) { pen(ctx, [a, [(a[0] + b[0]) / 2 + 2, (a[1] + b[1]) / 2], b], {width: 3.6}); }

function figurePng(name, w, h, draw) {
  const c = createCanvas(w * S, h * S), ctx = c.getContext('2d'); ctx.scale(S, S);
  seed = [...name].reduce((s, ch) => s + ch.charCodeAt(0), 11);
  draw(ctx);
  fs.writeFileSync(path.join(OUT, name + '.png'), c.toBuffer('image/png'));
}

// Seated Vidka, facing left (laptop side). Canvas 420 x 560.
function chair(ctx) {
  pen(ctx, [[150, 332], [300, 332]], {width: 3});
  pen(ctx, [[300, 332], [312, 175]], {width: 3});
  pen(ctx, [[312, 175], [330, 178]], {width: 3});
  pen(ctx, [[172, 334], [168, 530]], {width: 2.6}); pen(ctx, [[292, 334], [298, 530]], {width: 2.6});
}
function vidka(ctx, pose) {
  const hip = [238, 326], neck = [206, 152];
  chair(ctx);
  // legs (seated, to the left)
  limb(ctx, [hip, [125, 334], [112, 528]]); limb(ctx, [hip, [142, 344], [134, 532]]);
  torso(ctx, neck, hip);
  const sh = [208, 178];
  const onDesk = [sh, [168, 240], [106, 258]];
  const onDesk2 = [sh, [176, 248], [122, 266]];
  const onLap = [sh, [222, 250], [196, 300]];
  const H = o => head(ctx, {cx: 196, cy: 104, r: 44, hair: 'ponytail', ...o});
  switch (pose) {
    case 'type': limb(ctx, onDesk); limb(ctx, onDesk2); H({gaze: [-.7, .35], brows: 'neutral', mouth: 'line'}); break;
    case 'sigh': limb(ctx, onDesk2); limb(ctx, [sh, [150, 178], [176, 92]]); H({cx: 200, cy: 116, tilt: -.18, gaze: [-.3, .7], brows: 'sad', mouth: 'frown'}); break;
    case 'turn': limb(ctx, onDesk); limb(ctx, onLap); H({cx: 206, gaze: [.95, 0], brows: 'raised', mouth: 'open', tilt: .12}); break;
    case 'write': limb(ctx, onDesk2); limb(ctx, [sh, [158, 236], [96, 270]]); pen(ctx, [[82, 290], [118, 250]], {width: 4, color: '#C8891B'}); H({cx: 190, cy: 112, tilt: -.14, gaze: [-.7, .6], brows: 'neutral', mouth: 'line'}); break;
    case 'aha': limb(ctx, onDesk); limb(ctx, [sh, [246, 124], [228, 58]]); H({cx: 194, cy: 96, gaze: [-.3, -.3], brows: 'raised', mouth: 'grin'}); break;
    case 'think': limb(ctx, onDesk2); limb(ctx, [sh, [160, 232], [174, 142]]); H({gaze: [-.5, -.9], brows: 'pinched', mouth: 'line', tilt: .06}); break;
    case 'tidy': limb(ctx, [sh, [150, 232], [62, 250]]); limb(ctx, [sh, [196, 252], [152, 276]]); H({gaze: [-.6, .3], brows: 'neutral', mouth: 'smile'}); break;
    case 'listen': limb(ctx, onDesk); limb(ctx, onLap); H({cx: 204, gaze: [.9, -.05], brows: 'neutral', mouth: 'smile', tilt: .08}); break;
    case 'nod': limb(ctx, onDesk); limb(ctx, onDesk2); H({cx: 196, cy: 112, tilt: -.1, gaze: [-.5, .5], brows: 'neutral', mouth: 'smile'}); break;
  }
}
// Standing figures. Canvas 300 x 560.
function stand(ctx, {hair, glasses = false, beard = false, pose, face = {}}) {
  const neck = [150, 116], hip = [152, 322], sh = [150, 156];
  limb(ctx, [hip, [128, 440], [118, 546]]); limb(ctx, [hip, [178, 440], [190, 546]]);
  torso(ctx, neck, hip);
  const behind = [sh, [186, 226], [158, 286]];
  const H = o => head(ctx, {cx: 150, cy: 74, r: 42, hair, glasses, beard, ...face, ...o});
  switch (pose) {
    case 'point': limb(ctx, [sh, [96, 206], [28, 238]]); pen(ctx, [[28, 238], [10, 246]], {width: 3}); limb(ctx, behind); H({gaze: [-.9, .35], brows: 'neutral', mouth: 'smile', tilt: -.06}); break;
    case 'listen': limb(ctx, behind); limb(ctx, [sh, [184, 232], [150, 290]]); H({gaze: [-.8, .1], brows: 'neutral', mouth: 'smile', tilt: -.05}); break;
    case 'talk': limb(ctx, [sh, [100, 214], [56, 200]]); limb(ctx, behind); H({gaze: [-.8, .1], brows: 'raised', mouth: 'open'}); break;
    case 'nod': limb(ctx, behind); limb(ctx, [sh, [184, 232], [150, 290]]); H({cy: 82, gaze: [-.7, .4], brows: 'neutral', mouth: 'smile', tilt: -.14}); break;
  }
}
function vidkaStand(ctx, pose) {
  const neck = [150, 116], hip = [152, 322], sh = [150, 156];
  limb(ctx, [hip, [128, 440], [118, 546]]); limb(ctx, [hip, [178, 440], [190, 546]]);
  torso(ctx, neck, hip);
  const H = o => head(ctx, {cx: 150, cy: 74, r: 42, hair: 'ponytail', ...o});
  if (pose === 'read') {
    rect(ctx, 86, 212, 86, 112, {width: 2.6}); for (let i = 0; i < 6; i++) pen(ctx, [[98, 232 + i * 15], [160, 232 + i * 15]], {width: 1.8, color: '#6b7280'});
    pen(ctx, [[98, 236], [112, 236]], {width: 2.4}); limb(ctx, [sh, [112, 212], [96, 236]]); limb(ctx, [sh, [186, 212], [166, 236]]);
    H({gaze: [-.4, .8], brows: 'pinched', mouth: 'line', tilt: -.1});
  } else if (pose === 'look') {
    limb(ctx, [sh, [116, 232], [108, 322]]); rect(ctx, 70, 300, 76, 100, {width: 2.6}); for (let i = 0; i < 5; i++) pen(ctx, [[82, 318 + i * 15], [134, 318 + i * 15]], {width: 1.8, color: '#6b7280'});
    limb(ctx, [sh, [186, 226], [158, 286]]);
    H({cx: 158, gaze: [.95, -.15], brows: 'raised', mouth: 'o', tilt: .1});
  }
}
// Small ensemble player with a guitar-like instrument. Canvas 300 x 560.
function player(ctx, {turn = false, hair = 'short'}) {
  const neck = [150, 116], hip = [152, 322], sh = [150, 156];
  limb(ctx, [hip, [128, 440], [118, 546]]); limb(ctx, [hip, [178, 440], [190, 546]]);
  torso(ctx, neck, hip);
  // instrument body + neck
  oval(ctx, 172, 272, 38, 30, {width: 3}); oval(ctx, 150, 246, 30, 24, {width: 2.6}); circle(ctx, 162, 262, 8, {width: 2});
  pen(ctx, [[128, 232], [52, 170]], {width: 4}); pen(ctx, [[52, 170], [40, 158]], {width: 6});
  limb(ctx, [sh, [104, 190], [66, 176]]); limb(ctx, [sh, [196, 232], [176, 268]]);
  head(ctx, {cx: turn ? 142 : 150, cy: 74, r: 42, hair, gaze: turn ? [-.95, 0] : [-.2, .6], brows: turn ? 'raised' : 'neutral', mouth: turn ? 'o' : 'line', tilt: turn ? -.14 : 0});
}

// ---------- props ----------
function pageLines(ctx, x, y, w, rows, gap = 14, color = '#8a8f98') { for (let i = 0; i < rows; i++) pen(ctx, [[x, y + i * gap], [x + w * (i % 3 === 2 ? .7 : 1), y + i * gap]], {width: 1.8, color, jitter: .5}); }
function article(ctx, tab) {
  fillRect(ctx, 8, 8, 204, 274, '#ffffff'); rect(ctx, 8, 8, 204, 274, {width: 2.8});
  pen(ctx, [[26, 34], [150, 34]], {width: 5}); pen(ctx, [[26, 48], [120, 48]], {width: 3.4});
  pen(ctx, [[26, 70], [194, 70]], {width: 1.4, color: '#8a8f98'});
  pageLines(ctx, 26, 86, 78, 12); pageLines(ctx, 116, 86, 78, 12);
  if (tab) { fillRect(ctx, 172, 2, 44, 20, tab); rect(ctx, 172, 2, 44, 20, {width: 1.8}); }
}

const props = {
  'desk': [900, 220, ctx => { pen(ctx, [[20, 40], [880, 40]], {width: 4.4}); pen(ctx, [[20, 40], [20, 58], [880, 58], [880, 40]], {width: 2.6}); pen(ctx, [[70, 58], [60, 212]], {width: 3}); pen(ctx, [[830, 58], [840, 212]], {width: 3}); }],
  'laptop-side': [240, 180, ctx => { // screen facing left
    pen(ctx, [[30, 150], [220, 150]], {width: 3.4}); pen(ctx, [[30, 150], [40, 138], [214, 138], [220, 150]], {width: 2.6});
    pen(ctx, [[40, 138], [66, 20], [86, 20], [68, 138]], {width: 3, close: true}); pageLines(ctx, 92, 142, 100, 1, 10, '#555');
  }],
  'laptop-front': [420, 300, ctx => { fillRect(ctx, 30, 14, 360, 232, '#ffffff'); rect(ctx, 30, 14, 360, 232, {width: 3.4}); rect(ctx, 44, 28, 332, 204, {width: 1.6}); pen(ctx, [[10, 258], [410, 258], [396, 288], [24, 288]], {width: 3, close: true}); pen(ctx, [[160, 272], [260, 272]], {width: 2}); }],
  'laptop-closed': [240, 70, ctx => { pen(ctx, [[20, 50], [220, 50]], {width: 3.4}); pen(ctx, [[20, 50], [30, 30], [210, 30], [220, 50]], {width: 3, close: true}); }],
  'search-box': [360, 60, ctx => { fillRect(ctx, 4, 4, 352, 52, '#ffffff'); rect(ctx, 4, 4, 352, 52, {width: 2.6}); circle(ctx, 330, 28, 10, {width: 2.4}); pen(ctx, [[337, 36], [346, 46]], {width: 3}); }],
  'page-a': [220, 290, ctx => article(ctx, '#7FB3E6')],
  'page-b': [220, 290, ctx => article(ctx, '#9CD48B')],
  'page-plain': [220, 290, ctx => article(ctx, null)],
  'articles-pile': [300, 320, ctx => { for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(44 + i * 14, 30 + i * 11); ctx.rotate((i % 2 ? -1 : 1) * .05 * i); fillRect(ctx, 0, 0, 196, 250, '#ffffff'); rect(ctx, 0, 0, 196, 250, {width: 2.6}); pen(ctx, [[18, 26], [120, 26]], {width: 4}); pageLines(ctx, 18, 50, 160, 9); ctx.restore(); } }],
  'notebook': [340, 250, ctx => { fillRect(ctx, 10, 20, 320, 216, '#FFFDF5'); rect(ctx, 10, 20, 320, 216, {width: 3}); for (let i = 0; i < 9; i++) circle(ctx, 32 + i * 34, 20, 7, {width: 2, jitter: .5}); for (let i = 0; i < 6; i++) pen(ctx, [[30, 60 + i * 30], [312, 60 + i * 30]], {width: 1.4, color: '#b9c0cc', jitter: .4}); }],
  'sticky-yellow': [120, 120, ctx => { ctx.save(); ctx.translate(60, 60); ctx.rotate(-.06); fillRect(ctx, -52, -52, 104, 104, '#FFE066'); rect(ctx, -52, -52, 104, 104, {width: 2.2}); ctx.restore(); }],
  'sticky-pink': [120, 120, ctx => { ctx.save(); ctx.translate(60, 60); ctx.rotate(.05); fillRect(ctx, -52, -52, 104, 104, '#FFB3C1'); rect(ctx, -52, -52, 104, 104, {width: 2.2}); ctx.restore(); }],
  'note-card': [260, 150, ctx => { fillRect(ctx, 6, 6, 248, 138, '#FFFDF5'); rect(ctx, 6, 6, 248, 138, {width: 2.6}); pen(ctx, [[6, 34], [254, 34]], {width: 1.6, color: '#c0392b'}); }],
  'pencil': [150, 150, ctx => { ctx.save(); ctx.translate(75, 75); ctx.rotate(-Math.PI / 4); fillRect(ctx, -60, -9, 100, 18, '#F2C14E'); rect(ctx, -60, -9, 100, 18, {width: 2.4}); pen(ctx, [[40, -9], [62, 0], [40, 9]], {width: 2.4, close: true}); blob(ctx, 60, 0, 4, 3); fillRect(ctx, -72, -9, 12, 18, '#E88A8A'); rect(ctx, -72, -9, 12, 18, {width: 2}); ctx.restore(); }],
  'highlighter': [150, 150, ctx => { ctx.save(); ctx.translate(75, 75); ctx.rotate(-Math.PI / 4); fillRect(ctx, -60, -12, 96, 24, '#FFE94D'); rect(ctx, -60, -12, 96, 24, {width: 2.4}); pen(ctx, [[36, -12], [58, -5], [58, 5], [36, 12]], {width: 2.4, close: true}); rect(ctx, -66, -12, 12, 24, {width: 2}); ctx.restore(); }],
  'questionnaire': [220, 290, ctx => { fillRect(ctx, 8, 8, 204, 274, '#ffffff'); rect(ctx, 8, 8, 204, 274, {width: 2.8}); pen(ctx, [[26, 34], [140, 34]], {width: 5}); for (let i = 0; i < 7; i++) { rect(ctx, 26, 60 + i * 30, 14, 14, {width: 2}); pen(ctx, [[50, 67 + i * 30], [190, 67 + i * 30]], {width: 1.8, color: '#8a8f98'}); if (i % 3 === 1) pen(ctx, [[28, 66 + i * 30], [33, 72 + i * 30], [40, 58 + i * 30]], {width: 2.4}); } }],
  'door': [220, 420, ctx => { pen(ctx, [[20, 410], [20, 20], [200, 20], [200, 410]], {width: 4}); rect(ctx, 36, 36, 148, 374, {width: 2.8}); blob(ctx, 164, 230, 6, 6); fillRect(ctx, 56, 70, 108, 42, '#ffffff'); rect(ctx, 56, 70, 108, 42, {width: 2.2}); }],
  'metronome-body': [160, 220, ctx => { fillRect(ctx, 30, 20, 100, 190, '#E6D3B3'); pen(ctx, [[30, 210], [130, 210], [108, 20], [52, 20]], {width: 3, close: true}); pen(ctx, [[80, 60], [80, 170]], {width: 1.6, color: '#8a8f98'}); for (let i = 0; i < 5; i++) pen(ctx, [[72, 70 + i * 24], [88, 70 + i * 24]], {width: 1.4, color: '#8a8f98'}); }],
  'metronome-arm': [14, 150, ctx => { pen(ctx, [[7, 4], [7, 146]], {width: 3}); fillRect(ctx, 1, 40, 12, 18, INK); }],
  'clock-note': [200, 120, ctx => { fillRect(ctx, 6, 6, 188, 108, '#FFFDF5'); rect(ctx, 6, 6, 188, 108, {width: 2.6}); circle(ctx, 40, 44, 20, {width: 2.4}); pen(ctx, [[40, 44], [40, 30]], {width: 2.4}); pen(ctx, [[40, 44], [50, 50]], {width: 2.4}); pageLines(ctx, 72, 36, 108, 3, 16); }],
  'bubble': [380, 150, ctx => { fillRect(ctx, 10, 10, 360, 100, '#ffffff'); const r = 18; const pts = []; const seg = (cx, cy, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }; seg(28, 28, Math.PI, 1.5 * Math.PI); seg(352, 28, 1.5 * Math.PI, 2 * Math.PI); seg(352, 92, 0, .5 * Math.PI); pts.push([80, 110], [54, 142], [52, 110]); seg(28, 92, .5 * Math.PI, Math.PI); ctx.fillStyle = '#fff'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill(); pen(ctx, pts, {width: 2.8, close: true}); }],
  'card': [560, 180, ctx => { fillRect(ctx, 8, 8, 544, 164, '#FFF8DC'); rect(ctx, 8, 8, 544, 164, {width: 3}); fillRect(ctx, 8, 8, 10, 164, '#EC4338'); }],
  'cursor': [14, 60, ctx => { fillRect(ctx, 4, 4, 6, 52, INK); }],
  'music-stand': [120, 300, ctx => { rect(ctx, 14, 10, 92, 70, {width: 2.6}); pen(ctx, [[60, 80], [60, 250]], {width: 3}); pen(ctx, [[24, 290], [60, 250], [96, 290]], {width: 2.6}); }],
};

for (const [name, [w, h, draw]] of Object.entries(props)) figurePng(name, w, h, draw);
for (const p of ['type', 'sigh', 'turn', 'write', 'aha', 'think', 'tidy', 'listen', 'nod']) figurePng('vidka-' + p, 420, 560, ctx => vidka(ctx, p));
for (const p of ['read', 'look']) figurePng('vidka-stand-' + p, 300, 560, ctx => vidkaStand(ctx, p));
for (const p of ['point', 'listen', 'talk', 'nod']) figurePng('herry-' + p, 300, 560, ctx => stand(ctx, {hair: 'short', glasses: true, pose: p}));
for (const p of ['point', 'listen', 'talk']) figurePng('ardipal-' + p, 300, 560, ctx => stand(ctx, {hair: 'curly', beard: true, pose: p}));
figurePng('player-a', 300, 560, ctx => player(ctx, {hair: 'short'}));
figurePng('player-b-play', 300, 560, ctx => player(ctx, {hair: 'tufts'}));
figurePng('player-b-turn', 300, 560, ctx => player(ctx, {hair: 'tufts', turn: true}));
console.log('wrote', fs.readdirSync(OUT).length, 'files to', OUT);
