// THE FILM: one meeting room, drawn once (room), photographed by a camera that moves shot to shot.
// Every mouth follows the real ElevenLabs take (out/voice.json); every cue comes from score.js.
(function () {
  const U = globalThis.U, G = globalThis.G, Ch = globalThis.Ch, Subs = globalThis.Subs, Shots = globalThis.Shots, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { clamp, lerp, ease } = U;
  const { ev } = S;
  const W = G.W, H = G.H, SAFE = G.SAFE;
  let VO = null, SUBS = [];

  // ---------- the cast (all made up) ----------
  const CAST = {
    chair: { skin: '#C68B61', hair: '#8E8E8E', hairStyle: 'short', facialHair: 'mustache', glasses: 'square', outfit: 'suit', robe: '#2F3A5A', shirt: '#F4F1EA', trim: '#8E2F3A', build: 'broad', bottoms: 'pants', pants: '#2F3A5A', shoes: '#2A2320' },
    a: { skin: '#B97D55', hair: '#1C1715', hairStyle: 'short', outfit: 'tee', shirt: '#2E7D6B', bottoms: 'pants', pants: '#3A3A44' },
    b: { skin: '#D59B72', hairStyle: 'hijab', hijab: '#B5485D', outfit: 'kameez', shirt: '#E8A9B6', bottoms: 'shalwar', shorts: '#E8A9B6' },
    d: { skin: '#8D5A3B', hair: '#2A2320', hairStyle: 'bald', facialHair: 'beard', outfit: 'suit', robe: '#4A4A52', shirt: '#DCE6EE', trim: '#2F5D8A', bottoms: 'pants', pants: '#4A4A52' },
    c: { skin: '#C98A62', hairStyle: 'hijab', hijab: '#3E5F8A', outfit: 'kameez', shirt: '#D9C8A9', bottoms: 'shalwar', shorts: '#D9C8A9', glasses: 'round' },
  };
  globalThis.CAST = CAST;
  const SEAT = { a: 300, b: 500, d: 700, c: 900 }, SEAT_Y = 1215, PS = 0.62;
  const SEED = { chair: 900, a: 1000, b: 1040, d: 1080, c: 1120 };
  const CHAIR = { x: 150, y: 1045, s: 0.7 };
  const SLIDE = { x: 250, y: 260, w: 740, h: 420 };

  // ---------- helpers ----------
  const mouthOf = (who, t) => { const m = Subs.mouth(VO, t, who); return m.talking ? m : null; };
  const blink = (t, k) => (((t + k * 1.37) % 3.9) < 0.12 ? 1 : 0);
  const pen = (t, k) => ({ handR: [64 + 7 * Math.sin(t * 9 + k), -104 + 2 * Math.sin(t * 13 + k)], handL: [-56, -106] });
  const rest = { handL: [-58, -104], handR: [58, -104] };
  const nodY = (t) => { let y = 0; for (const n of S.nods) if (t >= n && t < n + 0.4) y += 14 * Math.sin(Math.PI * (t - n) / 0.4); return y; };
  const pop = (t, t0, d = 0.22) => (t < t0 ? 0 : ease.outBack(clamp((t - t0) / d), 2.2));

  function clockFace(ctx, cx, cy, r, t) {
    G.ellipse(ctx, cx, cy, r, r, { fill: '#F6F2E8', lw: 5, seed: 300 });
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; G.line(ctx, [[cx + Math.sin(a) * r * 0.8, cy - Math.cos(a) * r * 0.8], [cx + Math.sin(a) * r * 0.9, cy - Math.cos(a) * r * 0.9]], { color: '#2A2320', lw: 3, seed: 301 + k }); }
    G.line(ctx, [[cx, cy], [cx + Math.sin(-0.5) * r * 0.48, cy - Math.cos(-0.5) * r * 0.48]], { color: '#2A2320', lw: 6, seed: 320 }); // hour
    G.line(ctx, [[cx, cy], [cx + Math.sin(0.35) * r * 0.72, cy - Math.cos(0.35) * r * 0.72]], { color: '#2A2320', lw: 5, seed: 321 }); // minute
    const sec = Math.floor(t / 0.6) * (Math.PI / 30) * 1; // jumps on every tick of the score
    G.line(ctx, [[cx - Math.sin(sec) * r * 0.15, cy + Math.cos(sec) * r * 0.15], [cx + Math.sin(sec) * r * 0.8, cy - Math.cos(sec) * r * 0.8]], { color: '#C0392B', lw: 3, seed: 322 });
    G.ellipse(ctx, cx, cy, 5, 5, { fill: '#2A2320', lw: 2, seed: 323 });
  }

  // the projected slide: the agenda, then the special committee (and the stamp)
  function slide(ctx, t) {
    const { x, y, w, h } = SLIDE;
    G.rrect(ctx, x - 14, y - 14, w + 28, h + 28, 10, { fill: '#2A2A38', lw: 5, seed: 200 });
    ctx.fillStyle = '#FBFAF6'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2F3A5A'; ctx.fillRect(x, y, w, 14);
    const T2 = t >= ev.resume;
    if (!T2) {
      G.text(ctx, 'AGENDA FAKULTI', x + 30, y + 76, { size: 46, fam: 'Inter', weight: 800, color: '#1E2235', boil: 0 });
      G.line(ctx, [[x + 30, y + 96], [x + w - 30, y + 96]], { color: '#C9C2B2', lw: 3, seed: 201 });
      S.slideItems.forEach((it, i) => {
        const p = pop(t, it.t); if (p <= 0) return;
        if (it.kind === 'prog') {
          const cx = x + 30 + i * 230 + 105, cy = y + 150;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p);
          G.rrect(ctx, -105, -34, 210, 68, 10, { fill: ['#F2D08A', '#9EDCC6', '#F4B6C2'][i], lw: 4, seed: 210 + i });
          G.text(ctx, it.text, 0, 11, { size: 28, fam: 'Inter', weight: 800, color: '#1E2235', align: 'center', boil: 0 });
          ctx.restore();
        } else {
          const k = i - 3, ly = y + 236 + k * 42;
          ctx.save(); ctx.translate(x + 40, ly); ctx.scale(p, 1);
          G.text(ctx, '•  ' + it.text, 0, 0, { size: 32, fam: 'Inter', weight: 700, color: '#1E2235', boil: 0 });
          ctx.restore();
        }
      });
    } else {
      const w1 = clamp((t - ev.resume) / 0.12); // a quick white wipe as the slide changes
      ctx.save(); ctx.globalAlpha = w1;
      G.text(ctx, 'JAWATANKUASA KHAS', x + 30, y + 76, { size: 46, fam: 'Inter', weight: 800, color: '#1E2235', boil: 0 });
      G.line(ctx, [[x + 30, y + 96], [x + w - 30, y + 96]], { color: '#C9C2B2', lw: 3, seed: 201 });
      ctx.restore();
      if (t >= ev.resume + 1.2) { const p = pop(t, ev.resume + 1.2); ctx.save(); ctx.translate(x + 40, y + 170); ctx.scale(p, 1); G.text(ctx, 'Tujuan: mengkaji masalah', 0, 0, { size: 34, fam: 'Inter', weight: 700, color: '#1E2235', boil: 0 }); ctx.restore(); }
      if (t >= ev.resume + 2.4) { const p = pop(t, ev.resume + 2.4); ctx.save(); ctx.translate(x + 40, y + 222); ctx.scale(p, 1); G.text(ctx, 'terlalu banyak jawatankuasa', 0, 0, { size: 34, fam: 'Inter', weight: 700, color: '#C0392B', boil: 0 }); ctx.restore(); }
      if (t >= ev.resume + 3.4) { const p = pop(t, ev.resume + 3.4); ctx.save(); ctx.globalAlpha = Math.min(1, p); G.text(ctx, 'Ahli: semua yang hadir  ·  Mesyuarat pertama: minggu depan', x + 40, y + 300, { size: 24, fam: 'Inter', weight: 700, color: '#5A5A66', boil: 0 }); ctx.restore(); }
      if (t >= ev.stamp) stamp(ctx, x + w / 2 + 40, y + 250, t);
    }
    // the projector glow and the frame's lower edge
    ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = '#FFF2C0'; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  function stamp(ctx, cx, cy, t) {
    const a = t - ev.stamp, k = ease.inCubic(clamp(a / 0.1));
    const sc = lerp(2.4, 1, k), rot = -0.2 + 0.06 * k;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = lerp(0.3, 0.92, k);
    G.rrect(ctx, -210, -92, 420, 184, 18, { fill: 'rgba(0,0,0,0)', stroke: '#C0392B', lw: 12, seed: 240, amp: 1.2 });
    G.rrect(ctx, -192, -74, 384, 148, 12, { fill: 'rgba(0,0,0,0)', stroke: '#C0392B', lw: 5, seed: 241, amp: 1 });
    G.text(ctx, 'LULUS', 0, 42, { size: 118, fam: 'Bungee', weight: 400, color: '#C0392B', align: 'center', boil: 0.3 });
    ctx.restore();
    if (k >= 1) for (let i = 0; i < 10; i++) { const r = 14 + G.rnd(i, 7) * 10, ang = G.rnd(i, 8) * Math.PI * 2, d = 240 + G.rnd(i, 9) * 60; G.ellipse(ctx, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.5, r * 0.5, r * 0.3, { fill: 'rgba(192,57,43,0.55)', lw: 0, seed: 250 + i }); }
  }

  // ---------- the room, as the camera sees it at time t ----------
  function room(ctx, t) {
    // wall, floor
    ctx.fillStyle = '#E8DFCF'; ctx.fillRect(-600, -600, W + 1200, H + 1200);
    G.hatch(ctx, [-600, -600, W + 1200, 1720], { color: 'rgba(120,90,60,0.05)', gap: 18 });
    G.rrect(ctx, -600, 1120, W + 1200, 1400, 0, { fill: '#B9AA93', lw: 4, seed: 11, hatch: { color: 'rgba(80,50,20,0.1)', gap: 14 } });
    G.line(ctx, [[-600, 1120], [W + 600, 1120]], { color: '#8E8274', lw: 5, seed: 12 });
    clockFace(ctx, 135, 282, 50, t);
    // a framed "VISI · MISI" print, a plant
    G.rrect(ctx, 60, 390, 150, 110, 6, { fill: '#F6F2E8', lw: 4, seed: 20 });
    G.text(ctx, 'VISI · MISI', 135, 440, { size: 22, fam: 'Inter', weight: 800, color: '#5A5A66', align: 'center', boil: 0 });
    for (let k = 0; k < 3; k++) G.line(ctx, [[85, 462 + k * 12], [185 - k * 18, 462 + k * 12]], { color: '#B8B0A0', lw: 3, seed: 21 + k });
    slide(ctx, t);
    // the chair at the lectern, pointing at the slide
    const cm = mouthOf('chair', t);
    const talkingNow = !!cm;
    const closed = t >= ev.chairClose;
    const resumed = t >= ev.resume;
    const chairGesture = t < ev.hand || resumed ? 'point' : null;
    const chairPointSwing = Math.sin(t * 1.7) * 0.02;
    Ch.person(ctx, {
      x: CHAIR.x, y: CHAIR.y, s: CHAIR.s, pose: 'stand', style: CAST.chair, seed: SEED.chair, shadow: false,
      gesture: chairGesture, handL: [-40, -236], handR: chairGesture ? undefined : (closed && !resumed ? [40, -236] : undefined),
      mouth: cm || (t >= ev.hand && t < ev.resume ? 'flat' : 'smile'), brows: t >= ev.pushback && t < ev.resume ? 'neutral' : 'up',
      eyes: 'normal', blink: blink(t, 1), look: 0.6, headRot: chairPointSwing + (talkingNow ? 0.02 * Math.sin(t * 6) : 0),
    });
    // the lectern and the file
    G.rrect(ctx, 62, 882, 176, 170, 8, { fill: '#8E6444', lw: 5, seed: 30, hatch: { color: 'rgba(60,30,10,0.18)', gap: 9 } });
    G.rrect(ctx, 52, 872, 196, 22, 6, { fill: '#B98A5E', lw: 4, seed: 31 });
    fileOnLectern(ctx, 150, 870, t);
    // the four behind the table
    sitters(ctx, t);
    // the table: top slab, front panel, and what is on it
    G.rrect(ctx, 40, 1150, W - 80, 52, 10, { fill: '#B98A5E', lw: 5, seed: 40, hatch: { color: 'rgba(90,50,20,0.14)', gap: 10 } });
    G.rrect(ctx, 50, 1200, W - 100, 150, 4, { fill: '#7A553A', lw: 5, seed: 41, hatch: { color: 'rgba(0,0,0,0.12)', gap: 12 } });
    for (const who of ['a', 'b', 'd', 'c']) {
      const x = SEAT[who];
      G.rrect(ctx, x - 44, 1146, 88, 40, 4, { fill: '#FBFAF6', lw: 3, seed: 50 + x, hatch: null });
      for (let k = 0; k < 3; k++) G.line(ctx, [[x - 32, 1156 + k * 9], [x + 20 - k * 10, 1156 + k * 9]], { color: '#B8B0A0', lw: 2, seed: 60 + x + k });
      G.rrect(ctx, x + 50, 1166, 46, 22, 6, { fill: '#F6F2E8', lw: 3, seed: 70 + x }); // the tent card
      G.text(ctx, who.toUpperCase(), x + 73, 1183, { size: 18, fam: 'Inter', weight: 800, color: '#2A2320', align: 'center', boil: 0 });
    }
    for (const x of [410, 800]) { G.rrect(ctx, x - 16, 1150, 32, 30, 6, { fill: x > 500 ? '#3E5F8A' : '#C0392B', lw: 3, seed: 80 + x }); } // mugs
    // what C asks for: three cards on the wall beside her (music-box notes in the score)
    if (t >= S.icons[0].t && t < ev.pushback) S.icons.forEach((ic, i) => {
      const p = pop(t, ic.t, 0.25); if (p <= 0) return;
      const cx = 690, cy = 770 + i * 92;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((i - 1) * 0.03); ctx.scale(p, p);
      G.tornPaper(ctx, -100, -34, 200, 68, { fill: ['#9EDCC6', '#CFE3FF', '#F2D08A'][i], seed: 600 + i, shadow: true });
      G.text(ctx, ic.text, 0, 11, { size: 30, fam: 'Inter', weight: 800, color: '#1E2235', align: 'center', boil: 0 });
      ctx.restore();
    });
    // B's camera flash
    for (const f of [ev.flash1, ev.flash2]) if (t >= f && t < f + 0.2) { ctx.save(); ctx.globalAlpha = 0.85 * (1 - (t - f) / 0.2); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore(); }
  }
  function fileOnLectern(ctx, cx, top, t) {
    const k = t < ev.chairClose ? 0 : ease.inCubic(clamp((t - ev.chairClose) / 0.14));
    ctx.save(); ctx.translate(cx, top);
    // the right half stays, the left cover swings shut (its width shrinks to zero then the closed folder appears)
    G.rrect(ctx, -6, -8, 86, 60, 4, { fill: '#F2D08A', lw: 4, seed: 90 });
    for (let i = 0; i < 4; i++) G.line(ctx, [[6, 4 + i * 11], [70 - i * 8, 4 + i * 11]], { color: '#8E8274', lw: 2, seed: 91 + i });
    if (k < 1) { ctx.save(); ctx.translate(-6, 0); ctx.scale(1 - k, 1); G.rrect(ctx, -80, -8, 80, 60, 4, { fill: '#FBFAF6', lw: 4, seed: 95 }); for (let i = 0; i < 4; i++) G.line(ctx, [[-68, 4 + i * 11], [-14 - i * 6, 4 + i * 11]], { color: '#B8B0A0', lw: 2, seed: 96 + i }); ctx.restore(); }
    if (k >= 1) { G.rrect(ctx, -84, -10, 164, 64, 5, { fill: '#D9A441', lw: 4, seed: 98 }); G.text(ctx, 'FAIL', 0, 32, { size: 26, fam: 'Inter', weight: 800, color: '#5A3A10', align: 'center', boil: 0 }); }
    ctx.restore();
  }

  function sitters(ctx, t) {
    const early = t < ev.hand, resumed = t >= ev.resume;
    const nod = nodY(t);
    // A: eager, then defensive (leans back, arms crossed)
    {
      const am = mouthOf('a', t);
      const lean = t >= ev.pushback && t < ev.resume ? ease.inOutQuad(clamp((t - ev.pushback) / 0.5)) : 0;
      const o = { x: SEAT.a, y: SEAT_Y + lean * 10 + (t >= ev.chairClose ? nod : 0), s: PS, pose: 'sit', style: CAST.a, seed: SEED.a, shadow: false, rot: -0.12 * lean, blink: blink(t, 2) };
      if (early || resumed) Object.assign(o, am ? { gesture: 'pointUp', mouth: am, eyes: 'normal', brows: 'up' } : { ...pen(t, 1), mouth: 'smile', eyes: 'happy', brows: 'up' });
      else if (t < ev.pushback) Object.assign(o, rest, { mouth: 'flat', eyes: 'normal', brows: 'neutral', look: 1 });
      else Object.assign(o, { handL: [46, -150], handR: [-48, -138], mouth: am || 'flat', eyes: 'normal', brows: am ? 'worried' : 'neutral', look: 0.8 });
      Ch.person(ctx, o);
    }
    // B: photographs the slide, then looks down
    {
      const bm = mouthOf('b', t);
      const o = { x: SEAT.b, y: SEAT_Y + (t >= ev.chairClose ? nod : 0), s: PS, pose: 'sit', style: CAST.b, seed: SEED.b, shadow: false, blink: blink(t, 3) };
      if (t < ev.eager) Object.assign(o, pen(t, 2), { mouth: 'smile', eyes: 'happy', brows: 'up' });
      else if (early) Object.assign(o, { gesture: 'phone', mouth: bm || 'grin', eyes: 'happy', brows: 'up', lookY: -0.6 });
      else if (t < ev.pushback) Object.assign(o, rest, { mouth: 'flat', eyes: 'normal', brows: 'neutral', look: 1 });
      else if (!resumed) Object.assign(o, rest, { mouth: 'flat', eyes: 'normal', brows: 'worried', lookY: 0.8 });
      else Object.assign(o, pen(t, 2), { mouth: 'smile', eyes: 'happy', brows: 'up' });
      Ch.person(ctx, o);
    }
    // D: never speaks; shakes his head, then nods
    {
      const shaking = t >= ev.shake && t < ev.shake + 4;
      const o = { x: SEAT.d, y: SEAT_Y + (t >= ev.chairClose ? nod : 0), s: PS, pose: 'sit', style: CAST.d, seed: SEED.d, shadow: false, blink: blink(t, 4) };
      if (early || resumed) Object.assign(o, pen(t, 3), { mouth: 'smile', eyes: 'happy', brows: 'up' });
      else if (t < ev.pushback) Object.assign(o, rest, { mouth: 'flat', eyes: 'normal', brows: 'neutral', look: 1 });
      else Object.assign(o, rest, { mouth: shaking ? 'wavy' : 'flat', eyes: 'normal', brows: shaking ? 'worried' : 'neutral', headRot: shaking ? 0.14 * Math.sin((t - ev.shake) * Math.PI * 2 * 1.5) * (1 - clamp((t - ev.shake - 3) / 1)) : 0, look: 0.3 });
      Ch.person(ctx, o);
    }
    // C: the one who asks
    {
      const cmm = mouthOf('c', t);
      const o = { x: SEAT.c, y: SEAT_Y, s: PS, pose: 'sit', style: CAST.c, seed: SEED.c, shadow: false, blink: blink(t, 5) };
      if (early) Object.assign(o, pen(t, 4), { mouth: 'flat', eyes: 'normal', brows: 'neutral' });
      else if (t < ev.question) {
        const up = ease.outCubic(clamp((t - ev.hand) / 0.35));
        Object.assign(o, { handL: [-56, -106], handR: [lerp(58, 92, up), lerp(-104, -322, up)], mouth: cmm || 'flat', eyes: 'normal', brows: 'up', look: -0.7 });
      } else if (t < ev.pushback) {
        const down = ease.inOutQuad(clamp((t - ev.question) / 0.6));
        Object.assign(o, { handL: [-70, -120], handR: [lerp(92, 120, down) + 6 * Math.sin(t * 5), lerp(-322, -160, down) + 4 * Math.sin(t * 7)], mouth: cmm || 'flat', eyes: 'normal', brows: 'up', look: -0.7 });
      } else if (t < ev.sheet) Object.assign(o, rest, { mouth: 'flat', eyes: 'normal', brows: 'neutral', look: -0.9 });
      else if (t < ev.insert) {
        const lift = ease.outCubic(clamp((t - ev.sheet) / 0.5));
        Object.assign(o, { handL: [-82, lerp(-104, -138, lift)], handR: [62, lerp(-104, -142, lift)], mouth: cmm || 'flat', eyes: 'normal', brows: 'up', look: -0.7 });
      } else if (t < ev.chairClose) Object.assign(o, { handL: [-82, -138], handR: [62, -142], mouth: cmm || 'flat', eyes: 'normal', brows: 'up', look: -0.7 });
      else Object.assign(o, rest, { mouth: 'flat', eyes: 'normal', brows: 'worried', lookY: resumed ? 0.9 : 0.6, headRot: resumed ? 0.06 : 0.02 });
      Ch.person(ctx, o);
      // the page she lifts (31.2 → 33.0): a sheet between her hands, above the table
      if (t >= ev.sheet && t < ev.chairClose) {
        const lift = ease.outCubic(clamp((t - ev.sheet) / 0.5));
        const cx = SEAT.c - 6, cy = SEAT_Y + PS * lerp(-104, -140, lift);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.06 + 0.02 * Math.sin(t * 3));
        G.rrect(ctx, -70, -26, 140, 54, 3, { fill: '#FBFAF6', lw: 3, seed: 130 });
        for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) G.rrect(ctx, -60 + c * 31, -18 + r * 22, 26, 16, 2, { fill: ['#F2D08A', '#F4B6C2', '#9EDCC6', '#CFE3FF'][(r * 4 + c) % 4], lw: 1.5, seed: 131 + r * 4 + c });
        ctx.restore();
      }
    }
  }

  // ---------- the insert: her week, filled by admin ----------
  function insert(ctx, t) {
    ctx.fillStyle = '#7A553A'; ctx.fillRect(0, 0, W, H);
    G.hatch(ctx, [0, 0, W, H], { color: 'rgba(0,0,0,0.12)', gap: 12 });
    const px = 70, py = 420, pw = 940, ph = 1000;
    ctx.save(); ctx.translate(540, 920); ctx.rotate(-0.025); ctx.translate(-540, -920);
    G.tornPaper(ctx, px, py, pw, ph, { fill: '#FBFAF6', seed: 400, shadow: true });
    G.tape(ctx, px + 60, py - 14, 120, 34, -0.15, 401);
    G.tape(ctx, px + pw - 180, py - 10, 120, 34, 0.12, 402);
    G.text(ctx, 'JADUAL MINGGU INI', px + pw / 2, py + 86, { size: 50, fam: 'Inter', weight: 800, color: '#1E2235', align: 'center', boil: 0 });
    G.text(ctx, 'Dr. C', px + pw / 2, py + 130, { size: 30, fam: 'Caveat', weight: 700, color: '#5A5A66', align: 'center' });
    const gx = px + 110, gy = py + 200, cw = (pw - 150) / 5, ch = 220;
    const days = ['ISN', 'SEL', 'RAB', 'KHA', 'JUM'], rows = ['Pagi', 'T/hari', 'Petang'];
    days.forEach((d, i) => G.text(ctx, d, gx + i * cw + cw / 2, gy - 16, { size: 26, fam: 'Inter', weight: 800, color: '#5A5A66', align: 'center', boil: 0 }));
    rows.forEach((r, j) => G.text(ctx, r, gx - 14, gy + j * ch + ch / 2 + 8, { size: 22, fam: 'Inter', weight: 700, color: '#5A5A66', align: 'right', boil: 0 }));
    for (let i = 0; i <= 5; i++) G.line(ctx, [[gx + i * cw, gy], [gx + i * cw, gy + 3 * ch]], { color: '#C9C2B2', lw: 3, seed: 410 + i });
    for (let j = 0; j <= 3; j++) G.line(ctx, [[gx, gy + j * ch], [gx + 5 * cw, gy + j * ch]], { color: '#C9C2B2', lw: 3, seed: 420 + j });
    // the one research note, at the end of the week... until it is shoved off
    const cell = (c, r) => [gx + c * cw + cw / 2, gy + r * ch + ch / 2];
    {
      const [nx, ny] = cell(4, 2);
      const a = t < S.shove ? 0 : ease.inQuad(clamp((t - S.shove) / 0.45));
      const x = nx + a * 420, y = ny + a * a * 520, rot = 0.05 + a * 1.2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      G.rrect(ctx, -cw * 0.42, -78, cw * 0.84, 156, 4, { fill: '#F9E27A', lw: 3, seed: 430 });
      G.text(ctx, 'PENYELIDIKAN', 0, -14, { size: 22, fam: 'Inter', weight: 800, color: '#5A4A10', align: 'center', boil: 0 });
      G.text(ctx, '+ bimbingan', 0, 18, { size: 20, fam: 'Caveat', weight: 700, color: '#5A4A10', align: 'center' });
      G.text(ctx, '+ artikel', 0, 46, { size: 20, fam: 'Caveat', weight: 700, color: '#5A4A10', align: 'center' });
      ctx.restore();
    }
    const colors = { JK: '#F2D08A', LAPORAN: '#9EDCC6', MAJLIS: '#F4B6C2', DOKUMEN: '#CFE3FF', BACKDROP: '#E8C8F0', MINIT: '#9EDCC6', JEMPUTAN: '#F4B6C2', MESYUARAT: '#F2D08A' };
    const blocks = [...S.sheetBlocks, S.lastBlock];
    for (const b of blocks) {
      if (t < b.t) continue;
      const p = pop(t, b.t, 0.18), [bx, by] = cell(b.cell[0], b.cell[1]);
      const slideIn = b === S.lastBlock ? (1 - ease.outCubic(clamp((t - b.t) / 0.25))) * 300 : 0;
      ctx.save(); ctx.translate(bx + slideIn, by); ctx.scale(p, p);
      G.rrect(ctx, -cw * 0.44, -ch * 0.4, cw * 0.88, ch * 0.8, 6, { fill: colors[b.label] || '#F2D08A', lw: 3.5, seed: 440 + b.cell[0] * 3 + b.cell[1] });
      G.text(ctx, b.label, 0, 10, { size: b.label.length > 7 ? 20 : 24, fam: 'Inter', weight: 800, color: '#2A2320', align: 'center', boil: 0 });
      ctx.restore();
    }
    ctx.restore();
    // her thumb at the corner: she is holding the page
    G.ellipse(ctx, 92, 1290, 36, 52, { fill: CAST.c.skin, lw: 4, seed: 450 });
  }

  // ---------- the freeze ----------
  function freeze(ctx, t) {
    ctx.save(); Shots.cam(ctx, { zoom: 1.03 });
    room(ctx, ev.freeze); // the frame stands still
    ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore();
    ctx.restore();
    const dim = clamp((t - ev.freeze) / 0.3);
    ctx.save(); ctx.globalAlpha = 0.42 * dim; ctx.fillStyle = '#1E2638'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const label = (text, cx, cy, w, t0, rot, fill, size = 84) => {
      if (t < t0) return;
      const k = ease.outCubic(clamp((t - t0) / 0.16)), sc = lerp(1.7, 1, k);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = lerp(0.4, 1, k);
      G.tornPaper(ctx, -w / 2, -78, w, 156, { fill, seed: 500 + cx, shadow: true });
      G.tape(ctx, -w / 2 + 30, -92, 110, 30, -0.2, 501);
      G.text(ctx, text, 0, 26, { size, fam: 'Bungee', weight: 400, color: '#1E2235', align: 'center', boil: 0.4 });
      ctx.restore();
    };
    label('KITA DAH BIASA', 515, 640, 880, ev.label1, -0.035, '#F2D08A');
    if (t >= ev.label2 - 0.4) { // the arrow draws itself in the 0.4 s before the second label
      const k = ease.outQuad(clamp((t - ev.label2 + 0.4) / 0.35));
      G.line(ctx, [[515, 730], [515, 730 + 90 * k]], { color: '#FBFAF6', lw: 10, seed: 510 });
      if (k >= 1) G.poly(ctx, [[480, 806], [550, 806], [515, 846]], { fill: '#FBFAF6', lw: 6, seed: 511, step: 10 });
    }
    label('MAKA, MESTI BETUL?', 515, 960, 900, ev.label2, 0.03, '#FBFAF6', 60);
    if (t >= ev.cite) {
      const a = clamp((t - ev.cite) / 0.4);
      ctx.save(); ctx.globalAlpha = a;
      G.rrect(ctx, 90, 1200, 850, 92, 10, { fill: 'rgba(251,250,246,0.92)', lw: 3, seed: 520 });
      G.text(ctx, 'Justifikasi sistem  ·  Jost & Banaji (1994)', 515, 1258, { size: 34, fam: 'Inter', weight: 700, color: '#1E2235', align: 'center', boil: 0 });
      ctx.restore();
    }
  }

  // ---------- the end card ----------
  function endCard(ctx, t) {
    if (t < ev.endText) return;
    const a = clamp((t - ev.endText) / 0.25);
    ctx.save(); ctx.globalAlpha = 0.8 * a; ctx.fillStyle = '#14121C'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const p1 = pop(t, ev.endText + 0.05, 0.3), p2 = pop(t, ev.endText + 0.3, 0.3);
    ctx.save(); ctx.translate(515, 840); ctx.scale(p1, p1);
    G.text(ctx, 'Sudah biasa.', 0, 0, { size: 104, fam: 'Bungee', weight: 400, color: '#F2D08A', align: 'center', boil: 0.3 });
    ctx.restore();
    if (p2 > 0) { ctx.save(); ctx.translate(515, 980); ctx.scale(p2, p2); G.text(ctx, 'Tetapi adakah wajar?', 0, 0, { size: 82, fam: 'Caveat', weight: 700, color: '#FFFFFF', align: 'center' }); ctx.restore(); }
  }

  // ---------- the shots ----------
  const wide = (ctx, t) => room(ctx, t);
  const resumeCam = (s) => { const k = ease.inOutQuad(clamp((s.t - ev.resume) / (ev.stamp - ev.resume))); return { zoom: 1 + 0.32 * k, x: 80 * k, y: -380 * k }; };
  const film = Shots.film([
    { at: 0, draw: wide, cam: Shots.push(1.0, 1.05) },
    { at: ev.eager, draw: wide, in: 'cut', cam: { zoom: 1.9, x: -140, y: 120 } }, // A and B
    { at: ev.hand, draw: wide, in: 'cut', cam: Shots.push(1.0, 1.06) }, // the room: every pen stops
    { at: ev.question, draw: wide, in: 'cut', cam: Shots.combine({ zoom: 2.0, x: 290, y: 100 }, Shots.push(1, 1.04)) }, // C
    { at: ev.pushback, draw: wide, in: 'cut', cam: { zoom: 1.5, x: -40, y: 120 } }, // A, B and D
    { at: ev.sheet, draw: wide, in: 'cut', cam: { zoom: 1.9, x: 290, y: 130 } }, // C lifts the page
    { at: ev.insert, draw: insert, in: 'cut', cam: Shots.push(1.0, 1.04) }, // the page
    { at: ev.chairClose, draw: wide, in: 'cut', cam: { zoom: 1.7, x: -240, y: -100 } }, // the chair
    { at: ev.wide2, draw: wide, in: 'cut', cam: Shots.push(1.0, 1.03) }, // everyone nods
    { at: ev.freeze, draw: freeze, in: 'cut' },
    { at: ev.resume, draw: wide, in: 'cut', cam: Shots.combine(resumeCam, Shots.shake(18, ev.stamp, 6)) },
  ]);

  Studio.film({
    post: { vignette: 0.22, grain: 0.04, paper: 0.35 },
    fadeOut: 0.2,
    async init() {
      VO = await Studio.loadJSON('out/voice.json');
      SUBS = Subs.fromVoice(VO, { maxWords: 6, hold: 0.4 });
    },
    draw(ctx, t) {
      film(ctx, t);
      if (t < ev.endText) {
        const line = VO && VO.lines.find((l) => t >= l.t - 0.05 && t <= l.end + 0.45);
        Subs.draw(ctx, t, SUBS, { style: 'box', size: 54, color: line ? S.CAPTION_COLOR[line.who] : '#FFFFFF' });
      }
      endCard(ctx, t);
    },
  });
})();
