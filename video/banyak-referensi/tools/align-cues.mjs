// align-cues.mjs — time the 61 caption cues and 12 scene boundaries against the real narration.
//
//   node tools/align-cues.mjs --cues audio/cues.json --silences audio/take1/silences.txt \
//        --duration 170.295 [--words audio/take1/words.json] --out audio/timing.json
//
// Two modes:
//   words    exact: per-word timestamps ({words:[{start,end,word|text}]}) are matched to the cue texts in order.
//   silence  approximate: speech segments between detected pauses; cues are placed by cumulative character
//            share of speech time and snapped to the nearest segment edge. Disclosed as approximate in the output.
import fs from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const cues = JSON.parse(fs.readFileSync(arg('--cues'), 'utf8'));            // [{scene, text}]
const duration = Number(arg('--duration'));
const out = arg('--out', 'audio/timing.json');
const norm = s => s.toLowerCase().replace(/^(vidka|herry|ardipal|pemain): /, '').replace(/[«»"“”'’.,:;!?()]/g, ' ').replace(/\s+/g, ' ').trim();

let timed, mode;
if (arg('--words')) {
  mode = 'words';
  const raw = JSON.parse(fs.readFileSync(arg('--words'), 'utf8'));
  const words = (raw.words || raw).filter(w => (w.word ?? w.text ?? '').trim() && (w.type === undefined || w.type === 'word')).map(w => ({start: +w.start, end: +w.end, t: norm(w.word ?? w.text)})).filter(w => w.t);
  // Global alignment (Needleman-Wunsch) between all cue tokens and the transcript words, so a
  // transcription variant ("ke-12" for "kedua belas") costs one gap instead of derailing the match.
  const toks = []; cues.forEach((c, k) => norm(c.text).split(' ').forEach(t => toks.push({t, k})));
  const sim = (a, b) => a === b ? 2 : (a.startsWith(b) || b.startsWith(a)) && Math.min(a.length, b.length) >= 3 ? 1 : -1;
  const n = toks.length, m = words.length, GAP = -1;
  const S = Array.from({length: n + 1}, () => new Float64Array(m + 1)), B = Array.from({length: n + 1}, () => new Uint8Array(m + 1));
  for (let i = 1; i <= n; i++) { S[i][0] = i * GAP; B[i][0] = 1; }
  for (let j = 1; j <= m; j++) { S[0][j] = j * GAP; B[0][j] = 2; }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const d = S[i - 1][j - 1] + sim(toks[i - 1].t, words[j - 1].t), u = S[i - 1][j] + GAP, l = S[i][j - 1] + GAP;
    if (d >= u && d >= l) { S[i][j] = d; B[i][j] = 0; } else if (u >= l) { S[i][j] = u; B[i][j] = 1; } else { S[i][j] = l; B[i][j] = 2; }
  }
  const match = new Array(n).fill(-1);
  for (let i = n, j = m; i > 0 || j > 0;) { const b = B[i][j]; if (b === 0) { if (sim(toks[i - 1].t, words[j - 1].t) > 0) match[i - 1] = j - 1; i--; j--; } else if (b === 1) i--; else j--; }
  timed = cues.map(() => ({start: null, end: null}));
  toks.forEach((tk, i) => { const j = match[i]; if (j < 0) return; const c = timed[tk.k]; c.start = c.start === null ? words[j].start : Math.min(c.start, words[j].start); c.end = c.end === null ? words[j].end : Math.max(c.end, words[j].end); });
  const unmatched = timed.map((c, k) => c.start === null ? k : -1).filter(k => k >= 0);
  if (unmatched.length) throw new Error('cues with no matched words: ' + unmatched.map(k => cues[k].text).join(' | '));
  for (let k = 1; k < timed.length; k++) if (timed[k].start < timed[k - 1].end + 0.02) timed[k - 1].end = Math.max(timed[k - 1].start + 0.3, timed[k].start - 0.02);
  const matched = match.filter(j => j >= 0).length;
  console.error(`matched ${matched}/${n} cue tokens to ${m} words`);
} else {
  mode = 'silence-approximate';
  const sil = fs.readFileSync(arg('--silences'), 'utf8').trim().split('\n').map(l => l.split(/\s+/)).map(a => [+a[0], +a[1]]);
  const seg = []; let t = 0;
  for (const [a, b] of sil) { if (a - t > 0.05) seg.push([t, a]); t = b; }
  if (duration - t > 0.05) seg.push([t, duration]);
  const speech = seg.reduce((s, [a, b]) => s + (b - a), 0);
  const chars = cues.map(c => norm(c.text).length + 1), total = chars.reduce((a, b) => a + b, 0);
  // position of each speech onset on the "speech-time" axis (pauses removed)
  const onsetPos = []; let acc = 0;
  for (const [a, b] of seg) { onsetPos.push(acc); acc += b - a; }
  const toReal = st => { let acc = 0; for (const [a, b] of seg) { if (st <= acc + (b - a)) return a + (st - acc); acc += b - a; } return duration; };
  // Monotonic assignment: cue k starts at the unused onset whose speech-time position is nearest its
  // expected position (cumulative character share); when the nearest free onset is far, split the segment.
  let cum = 0, j = -1; timed = [];
  for (let k = 0; k < cues.length; k++) {
    const expect = cum / total * speech; cum += chars[k];
    if (k === 0) { timed.push({start: 0, seg: 0}); j = 0; continue; }
    let best = -1, bd = Infinity;
    for (let i = j + 1; i < seg.length; i++) { const d = Math.abs(onsetPos[i] - expect); if (d < bd) { bd = d; best = i; } }
    const tol = Math.max(0.9, chars[k] / total * speech * 0.6);
    if (best > -1 && bd <= tol) { timed.push({start: seg[best][0], seg: best}); j = best; }
    else timed.push({start: Math.max(toReal(expect), timed[k - 1].start + 0.5), seg: j});
  }
  for (let k = 0; k < timed.length; k++) {
    const next = k + 1 < timed.length ? timed[k + 1] : {start: duration, seg: seg.length};
    // end at the pause before the next cue's segment, or just before a same-segment split
    const e = next.seg > timed[k].seg ? seg[next.seg - 1][1] : next.start - 0.05;
    timed[k].end = Math.max(timed[k].start + 0.3, Math.min(e, next.start - 0.05));
  }
}
// scene boundaries: a scene starts where its first cue starts (scene 1 at 0); last scene ends at duration
const sceneStarts = [];
cues.forEach((c, k) => { if (sceneStarts[c.scene - 1] === undefined) sceneStarts[c.scene - 1] = k === 0 ? 0 : Math.max(0, timed[k].start - 0.25); });
const scenes = sceneStarts.map((s, i) => ({start: +s.toFixed(3), end: +((sceneStarts[i + 1] ?? duration)).toFixed(3)}));
const result = {mode, duration, voice: arg('--voice', 'audio/narasi.wav'), scenes, cues: timed.map(c => ({start: +c.start.toFixed(3), end: +c.end.toFixed(3)})),
  note: mode === 'words' ? 'Cue times come from per-word timestamps of the actual recording.' : 'APPROXIMATE: cue times derive from detected pauses and character share, not forced alignment. Review against playback; replace with word timestamps when available.'};
fs.writeFileSync(out, JSON.stringify(result, null, 1));
console.log(`${mode}: ${scenes.length} scenes, ${timed.length} cues → ${out}`);
scenes.forEach((s, i) => console.log(`  scene ${String(i + 1).padStart(2)}  ${s.start.toFixed(2)} – ${s.end.toFixed(2)}  (${(s.end - s.start).toFixed(1)}s)`));
