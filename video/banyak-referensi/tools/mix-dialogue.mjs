// mix-dialogue.mjs — replace the dialogue spans of the narrator master with role recordings,
// then write the new master and a re-timed timing file for build-project.mjs.
//
//   node tools/mix-dialogue.mjs --master audio/narasi.wav --timing audio/timing.json --cues audio/cues.json \
//        --spec audio/dialogue/spec.json --out-audio audio/narasi-mix.wav --out-timing audio/timing-mix.json
//
// spec.json: [{ "role": "Vidka", "voice": "...", "file": "audio/dialogue/v1.mp3", "cues": [2, 3] }, ...]
// Each utterance's span in the master runs from the midpoint of the pause before its first cue to the
// midpoint of the pause after its last cue (cue times come from the word-aligned timing file). The span is
// replaced by the trimmed clip; everything after shifts by the duration difference. Dialogue cue times are
// placed inside the clip (one cue = whole clip; several cues = split by character share).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const MASTER = arg('--master', 'audio/narasi.wav'), OUT_AUDIO = arg('--out-audio', 'audio/narasi-mix.wav'), OUT_TIMING = arg('--out-timing', 'audio/timing-mix.json');
const timing = JSON.parse(fs.readFileSync(arg('--timing', 'audio/timing.json'), 'utf8'));
const cues = JSON.parse(fs.readFileSync(arg('--cues', 'audio/cues.json'), 'utf8'));
const spec = JSON.parse(fs.readFileSync(arg('--spec', 'audio/dialogue/spec.json'), 'utf8')).sort((a, b) => a.cues[0] - b.cues[0]);
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostats', ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
const ffInfo = (args) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], {encoding: 'utf8'}); return String(r.stderr || '') + String(r.stdout || ''); }; // ffmpeg reports filters on stderr
const duration = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}).trim();
const meanVolume = f => { const m = ffInfo(['-i', f, '-af', 'volumedetect', '-f', 'null', '-']).match(/mean_volume: (-?[\d.]+) dB/); return m ? +m[1] : null; };

const masterDur = duration(MASTER), masterVol = meanVolume(MASTER);
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(OUT_AUDIO)), '.mix-'));

// 1. prepare clips: 48 kHz mono, trimmed to speech with small pads, level-matched to the master
const utter = spec.map((u, n) => {
  const wav = path.join(tmp, `clip-${n}.wav`);
  ff(['-y', '-i', u.file, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
  const dur = duration(wav);
  const det = ffInfo(['-i', wav, '-af', 'silencedetect=noise=-42dB:d=0.15', '-f', 'null', '-']);
  const starts = [...det.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1]), ends = [...det.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1]);
  let speechStart = 0, speechEnd = dur;
  if (starts.length && starts[0] < 0.05 && ends.length) speechStart = ends[0];                // leading silence
  if (starts.length && starts.at(-1) > dur - 1.5 && (ends.length < starts.length || ends.at(-1) >= dur - 0.06)) speechEnd = starts.at(-1); // trailing silence (runs to the end of the file)
  const t0 = Math.max(0, speechStart - 0.12), t1 = Math.min(dur, speechEnd + 0.22);
  // level-match against the narrator's own speech in the span being replaced, not the whole file (pauses bias the mean)
  const first0 = u.cues[0], last0 = u.cues.at(-1);
  const spanVolRaw = ffInfo(['-i', MASTER, '-af', `atrim=${timing.cues[first0].start}:${timing.cues[last0].end},volumedetect`, '-f', 'null', '-']).match(/mean_volume: (-?[\d.]+) dB/);
  const spanVol = spanVolRaw ? +spanVolRaw[1] : masterVol;
  const volRaw = ffInfo(['-i', wav, '-af', `atrim=${speechStart}:${speechEnd},volumedetect`, '-f', 'null', '-']).match(/mean_volume: (-?[\d.]+) dB/);
  const vol = volRaw ? +volRaw[1] : null, gainDb = spanVol !== null && vol !== null ? Math.max(-12, Math.min(12, spanVol - vol)) : 0;
  const trimmed = path.join(tmp, `clip-${n}-trim.wav`);
  ff(['-y', '-i', wav, '-af', `atrim=${t0}:${t1},asetpts=PTS-STARTPTS,volume=${gainDb.toFixed(2)}dB,afade=t=in:d=0.03,afade=t=out:st=${Math.max(0, t1 - t0 - 0.05).toFixed(3)}:d=0.05`, '-ar', '48000', '-ac', '1', trimmed]);
  const first = u.cues[0], last = u.cues.at(-1);
  const prevEnd = first > 0 ? timing.cues[first - 1].end : 0, nextStart = last + 1 < timing.cues.length ? timing.cues[last + 1].start : masterDur;
  const S = (prevEnd + timing.cues[first].start) / 2, E = (timing.cues[last].end + nextStart) / 2;
  return {...u, wav: trimmed, clipDur: duration(trimmed), S, E, gainDb: +gainDb.toFixed(2), speechWindow: [+t0.toFixed(2), +t1.toFixed(2)]};
});

// 2. build the new master: master[0:S1] clip1 master[E1:S2] clip2 ... master[En:end]
const inputs = ['-i', MASTER]; utter.forEach(u => inputs.push('-i', u.wav));
const parts = []; let filt = '', cursor = 0, k = 0;
const seg = (a, b) => { filt += `[0:a]atrim=${a.toFixed(4)}:${b.toFixed(4)},asetpts=PTS-STARTPTS[m${k}];`; parts.push(`[m${k}]`); k++; };
utter.forEach((u, n) => { seg(cursor, u.S); parts.push(`[${n + 1}:a]`); cursor = u.E; });
seg(cursor, masterDur);
filt += `${parts.join('')}concat=n=${parts.length}:v=0:a=1[out]`;
ff(['-y', ...inputs, '-filter_complex', filt, '-map', '[out]', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', OUT_AUDIO]);
const newDur = Math.floor(duration(OUT_AUDIO) * 1000) / 1000; // floor so no cue or bed can end past the probed length

// 3. re-time cues
const shiftAt = t => { let d = 0; for (const u of utter) { if (t >= u.E) d += u.clipDur - (u.E - u.S); } return t + d; };
const newCues = timing.cues.map(c => ({start: shiftAt(c.start), end: shiftAt(c.end)}));
for (const u of utter) {
  const start = shiftAt(u.S - 1e-6) ; // position of the clip in the new master
  const clipStart = start + 0.10, clipEnd = start + u.clipDur - 0.18;
  const texts = u.cues.map(i => cues[i].text.replace(/^\w+: /, ''));
  const chars = texts.map(t => t.length), total = chars.reduce((a, b) => a + b, 0);
  let t = clipStart;
  u.cues.forEach((i, j) => { const len = (clipEnd - clipStart) * chars[j] / total; newCues[i] = {start: +t.toFixed(3), end: +(t + len - (j < u.cues.length - 1 ? 0.06 : 0)).toFixed(3)}; t += len; });
}
for (let i = 1; i < newCues.length; i++) if (newCues[i].start < newCues[i - 1].end + 0.02) newCues[i - 1].end = Math.max(newCues[i - 1].start + 0.3, newCues[i].start - 0.02);
const sceneStarts = [];
cues.forEach((c, k2) => { if (sceneStarts[c.scene - 1] === undefined) sceneStarts[c.scene - 1] = k2 === 0 ? 0 : Math.max(0, newCues[k2].start - 0.25); });
const scenes = sceneStarts.map((s, i) => ({start: +s.toFixed(3), end: +((sceneStarts[i + 1] ?? newDur)).toFixed(3)}));
fs.writeFileSync(OUT_TIMING, JSON.stringify({mode: 'words+dialogue-insert', duration: +newDur.toFixed(3), voice: path.relative(path.dirname(path.resolve(OUT_TIMING)) + '/..', path.resolve(OUT_AUDIO)).replace(/\\/g, '/'), scenes, cues: newCues.map(c => ({start: +c.start.toFixed(3), end: +c.end.toFixed(3)})),
  note: 'Narrator cue times are word-aligned (Scribe) and shifted by the inserted role clips; dialogue cue times are placed inside each clip by character share.',
  dialogue: utter.map(u => ({role: u.role, voice: u.voice, file: u.file, cues: u.cues, replaced_span: [+u.S.toFixed(3), +u.E.toFixed(3)], clip_seconds: +u.clipDur.toFixed(3), gain_db: u.gainDb, speech_window: u.speechWindow}))}, null, 1));
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`master ${masterDur.toFixed(2)}s → ${OUT_AUDIO} ${newDur.toFixed(2)}s; ${utter.length} utterances replaced`);
utter.forEach(u => console.log(`  ${u.role.padEnd(8)} cues ${u.cues.join(',')}  span ${u.S.toFixed(2)}–${u.E.toFixed(2)} (${(u.E - u.S).toFixed(2)}s) → clip ${u.clipDur.toFixed(2)}s, gain ${u.gainDb} dB`));
