// build-audio.mjs — assemble the dialogue master from per-line clips and write the timing file.
//
//   node tools/build-audio.mjs [--clips audio/lines] [--out-audio audio/narasi-dialog.wav] [--out-timing audio/timing-dialog.json]
//
// Timeline per scene: line1, GAP, line2, GAP, ..., then silence until max(SCENE_MIN, speechEnd + HOLD).
// Clips are trimmed to speech (small pads), level-matched to one target, and never time-stretched.
// Cue times: a line with one cue spans the clip; several cues split at the clip's own internal pauses
// (longest ones, in order) or, failing that, by character share.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {SCENES, LINES, HOLD, GAP, SCENE_MIN} from './script.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const CLIPS = arg('--clips', 'audio/lines'), OUT_AUDIO = arg('--out-audio', 'audio/narasi-dialog.wav'), OUT_TIMING = arg('--out-timing', 'audio/timing-dialog.json');
const TARGET_DB = -24; // mean speech level for every voice
const ff = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostats', ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
const ffInfo = args => { const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], {encoding: 'utf8'}); return String(r.stderr || '') + String(r.stdout || ''); };
const duration = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}).trim();
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(OUT_AUDIO)), '.build-'));

// 1. prepare clips
const prepared = {};
for (const l of LINES) {
  const src = path.join(CLIPS, l.id + '.mp3');
  if (!fs.existsSync(src)) throw new Error(`missing clip ${src}`);
  const wav = path.join(tmp, l.id + '.wav');
  ff(['-y', '-i', src, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
  const dur = duration(wav);
  const det = ffInfo(['-i', wav, '-af', 'silencedetect=noise=-42dB:d=0.12', '-f', 'null', '-']);
  const sil = [...det.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map(m => [+m[1], +m[2]]);
  let s0 = 0, s1 = dur;
  if (sil.length && sil[0][0] < 0.03) s0 = sil[0][1];
  if (sil.length && sil.at(-1)[1] > dur - 0.03) s1 = sil.at(-1)[0];
  const t0 = Math.max(0, s0 - 0.08), t1 = Math.min(dur, s1 + 0.16);
  const volM = ffInfo(['-i', wav, '-af', `atrim=${s0}:${s1},volumedetect`, '-f', 'null', '-']).match(/mean_volume: (-?[\d.]+) dB/);
  const gain = volM ? Math.max(-12, Math.min(12, TARGET_DB - +volM[1])) : 0;
  const out = path.join(tmp, l.id + '-ready.wav');
  ff(['-y', '-i', wav, '-af', `atrim=${t0}:${t1},asetpts=PTS-STARTPTS,volume=${gain.toFixed(2)}dB,afade=t=in:d=0.02,afade=t=out:st=${Math.max(0, t1 - t0 - 0.06).toFixed(3)}:d=0.06`, '-ar', '48000', '-ac', '1', out]);
  // internal pauses of the trimmed clip (for multi-cue lines)
  const det2 = ffInfo(['-i', out, '-af', 'silencedetect=noise=-38dB:d=0.16', '-f', 'null', '-']);
  const pauses = [...det2.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map(m => [+m[1], +m[2]]).filter(([a, b]) => a > 0.25 && b < duration(out) - 0.25);
  prepared[l.id] = {file: out, dur: duration(out), gain: +gain.toFixed(2), speechWindow: [+t0.toFixed(2), +t1.toFixed(2)], pauses};
}

// 2. timeline
const inputs = [], parts = []; let filt = '', n = 0, T = 0;
const silence = d => { inputs.push('-f', 'lavfi', '-t', d.toFixed(3), '-i', 'anullsrc=r=48000:cl=mono'); parts.push(`[${n++}:a]`); };
const clip = f => { inputs.push('-i', f); parts.push(`[${n++}:a]`); };
const scenes = [], cues = [], lineLedger = [];
SCENES.forEach((sc, i) => {
  const start = T; let t = T; const lines = [];
  sc.lines.forEach((l, j) => {
    const id = LINES.find(x => x.scene === i + 1 && x.index === j).id, p = prepared[id];
    if (j > 0) { silence(GAP); t += GAP; }
    clip(p.file);
    const lineStart = t, lineEnd = t + p.dur;
    // cue boundaries
    const k = l.cues.length; let bounds = [];
    let splitMode = 'single';
    if (k > 1) {
      // expected boundary from character share, then snap to the nearest unused internal pause (within 0.6 s)
      const chars = l.cues.map(c => c.replace(/^\w+: /, '').length), tot = chars.reduce((x, y) => x + y, 0);
      let acc = 0; const used = new Set(); splitMode = 'chars';
      bounds = chars.slice(0, -1).map(c => {
        acc += c; const expect = (p.dur - 0.16) * acc / tot;
        let best = -1, bd = 0.6;
        p.pauses.forEach(([a, b], idx) => { const mid = (a + b) / 2, d = Math.abs(mid - expect); if (!used.has(idx) && d < bd) { bd = d; best = idx; } });
        if (best > -1) { used.add(best); splitMode = 'pauses'; return (p.pauses[best][0] + p.pauses[best][1]) / 2; }
        return expect;
      });
    }
    const edges = [0.0, ...bounds, p.dur - 0.10];
    l.cues.forEach((text, c) => cues.push({start: +(lineStart + edges[c] + (c ? 0.03 : 0)).toFixed(3), end: +(lineStart + edges[c + 1] - (c < k - 1 ? 0.03 : 0)).toFixed(3), text, scene: i + 1, line: id}));
    lines.push({id, role: l.role, start: +lineStart.toFixed(3), end: +lineEnd.toFixed(3), gain_db: p.gain, cue_split: splitMode});
    lineLedger.push(lines.at(-1));
    t = lineEnd;
  });
  const speechEnd = t, end = Math.max(start + SCENE_MIN, speechEnd + HOLD);
  silence(end - speechEnd);
  scenes.push({start: +start.toFixed(3), end: +end.toFixed(3), talk_end: +speechEnd.toFixed(3), hold: +(end - speechEnd).toFixed(3), lines});
  T = end;
});
filt = `${parts.join('')}concat=n=${parts.length}:v=0:a=1[out]`;
ff(['-y', ...inputs, '-filter_complex', filt, '-map', '[out]', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', OUT_AUDIO]);
const total = Math.floor(duration(OUT_AUDIO) * 1000) / 1000;
scenes.at(-1).end = total;
for (let i = 1; i < cues.length; i++) if (cues[i].start < cues[i - 1].end + 0.02) cues[i - 1].end = +Math.max(cues[i - 1].start + 0.3, cues[i].start - 0.02).toFixed(3);
fs.writeFileSync(OUT_TIMING, JSON.stringify({mode: 'dialogue-clips', duration: total, voice: path.relative(path.resolve('.'), path.resolve(OUT_AUDIO)).replace(/\\/g, '/'), hold_seconds: HOLD, gap_seconds: GAP, scenes, cues,
  note: 'Each line is its own recording placed on the timeline; cue times come from clip boundaries (and the clips\' internal pauses for multi-cue lines), so they are exact to the recordings.'}, null, 1));
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`${OUT_AUDIO}: ${total.toFixed(2)}s, ${cues.length} cues → ${OUT_TIMING}`);
scenes.forEach((s, i) => console.log(`  scene ${String(i + 1).padStart(2)}  ${s.start.toFixed(2)}–${s.end.toFixed(2)}  talk ${(s.talk_end - s.start).toFixed(1)}s  hold ${s.hold.toFixed(1)}s  ${s.lines.map(l => `${l.role[0]}${(l.end - l.start).toFixed(1)}`).join(' ')}`));
