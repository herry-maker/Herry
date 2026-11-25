'use strict';
// Rig for «Sidang Kecil Sebelum Sidang», revision 2: a notebook-and-grid-paper explainer look, built on the same
// procedural engine as revision 1 (Lemo-Opuscar's Stick-figure Explainer technique: one skeleton — hip, curved spine,
// two-bone arms, IK legs, head on the neck — every limb one quadratic curve, damped springs per pose parameter, joined
// hands as one hose). What changed in this revision, and why, is written out in TREATMENT.md §11. In short: the three
// named people (Vidka, Dr. Herry, Prof. Ardipal) now carry a face, hair and a clothed silhouette, drawn on a light grid
// page instead of plain paper; the chain of five chapters stays bare on purpose, so a reader never confuses a diagram
// of the thesis with a person. The skeleton, springs and joined-hands geometry below are unchanged from revision 1.
const W = 1920, H = 1080;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const C = {
  paper: '#F6F5F1', grid: '#C7CEDB', ink: '#262626', mute: '#8E8A82', tint: '#E4E1D8',
  sig: '#E0502A',    // red — a gap the reader should notice (unanswered question, a claim wider than its evidence)
  navy: '#2C3E66',   // navy — a structured option or category (a list of possible readings, a label)
  gold: '#D8A41E',   // gold/yellow — a highlighted phrase worth a second look
  leaf: '#3F8F5F',   // green — a repair confirmed, a connection now in place
};
const LW = 7, EN = 'Jost', HAND = 'Caveat', RND = "'Baloo 2'";

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a)), ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const bell = (t, a, b) => { const u = seg(t, a, b); return Math.sin(Math.PI * u) ** 2; };
const eo = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerpZ = (a, b, u) => Math.exp(lerp(Math.log(a), Math.log(b), u));
const L2D = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const V = { add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]], mul: (a, k) => [a[0] * k, a[1] * k],
  len: a => Math.hypot(a[0], a[1]), norm: a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; } };
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hex(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
function mix(a, b, t) { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t)))).join(',') + ')'; }

// ---- page: a soft grid-paper sheet (a page from a research notebook, not a flat studio backdrop) ----
const GRID = 112;
let paperC = null;
function paper() {
  if (!paperC) {
    paperC = document.createElement('canvas'); paperC.width = W; paperC.height = H;
    const x = paperC.getContext('2d'); x.fillStyle = C.paper; x.fillRect(0, 0, W, H);
    const id = x.getImageData(0, 0, W, H), d = id.data, r = mulberry(11);
    for (let i = 0; i < d.length; i += 4) { const n = (r() + r() - 1) * 2.0; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(id, 0, 0);
    x.strokeStyle = C.grid; x.lineWidth = 1.4; x.globalAlpha = .38;
    for (let gx = 0; gx <= W; gx += GRID) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
    for (let gy = 0; gy <= H; gy += GRID) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
  }
  g.drawImage(paperC, 0, 0);
}
// a short stroke that grows from a0 to a1 as f goes 0→1, with a hand's faint waver (the dynamic-drawing /
// progressive-reveal device: TREATMENT.md §11 cites Fiorella & Mayer and Schneider et al. 2023 for why a mark that
// draws itself, rather than appearing whole, is worth the extra code here).
function growStroke(x0, y0, x1, y1, f, col, lw, seed = 1) {
  f = clamp(f); if (f <= 0) return;
  const r = mulberry(seed * 97 + 3), n = 5, pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, bow = Math.sin(Math.PI * t) * (2.2 + 1.4 * r());
    pts.push([lerp(x0, x1, t), lerp(y0, y1, t) - bow * .35]);
  }
  const upto = f * (n);
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= n; i++) { const k = clamp(upto - (i - 1)); if (k <= 0) break; const p = i <= upto ? pts[i] : L2D(pts[i - 1], pts[i], k); g.lineTo(p[0], p[1]); if (k < 1) break; }
  g.stroke(); g.restore();
}

// ---- skeleton (figure height = 1; angle a has direction (sin a, cos a): 0 down, +π/2 right, ±π up) ----
const GEO = { thigh: .215, shin: .215, hipH: .42, spine: .285, sh: .065, upper: .18, fore: .155, headR: .112, stance: .09 };
function rest() { return { hx: 0, hy: 0, lean: 0, bend: 0, head: 0, la: -.56, lb: .24, ra: .56, rb: -.24, lfx: 0, lfy: 0, rfx: 0, rfy: 0, hdx: 0, hdy: 0 }; }
const KEYS = Object.keys(rest());
const dirv = a => [Math.sin(a), Math.cos(a)];
function ik(Hp, F, L1, L2, side) {
  let dx = F[0] - Hp[0], dy = F[1] - Hp[1], d = Math.hypot(dx, dy); const m = (L1 + L2) * .9995;
  if (d > m) { F = [Hp[0] + dx / d * m, Hp[1] + dy / d * m]; dx = F[0] - Hp[0]; dy = F[1] - Hp[1]; d = m; }
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const px = Hp[0] + a * dx / d, py = Hp[1] + a * dy / d; let nx = -dy / d, ny = dx / d;
  if (nx * side < 0) { nx = -nx; ny = -ny; }
  return [[px + nx * h, py + ny * h], F];
}
function joints(f, p) {
  const S = f.S, bx = f.x, gy = f.gy;
  const Hp = [bx + p.hx * S, gy - (GEO.hipH - p.hy) * S];
  const sd = dirv(Math.PI - p.lean);
  const N = [Hp[0] + sd[0] * GEO.spine * S, Hp[1] + sd[1] * GEO.spine * S];
  const mid = [(Hp[0] + N[0]) / 2, (Hp[1] + N[1]) / 2], perp = [-sd[1], sd[0]];
  const Cc = [mid[0] + perp[0] * p.bend * S, mid[1] + perp[1] * p.bend * S];
  const u = 1 - GEO.sh / GEO.spine;
  const Sh = [(1 - u) * (1 - u) * Hp[0] + 2 * (1 - u) * u * Cc[0] + u * u * N[0], (1 - u) * (1 - u) * Hp[1] + 2 * (1 - u) * u * Cc[1] + u * u * N[1]];
  const lag = clamp(p.hdx / GEO.headR * .9, -.35, .35);
  const hd = dirv(Math.PI - (p.lean + p.head + lag)), hr = GEO.headR * S;
  const Hd = [N[0] + hd[0] * hr, N[1] + hd[1] * hr];
  const arm = (a, b) => { const e = dirv(a), E = [Sh[0] + e[0] * GEO.upper * S, Sh[1] + e[1] * GEO.upper * S]; const w = dirv(a + b); return [E, [E[0] + w[0] * GEO.fore * S, E[1] + w[1] * GEO.fore * S]]; };
  const st = GEO.stance;
  const footL = [bx + (-st + p.lfx) * S, gy - p.lfy * S], footR = [bx + (st + p.rfx) * S, gy - p.rfy * S];
  return { Hp, N, Cc, Sh, Hd, aL: arm(p.la, p.lb), aR: arm(p.ra, p.rb), lL: ik(Hp, footL, GEO.thigh * S, GEO.shin * S, -1), lR: ik(Hp, footR, GEO.thigh * S, GEO.shin * S, 1) };
}
// shoulder of a figure in a given pose, without the bend (for reaching targets)
function shoulderOf(f, p) {
  const S = f.S, Hp = [f.x + p.hx * S, f.gy - (GEO.hipH - p.hy) * S], sd = dirv(Math.PI - p.lean);
  const u = 1 - GEO.sh / GEO.spine; return [Hp[0] + sd[0] * GEO.spine * S * u, Hp[1] + sd[1] * GEO.spine * S * u];
}
// set one arm of pose p so that its hand reaches world point P (two-bone IK, elbow bent down); side -1 left arm, +1 right arm
function armTo(f, p, side, P, reach = .97) {
  const S = f.S, Sh = shoulderOf(f, p), L1 = GEO.upper * S, L2 = GEO.fore * S;
  let dx = P[0] - Sh[0], dy = P[1] - Sh[1], d = Math.hypot(dx, dy) || 1e-6; const m = (L1 + L2) * reach;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; }
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  let nx = -dy / d, ny = dx / d; if (ny < 0) { nx = -nx; ny = -ny; }
  const E = [a * dx / d + nx * h, a * dy / d + ny * h], Hn = [dx, dy];
  const A = Math.atan2(E[0], E[1]); let B = Math.atan2(Hn[0] - E[0], Hn[1] - E[1]) - A;
  while (B > Math.PI) B -= 2 * Math.PI; while (B < -Math.PI) B += 2 * Math.PI;
  if (side < 0) { p.la = A; p.lb = B; } else { p.ra = A; p.rb = B; }
  return p;
}

// ---- drawing: the even hose, now in a shirt, with shoes and (for the three named people only) a face ----
const FIG = { w: 8, head: 7.5, k: .8 };
// a character's "look": torso tint, hair/face kind. The chain of five chapters passes none of this — on purpose
// (TREATMENT.md §11): a diagram of a thesis should never be mistaken for a person at a table.
const LOOK = {
  V: { tint: '#ECD2C8', kind: 'ponytail' },
  H: { tint: '#CBD6E3', kind: 'glasses' },
  A: { tint: '#D7DCC6', kind: 'curly' },
};
function ctrl(A, B, E, k) { const m = [(A[0] + E[0]) / 2, (A[1] + E[1]) / 2]; return [B[0] + (B[0] - m[0]) * k, B[1] + (B[1] - m[1]) * k]; }
const qpt = (A, Q, E, t) => { const s = 1 - t; return [s * s * A[0] + 2 * s * t * Q[0] + t * t * E[0], s * s * A[1] + 2 * s * t * Q[1] + t * t * E[1]]; };
// a thin filled "leaf" between two quadratic curves — used for the ponytail, cheap stand-in for a variable-width stroke
function leafShape(A, Q1, Q2, E) {
  g.beginPath(); g.moveTo(A[0], A[1]); g.quadraticCurveTo(Q1[0], Q1[1], E[0], E[1]); g.quadraticCurveTo(Q2[0], Q2[1], A[0], A[1]); g.closePath(); g.fill(); g.stroke();
}
// local→world for a point in the head's own frame (hr = head radius, ang = head's small tilt, Hd = head centre)
function headPt(Hd, ang, hr, lx, ly) { const c = Math.cos(ang), s = Math.sin(ang); return [Hd[0] + (c * lx - s * ly) * hr, Hd[1] + (s * lx + c * ly) * hr]; }
function hairFace(kind, j, S, p, col, fill) {
  const Hd = j.Hd, hr = GEO.headR * S, ang = (p.lean + p.head) * .8;
  const P = (lx, ly) => headPt(Hd, ang, hr, lx, ly);
  // eyes, brows, a mouth that flattens a little when the figure leans back or down (free: reuses the pose, no new state)
  const mood = clamp(-p.lean * 5, -1, 1), smile = lerp(.1, -.015, (mood + 1) / 2);
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const sx of [-1, 1]) {
    const e = P(sx * .33, -.03); g.lineWidth = Math.max(1.1, hr * .05);
    g.beginPath(); g.arc(e[0], e[1], Math.max(1.3, hr * .075), 0, Math.PI * 2); g.fill();
    const b0 = P(sx * .2, -.26), b1 = P(sx * .48, -.3 - .05 * sx * ang * 2);
    g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.stroke();
  }
  const m0 = P(-.26, .24), m1 = P(.26, .24), mc = P(0, .24 + smile);
  g.lineWidth = Math.max(1.3, hr * .06); g.beginPath(); g.moveTo(m0[0], m0[1]); g.quadraticCurveTo(mc[0], mc[1], m1[0], m1[1]); g.stroke();
  g.restore();
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(1.6, hr * .09);
  if (kind === 'ponytail') {
    const a0 = P(-.62, -.58), q1 = P(-1.32, -.5), q2 = P(-1.1, .15), e = P(-1.3, .55);
    leafShape(a0, q1, q2, e);
    for (const t of [.55, .8]) { const b = qpt(a0, q1, e, t), c = qpt(a0, q2, e, t); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo([c[0] + (c[0] - b[0]) * .4, c[1] + (c[1] - b[1]) * .4][0], c[1] + (c[1] - b[1]) * .4); g.stroke(); }
    const f0 = P(-.5, -.82), f1 = P(.46, -.84), fc = P(-.02, -1.02);
    g.beginPath(); g.moveTo(f0[0], f0[1]); g.quadraticCurveTo(fc[0], fc[1], f1[0], f1[1]); g.stroke();
  } else if (kind === 'glasses') {
    const r = hr * .3, eL = P(-.33, -.03), eR = P(.33, -.03);
    g.lineWidth = Math.max(1.6, hr * .07);
    g.beginPath(); g.arc(eL[0], eL[1], r, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(eR[0], eR[1], r, 0, Math.PI * 2); g.stroke();
    const bl = P(-.08, -.03), br = P(.08, -.03); g.beginPath(); g.moveTo(bl[0], bl[1]); g.lineTo(br[0], br[1]); g.stroke();
    const tl = P(-.62, -.08); g.beginPath(); g.moveTo(eL[0] - (eL[0] - eR[0]) * .03, eL[1]); g.lineTo(tl[0], tl[1]); g.stroke();
    const h0 = P(-.56, -.82), h1 = P(.56, -.84), hc = P(0, -.98);
    g.lineWidth = Math.max(1.3, hr * .05); g.beginPath(); g.moveTo(h0[0], h0[1]); g.quadraticCurveTo(hc[0], hc[1], h1[0], h1[1]); g.stroke();
  } else if (kind === 'curly') {
    const bumps = [[-.58, -.68], [-.3, -.92], [0, -1.0], [.3, -.92], [.58, -.68], [-.78, -.4], [.78, -.4]];
    for (const [bx, by] of bumps) { const c = P(bx, by); g.beginPath(); g.arc(c[0], c[1], hr * .22, 0, Math.PI * 2); g.stroke(); }
    const j0 = P(-.3, .52), j1 = P(.3, .52), jc = P(0, .66);
    g.beginPath(); g.moveTo(j0[0], j0[1]); g.quadraticCurveTo(jc[0], jc[1], j1[0], j1[1]); g.stroke();
  }
  g.restore();
}
function figure(f, p) {
  const S = f.S, j = joints(f, p), col = f.col || C.ink, fill = f.fill || C.paper, look = f.look && LOOK[f.look];
  const sc = (f.lws ?? clamp(Math.sqrt(S / 380), .6, 1.05)) * (f.lwk ?? 1);
  const w = Math.max(3 * (f.lwk ?? 1), FIG.w * sc), hw = Math.max(3 * (f.lwk ?? 1), FIG.head * sc);
  if (look) {   // the shirt: a plain straight-sided silhouette between hip and shoulder, behind the limb strokes.
    // (a curve toward the spine's own bend point pinches both sides in at once, like a corset — a quad stays honest in every pose.)
    const sd = V.norm(V.sub(j.N, j.Hp)), perp = [-sd[1], sd[0]], hipW = .105 * S, shW = .1 * S;
    const Hl = V.add(j.Hp, V.mul(perp, hipW)), Hr = V.sub(j.Hp, V.mul(perp, hipW));
    const Sl = V.add(j.Sh, V.mul(perp, shW)), Sr = V.sub(j.Sh, V.mul(perp, shW));
    g.save(); g.fillStyle = look.tint; g.strokeStyle = mix(look.tint, C.ink, .45); g.lineWidth = Math.max(1.2, w * .4); g.lineJoin = 'round';
    g.beginPath(); g.moveTo(Hl[0], Hl[1]); g.lineTo(Sl[0], Sl[1]); g.lineTo(Sr[0], Sr[1]); g.lineTo(Hr[0], Hr[1]); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w;
  g.beginPath();
  for (const [K, F] of [j.lL, j.lR]) { const Q = ctrl(j.Hp, K, F, FIG.k); g.moveTo(j.Hp[0], j.Hp[1]); g.quadraticCurveTo(Q[0], Q[1], F[0], F[1]); }
  g.moveTo(j.Hp[0], j.Hp[1]); g.quadraticCurveTo(j.Cc[0], j.Cc[1], j.N[0], j.N[1]);
  [j.aL, j.aR].forEach(([El, Hn], ai) => { if (ai === 0 && f.noL || ai === 1 && f.noR) return; const Q = ctrl(j.Sh, El, Hn, FIG.k); g.moveTo(j.Sh[0], j.Sh[1]); g.quadraticCurveTo(Q[0], Q[1], Hn[0], Hn[1]); });
  g.stroke();
  if (look) for (const [K, F] of [j.lL, j.lR]) {   // shoes: a small flattened ellipse past each ankle, along the shin
    const d = V.norm(V.sub(F, K)), ang = Math.atan2(d[1], d[0]), rx = .11 * S, ry = .052 * S;
    const c = V.add(F, V.mul(d, rx * .55));
    g.save(); g.translate(c[0], c[1]); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  g.beginPath(); g.arc(j.Hd[0], j.Hd[1], GEO.headR * S, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
  g.lineWidth = hw; g.beginPath(); g.arc(j.Hd[0], j.Hd[1], GEO.headR * S, 0, Math.PI * 2); g.stroke();
  if (look) hairFace(look.kind, j, S, p, col, fill);
  g.restore();
  return j;
}

// ---- springs: every pose parameter chases its target; forearms arrive late, the head loosest ----
const SPR = { hx: [20, .8], hy: [24, .62], lean: [13, .6], bend: [12, .55], head: [9, .42],
  la: [13, .58], ra: [13, .58], lb: [9.5, .46], rb: [9.5, .46], lfx: [30, .85], lfy: [30, .85], rfx: [30, .85], rfy: [30, .85] };
const HEADSPR = [16, .38];
function simulate(n, target, t0, t1) {
  const dt = 1 / 1200, every = 5, out = [];
  const st = []; for (let i = 0; i < n; i++) { const p = target(i, t0), v = {}; for (const k in p) v[k] = 0; st.push({ p: { ...p }, v, hp: null, hv: [0, 0] }); }
  const rigidHead = p => { const hy = GEO.hipH - p.hy, s = GEO.spine, r = GEO.headR; return [p.hx + Math.sin(p.lean) * s + Math.sin(p.lean + p.head) * r, hy + Math.cos(p.lean) * s + Math.cos(p.lean + p.head) * r]; };
  let step = 0;
  for (let t = t0; t <= t1 + 1e-9; t += dt, step++) {
    if (step % every === 0) out.push(st.map(s => ({ ...s.p })));
    for (let i = 0; i < n; i++) {
      const s = st[i], tg = target(i, t);
      for (const k in SPR) { const [w, z] = SPR[k]; const a = w * w * (tg[k] - s.p[k]) - 2 * z * w * s.v[k]; s.v[k] += a * dt; s.p[k] += s.v[k] * dt; }
      const R = rigidHead(s.p); if (!s.hp) s.hp = [...R];
      const [w, z] = HEADSPR;
      for (let q = 0; q < 2; q++) { const a = w * w * (R[q] - s.hp[q]) - 2 * z * w * s.hv[q]; s.hv[q] += a * dt; s.hp[q] += s.hv[q] * dt; }
      s.p.hdx = clamp(s.hp[0] - R[0], -.03, .03); s.p.hdy = clamp(s.hp[1] - R[1], -.03, .03);
    }
  }
  return { t0, rate: 240, frames: out, at(t) { const f = (t - this.t0) * this.rate, i = clamp(Math.floor(f), 0, this.frames.length - 2), u = clamp(f - i);
    const A = this.frames[i], B = this.frames[i + 1]; return A.map((p, k) => { const q = {}; for (const key of KEYS) q[key] = lerp(p[key], B[k][key], u); return q; }); } };
}
function popS(tau, w = 17, z = .45) { if (tau <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + z * w / wd * Math.sin(wd * tau)); }
function idle(seed, t) {
  const p = rest(), ph = seed * 1.93 + .4;
  p.hx += .004 * Math.sin(t * 1.25 + ph); p.lean += .012 * Math.sin(t * 1.05 + ph * 1.3);
  p.hy += .004 * (.5 + .5 * Math.sin(t * 2.1 + ph)); p.la -= .03 * Math.sin(t * 1.5 + ph); p.ra += .03 * Math.sin(t * 1.5 + ph + .7);
  p.head += .05 * Math.sin(t * .7 + ph * 2.1);
  return p;
}

// ---- joined hands: both hands travel to one clasp point; once joined the two control points line up through it → one hose ----
function elbowD(Sh, Hn, L1, L2, down) {
  let dx = Hn[0] - Sh[0], dy = Hn[1] - Sh[1], d = Math.hypot(dx, dy) || 1e-6;
  if (d >= L1 + L2) return [Sh[0] + dx * L1 / (L1 + L2), Sh[1] + dy * L1 / (L1 + L2)];
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  let nx = -dy / d, ny = dx / d; if (nx * down[0] + ny * down[1] < 0) { nx = -nx; ny = -ny; }
  return [Sh[0] + a * dx / d + nx * h, Sh[1] + a * dy / d + ny * h];
}
// a person in the world: {x, y (feet), rot, S, appear, pose(T), col(T), fill(T), lws?}
function wJ(e, T) {
  const sc = popS(T - e.appear); if (sc <= .01) return null;
  const S = e.S * sc, p = e.pose(T), j = joints({ x: 0, gy: 0, S }, p);
  const c = Math.cos(e.rot || 0), s = Math.sin(e.rot || 0), M = q => [e.x + c * q[0] - s * q[1], e.y + s * q[0] + c * q[1]];
  return { S, sc, p, Sh: M(j.Sh), aL: [M(j.aL[0]), M(j.aL[1])], aR: [M(j.aR[0]), M(j.aR[1])], head: M(j.Hd), down: [-s, c] };
}
// link {a, b, c: clasp time, rel?: release time, sag(T), over: [{t0,t1,f0,f1}]}
function linkGeoW(L, T, A, B) {
  const c = L.c;
  let r = seg(T, c - .3, c); r = r < .3 ? -.10 * Math.sin(Math.PI * r / .3) : ss((r - .3) / .7);
  if (L.rel != null) r = Math.min(r, 1 - ss(seg(T, L.rel, L.rel + .32)));
  const joined = T >= c && (L.rel == null || T < L.rel);
  const down = V.norm(V.add(A.down, B.down)), S = (A.S + B.S) / 2;
  const tc = T - c, bounce = tc > 0 && joined ? .045 * Math.exp(-tc * 6) * Math.sin(tc * 21) : 0;
  const mid = V.mul(V.add(A.Sh, B.Sh), .5), Pc = V.add(mid, V.mul(down, ((L.sag ? L.sag(T) : .17) + bounce) * S));
  const hi = L2D(A.aR[1], Pc, r), hj = L2D(B.aL[1], Pc, r);
  const Ei = elbowD(A.Sh, hi, GEO.upper * A.S, GEO.fore * A.S, down), Ej = elbowD(B.Sh, hj, GEO.upper * B.S, GEO.fore * B.S, down);
  let Qi = ctrl(A.Sh, Ei, hi, FIG.k), Qj = ctrl(B.Sh, Ej, hj, FIG.k);
  const jw = joined ? ss(seg(T, c, c + .14)) : 0;
  if (jw > 0) {
    const d = V.norm(V.sub(Qj, Qi)), li = V.len(V.sub(Pc, Qi)), lj = V.len(V.sub(Qj, Pc));
    Qi = L2D(Qi, V.sub(Pc, V.mul(d, li)), jw); Qj = L2D(Qj, V.add(Pc, V.mul(d, lj)), jw);
  }
  return { Si: A.Sh, Qi, hi, Sj: B.Sh, Qj, hj, Pc, joined };
}
const engaged = (L, T) => T >= L.c - .3 && (L.rel == null || T < L.rel + .32);
function lwOf(e, J) { return Math.max(1.2, FIG.w * (e.lws ?? clamp(Math.sqrt(J.S / 380), .6, 1.05)) * clamp(J.sc * 1.6)); }
function quadPts(A, Q, E, n = 16) { const o = []; for (let i = 0; i <= n; i++) o.push(qpt(A, Q, E, i / n)); return o; }
function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; }
function strokePoly(P, upto) {
  g.beginPath(); g.moveTo(P[0][0], P[0][1]); let L = 0;
  for (let i = 1; i < P.length; i++) { const s = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    if (L + s >= upto) { const u = (upto - L) / s; g.lineTo(lerp(P[i - 1][0], P[i][0], u), lerp(P[i - 1][1], P[i][1], u)); break; }
    g.lineTo(P[i][0], P[i][1]); L += s; }
  g.stroke();
}
function pathOf(G) { return quadPts(G.Si, G.Qi, G.hi).concat(quadPts(G.hj, G.Qj, G.Sj).slice(1)); }
// links first (behind), accent runs on top, then the people without the arms that hold hands
function drawGroup(P, Ls, T) {
  const J = P.map(e => wJ(e, T)), G = [];
  g.save();
  for (const L of Ls) {
    const A = J[L.a], B = J[L.b]; if (!A || !B || !engaged(L, T)) continue;
    const geo = linkGeoW(L, T, A, B); G.push([L, geo]);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = P[L.a].col(T); g.lineWidth = lwOf(P[L.a], A);
    g.beginPath(); g.moveTo(geo.Si[0], geo.Si[1]); g.quadraticCurveTo(geo.Qi[0], geo.Qi[1], geo.hi[0], geo.hi[1]); g.stroke();
    g.strokeStyle = P[L.b].col(T); g.lineWidth = lwOf(P[L.b], B);
    g.beginPath(); g.moveTo(geo.hj[0], geo.hj[1]); g.quadraticCurveTo(geo.Qj[0], geo.Qj[1], geo.Sj[0], geo.Sj[1]); g.stroke();
  }
  for (const [L, geo] of G) {
    if (!geo.joined || !L.over) continue;
    const pts = pathOf(geo), len = polyLen(pts);
    for (const ov of L.over) {
      const f = seg(T, ov.t0, ov.t1); if (f <= 0) continue;
      const vis = 1 - seg(T, ov.f0 ?? 1e9, ov.f1 ?? 1e9 + 1); if (vis <= 0) continue;
      g.strokeStyle = mix(C.ink, C.sig, vis); g.lineWidth = lwOf(P[L.a], J[L.a]) + .6;
      strokePoly(pts, f * len);
    }
  }
  P.forEach((e, i) => {
    const j = J[i]; if (!j) return;
    let noL = false, noR = false;
    for (const L of Ls) { if (!engaged(L, T) || !J[L.a] || !J[L.b]) continue; if (L.a === i) noR = true; if (L.b === i) noL = true; }
    g.save(); g.translate(e.x, e.y); g.rotate(e.rot || 0);
    figure({ x: 0, gy: 0, S: j.S, col: e.col(T), fill: e.fill(T), lwk: clamp(j.sc * 1.6), lws: e.lws, noL, noR }, j.p);
    g.restore();
  });
  g.restore();
  return { J, G };
}

// ---- type ----
let TXT = null;   // for window.TEXTS: every text drawn this frame, in screen pixels
let SCR = null;   // current world→screen transform for text boxes drawn in world space: {x,y,z}
function text(s, x, y, { size = 28, w = 500, col = C.ink, align = 'left', track = 0, a = 1, pass = false, font = EN } = {}) {
  if (a <= 0 || !s) return;
  g.save(); g.globalAlpha = clamp(a); g.font = `${w} ${size}px ${font}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.letterSpacing = track + 'px'; g.fillText(s, x, y);
  if (TXT) {
    const m = g.measureText(s), x0 = align === 'left' ? x : align === 'right' ? x - m.width : x - m.width / 2;
    let box = { x0, y0: y - size * .8, x1: x0 + m.width, y1: y + size * .25 };
    if (SCR) { const t = SCR, M = (px, py) => [W / 2 + (px - t.x) * t.z, H / 2 + (py - t.y) * t.z]; const p0 = M(box.x0, box.y0), p1 = M(box.x1, box.y1); box = { x0: p0[0], y0: p0[1], x1: p1[0], y1: p1[1] }; }
    TXT.push({ id: s, text: s, ...box, pass });
  }
  g.restore();
}
let T_NOW = 0;
// text that slides up into place and leaves by fading
function hud(s, x, y, o, tin, tout = 1e9, dy = 16) {
  const a = eo(seg(T_NOW, tin, tin + .38)) * (1 - seg(T_NOW, tout, tout + .3));
  if (a <= 0) return;
  text(s, x, y + dy * (1 - eo(seg(T_NOW, tin, tin + .45))), { ...o, a });
}

// ---- small reusable props added in revision 2 (TREATMENT.md §11): a sticky note, a self-check list, a metronome ----
function sticky(x, y, w, h, rot, fill, label, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot);
  g.fillStyle = fill; g.strokeStyle = mix(fill, C.ink, .55); g.lineWidth = 2.4; g.lineJoin = 'round';
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 6); g.fill(); g.stroke();
  if (label) { g.font = `600 ${Math.round(h * .3)}px ${HAND}`; g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, h * .06); }
  g.restore();
}
// a short self-check list: items = [text,...]; checked = how many (can be fractional while one tick is drawing in)
function checklist(x, y, items, checked, a = 1) {
  if (a <= 0) return;
  const row = 46, box = 22;
  g.save(); g.globalAlpha = a;
  items.forEach((s, i) => {
    const y0 = y + i * row, k = clamp(checked - i);
    g.strokeStyle = k > 0 ? C.leaf : C.mute; g.lineWidth = 2.6; g.lineJoin = 'round';
    g.beginPath(); g.roundRect(x, y0 - box / 2, box, box, 4); g.stroke();
    if (k > 0) {
      const p0 = [x + box * .2, y0], p1 = [x + box * .42, y0 + box * .26], p2 = [x + box * .82, y0 - box * .28];
      const f = clamp(k * 2); g.strokeStyle = C.leaf; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(p0[0], p0[1]);
      if (f <= 1) g.lineTo(L2D(p0, p1, f)[0], L2D(p0, p1, f)[1]); else { g.lineTo(p1[0], p1[1]); g.lineTo(L2D(p1, p2, f - 1)[0], L2D(p1, p2, f - 1)[1]); }
      g.stroke();
    }
    text(s, x + box + 16, y0 + 7, { size: 25, w: 500, col: k > 0 ? C.ink : C.mute, font: RND });
  });
  g.restore();
}
// a small metronome, ticking at `bpm` (one tick per beat: the arm crosses centre once every 60/bpm seconds, the
// convention a real metronome keeps — the mix's own foley ticks are placed on the same zero-crossings, metronomeTick(t,bpm)
// below). t is absolute seconds so the swing stays continuous across the cut.
function metronome(x, y, s, t, bpm = 72, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate(x, y);
  g.strokeStyle = C.ink; g.fillStyle = C.paper; g.lineWidth = 2.6; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-.32 * s, 0); g.lineTo(.32 * s, 0); g.lineTo(.14 * s, -.92 * s); g.lineTo(-.14 * s, -.92 * s); g.closePath(); g.fill(); g.stroke();
  const ang = Math.sin(2 * Math.PI * (bpm / 120) * t) * .34;
  g.save(); g.rotate(ang); g.strokeStyle = C.sig; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, -.04 * s); g.lineTo(0, -.86 * s); g.stroke();
  g.beginPath(); g.arc(0, -.86 * s, s * .05, 0, Math.PI * 2); g.fillStyle = C.sig; g.fill(); g.restore();
  g.beginPath(); g.arc(0, 0, s * .045, 0, Math.PI * 2); g.fillStyle = C.ink; g.fill();
  g.restore();
}
// the metronome's own tick times, so mix.py's foley lands exactly on the arm's zero-crossings
function metronomeTicks(t0, t1, bpm = 72) {
  const T = 60 / bpm, out = []; let k = Math.ceil(t0 / T);
  for (let t = k * T; t <= t1; t += T) out.push(t);
  return out;
}
