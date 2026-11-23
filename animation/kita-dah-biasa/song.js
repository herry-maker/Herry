// THE SOUND: node song.js   (STEMS=1 writes stems, LUFS=-14 sets loudness)
// The dialogue is nine ElevenLabs takes (assets/vo). Each is trimmed, its pauses are shortened and, when
// it still overruns its slot in score.js, its tempo is nudged (never more than MAX_TEMPO) so the cut ends
// at exactly 63 s. Under it: a dry lofi vamp for the meeting that drops dead when the hand goes up (only the
// wall clock ticks), a low pad for the push-back, a music box under the narrator, and the vamp coming back,
// oblivious, for the final slide. Every hit (pen tick, flash, file, labels, stamp) comes from score.js.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const Genre = require('./engine/audio/genres');
const Voice = require('./engine/audio/voice');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev, clock, chordAt } = sc;

const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drums = bus(), bass = bus(), gpad = bus(), keys = bus(), pad = bus(), box = bus(), fx = bus(), voBus = bus();

// ---------- the dialogue ----------
const MAX_TEMPO = 1.22;
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,silenceremove=stop_periods=-1:stop_threshold=-42dB:stop_silence=0.2';
function decodeWith(file, af) {
  const r = spawnSync(process.env.FFMPEG || 'ffmpeg', ['-v', 'error', '-i', file, '-af', af, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`could not decode ${file}: ${String(r.stderr).trim()}`);
  const b = r.stdout;
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
}
const wordsOf = (s) => s.replace(/\s+/g, ' ').trim().split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w));
const lines = [], report = [];
for (const l of sc.vo) {
  const file = path.join(__dirname, 'assets', 'vo', l.id + '.mp3');
  const slot = l.until - l.at;
  let x = decodeWith(file, TRIM);
  const d0 = x.length / SR;
  let tempo = 1;
  if (d0 > slot) { tempo = Math.min(MAX_TEMPO, Math.ceil((d0 / slot) * 100) / 100); x = decodeWith(file, `${TRIM},atempo=${tempo}`); }
  const dur = x.length / SR;
  // every line at the same loudness (RMS of its voiced part)
  let s = 0, c = 0; for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > 0.01) { s += x[i] * x[i]; c++; }
  const g = c ? Math.min(6, 0.12 / Math.sqrt(s / c)) : 0;
  const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
  voBus.addMono(y, l.at, 1, 0);
  const words = Voice.fit(y, wordsOf(l.text), null).map((w) => ({ w: w.w, t: +(l.at + w.t).toFixed(3), end: +(l.at + w.end).toFixed(3) }));
  lines.push({ t: +l.at.toFixed(3), end: +(l.at + dur).toFixed(3), text: l.text, who: l.who, words });
  const over = l.at + dur > l.until + 0.05;
  report.push(`${l.id.padEnd(7)} slot ${slot.toFixed(2)}s  trimmed ${d0.toFixed(2)}s  tempo x${tempo.toFixed(2)}  final ${dur.toFixed(2)}s  ${l.at.toFixed(2)} -> ${(l.at + dur).toFixed(2)}${over ? '  OVER' : ''}`);
}
fs.writeFileSync(path.join(OUT, 'voice.json'), JSON.stringify({ engine: 'elevenlabs', lines, mouth: Voice.mouthTrack(voBus, sc.FPS) }));

// ---------- the meeting vamp: lofi, dry, a little too cheerful ----------
Genre.play('lofi', { clock, from: 0, to: 6, chordAt, buses: { drums, bass, pad: gpad, keys }, gain: 0.7 });
Genre.play('lofi', { clock, from: 23, to: 26, chordAt, buses: { drums, bass, pad: gpad, keys }, gain: 0.8 });
// the slide fills in: a soft tick per item
for (const it of sc.slideItems) fx.addMono(it.kind === 'prog' ? I.pop(0.9) : I.woodTick(1.2), it.t, it.kind === 'prog' ? 0.22 : 0.16, 0.2);
// B photographs the slide
for (const t of [ev.flash1, ev.flash2]) { fx.addMono(I.tvClick(), t, 0.7); fx.addMono(I.pop(2.2), t, 0.25, -0.2); }
// the hand goes up: a pen set down, then the music is simply gone
fx.addMono(I.woodTick(1.5), ev.hand, 0.55); fx.addMono(I.paperFwip(0.7), ev.hand + 0.01, 0.35);
// only the wall clock, on the beat
sc.ticks.forEach((t, i) => fx.addMono(I.woodTick(i % 2 ? 1.25 : 1), t, 0.2, i % 2 ? 0.35 : -0.35));
// what C asks for: three music-box notes
for (const ic of sc.icons) { box.addMono(I.musicBox(ic.midi, { decay: 1.6 }), ic.t, 0.32); }
// the push-back: a low pad and sparse, dim e-piano chords on the bar lines
{ const { L, R } = I.padNote(m('A2'), ev.chairClose - ev.pushback + 0.6, { cutoff: 520, attack: 1.4, release: 1.2 }); pad.addStereo(L, R, ev.pushback - 0.1, 0.26); }
// the timetable: a paper fwip per admin block, a shove for the research note, a thud for the meeting
sc.sheetBlocks.forEach((b, i) => fx.addMono(I.paperFwip(0.9 + i * 0.06), b.t, 0.34, (b.cell[0] - 2) * 0.2));
fx.addMono(I.noiseSweep(0.32, 1800, 500, { q: 1.2, pink: true }), sc.shove, 0.3, 0.3); fx.addMono(I.paperFwip(0.6), sc.shove + 0.05, 0.25, 0.4);
fx.addMono(I.thud(120, 0.25), sc.lastBlock.t, 0.5, 0.3);
// the chair closes the file
fx.addMono(I.thud(90, 0.35), ev.chairClose, 0.95); fx.addMono(I.paperFwip(0.5), ev.chairClose + 0.01, 0.4);
// "kita kena positif": a warm major pad and an ironic little e-piano arpeggio; a pop per nod
for (const n of ['C4', 'E4', 'G4', 'B4']) { const { L, R } = I.padNote(m(n), ev.freeze - ev.chairClose, { cutoff: 900, attack: 0.5, release: 1 }); pad.addStereo(L, R, ev.chairClose + 0.2, 0.06); }
['C4', 'E4', 'G4', 'B4', 'D5'].forEach((n, i) => keys.addMono(I.epiano(m(n), 1.2, { decay: 1.2 }), 40.3 + i * 0.14, 0.11));
sc.nods.forEach((t, i) => fx.addMono(I.pop(1.3 + i * 0.12), t, 0.22, (i % 2 ? 0.3 : -0.3)));
// the freeze: the labels slam in; a dark pad and a music box under the narrator
for (const t of [ev.label1, ev.label2]) { fx.addMono(I.thwack(), t, 0.7); fx.addMono(I.thud(70, 0.4), t, 0.6); }
{ const { L, R } = I.padNote(m('A2'), ev.resume - ev.freeze, { cutoff: 420, attack: 0.8, release: 1.5 }); pad.addStereo(L, R, ev.freeze, 0.22); }
{ const { L, R } = I.padNote(m('E3'), ev.resume - ev.freeze, { cutoff: 420, attack: 1.2, release: 1.5 }); pad.addStereo(L, R, ev.freeze + 0.3, 0.12); }
const tune = ['E5', 'C5', 'B4', 'A4', null, 'E5', 'D5', 'C5', 'B4', null, 'A4', 'G4', 'A4', null, null, null];
tune.forEach((n, i) => { if (n) box.addMono(I.musicBox(m(n), { decay: 1.4 }), 46.2 + i * BEAT, 0.15, (i % 2 ? 0.25 : -0.25)); });
// colour comes back: a click, and the vamp again
fx.addMono(I.tvClick(), ev.resume, 0.7); fx.addMono(I.pop(1.6), ev.resume, 0.25);
// LULUS
fx.addMono(I.thwack(), ev.stamp, 1.0); fx.addMono(I.thud(60, 0.5), ev.stamp, 0.8); fx.addMono(I.subBoom(0.6, 80, 40), ev.stamp, 0.4);
// the last card: one held, unresolved chord
for (const n of ['A2', 'E3', 'A3', 'B3', 'C4']) { const { L, R } = I.padNote(m(n), DURATION - ev.endText, { cutoff: 700, attack: 0.25, release: 0.8 }); pad.addStereo(L, R, ev.endText, 0.07); }

// ---------- mix ----------
const vamp = [drums, bass, gpad, keys];
for (const b of vamp) { MIX.gate(b, ev.hand, ev.resume, 0.01); MIX.gate(b, ev.stamp, DURATION, 0.01); }
// the dim e-piano chords of the push-back go in `pad` (not gated with the vamp)
for (const tb of [26.4, 28.8, 31.2, 33.6, 36.0]) for (const n of chordAt(tb).notes) pad.addMono(I.epiano(n - 12, 1.6, { decay: 1.3, index: 1.2 }), tb, 0.055);
const music = [...vamp, pad, box];
MIX.duck(music, voBus, { depth: 0.6 });
const room = reverb(box, { room: 0.7, damp: 0.5 });
const stems = { drums, bass, gpad, keys, pad, box, fx, voice: voBus, verb: room };
const GAIN = { drums: 0.9, bass: 0.7, gpad: 0.8, keys: 0.8, pad: 1, box: 1.2, fx: 1, voice: 1.9, verb: 0.35 };
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? OUT : null });
MIX.highpass(mix, 30);
MIX.fadeOut(mix, DURATION - 0.5, DURATION);
const res = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? +process.env.LUFS : -14 });
MIX.writeWav(path.join(OUT, 'music.wav'), mix);
console.log(report.join('\n'));
console.log(`out/music.wav  ${DURATION.toFixed(1)}s  ${res.lufs.toFixed(1)} LUFS  voice: elevenlabs (${lines.length} lines)`);
