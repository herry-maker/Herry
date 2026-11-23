// THE SOUND: node song.js   (STEMS=1 writes stems, LUFS=-14 sets loudness)
// Dialogue is 33 real ElevenLabs takes (assets/vo/<id>.mp3), Bahasa Indonesia, three voices (Vidka,
// Dr. Herry, Prof. Ardipal). For every scene, every one of its takes is trimmed of silence, then (only
// if the real takes overrun the scene's 10 s dialogue budget) ALL of that scene's takes are sped up
// together, by the same small amount (never past SCORE.MAX_TEMPO), so turn-taking rhythm is kept.
// Under the dialogue: a soft, mostly-wordless lofi study-room bed (e-piano, pad, brushed hat, a page
// turn here and there) that never competes with anyone talking.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const Genre = require('./engine/audio/genres');
const Voice = require('./engine/audio/voice');
const U = require('./engine/util');
const sc = require('./score');
const { T, BEAT, DURATION, m, clock, chordAt, scene } = sc;

const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drums = bus(), bass = bus(), keys = bus(), pad = bus(), fx = bus(), voBus = bus();

// ---------- trim + tempo-fit each scene's takes as one group ----------
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,silenceremove=stop_periods=-1:stop_threshold=-42dB:stop_silence=0.2';
function decodeWith(file, af) {
  const args = ['-v', 'error', '-i', file, ...(af ? ['-af', af] : []), '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'];
  const r = spawnSync(process.env.FFMPEG || 'ffmpeg', args, { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`could not decode ${file}: ${String(r.stderr).trim()}`);
  const b = r.stdout;
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
}
const wordsOf = (s) => s.replace(/\s+/g, ' ').trim().split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w));

const lines = [], report = [];
for (const S of sc.SCENES) {
  const ids = S.lines;
  // pass 1: trim every take in this scene, measure its real duration
  const trimmed = ids.map((id) => decodeWith(path.join(__dirname, 'assets', 'vo', id + '.mp3'), TRIM));
  const dur0 = trimmed.map((x) => x.length / SR);
  const raw = dur0.reduce((a, d) => a + d, 0) + sc.DIALOGUE_GAP * Math.max(0, ids.length - 1);
  const scaleNeeded = raw / sc.DIALOGUE_BUDGET;
  const tempo = Math.max(1, Math.min(sc.MAX_TEMPO, scaleNeeded));
  // pass 2: re-decode with the shared tempo only if a speedup is actually needed (keeps cache-free takes crisp)
  const sceneStart = scene(S.n);
  let t = sceneStart + sc.DIALOGUE_LEAD;
  ids.forEach((id, i) => {
    const x = tempo > 1.001 ? decodeWith(path.join(__dirname, 'assets', 'vo', id + '.mp3'), `${TRIM},atempo=${tempo.toFixed(4)}`) : trimmed[i];
    const dur = x.length / SR;
    // level every line to the same loudness (RMS of its voiced part)
    let s2 = 0, c = 0; for (let k = 0; k < x.length; k++) if (Math.abs(x[k]) > 0.01) { s2 += x[k] * x[k]; c++; }
    const g = c ? Math.min(6, 0.12 / Math.sqrt(s2 / c)) : 0;
    const y = new Float32Array(x.length); for (let k = 0; k < x.length; k++) y[k] = x[k] * g;
    voBus.addMono(y, t, 1, 0);
    const meta = sc.VO_TEXT[id];
    const words = Voice.fit(y, wordsOf(meta.text), null).map((w) => ({ w: w.w, t: +(t + w.t).toFixed(3), end: +(t + w.end).toFixed(3) }));
    lines.push({ id, t: +t.toFixed(3), end: +(t + dur).toFixed(3), text: meta.text, who: meta.who, words });
    report.push(`scene ${String(S.n).padStart(2)} ${id.padEnd(4)} raw ${dur0[i].toFixed(2)}s tempo x${tempo.toFixed(2)} final ${dur.toFixed(2)}s  ${t.toFixed(2)} -> ${(t + dur).toFixed(2)}`);
    t += dur + sc.DIALOGUE_GAP;
  });
  const pauseLeft = sceneStart + sc.SCENE - t + sc.DIALOGUE_GAP;
  if (pauseLeft < 1.5) report.push(`  ! scene ${S.n} action beat is short: only ${pauseLeft.toFixed(2)}s left`);
}
fs.writeFileSync(path.join(OUT, 'voice.json'), JSON.stringify({ engine: 'elevenlabs', lines, mouth: Voice.mouthTrack(voBus, sc.FPS) }));

// ---------- the study-room bed: unobtrusive, mostly silent while anyone talks ----------
Genre.play('lofi', { clock, from: 0, to: Math.ceil(DURATION / BEAT / 4) + 1, chordAt, buses: { drums, bass, pad, keys }, gain: 0.5 });
// a soft hat-only texture under dialogue scenes; let the groove breathe a little more in the 5 s action beats
for (const S of sc.SCENES) {
  const startT = scene(S.n);
  // light brushed hats across the whole scene (barely audible, keeps a sense of time passing)
  for (let i = 0; i < 10; i++) drums.addMono(I.hat(i % 3 === 0, i), startT + i * 1.5, 0.03, (i % 2 ? 0.2 : -0.2));
}
// page-turn / pencil / click sounds at the visual beats (one clear sound per cue in score.js markers)
const M = sc.markers;
fx.addMono(I.paperFwip(0.9), M.s1_fall.t, 0.4, -0.2); // the first dropped page lands
fx.addMono(I.pop(1.4), M.s2_task.t, 0.22); // task card pops in (scene 2)
fx.addMono(I.paperFwip(1.1), M.s3_cards.t, 0.3); // the two reading cards laid down
fx.addMono(I.woodTick(1.3), M.s4_mark.t, 0.3); // the highlighter taps the page
fx.addMono(I.scribble(0.3), M.s6_replace.t, 0.35); // the sentence is struck through
fx.addMono(I.pop(1.4), M.s6_task.t, 0.22);
fx.addMono(I.pop(1.5), M.s8_write.t, 0.22); // the full question appears
fx.addMono(I.pop(1.4), M.s9_task.t, 0.22);
fx.addMono(I.paperFwip(0.7), M.s11_flip.t, 0.32); // the page flips past "lebih efektif?"
fx.addMono(I.thud(140, 0.28), M.s12_close.t, 0.4); // the laptop lid
fx.addMono(I.pop(1.3), M.s12_task.t, 0.22);
// a few extra, quieter page-rustle and pencil sounds through the "thinking" beats (not hard sync points)
const extra = [
  [sc.s1.noteOpen, 'paperFwip'], [sc.s3.stickyAt, 'woodTick'], [sc.s5.notesAt, 'paperFwip'], [sc.s5.qmarkAt, 'woodTick'],
  [sc.s7.combineAt, 'paperFwip'], [sc.s9.formDownAt, 'paperFwip'], [sc.s10.sketchAt, 'woodTick'], [sc.s10.linkAt, 'woodTick'],
  [sc.s11.backAt, 'paperFwip'], [sc.s12.bookAt, 'paperFwip'],
];
extra.forEach(([t, kind], i) => {
  const r1 = U.hash(t, i, 1), r2 = U.hash(t, i, 2);
  fx.addMono(kind === 'paperFwip' ? I.paperFwip(0.8 + r1 * 0.3) : I.woodTick(1 + r1 * 0.4), t, 0.18, (r2 - 0.5) * 0.4);
});

// ---------- mix ----------
const music = [drums, bass, pad, keys];
MIX.duck(music, voBus, { depth: 0.65, attack: 0.03, release: 0.25 }); // the bed ducks well under every line
const room = reverb(fx, { room: 0.35, damp: 0.6 });
const stems = { drums, bass, pad, keys, fx, voice: voBus, verb: room };
const GAIN = { drums: 0.5, bass: 0.55, pad: 0.7, keys: 0.6, fx: 1, voice: 1.9, verb: 0.3 };
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? OUT : null });
MIX.highpass(mix, 30);
MIX.fadeOut(mix, DURATION - 1.0, DURATION);
const res = MIX.master(mix, 0.8, 0.78, { lufs: process.env.LUFS ? +process.env.LUFS : -14 }); // ceiling leaves AAC headroom
MIX.writeWav(path.join(OUT, 'music.wav'), mix);
console.log(report.join('\n'));
console.log(`out/music.wav  ${DURATION.toFixed(1)}s  ${res.lufs.toFixed(1)} LUFS  voice: elevenlabs (${lines.length} lines)`);
