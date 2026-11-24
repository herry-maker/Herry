// Diagnostic: reproduce the renderer's motion-interval rule and print gaps > 2.5 s.
import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync(process.argv[2] || 'project.json', 'utf8'));
const D = {x: 2, y: 2, angle: .02, progress: .02, w: 2};
const iv = [];
for (const s of p.shots) for (const l of s.layers) {
  if (!l.motion || !l.keys) continue;
  for (const [prop, d] of Object.entries(D)) { const k = l.keys.filter(k => k[prop] !== undefined); for (let i = 1; i < k.length; i++) { const a = s.start + Math.max(k[i-1].t, l.from ?? 0), b = s.start + Math.min(k[i].t, l.to ?? (s.end - s.start)); if (b > a && Math.abs(k[i][prop] - k[i-1][prop]) >= d) iv.push([a, b, l.id]); } }
}
iv.sort((a, b) => a[0] - b[0]);
let end = 0; const gaps = [];
for (const [a, b, id] of iv) { if (a - end > 2.5) gaps.push([end, a]); end = Math.max(end, b); }
if (p.shots.at(-1).end - end > 2.5) gaps.push([end, p.shots.at(-1).end]);
const scene = t => Math.floor(t / 15) + 1;
for (const [a, b] of gaps) console.log(`gap ${a.toFixed(2)} → ${b.toFixed(2)} (${(b - a).toFixed(2)}s)  scene ${scene(a)}`);
console.log(gaps.length ? `${gaps.length} gaps` : 'no gaps > 2.5s');
