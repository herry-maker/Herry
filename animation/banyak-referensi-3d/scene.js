// BANYAK REFERENSI, MANA YANG TEPAT? -- 3D edition.
// Same score.js timeline, same ElevenLabs dialogue and music as the 2D film; only the visual layer
// is new: real perspective, lighting and shadows in Three.js, with simple rigged characters (a torso,
// a head on a neck pivot, a hinged jaw driven by the measured speech loudness, and two-segment arms).
import * as THREE from './node_modules/three/build/three.module.js';

const S = window.SCORE;
const gl = document.getElementById('gl');
const hud = document.getElementById('hud');
const hctx = hud.getContext('2d');
let VO = null;

// ---------- renderer / scene / lights ----------
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(1920, 1080, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#EFE7D8');
scene.fog = new THREE.Fog('#EFE7D8', 9, 16);

const camera = new THREE.PerspectiveCamera(32, 1920 / 1080, 0.1, 100);

scene.add(new THREE.HemisphereLight('#FFF6D8', '#6E4B33', 0.65));
const key = new THREE.DirectionalLight('#FFF6D8', 1.5);
key.position.set(2.4, 4.6, 3.6);
key.castShadow = true;
key.shadow.mapSize.set(1536, 1536);
key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
key.shadow.bias = -0.0015;
scene.add(key);
const fill = new THREE.DirectionalLight('#BFE0EE', 0.4);
fill.position.set(-3, 2.5, -2);
scene.add(fill);

// ---------- helpers ----------
function hashRng(seed) { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function makeCanvasTexture(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { canvas: c, ctx, tex };
}
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur);
  return lines;
}
// a card: a plane with a canvas texture, redrawn only when its content key changes (perf)
function makeCard(w, h, worldW, worldH) {
  const { canvas, ctx, tex } = makeCanvasTexture(w, h);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH), mat);
  mesh.visible = false;
  let lastKey = null;
  return {
    mesh, ctx, canvas,
    draw(key, fn) { if (key === lastKey) return; lastKey = key; ctx.clearRect(0, 0, canvas.width, canvas.height); fn(ctx, canvas.width, canvas.height); tex.needsUpdate = true; },
  };
}

// procedural fabric patterns (no external images): a plaid weave for the hijab, a flecked speckle for the blouse
function makePatternTexture(size, drawFn) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function plaidTexture(base, line) {
  return makePatternTexture(128, (ctx, n) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, n, n);
    ctx.strokeStyle = line; ctx.globalAlpha = 0.55; ctx.lineWidth = 3;
    for (let i = -n; i < n * 2; i += 22) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + n, n); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i, n); ctx.lineTo(i + n, 0); ctx.stroke(); }
  });
}
function speckleTexture(base, speck) {
  return makePatternTexture(96, (ctx, n) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, n, n);
    ctx.fillStyle = speck;
    const rng = hashRng(7);
    for (let i = 0; i < 140; i++) { const x = rng() * n, y = rng() * n, r = 0.6 + rng() * 1.1; ctx.globalAlpha = 0.6 + rng() * 0.4; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  });
}

// ---------- room ----------
const room = new THREE.Group(); scene.add(room);
const mat = (color, rough = 0.85, metal = 0.0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), mat('#C9B79C'));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; room.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), mat('#EFE7D8', 1));
wall.position.set(0, 3, -2.6); wall.receiveShadow = true; room.add(wall);

function bookshelf(x) {
  const g = new THREE.Group(); g.position.set(x, 0, -2.4);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 0.4), mat('#6E4B33'));
  frame.position.y = 1.5; frame.castShadow = true; frame.receiveShadow = true; g.add(frame);
  const colors = ['#8E2F3A', '#2E6B5C', '#2F5D8A', '#D9A441', '#5B4A7A', '#3E7D6F'];
  const rng = hashRng(x * 977 + 1);
  for (let shelf = 0; shelf < 4; shelf++) {
    let bx = -0.85;
    while (bx < 0.85) {
      const bw = 0.08 + rng() * 0.09, bh = 0.5 + rng() * 0.15;
      if (bx + bw > 0.88) break;
      const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.3), mat(colors[Math.floor(rng() * colors.length)], 0.9));
      book.position.set(bx + bw / 2, 0.45 + shelf * 0.68, 0.22);
      book.castShadow = true; g.add(book);
      bx += bw + 0.015;
    }
  }
  room.add(g);
}
bookshelf(-4.2); bookshelf(4.2);

// the window
{
  const win = new THREE.Group(); win.position.set(0, 2.1, -2.58);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ color: '#BFE0EE' }));
  win.add(glow);
  const frameMat = mat('#2A2320', 1);
  const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameMat); m.position.set(x, y, 0.02); m.castShadow = true; win.add(m); };
  bar(2.1, 0.08, 0, 1.0); bar(2.1, 0.08, 0, -1.0); bar(0.08, 2.1, -1.0, 0); bar(0.08, 2.1, 1.0, 0); bar(0.08, 2.0, 0, 0);
  room.add(win);
}

// the table (a long study table the three stand behind)
const table = new THREE.Group(); table.position.set(0, 0, 0.9); room.add(table);
{
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.12, 1.1), mat('#8E6444'));
  top.position.y = 0.88; top.castShadow = true; top.receiveShadow = true; table.add(top);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.78, 0.08), mat('#6E4B33'));
  panel.position.set(0, 0.46, 0.5); panel.receiveShadow = true; table.add(panel);
}

// the laptop (screen content updates via a canvas texture)
const laptop = new THREE.Group(); laptop.position.set(0, 0.94, 0.55); room.add(laptop);
const laptopScreenCard = (() => {
  const { canvas, ctx, tex } = makeCanvasTexture(640, 360);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.42), mat('#D8D2C2', 0.4, 0.3));
  laptop.add(base);
  const screenGroup = new THREE.Group(); screenGroup.position.set(0, 0.01, -0.19); laptop.add(screenGroup);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.38, 0.02), mat('#2A2A32', 0.6, 0.2));
  bezel.rotation.x = -0.28; bezel.position.set(0, 0.19, -0.02); bezel.castShadow = true; screenGroup.add(bezel);
  const screenMat = new THREE.MeshBasicMaterial({ map: tex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.30), screenMat);
  screen.rotation.x = -0.28; screen.position.set(0, 0.19, -0.009); screenGroup.add(screen);
  let lastKey = null;
  return { draw(key, fn) { if (key === lastKey) return; lastKey = key; ctx.clearRect(0, 0, 640, 360); fn(ctx); tex.needsUpdate = true; } };
})();

// the notebook (closed, resting beside Vidka -- the throughline prop)
const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.2), mat('#D9A441', 0.6));
notebook.position.set(1.0, 0.90, 0.5); notebook.rotation.y = -0.12; notebook.castShadow = true; room.add(notebook);
const notebookOpenMat = mat('#FBFAF6', 0.9);

// ---------- figures ----------
function buildFigure(spec) {
  const root = new THREE.Group();
  const skin = mat(spec.skin, 0.75);
  const torsoMat = spec.shirtPattern ? new THREE.MeshStandardMaterial({ map: speckleTexture(spec.shirt, spec.shirtSpeck || '#F0D9D6'), roughness: 0.85 }) : mat(spec.shirt, 0.8);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 4, 10), torsoMat);
  torso.position.y = 0.89; torso.castShadow = true; root.add(torso); // top ~= 1.32, well below the neck at 1.48

  const neck = new THREE.Group(); neck.position.set(0, 1.48, 0); root.add(neck);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 16), skin);
  skull.castShadow = true; neck.add(skull);
  if (spec.hair === 'hijab') {
    // a cap over the top/sides (like the other hairstyles) plus a shawl draped down the BACK only,
    // so the face (eyes, glasses, mouth) stays visible to camera -- the open side faces forward (+z)
    const hijabMat = spec.hijabPattern ? new THREE.MeshStandardMaterial({ map: plaidTexture(spec.hairColor, spec.hijabLine || '#6E2A2A'), roughness: 0.95 }) : mat(spec.hairColor, 0.95);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.205, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.85), hijabMat);
    cap.position.y = 0.02; cap.castShadow = true; neck.add(cap);
    const shawl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 0.5, 16, 1, true, Math.PI * 0.15, Math.PI * 1.7), hijabMat);
    shawl.position.set(0, -0.2, -0.02); shawl.rotation.y = Math.PI; shawl.castShadow = true; neck.add(shawl);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.9), mat(spec.hairColor, 0.9));
    hair.position.y = 0.025; hair.castShadow = true; neck.add(hair);
    if (spec.hair === 'quiff') {
      const tuftSpec = [[0, 0.21, 0.04, -0.4, 0, 0.1], [-0.08, 0.2, 0, -0.1, -0.5, 0.075], [0.08, 0.2, -0.02, -0.15, 0.5, 0.075], [-0.03, 0.195, 0.1, -0.7, -0.15, 0.065]];
      for (const [x, y, z, rx, rz, s] of tuftSpec) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.7, 7), mat(spec.hairColor, 0.9));
        tuft.position.set(x, y, z); tuft.rotation.set(rx, 0, rz); tuft.castShadow = true; neck.add(tuft);
      }
    }
  }
  // eyes: a white sclera + a dark pupil (a flat dark dot alone reads as the back of a head, not a face)
  const scleraMat = mat('#F5F0E8', 0.5, 0);
  const pupilMat = mat('#1A1410', 0.25, 0.1);
  for (const sx of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), scleraMat);
    sclera.scale.set(1, 0.85, 0.6); sclera.position.set(sx * 0.072, 0.025, 0.176); neck.add(sclera);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 10, 8), pupilMat);
    pupil.position.set(sx * 0.072, 0.023, 0.192); neck.add(pupil);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.013, 0.013), mat(spec.hairColor === '#C9C9C9' ? '#9A9A9A' : spec.hairColor, 0.9));
    brow.position.set(sx * 0.072, 0.062, 0.182); brow.rotation.z = sx * -0.12; neck.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.04, 8), skin); nose.position.set(0, -0.01, 0.185); nose.rotation.x = Math.PI / 2 + 0.25; neck.add(nose);
  if (spec.glasses) {
    const frameMat = mat('#201C18', 0.35, 0.5);
    const lensMat = new THREE.MeshStandardMaterial({ color: '#2A3A44', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.32 });
    for (const sx of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.014, 10, 18), frameMat);
      ring.position.set(sx * 0.072, 0.025, 0.188); neck.add(ring);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.058, 18), lensMat);
      lens.position.set(sx * 0.072, 0.025, 0.189); neck.add(lens);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.01), frameMat);
      arm.position.set(sx * 0.15, 0.025, 0.14); arm.rotation.y = sx * 0.9; neck.add(arm);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.012, 0.012), frameMat); bridge.position.set(0, 0.025, 0.19); neck.add(bridge);
  }
  // the mouth: a fixed upper lip line (always visible) above the hinged jaw, with a dark cavity
  // behind it so the mouth reads as an opening, not just a block of skin, when it talks
  const mouthLine = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.009, 0.012), mat('#5A3A2E', 0.6));
  mouthLine.position.set(0, -0.05, 0.188); neck.add(mouthLine);
  const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.05, 0.02), mat('#3A1C18', 0.8));
  cavity.position.set(0, -0.065, 0.178); neck.add(cavity);
  if (spec.facial === 'mustache') {
    const mstMat = mat('#15110D', 0.85);
    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), mstMat);
      wing.scale.set(1.5, 0.55, 0.6); wing.position.set(sx * 0.038, -0.047, 0.192); wing.rotation.z = sx * 0.35; wing.castShadow = true; neck.add(wing);
    }
    const bridgeM = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), mstMat);
    bridgeM.scale.set(1.3, 0.6, 0.6); bridgeM.position.set(0, -0.045, 0.194); neck.add(bridgeM);
  }
  if (spec.facial === 'goatee') {
    const beardMat = mat('#D8D8D8', 0.95);
    const mstMat = mat('#C9C9C9', 0.9);
    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mstMat);
      wing.scale.set(1.4, 0.5, 0.55); wing.position.set(sx * 0.034, -0.047, 0.19); wing.rotation.z = sx * 0.3; wing.castShadow = true; neck.add(wing);
    }
    // a smooth, dense beard: small overlapping spheres sampled along a jaw curve (ear -> chin -> ear)
    const bez = (p0, p1, p2, t) => p0.map((v, i) => (1 - t) * (1 - t) * v + 2 * (1 - t) * t * p1[i] + t * t * p2[i]);
    const earL = [-0.155, -0.03, 0.05], chin = [0, -0.195, 0.182], earR = [0.155, -0.03, 0.05];
    const ctrlL = [-0.1, -0.14, 0.15], ctrlR = [0.1, -0.14, 0.15];
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const pt = t < 0.5 ? bez(earL, ctrlL, chin, t * 2) : bez(chin, ctrlR, earR, (t - 0.5) * 2);
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.024 + 0.003 * Math.sin(t * Math.PI), 8, 6), beardMat);
      seg.position.set(pt[0], pt[1] - 0.01, pt[2]); seg.castShadow = true; neck.add(seg);
    }
  }
  const jaw = new THREE.Group(); jaw.position.set(0, -0.075, 0.1); neck.add(jaw);
  const jawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), skin);
  jawMesh.rotation.x = Math.PI; jawMesh.position.set(0, -0.005, 0.03); jaw.add(jawMesh);

  function buildArm(side) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * 0.3, 1.32, 0); root.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 8), skin);
    upper.position.y = -0.15; upper.castShadow = true; shoulder.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.3; shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.24, 4, 8), skin);
    fore.position.y = -0.13; fore.castShadow = true; elbow.add(fore);
    return { shoulder, elbow };
  }
  const armL = buildArm(-1), armR = buildArm(1);
  for (const legX of [-0.12, 0.12]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 10), mat(spec.pants || '#3A3A44')); leg.position.set(legX, 0.38, 0); leg.castShadow = true; root.add(leg); }

  scene.add(root);
  return { root, neck, jaw, armL, armR, baseHeadY: neck.position.y };
}

const CAST = {
  // h = Dr. Herry (the older, grey-haired, bearded look from the reference photo)
  h: buildFigure({ skin: '#D7B48C', hairColor: '#C9C9C9', hair: 'short', shirt: '#AFCBE0', pants: '#4A505C', glasses: true, facial: 'goatee' }),
  // a = Prof. Ardipal (the younger, dark-haired, moustached look from the reference photo)
  a: buildFigure({ skin: '#C68B61', hairColor: '#17140F', hair: 'quiff', shirt: '#1C1C1C', pants: '#2B2B33', glasses: true, facial: 'mustache' }),
  v: buildFigure({ skin: '#C98A62', hairColor: '#2E2B30', hair: 'hijab', hijabPattern: true, hijabLine: '#8A3A3A', shirt: '#C23B35', shirtPattern: true, shirtSpeck: '#F3DEDB', pants: '#8A3A3A' }),
};
CAST.h.root.position.set(-1.9, 0, 0.1);
CAST.v.root.position.set(0, 0, 0.1);
CAST.a.root.position.set(1.9, 0, 0.1);
CAST.h.root.rotation.y = 0.18; CAST.a.root.rotation.y = -0.18;
// resting arm pose: forearms toward the table
for (const [who, fig] of Object.entries(CAST)) {
  const side = who === 'h' ? -1 : who === 'a' ? 1 : 0;
  fig.armL.shoulder.rotation.x = -1.3; fig.armL.elbow.rotation.x = 0.6;
  fig.armR.shoulder.rotation.x = -1.3; fig.armR.elbow.rotation.x = 0.6;
}

// ---------- overlay cards (one "floating card" + one task banner, content per scene) ----------
const card = makeCard(900, 460, 2.6, 1.33); card.mesh.position.set(0, 2.55, -1.1); scene.add(card.mesh);
const taskCard = makeCard(1100, 170, 3.1, 0.48); taskCard.mesh.position.set(0, 0.35, 1.75); taskCard.mesh.rotation.x = -0.35; scene.add(taskCard.mesh);

function cardBg(ctx, w, h, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(4, 4, w - 8, h - 8, 18); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; ctx.stroke(); }
function drawTitleBody(ctx, w, h, title, lines, opts = {}) {
  cardBg(ctx, w, h, opts.bg || '#FBFAF6');
  ctx.fillStyle = opts.titleColor || '#1E2235'; ctx.font = '700 40px Georgia, serif'; ctx.textBaseline = 'top';
  ctx.fillText(title, 36, 30);
  ctx.font = '400 32px Georgia, serif'; ctx.fillStyle = opts.color || '#2A2320';
  let y = 100;
  for (const raw of lines) { for (const ln of wrapText(ctx, raw, w - 72)) { ctx.fillText(ln, 36, y); y += 42; } y += 8; }
}
function drawTask(ctx, w, h, text) {
  cardBg(ctx, w, h, 'rgba(42,35,20,0.92)');
  ctx.fillStyle = '#F2D08A'; ctx.font = '700 36px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [i, ln] of wrapText(ctx, text, w - 90).entries()) ctx.fillText(ln, w / 2, h / 2 + (i - 0.5) * 42);
  ctx.textAlign = 'left';
}

// per-scene floating-card content (kept close to the fuller 2D storyboard, simplified into cards)
const SCENE_CARD = {
  1: { title: 'Catatan kelompok', lines: ['"menjaga tempo bersama"'] },
  3: { title: 'Dua bacaan', lines: ['SERING DIKUTIP -- musisi profesional', 'KONTEKS KELAS -- siswa pemula'] },
  4: { title: 'Judul Artikel yang Cocok', lines: ['Penulis / Tempat terbit / Peserta', 'Metode & Temuan -- diperiksa dulu'] },
  5: { title: 'Dua bacaan + contoh ilustratif', lines: ['mendengar teman', 'melihat isyarat', '(contoh bacaan ilustratif)'] },
  6: { title: 'Pernyataan masalah', lines: ['"Siswa kami kurang kompak." -->', 'Tempo meningkat, siswa tertinggal,', 'latihan berulang kali berhenti.'] },
  7: { title: 'Menggabungkan catatan', lines: ['kejadian + dampak + belum dipahami', '-> Bagaimana mereka mengikuti tempo teman?'] },
  8: { title: 'Pertanyaan penelitian', lines: ['Bagaimana siswa pemula menggunakan', 'isyarat bunyi dan gerak untuk menjaga', 'tempo saat latihan ansambel?'] },
  9: { title: 'Kuesioner atau observasi?', lines: ['Memahami tindakan -> lihat prosesnya langsung'] },
  10: { title: 'Rencana penelitian', lines: ['kelompok -> observasi (mata)', '-> wawancara ("...?")'] },
  11: { title: 'Pertanyaan berbeda, rancangan berbeda', lines: ['"...lebih efektif?" (dibandingkan, diukur)', 'vs. "bagaimana menjaga tempo?" (proses)', 'Pertanyaan -> pilihan cara + alasan'] },
  12: { title: 'Rancangan Penelitian', lines: ['Fungsi tiap bacaan jelas.', 'Metode sesuai pertanyaan.'] },
};
const SCENE_TASK = { 2: 'Tugas: Sebutkan dua kata kunci topikmu.', 6: 'Tugas: Sebutkan satu dampak masalah pilihanmu.', 9: 'Tugas: Data apa yang menunjukkan tindakan pemain?', 12: 'Tugas akhir: Tulis satu pertanyaan, pilih data, jelaskan alasannya.' };

// ---------- camera shots: one per scene (position, look-at, slow push) ----------
const SHOT = {
  1: { from: [0, 1.6, 4.6], to: [0, 1.6, 4.0], look: [0, 1.35, 0] },
  2: { from: [0.3, 1.55, 3.2], to: [0.3, 1.55, 2.9], look: [0.3, 1.5, 0.5] },
  3: { from: [0, 1.6, 4.4], to: [0, 1.6, 4.0], look: [0, 1.5, 0] },
  4: { from: [0, 1.75, 3.6], to: [0, 1.75, 3.3], look: [0, 1.9, -0.3] },
  5: { from: [0, 1.6, 4.4], to: [0, 1.6, 4.0], look: [0, 1.6, 0] },
  6: { from: [1.0, 1.55, 3.4], to: [1.0, 1.55, 3.0], look: [0.6, 1.5, 0.3] },
  7: { from: [0.6, 1.8, 3.6], to: [0.6, 1.8, 3.3], look: [0, 1.9, -0.6] },
  8: { from: [0, 1.75, 3.4], to: [0, 1.75, 3.1], look: [0, 1.95, -0.6] },
  9: { from: [-0.6, 1.6, 4.2], to: [-0.6, 1.6, 3.8], look: [0, 1.5, 0] },
  10: { from: [1.0, 1.7, 3.3], to: [1.0, 1.7, 3.0], look: [0.6, 1.9, -0.6] },
  11: { from: [0, 1.7, 3.4], to: [0, 1.7, 3.1], look: [0, 1.9, -0.5] },
  12: { from: [0, 1.6, 4.4], to: [0, 1.55, 3.6], look: [0, 1.3, 0] },
};

// ---------- helpers for the per-frame state ----------
function mouthOf(who, t) {
  if (!VO || !VO.mouth) return 0;
  const line = (VO.lines || []).find((l) => t >= l.t - 0.05 && t <= l.end + 0.05 && l.who === who);
  if (!line) return 0;
  const M = VO.mouth, f = t * M.fps, i = Math.floor(f), u = f - i;
  const at = (arr, j) => arr[Math.max(0, Math.min(arr.length - 1, j))] ?? 0;
  return at(M.open, i) * (1 - u) + at(M.open, i + 1) * u;
}
function activeLine(t) { return VO && (VO.lines || []).find((l) => t >= l.t - 0.05 && t <= l.end + 0.45); }
function sceneOf(t) { return Math.min(12, Math.max(1, Math.floor(t / S.SCENE) + 1)); }
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k);

// ---------- draw ----------
function render(t) {
  const sceneN = sceneOf(t);
  const sceneT = t - S.scene(sceneN);
  const shot = SHOT[sceneN] || SHOT[1];
  const k = ease(Math.min(1, sceneT / S.SCENE));
  camera.position.set(lerp(shot.from[0], shot.to[0], k), lerp(shot.from[1], shot.to[1], k), lerp(shot.from[2], shot.to[2], k));
  camera.lookAt(shot.look[0], shot.look[1], shot.look[2]);

  // mouths, idle head turn toward whoever is speaking, idle breathing
  const line = activeLine(t);
  for (const who of ['h', 'v', 'a']) {
    const fig = CAST[who];
    const openAmt = mouthOf(who, t);
    fig.jaw.rotation.x = Math.min(0.55, openAmt * 1.6);
    const talking = line && line.who === who;
    const targetYaw = who === 'h' ? (talking ? 0.05 : 0.18) : who === 'a' ? (talking ? -0.05 : -0.18) : (talking ? 0 : 0.06 * Math.sin(t * 0.6));
    fig.neck.rotation.y = lerp(fig.neck.rotation.y, targetYaw, 0.06);
    fig.neck.position.y = fig.baseHeadY + Math.sin(t * 1.1 + (who === 'h' ? 1 : who === 'a' ? 2 : 0)) * 0.006;
    fig.root.scale.y = 1 + Math.sin(t * 1.3 + (who === 'h' ? 0.5 : who === 'a' ? 1.5 : 0)) * 0.004;
  }
  // a small periodic nod for whoever is listening after the chair's line (scene 6 "kita kena positif" equivalent) is skipped for scope; idle only.

  // the laptop screen (search box in scene 2, otherwise a calm "idle" screen)
  laptopScreenCard.draw('s' + sceneN, (ctx) => {
    ctx.fillStyle = '#F7F7F2'; ctx.fillRect(0, 0, 640, 360);
    ctx.strokeStyle = '#C9C2B2'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 636, 356);
    const narrow = sceneN >= 2 && t >= S.s2.searchNarrow;
    const text = sceneN === 2 ? (narrow ? 'beginner ensemble rhythmic\nsynchronization' : (t >= S.s2.searchBroad ? 'Musik' : '')) : (sceneN >= 3 ? 'ok' : '');
    ctx.fillStyle = '#5A5A66'; ctx.font = '600 30px Inter, Arial'; ctx.fillText('\u{1F50D}', 30, 50);
    ctx.fillStyle = '#1E2235'; ctx.font = (narrow ? '500 24px' : '500 34px') + ' Inter, Arial';
    text.split('\n').forEach((ln, i) => ctx.fillText(ln, 70, 55 + i * 30));
  });

  // the floating card and task banner
  const sc = SCENE_CARD[sceneN];
  if (sc) { card.draw(sceneN + (sc.evolve ? Math.floor(t * 2) : 0), (ctx, w, h) => drawTitleBody(ctx, w, h, sc.title, sc.lines)); card.mesh.visible = true; }
  else card.mesh.visible = false;
  const taskT = { 2: S.s2.taskAt, 6: S.s6.taskAt, 9: S.s9.taskAt, 12: S.s12.taskAt }[sceneN];
  if (taskT && t >= taskT) { taskCard.draw(sceneN, (ctx, w, h) => drawTask(ctx, w, h, SCENE_TASK[sceneN])); taskCard.mesh.visible = true; }
  else taskCard.mesh.visible = false;

  renderer.render(scene, camera);

  // HUD captions (2D canvas, composited on top)
  hctx.clearRect(0, 0, 1920, 1080);
  if (line) {
    const name = S.NAME[line.who], color = S.CAPTION_COLOR[line.who];
    hctx.font = '700 34px Inter, Arial'; hctx.textBaseline = 'alphabetic';
    const words = (line.words || []).filter((w) => w.t <= t);
    const text = words.length ? words.map((w) => w.w).join(' ') : line.text;
    const maxW = 1500;
    const lines = []; let cur = '';
    for (const w of text.split(' ')) { const test = cur ? cur + ' ' + w : w; if (hctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
    if (cur) lines.push(cur);
    const boxH = 54 + lines.length * 40, boxY = 1080 - 70 - boxH;
    hctx.fillStyle = 'rgba(20,16,10,0.72)'; hctx.beginPath(); hctx.roundRect(960 - maxW / 2 - 24, boxY, maxW + 48, boxH, 10); hctx.fill();
    hctx.fillStyle = color; hctx.textAlign = 'center';
    lines.forEach((ln, i) => hctx.fillText(ln, 960, boxY + 44 + i * 40));
    hctx.textAlign = 'left'; hctx.font = '800 24px Inter, Arial';
    hctx.fillStyle = 'rgba(20,16,10,0.72)'; hctx.beginPath(); hctx.roundRect(40, 1080 - 70 - boxH - 44, hctx.measureText(name).width + 24, 34, 6); hctx.fill();
    hctx.fillStyle = color; hctx.fillText(name, 52, 1080 - 70 - boxH - 20);
  }
}

window.renderAt = render;
fetch('out/voice.json').then((r) => r.json()).then((j) => { VO = j; render(0); window.READY = true; });
