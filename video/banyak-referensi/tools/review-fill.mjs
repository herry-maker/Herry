// review-fill.mjs — turn an independent reviewer's findings into the upstream review schema.
//
//   node tools/review-fill.mjs --template output/preview-reference/review-template.json \
//        --evidence output/preview-reference/evidence.json --findings review/findings-preview.json \
//        --out review/preview-review.json
//
// findings.json (written by the reviewer, not by the author):
// {
//   "reviewer": {"id": "...", "kind": "agent", "method": "..."},
//   "full_playback": {"viewed_ranges": [{"start":0,"end":60}], "observations": [{"time": 12.3, "detail": "..."}]},
//   "baseline": [{"reference_id": "b1-ryan-v4", "start": 0, "end": 21.3, "observations": [{"time": 3.1, "detail": "..."}]}],
//   "blocking_issues": [],
//   "shots": {"shot-0": {"drawing_character": {"status": "pass|unmet", "observations": [{"time": 1.0, "detail": "...", "phase": "mid"}],
//                                            "comparison": {"reference_id": "b1-ryan-v4", "start": 0, "end": 5, "detail": "..."}}, ...}}
// }
// Only plumbing happens here: evidence ids are attached from the ledger; no status or text is invented.
import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const template = JSON.parse(fs.readFileSync(arg('--template'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(arg('--evidence'), 'utf8'));
const f = JSON.parse(fs.readFileSync(arg('--findings'), 'utf8'));
const out = arg('--out');
const phaseId = (shot, phase) => evidence.artifacts.find(a => a.shot === shot && (a.phase === phase || (phase === 'continuous' && a.type === 'clip')))?.id;
const review = {
  ...template,
  reviewer: {id: f.reviewer.id, kind: f.reviewer.kind || 'agent', method: f.reviewer.method, independent: true},
  full_playback: {status: 'pass', viewed_ranges: f.full_playback.viewed_ranges, observations: f.full_playback.observations.map(o => ({time: o.time, detail: o.detail, evidence_ids: ['source-video']}))},
  baseline_comparisons: f.baseline.map(b => ({reference_id: b.reference_id, start: b.start, end: b.end, observations: b.observations.map(o => ({time: o.time, detail: o.detail, evidence_ids: [b.reference_id]}))})),
  blocking_issues: f.blocking_issues || [],
  shots: template.shots.map(s => {
    const fs_ = f.shots[s.id]; if (!fs_) throw new Error(`findings missing ${s.id}`);
    const checks = {};
    for (const k of Object.keys(s.checks)) {
      const c = fs_[k]; if (!c) throw new Error(`findings missing ${s.id}.${k}`);
      const observations = c.observations.map(o => ({time: o.time, detail: o.detail, evidence_ids: [phaseId(s.id, 'continuous'), ...(o.phase ? [phaseId(s.id, o.phase)] : [])].filter(Boolean)}));
      const comparisons = c.comparison ? [c.comparison] : (c.comparisons || []);
      checks[k] = {status: c.status, observations, comparisons};
    }
    return {id: s.id, checks};
  }),
};
fs.writeFileSync(out, JSON.stringify(review, null, 1));
console.log(`wrote ${out}: ${review.shots.length} shots, reviewer ${review.reviewer.id}`);
