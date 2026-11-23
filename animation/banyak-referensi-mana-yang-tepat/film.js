// THE FILM: one study-room table, drawn once (room), photographed shot to shot. Vidka's notebook is
// the through-line: it starts as loose pages and ends as a reasoned research plan. Every mouth follows
// the real ElevenLabs take (out/voice.json); every beat's time comes from score.js (s1..s12, markers).
(function () {
  const U = globalThis.U, G = globalThis.G, Ch = globalThis.Ch, Subs = globalThis.Subs, Shots = globalThis.Shots, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, SAFE = G.SAFE;
  let VO = null, SUBS = [];

  // ---------- the cast (all fictional; styles translated from a brief description, not stored photos) ----------
  const CAST = {
    h: { // Dr. Herry: approachable young lecturer -- dark quiff, square glasses, moustache, black tee
      skin: '#C68B61', hair: '#17140F', hairStyle: 'quiff', facialHair: 'mustache', glasses: 'square',
      outfit: 'tee', shirt: '#1C1C1C', bottoms: 'pants', pants: '#2B2B33', build: 'regular', shoes: '#2A2320',
    },
    a: { // Prof. Ardipal: senior, composed -- grey hair, goatee, light-blue shirt under a grey jacket
      skin: '#D7B48C', hair: '#C9C9C9', hairStyle: 'short', facialHair: 'trimmed', glasses: 'square', glassesColor: '#3A3A3A',
      outfit: 'suit', robe: '#5B6472', shirt: '#AFCBE0', trim: '#3A4452', bottoms: 'pants', pants: '#4A505C', build: 'regular', shoes: '#2A2320',
    },
    v: { // Vidka: the student -- dark plaid hijab, warm red patterned blouse
      skin: '#C98A62', hairStyle: 'hijab', hijab: '#2E2B30', outfit: 'kameez', shirt: '#B23B33', bottoms: 'shalwar', shorts: '#B23B33', build: 'slim',
    },
  };
  globalThis.CAST = CAST;
  const SEAT = { v: W / 2, h: W / 2 - 430, a: W / 2 + 430 };
  const SEAT_Y = H - 300;
  const PS = 0.78;
  const SEED = { h: 200, a: 260, v: 320 };

  // ---------- helpers ----------
  const mouthOf = (who, t) => { const mm = Subs.mouth(VO, t, who); return mm.talking ? mm : null; };
  const blink = (t, k) => (((t + k * 1.41) % 4.1) < 0.12 ? 1 : 0);
  const pop = (t, t0, d = 0.22) => (t < t0 ? 0 : ease.outBack(clamp((t - t0) / d), 2.2));
  const fade = (t, t0, d = 0.2) => clamp((t - t0) / d);

  // ---------- the room: bookshelves, window, desk, three people ----------
  function bookshelf(ctx, x, y, w, h, seed) {
    G.rrect(ctx, x, y, w, h, 6, { fill: '#6E4B33', lw: 5, seed });
    const shelves = 4, rowH = h / shelves;
    for (let r = 0; r < shelves; r++) {
      G.line(ctx, [[x + 6, y + (r + 1) * rowH], [x + w - 6, y + (r + 1) * rowH]], { color: '#3E2A1C', lw: 4, seed: seed + r });
      let bx = x + 12;
      while (bx < x + w - 24) {
        const bw = 14 + G.rnd(seed + bx, r) * 20;
        const col = ['#8E2F3A', '#2E6B5C', '#2F5D8A', '#D9A441', '#5B4A7A', '#3E7D6F'][Math.floor(G.rnd(seed + bx, r + 9) * 6)];
        G.rrect(ctx, bx, y + r * rowH + 6, bw, rowH - 10, 2, { fill: col, lw: 2, seed: seed + bx + r * 7 });
        bx += bw + 3;
      }
    }
  }
  function room(ctx, t) {
    ctx.fillStyle = '#EFE7D8'; ctx.fillRect(-200, -200, W + 400, H + 400);
    G.hatch(ctx, [-200, -200, W + 400, H * 0.72], { color: 'rgba(110,80,40,0.04)', gap: 20 });
    bookshelf(ctx, 60, 90, 420, 560, 10);
    bookshelf(ctx, W - 480, 90, 420, 560, 70);
    // a tall window between the shelves, soft daylight
    G.rrect(ctx, W / 2 - 230, 60, 460, 460, 10, { fill: '#BFE0EE', lw: 8, seed: 40 });
    G.line(ctx, [[W / 2, 60], [W / 2, 520]], { color: '#2A2320', lw: 6, seed: 41 });
    G.line(ctx, [[W / 2 - 230, 290], [W / 2 + 230, 290]], { color: '#2A2320', lw: 6, seed: 42 });
    ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#FFF6D8'; ctx.fillRect(W / 2 - 230, 60, 460, 460); ctx.restore();
    // the floor and the long study table
    G.rrect(ctx, -200, H - 230, W + 400, 460, 0, { fill: '#C9B79C', lw: 0, seed: 50, hatch: { color: 'rgba(90,60,30,0.08)', gap: 16 } });
    G.rrect(ctx, 150, H - 260, W - 300, 70, 10, { fill: '#8E6444', lw: 5, seed: 60, hatch: { color: 'rgba(60,30,10,0.16)', gap: 10 } });
    G.rrect(ctx, 170, H - 196, W - 340, 150, 0, { fill: '#6E4B33', lw: 4, seed: 61 });

    // ---- Vidka: seated centre, at the laptop, with the notebook and the paper stack ----
    const vm = mouthOf('v', t);
    Ch.person(ctx, {
      x: SEAT.v, y: SEAT_Y, s: PS, pose: 'sit', style: CAST.v, seed: SEED.v, shadow: false,
      handL: [-70, -112], handR: [60, -120], mouth: vm || 'flat', eyes: 'normal', brows: 'neutral',
      blink: blink(t, 1), look: 0,
    });
    // ---- Dr. Herry: seated left, leaning in, a pen in hand ----
    const hm = mouthOf('h', t);
    Ch.person(ctx, {
      x: SEAT.h, y: SEAT_Y, s: PS, pose: 'sit', style: CAST.h, seed: SEED.h, shadow: false,
      handL: [-60, -108], handR: [66 + 4 * Math.sin(t * 2), -106], mouth: hm || 'smile', eyes: hm ? 'normal' : 'happy',
      brows: hm ? 'up' : 'neutral', blink: blink(t, 2), look: 0.55, headRot: 0.03 * Math.sin(t * 1.3),
    });
    // ---- Prof. Ardipal: seated right, composed, glasses catching the window light ----
    const am = mouthOf('a', t);
    Ch.person(ctx, {
      x: SEAT.a, y: SEAT_Y, s: PS, pose: 'sit', style: CAST.a, seed: SEED.a, shadow: false,
      handL: [-60, -118], handR: [60, -118], mouth: am || 'flat', eyes: 'normal', brows: am ? 'up' : 'neutral',
      blink: blink(t, 3), look: -0.55,
    });

    // ---- the laptop in front of Vidka (every scene; s12 draws its lid closing over this) ----
    laptop(ctx, SEAT.v - 10, SEAT_Y - 40, t);
    // ---- her notebook, small and closed, resting at her own elbow (the throughline prop) ----
    ctx.save(); ctx.translate(SEAT.v + 150, SEAT_Y - 70);
    G.rrect(ctx, -42, -32, 84, 62, 3, { fill: '#D9A441', lw: 3, seed: 150 });
    G.rrect(ctx, -34, -24, 68, 48, 2, { fill: '#C68E2E', lw: 0, seed: 151 });
    ctx.restore();
  }

  // ---------- recurring props ----------
  function laptop(ctx, cx, topY, t) {
    const w = 300, h = 130; // kept low and small so it never covers a speaking face
    G.rrect(ctx, cx - w / 2, topY, w, 18, 4, { fill: '#D8D2C2', lw: 3, seed: 400 }); // base
    G.rrect(ctx, cx - w / 2 + 16, topY - h, w - 32, h, 6, { fill: '#2A2A32', lw: 4, seed: 401 }); // bezel
    const sx = cx - w / 2 + 28, sy = topY - h + 12, sw = w - 56, sh = h - 24;
    G.rrect(ctx, sx, sy, sw, sh, 3, { fill: '#F7F7F2', lw: 0, seed: 402 });
    return { sx, sy, sw, sh };
  }
  function paperStack(ctx, cx, topY, t) {
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.translate(cx + (i % 2 ? 4 : -4), topY - i * 7); ctx.rotate((i - 2) * 0.02);
      G.rrect(ctx, -90, -120, 180, 150, 3, { fill: i % 2 ? '#FBFAF6' : '#F3EFE4', lw: 2.5, seed: 420 + i });
      for (let k = 0; k < 4; k++) G.line(ctx, [[-70, -95 + k * 14], [60 - (k % 2) * 20, -95 + k * 14]], { color: '#C9C2B2', lw: 2, seed: 430 + i * 4 + k });
      ctx.restore();
    }
  }
  function notebook(ctx, cx, topY, t) {
    G.rrect(ctx, cx - 110, topY - 150, 220, 160, 4, { fill: '#D9A441', lw: 4, seed: 460 });
    G.rrect(ctx, cx - 95, topY - 136, 190, 132, 2, { fill: '#FBFAF6', lw: 2, seed: 461 });
  }

  // ---------- Scene 1: the stack of articles, a few pages sliding to the floor ----------
  function s1_overlay(ctx, t) {
    for (let i = 0; i < S.s1.slideCount; i++) {
      const t0 = S.s1.slideStart + i * 0.35, k = clamp((t - t0) / 1.1);
      if (k <= 0) continue;
      const x = SEAT.v - 330 + (i - 1.5) * 26, y0 = SEAT_Y - 170, y1 = H - 150;
      const x1 = x + (i % 2 ? 70 : -60);
      ctx.save(); ctx.translate(lerp(x, x1, ease.outQuad(k)), lerp(y0, y1, ease.inQuad(k))); ctx.rotate(lerp(0, (i % 2 ? 1 : -1) * 0.7, k));
      G.rrect(ctx, -70, -92, 140, 118, 3, { fill: '#F3EFE4', lw: 2.5, seed: 500 + i });
      ctx.restore();
    }
    if (t >= S.s1.noteOpen) {
      const p = pop(t, S.s1.noteOpen, 0.3);
      ctx.save(); ctx.translate(SEAT.v + 260, SEAT_Y - 220); ctx.scale(p, p);
      G.rrect(ctx, -130, -70, 260, 90, 3, { fill: '#FBFAF6', lw: 3, seed: 510, stroke: '#2A2320' });
      G.text(ctx, '"menjaga tempo bersama"', 0, -18, { size: 24, fam: 'Caveat', weight: 700, color: '#2A2320', align: 'center' });
      G.text(ctx, '- catatan kelompok -', 0, 14, { size: 18, fam: 'Caveat', weight: 700, color: '#5A5A66', align: 'center' });
      ctx.restore();
    }
  }

  // ---------- Scene 2: the search box, a term that goes from broad to specific ----------
  function s2_overlay(ctx, t) {
    const lap = laptop(ctx, SEAT.v - 10, SEAT_Y - 40, t);
    const narrow = t >= S.s2.searchNarrow;
    const text = narrow ? 'beginner ensemble rhythmic synchronization' : (t >= S.s2.searchBroad ? 'Musik' : '');
    const p = narrow ? pop(t, S.s2.searchNarrow, 0.25) : pop(t, S.s2.searchBroad, 0.2);
    ctx.save(); ctx.translate(lap.sx + lap.sw / 2, lap.sy + lap.sh / 2);
    G.rrect(ctx, -lap.sw / 2 + 16, -22, lap.sw - 32, 44, 10, { fill: '#FFFFFF', lw: 3, seed: 560, stroke: '#2A2320' });
    G.ellipse(ctx, -lap.sw / 2 + 36, 0, 7, 7, { fill: 'none', lw: 3, seed: 561, stroke: '#5A5A66' });
    ctx.save(); ctx.translate(-lap.sw / 2 + 50, 0); ctx.scale(Math.min(1, p + 0.4), 1);
    G.text(ctx, text, 0, 7, { size: narrow ? 17 : 22, fam: 'Inter', weight: 700, color: '#1E2235', align: 'left', boil: 0 });
    ctx.restore(); ctx.restore();
    if (t >= S.s2.taskAt) {
      const q = pop(t, S.s2.taskAt, 0.25);
      ctx.save(); ctx.translate(W / 2, H - 92); ctx.scale(q, q);
      G.rrect(ctx, -330, -34, 660, 56, 8, { fill: 'rgba(42,35,20,0.88)', lw: 0, seed: 570 });
      G.text(ctx, 'Tugas: Sebutkan dua kata kunci topikmu.', 0, 6, { size: 24, fam: 'Inter', weight: 800, color: '#F2D08A', align: 'center', boil: 0 });
      ctx.restore();
    }
  }

  // ---------- Scene 3: two reading cards compared, then two sticky notes ----------
  function readingCard(ctx, x, y, title, tag, color, seed) {
    G.rrect(ctx, x - 110, y - 80, 220, 160, 4, { fill: '#FBFAF6', lw: 3, seed });
    G.rrect(ctx, x - 110, y - 80, 220, 26, 4, { fill: color, lw: 2, seed: seed + 1 });
    G.text(ctx, tag, x, y - 62, { size: 18, fam: 'Inter', weight: 800, color: '#FFFFFF', align: 'center', boil: 0 });
    const words = title.split(' ');
    words.forEach((w, i) => G.text(ctx, w, x, y - 20 + i * 24, { size: 18, fam: 'Inter', weight: 700, color: '#2A2320', align: 'center', boil: 0 }));
  }
  function s3_overlay(ctx, t) {
    const p = pop(t, S.s3.cardsAt, 0.3);
    if (p > 0) {
      ctx.save(); ctx.translate(0, 0); ctx.globalAlpha = Math.min(1, p + 0.3);
      ctx.save(); ctx.translate(SEAT.v - 180, SEAT_Y - 260); ctx.scale(p, p); readingCard(ctx, 0, 0, 'musisi profesional', 'SERING DIKUTIP', '#8E2F3A', 600); ctx.restore();
      ctx.save(); ctx.translate(SEAT.v + 180, SEAT_Y - 260); ctx.scale(p, p); readingCard(ctx, 0, 0, 'siswa pemula', 'KONTEKS KELAS', '#2E6B5C', 610); ctx.restore();
      ctx.restore();
    }
    if (t >= S.s3.stickyAt) {
      const q = pop(t, S.s3.stickyAt, 0.25);
      ctx.save(); ctx.translate(SEAT.v - 180, SEAT_Y - 150); ctx.rotate(-0.08); ctx.scale(q, q);
      G.rrect(ctx, -60, -40, 120, 80, 2, { fill: '#F9E27A', lw: 2, seed: 620 });
      G.text(ctx, 'konsep', 0, 8, { size: 22, fam: 'Caveat', weight: 700, color: '#5A4A10', align: 'center' });
      ctx.restore();
      ctx.save(); ctx.translate(SEAT.v + 180, SEAT_Y - 150); ctx.rotate(0.07); ctx.scale(q, q);
      G.rrect(ctx, -70, -40, 140, 80, 2, { fill: '#9EDCC6', lw: 2, seed: 621 });
      G.text(ctx, 'konteks siswa', 0, 8, { size: 20, fam: 'Caveat', weight: 700, color: '#1E3A30', align: 'center' });
      ctx.restore();
    }
  }

  // ---------- Scene 4: the article opens, a highlight marks the method/results ----------
  function s4_overlay(ctx, t) {
    const p = pop(t, S.s4.openAt, 0.3);
    if (p <= 0) return;
    ctx.save(); ctx.translate(SEAT.v, SEAT_Y - 420); ctx.scale(p, p);
    G.rrect(ctx, -180, -140, 360, 280, 4, { fill: '#FBFAF6', lw: 3, seed: 700 });
    G.text(ctx, 'Judul Artikel yang Cocok', -160, -108, { size: 20, fam: 'Inter', weight: 800, color: '#1E2235', boil: 0 });
    const rows = ['Penulis', 'Tempat terbit', 'Peserta', 'Metode', 'Temuan'];
    rows.forEach((r, i) => {
      const marked = t >= S.s4.markAt && (r === 'Metode' || r === 'Temuan');
      G.rrect(ctx, -160, -78 + i * 42, 320, 34, 3, { fill: marked ? '#F9E27A' : 'transparent', lw: 0, seed: 710 + i });
      G.text(ctx, r, -150, -56 + i * 42, { size: 18, fam: 'Inter', weight: 700, color: '#2A2320', boil: 0 });
    });
    if (t >= S.s4.markAt) {
      const q = pop(t, S.s4.markAt, 0.15);
      ctx.save(); ctx.translate(140, 48); ctx.scale(q, q);
      G.ellipse(ctx, 0, 0, 14, 14, { fill: '#C0392B', lw: 0, seed: 720 });
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- Scene 5: two reading notes beside an illustrative group photo; a question mark ----------
  function s5_overlay(ctx, t) {
    const p = pop(t, S.s5.notesAt, 0.3);
    if (p > 0) {
      ctx.save(); ctx.translate(SEAT.v - 230, SEAT_Y - 240); ctx.scale(p, p);
      G.rrect(ctx, -90, -55, 180, 110, 2, { fill: '#9EDCC6', lw: 2, seed: 800 });
      G.text(ctx, 'mendengar\nteman'.split('\n')[0], 0, -8, { size: 20, fam: 'Caveat', weight: 700, color: '#1E3A30', align: 'center' });
      G.text(ctx, 'teman', 0, 20, { size: 20, fam: 'Caveat', weight: 700, color: '#1E3A30', align: 'center' });
      ctx.restore();
      ctx.save(); ctx.translate(SEAT.v + 260, SEAT_Y - 240); ctx.scale(p, p);
      G.rrect(ctx, -90, -55, 180, 110, 2, { fill: '#F2D08A', lw: 2, seed: 801 });
      G.text(ctx, 'melihat', 0, -8, { size: 20, fam: 'Caveat', weight: 700, color: '#5A4A10', align: 'center' });
      G.text(ctx, 'isyarat', 0, 20, { size: 20, fam: 'Caveat', weight: 700, color: '#5A4A10', align: 'center' });
      ctx.restore();
      // illustrative ensemble photo (a taped polaroid of simple generic silhouettes, clearly a prop)
      ctx.save(); ctx.translate(SEAT.v, SEAT_Y - 430); ctx.scale(p, p); ctx.rotate(0.05);
      G.rrect(ctx, -110, -80, 220, 160, 2, { fill: '#FBFAF6', lw: 3, seed: 802 });
      G.rrect(ctx, -98, -68, 196, 120, 2, { fill: '#BFE0EE', lw: 0, seed: 803 });
      for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(-70 + i * 46, 30); G.ellipse(ctx, 0, -40, 12, 12, { fill: '#5A5A66', lw: 0, seed: 804 + i }); G.rrect(ctx, -10, -28, 20, 50, 6, { fill: '#5A5A66', lw: 0, seed: 810 + i }); ctx.restore(); }
      G.text(ctx, 'Contoh bacaan ilustratif', 0, 70, { size: 18, fam: 'Inter', weight: 700, color: '#3A3A44', align: 'center', boil: 0 });
      ctx.restore();
    }
    if (t >= S.s5.qmarkAt) {
      const q = pop(t, S.s5.qmarkAt, 0.2);
      ctx.save(); ctx.translate(SEAT.v + 260, SEAT_Y - 380); ctx.scale(q, q);
      G.text(ctx, '?', 0, 0, { size: 60, fam: 'Bungee', weight: 400, color: '#C0392B', align: 'center' });
      ctx.restore();
    }
  }

  // ---------- Scene 6: the vague sentence crossed out, replaced by the specific one ----------
  function s6_overlay(ctx, t) {
    const p = pop(t, S.s6.draftAt, 0.3);
    if (p <= 0) return;
    ctx.save(); ctx.translate(SEAT.v + 260, SEAT_Y - 220); ctx.scale(p, p);
    G.rrect(ctx, -170, -90, 340, 150, 3, { fill: '#FBFAF6', lw: 3, seed: 900 });
    const replaced = t >= S.s6.replaceAt;
    G.text(ctx, '"Siswa kami kurang kompak."', 0, -50, { size: 20, fam: 'Caveat', weight: 700, color: replaced ? '#9A9A9A' : '#2A2320', align: 'center' });
    if (replaced) {
      const k = fade(t, S.s6.replaceAt, 0.2);
      ctx.save(); ctx.globalAlpha = k; G.line(ctx, [[-150, -50], [150, -50]], { color: '#C0392B', lw: 3, seed: 901 }); ctx.restore();
      const lines = ['Tempo meningkat,', 'beberapa siswa tertinggal,', 'latihan berulang kali berhenti.'];
      lines.forEach((ln, i) => { ctx.save(); ctx.globalAlpha = k; G.text(ctx, ln, 0, -8 + i * 26, { size: 18, fam: 'Caveat', weight: 700, color: '#2A2320', align: 'center' }); ctx.restore(); });
    }
    ctx.restore();
    if (t >= S.s6.taskAt) {
      const q = pop(t, S.s6.taskAt, 0.25);
      ctx.save(); ctx.translate(W / 2, H - 92); ctx.scale(q, q);
      G.rrect(ctx, -360, -34, 720, 56, 8, { fill: 'rgba(42,35,20,0.88)', lw: 0, seed: 910 });
      G.text(ctx, 'Tugas: Sebutkan satu dampak masalah pilihanmu.', 0, 6, { size: 24, fam: 'Inter', weight: 800, color: '#F2D08A', align: 'center', boil: 0 });
      ctx.restore();
    }
  }

  // ---------- Scene 7: three note pieces slide together into one paragraph ----------
  function s7_overlay(ctx, t) {
    const pieces = [
      { label: 'kejadian', color: '#9EDCC6', from: [SEAT.v - 260, SEAT_Y - 330] },
      { label: 'dampak', color: '#F2D08A', from: [SEAT.v, SEAT_Y - 350] },
      { label: 'belum dipahami', color: '#F4B6C2', from: [SEAT.v + 260, SEAT_Y - 330] },
    ];
    const target = [SEAT.v + 260, SEAT_Y - 220];
    const k = ease.inOutQuad(clamp((t - S.s7.combineAt) / 0.7));
    if (t < S.s7.combineAt) {
      pieces.forEach((pc, i) => {
        ctx.save(); ctx.translate(pc.from[0], pc.from[1]);
        G.rrect(ctx, -70, -34, 140, 60, 2, { fill: pc.color, lw: 2, seed: 1000 + i });
        G.text(ctx, pc.label, 0, 6, { size: 20, fam: 'Caveat', weight: 700, color: '#2A2320', align: 'center' });
        ctx.restore();
      });
    } else {
      ctx.save(); ctx.translate(lerp(target[0], target[0], 1), lerp(target[1], target[1], 1)); ctx.scale(Math.min(1, 0.6 + k * 0.4), 1);
      G.rrect(ctx, -180, -95, 360, 160, 3, { fill: '#FBFAF6', lw: 3, seed: 1010 });
      pieces.forEach((pc, i) => G.text(ctx, pc.label, -160 + (i % 2) * 180, -55 + Math.floor(i / 2) * 36 + (i === 2 ? 36 : 0), { size: 18, fam: 'Inter', weight: 800, color: '#3A3A44', align: 'left', boil: 0 }));
      if (t >= S.s7.rereadAt) {
        const q = fade(t, S.s7.rereadAt, 0.2);
        ctx.save(); ctx.globalAlpha = q;
        G.text(ctx, 'Bagaimana mereka mengikuti tempo teman —', 0, -4, { size: 16, fam: 'Inter', weight: 700, color: '#1E2235', align: 'center', boil: 0 });
        G.text(ctx, 'belum dipahami.', 0, 18, { size: 16, fam: 'Inter', weight: 700, color: '#1E2235', align: 'center', boil: 0 });
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // ---------- Scene 8: the full research question, written out; its three elements highlighted ----------
  function s8_overlay(ctx, t) {
    const full = 'Bagaimana siswa pemula menggunakan isyarat bunyi dan gerak untuk menjaga tempo saat latihan ansambel?';
    const words = full.split(' ');
    const line = (VO.lines || []).find((l) => l.id === 'v10' || l.text === full);
    const spokenWords = line ? line.words.filter((w) => w.t <= t).length : 0;
    const shown = words.slice(0, Math.max(1, spokenWords || 1)).join(' ');
    ctx.save(); ctx.translate(SEAT.v, SEAT_Y - 410);
    G.rrect(ctx, -420, -70, 840, 140, 4, { fill: '#FBFAF6', lw: 3, seed: 1100 });
    const wrap = []; let cur = '', curW = 0;
    shown.split(' ').forEach((w) => { if ((cur + ' ' + w).length > 56) { wrap.push(cur.trim()); cur = w; } else cur += ' ' + w; });
    wrap.push(cur.trim());
    wrap.forEach((ln, i) => G.text(ctx, ln, 0, -30 + i * 30, { size: 22, fam: 'Inter', weight: 700, color: '#1E2235', align: 'center', boil: 0 }));
    // peserta / proses / konteks highlights across h5
    const hi = (word, t0, color, x, y) => {
      if (t < t0) return;
      const q = pop(t, t0, 0.2);
      ctx.save(); ctx.globalAlpha = Math.min(1, q + 0.3);
      G.text(ctx, '▲ ' + word, x, y, { size: 18, fam: 'Inter', weight: 800, color, align: 'left', boil: 0 });
      ctx.restore();
    };
    hi('siswa pemula', S.s8.hiP, '#8E2F3A', -400, 58);
    hi('menjaga tempo', S.s8.hiPr, '#2E6B5C', 150, 58);
    hi('latihan ansambel', S.s8.hiC, '#3A4452', 150, 86);
    ctx.restore();
  }

  // ---------- Scene 9: the questionnaire lowers; a peek through the practice-room door ----------
  function s9_overlay(ctx, t) {
    const k = fade(t, S.s9.formDownAt, 0.6);
    ctx.save(); ctx.translate(SEAT.v - 220, lerp(SEAT_Y - 340, SEAT_Y - 160, k));
    G.rrect(ctx, -90, -110, 180, 220, 3, { fill: '#FBFAF6', lw: 3, seed: 1200, stroke: '#2A2320' });
    G.text(ctx, 'KUESIONER', 0, -80, { size: 18, fam: 'Inter', weight: 800, color: '#1E2235', align: 'center', boil: 0 });
    for (let i = 0; i < 4; i++) G.line(ctx, [[-60, -40 + i * 30], [60, -40 + i * 30]], { color: '#C9C2B2', lw: 2, seed: 1210 + i });
    ctx.restore();
    if (t >= S.s9.doorAt) {
      const q = pop(t, S.s9.doorAt, 0.3);
      ctx.save(); ctx.translate(SEAT.v + 220, SEAT_Y - 230); ctx.scale(q, q);
      G.rrect(ctx, -90, -120, 180, 240, 4, { fill: '#8E6444', lw: 5, seed: 1220 });
      ctx.save(); ctx.beginPath(); ctx.rect(-76, -106, 152, 212); ctx.clip();
      ctx.fillStyle = '#2A2A38'; ctx.fillRect(-76, -106, 152, 212);
      // two tiny silhouettes mid-practice, through the door
      G.ellipse(ctx, -20, -10, 10, 10, { fill: '#9EDCC6', lw: 0, seed: 1221 });
      G.rrect(ctx, -28, 0, 16, 40, 5, { fill: '#9EDCC6', lw: 0, seed: 1222 });
      G.ellipse(ctx, 30, 10, 10, 10, { fill: '#F2D08A', lw: 0, seed: 1223 });
      G.rrect(ctx, 22, 20, 16, 40, 5, { fill: '#F2D08A', lw: 0, seed: 1224 });
      ctx.restore();
      ctx.restore();
    }
    if (t >= S.s9.taskAt) {
      const q = pop(t, S.s9.taskAt, 0.25);
      ctx.save(); ctx.translate(W / 2, H - 92); ctx.scale(q, q);
      G.rrect(ctx, -400, -34, 800, 56, 8, { fill: 'rgba(42,35,20,0.88)', lw: 0, seed: 1230 });
      G.text(ctx, 'Tugas: Data apa yang menunjukkan tindakan pemain?', 0, 6, { size: 24, fam: 'Inter', weight: 800, color: '#F2D08A', align: 'center', boil: 0 });
      ctx.restore();
    }
  }

  // ---------- Scene 10: a notebook sketch -- group, observation (eye), interview (bubble) -- linked ----------
  function s10_overlay(ctx, t) {
    const p = pop(t, S.s10.sketchAt, 0.3);
    if (p <= 0) return;
    ctx.save(); ctx.translate(SEAT.v + 260, SEAT_Y - 230); ctx.scale(p, p);
    G.rrect(ctx, -150, -140, 300, 260, 4, { fill: '#FBFAF6', lw: 3, seed: 1300 });
    G.text(ctx, 'Rencana penelitian', 0, -108, { size: 18, fam: 'Inter', weight: 800, color: '#1E2235', align: 'center', boil: 0 });
    // the group (four small figures)
    for (let i = 0; i < 4; i++) { G.ellipse(ctx, -90 + i * 60, -60, 10, 10, { fill: '#5A5A66', lw: 0, seed: 1310 + i }); G.rrect(ctx, -98 + i * 60, -50, 16, 34, 4, { fill: '#5A5A66', lw: 0, seed: 1320 + i }); }
    // the eye (observation)
    ctx.save(); ctx.translate(-80, 30);
    G.ellipse(ctx, 0, 0, 34, 20, { fill: 'none', lw: 3, seed: 1330, stroke: '#2E6B5C' });
    G.ellipse(ctx, 0, 0, 10, 10, { fill: '#2E6B5C', lw: 0, seed: 1331 });
    G.text(ctx, 'observasi', 0, 46, { size: 18, fam: 'Inter', weight: 700, color: '#2E6B5C', align: 'center', boil: 0 });
    ctx.restore();
    // the speech bubble (interview)
    ctx.save(); ctx.translate(80, 30);
    G.rrect(ctx, -40, -22, 80, 44, 10, { fill: 'none', lw: 3, seed: 1340, stroke: '#8E2F3A' });
    G.text(ctx, '"...?"', 0, 5, { size: 16, fam: 'Inter', weight: 700, color: '#8E2F3A', align: 'center', boil: 0 });
    G.text(ctx, 'wawancara', 0, 46, { size: 18, fam: 'Inter', weight: 700, color: '#8E2F3A', align: 'center', boil: 0 });
    ctx.restore();
    if (t >= S.s10.linkAt) {
      const q = fade(t, S.s10.linkAt, 0.3);
      ctx.save(); ctx.globalAlpha = q;
      G.line(ctx, [[-80, 52], [0, -30], [80, 52]], { color: '#2A2320', lw: 2.5, seed: 1350 });
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- Scene 11: a page reading 'lebih efektif?' flips past; back to the process question ----------
  function s11_overlay(ctx, t) {
    const flip = ease.inOutQuad(clamp((t - S.s11.flipAt) / 0.5));
    ctx.save(); ctx.translate(SEAT.v, SEAT_Y - 400);
    G.rrect(ctx, -170, -100, 340, 170, 3, { fill: '#FBFAF6', lw: 3, seed: 1400 });
    ctx.save(); ctx.beginPath(); ctx.rect(-170, -100, 340, 170); ctx.clip();
    ctx.save(); ctx.translate(flip * 340, 0);
    G.text(ctx, '"...lebih efektif?"', 0, -10, { size: 22, fam: 'Caveat', weight: 700, color: '#2A2320', align: 'center' });
    G.text(ctx, 'metronom vs tanpa metronom', 0, 26, { size: 18, fam: 'Inter', weight: 700, color: '#3A3A44', align: 'center', boil: 0 });
    ctx.restore();
    if (t >= S.s11.backAt) {
      const q = fade(t, S.s11.backAt, 0.25);
      ctx.save(); ctx.globalAlpha = q;
      G.text(ctx, 'Bagaimana siswa pemula', 0, -10, { size: 18, fam: 'Inter', weight: 700, color: '#1E2235', align: 'center', boil: 0 });
      G.text(ctx, 'menjaga tempo saat latihan?', 0, 16, { size: 18, fam: 'Inter', weight: 700, color: '#1E2235', align: 'center', boil: 0 });
      ctx.restore();
    }
    ctx.restore(); ctx.restore();
    if (t >= S.s11.noteAt) {
      const q = pop(t, S.s11.noteAt, 0.25);
      ctx.save(); ctx.translate(SEAT.v, SEAT_Y - 130); ctx.scale(q, q);
      G.text(ctx, 'Pertanyaan  →  pilihan cara + alasan', 0, 0, { size: 20, fam: 'Caveat', weight: 700, color: '#2A2320', align: 'center' });
      ctx.restore();
    }
  }

  // ---------- Scene 12: the laptop closes, the book is carried; the final task ----------
  function s12_overlay(ctx, t) {
    const lap = laptop(ctx, SEAT.v - 10, SEAT_Y - 40, t); // redraws the same open screen (idempotent)
    const k = ease.inCubic(clamp((t - S.s12.closeAt) / 0.35)); // 0 = open, 1 = closed
    if (k > 0) {
      // the dark lid swings down from the top hinge, covering the open screen as it closes
      ctx.save();
      G.rrect(ctx, lap.sx, lap.sy, lap.sw, lap.sh * k, 3, { fill: '#2A2A32', lw: 0, seed: 1500 });
      if (k < 1) G.rrect(ctx, lap.sx, lap.sy + lap.sh * k - 4, lap.sw, 6, 2, { fill: '#17171C', lw: 0, seed: 1501 }); // the edge of the lid
      ctx.restore();
    }
    if (t >= S.s12.bookAt) {
      const q = pop(t, S.s12.bookAt, 0.3);
      ctx.save(); ctx.translate(SEAT.v + 260, SEAT_Y - 230); ctx.scale(q, q); ctx.rotate(-0.04);
      G.rrect(ctx, -110, -80, 220, 160, 4, { fill: '#D9A441', lw: 4, seed: 1510 });
      G.text(ctx, 'RANCANGAN', 0, -20, { size: 18, fam: 'Inter', weight: 800, color: '#140C00', align: 'center', boil: 0 });
      G.text(ctx, 'PENELITIAN', 0, 4, { size: 18, fam: 'Inter', weight: 800, color: '#140C00', align: 'center', boil: 0 });
      ctx.restore();
    }
    if (t >= S.s12.taskAt) {
      const q = pop(t, S.s12.taskAt, 0.3);
      ctx.save(); ctx.translate(W / 2, H - 102); ctx.scale(q, q);
      G.rrect(ctx, -430, -46, 860, 76, 10, { fill: 'rgba(42,35,20,0.9)', lw: 0, seed: 1520 });
      G.text(ctx, 'Tugas akhir: Tulis satu pertanyaan.', 0, -6, { size: 22, fam: 'Inter', weight: 800, color: '#F2D08A', align: 'center', boil: 0 });
      G.text(ctx, 'Pilih data yang diperlukan dan jelaskan alasannya.', 0, 20, { size: 22, fam: 'Inter', weight: 800, color: '#F2D08A', align: 'center', boil: 0 });
      ctx.restore();
    }
  }

  const OVERLAY = { 1: s1_overlay, 2: s2_overlay, 3: s3_overlay, 4: s4_overlay, 5: s5_overlay, 6: s6_overlay, 7: s7_overlay, 8: s8_overlay, 9: s9_overlay, 10: s10_overlay, 11: s11_overlay, 12: s12_overlay };

  // ---------- the shots: one per scene, a hard cut at every 15 s boundary ----------
  const film = Shots.film(S.SCENES.map((sc) => ({
    at: S.scene(sc.n), in: sc.n === 1 ? 'cut' : 'cut',
    draw: (ctx, t) => { room(ctx, t); OVERLAY[sc.n](ctx, t); },
    cam: Shots.push(1.0, 1.035),
  })), { end: S.DURATION });

  Studio.film({
    post: { vignette: 0.18, grain: 0.035, paper: 0.3 },
    fadeOut: 0.6,
    async init() {
      VO = await Studio.loadJSON('out/voice.json');
      SUBS = Subs.fromVoice(VO, { maxWords: 6, hold: 0.35 });
    },
    draw(ctx, t) {
      film(ctx, t);
      const line = VO && VO.lines.find((l) => t >= l.t - 0.05 && t <= l.end + 0.45);
      Subs.draw(ctx, t, SUBS, { style: 'box', size: 34, color: line ? S.CAPTION_COLOR[line.who] : '#FFFFFF' });
      if (line) {
        const nm = S.NAME[line.who], ny = SAFE.y + SAFE.h - 70, nw = G.measure(ctx, nm, 22, 'Inter', 800);
        G.rrect(ctx, SAFE.x + 14, ny - 24, nw + 24, 34, 6, { fill: 'rgba(20,16,10,0.72)', lw: 0, seed: 1 });
        G.text(ctx, nm, SAFE.x + 26, ny, { size: 22, fam: 'Inter', weight: 800, color: S.CAPTION_COLOR[line.who], boil: 0 });
      }
    },
  });
})();
