'use strict';
// Stick-figure rig for «Sidang Kecil Sebelum Sidang» (Stick-figure Explainer style, Lemo-Opuscar).
// Technique learnt from the style's demo engine: one skeleton (hip, curved spine, two-bone arms, IK legs, head on the neck),
// every limb one quadratic curve with the joint as control point, damped springs per pose parameter, joined hands as one hose.
const W = 1920, H = 1080;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const C = { paper: '#F3F0EA', ink: '#24242C', mute: '#9C978C', tint: '#E2DDD2', sig: '#EB4A2A' };
const LW = 7, EN = 'Jost';

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

// ---- paper: one flat warm off-white with a very fine matte grain, drawn once ----
let paperC = null;
function paper() {
  if (!paperC) {
    paperC = document.createElement('canvas'); paperC.width = W; paperC.height = H;
    const x = paperC.getContext('2d'); x.fillStyle = C.paper; x.fillRect(0, 0, W, H);
    const id = x.getImageData(0, 0, W, H), d = id.data, r = mulberry(11);
    for (let i = 0; i < d.length; i += 4) { const n = (r() + r() - 1) * 3.2; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(id, 0, 0);
  }
  g.drawImage(paperC, 0, 0);
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

// ---- drawing: the even hose ----
const FIG = { w: 8, head: 7.5, k: .8 };
function ctrl(A, B, E, k) { const m = [(A[0] + E[0]) / 2, (A[1] + E[1]) / 2]; return [B[0] + (B[0] - m[0]) * k, B[1] + (B[1] - m[1]) * k]; }
const qpt = (A, Q, E, t) => { const s = 1 - t; return [s * s * A[0] + 2 * s * t * Q[0] + t * t * E[0], s * s * A[1] + 2 * s * t * Q[1] + t * t * E[1]]; };
function figure(f, p) {
  const S = f.S, j = joints(f, p), col = f.col || C.ink, fill = f.fill || C.paper;
  const sc = (f.lws ?? clamp(Math.sqrt(S / 380), .6, 1.05)) * (f.lwk ?? 1);
  const w = Math.max(3 * (f.lwk ?? 1), FIG.w * sc), hw = Math.max(3 * (f.lwk ?? 1), FIG.head * sc);
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w;
  g.beginPath();
  for (const [K, F] of [j.lL, j.lR]) { const Q = ctrl(j.Hp, K, F, FIG.k); g.moveTo(j.Hp[0], j.Hp[1]); g.quadraticCurveTo(Q[0], Q[1], F[0], F[1]); }
  g.moveTo(j.Hp[0], j.Hp[1]); g.quadraticCurveTo(j.Cc[0], j.Cc[1], j.N[0], j.N[1]);
  [j.aL, j.aR].forEach(([El, Hn], ai) => { if (ai === 0 && f.noL || ai === 1 && f.noR) return; const Q = ctrl(j.Sh, El, Hn, FIG.k); g.moveTo(j.Sh[0], j.Sh[1]); g.quadraticCurveTo(Q[0], Q[1], Hn[0], Hn[1]); });
  g.stroke();
  g.beginPath(); g.arc(j.Hd[0], j.Hd[1], GEO.headR * S, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
  g.lineWidth = hw; g.beginPath(); g.arc(j.Hd[0], j.Hd[1], GEO.headR * S, 0, Math.PI * 2); g.stroke();
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
function text(s, x, y, { size = 28, w = 500, col = C.ink, align = 'left', track = 0, a = 1, pass = false } = {}) {
  if (a <= 0 || !s) return;
  g.save(); g.globalAlpha = clamp(a); g.font = `${w} ${size}px ${EN}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic';
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
