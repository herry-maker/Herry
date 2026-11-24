// import-art.mjs — turn a generated character pose sheet (grid on white) into the project's
// transparent PNGs, keeping each target file's canvas ratio so project.json needs no change.
//
//   node tools/import-art.mjs --sheet sheet.png --cols 3 --rows 3 --names vidka-type,vidka-sigh,... [--out art] [--pad 0.06]
//
// Steps per cell: crop the grid cell, find the ink bounding box (dark pixels), make white transparent
// (luminance → alpha, so anti-aliased edges stay smooth), then place the figure bottom-aligned on a
// canvas with the ORIGINAL file's width:height ratio (read from the existing PNG in --out).
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import os from 'node:os';
const CACHE = process.env.B6_UPSTREAM_DIR || path.join(os.homedir(), '.cache', 'stickman-video-director');
const SKILL_DIR = process.env.SKILL_DIR || path.join(CACHE, 'skills', 'directing-stickman-videos');
const {createCanvas, loadImage} = createRequire(path.join(SKILL_DIR, 'package.json'))('@napi-rs/canvas');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const sheetPath = arg('--sheet'), cols = +arg('--cols', 3), rows = +arg('--rows', 3), names = arg('--names').split(','), OUT = arg('--out', 'art'), PAD = +arg('--pad', 0.06), INSET = +arg('--inset', 0.03);
const SCALE = 2; // project PNGs are drawn at 2x
if (names.length !== cols * rows) throw new Error(`need ${cols * rows} names, got ${names.length}`);

const sheet = await loadImage(sheetPath);
const sc = createCanvas(sheet.width, sheet.height), sctx = sc.getContext('2d'); sctx.drawImage(sheet, 0, 0);
const data = sctx.getImageData(0, 0, sheet.width, sheet.height).data;
const lum = (x, y) => { const i = (y * sheet.width + x) * 4; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };

// Grid lines are light gray; find column/row separators as the lightest-but-not-white long lines near the expected positions.
const cellW = sheet.width / cols, cellH = sheet.height / rows;
function inkBox(x0, y0, x1, y1) {
  let minX = x1, minY = y1, maxX = x0, maxY = y0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (lum(x, y) < 140) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  return maxX > minX ? [minX, minY, maxX + 1, maxY + 1] : null;
}
const report = [];
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
  const name = names[r * cols + c]; if (!name || name === '-') continue;
  // inset the cell to stay clear of the separator lines
  const x0 = Math.round(c * cellW + cellW * INSET), x1 = Math.round((c + 1) * cellW - cellW * INSET);
  const y0 = Math.round(r * cellH + cellH * INSET), y1 = Math.round((r + 1) * cellH - cellH * INSET);
  const box = inkBox(x0, y0, x1, y1);
  if (!box) { report.push(`${name}: EMPTY cell`); continue; }
  const [bx0, by0, bx1, by1] = box, bw = bx1 - bx0, bh = by1 - by0;
  const target = path.join(OUT, name + '.png');
  const prev = fs.existsSync(target) ? await loadImage(target) : null;
  const ratio = prev ? prev.width / prev.height : bw / bh; // keep the original canvas ratio
  // output canvas: figure height = (1 - 2*PAD) of canvas height, bottom aligned, centered horizontally
  const H = Math.round(bh / (1 - 2 * PAD)), W = Math.max(Math.round(H * ratio), Math.round(bw * 1.08));
  const outH = Math.round(W / ratio), out = createCanvas(W, outH), ctx = out.getContext('2d');
  const dx = Math.round((W - bw) / 2), dy = outH - Math.round(outH * PAD) - bh;
  ctx.drawImage(sc, bx0, by0, bw, bh, dx, dy, bw, bh);
  const img = ctx.getImageData(0, 0, W, outH), px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
    if (px[i + 3] === 0) continue;
    if (sat > 28) { px[i + 3] = 255; continue; }                                                     // coloured fills (pencil, marker, beige) stay as drawn
    const a = l > 185 ? 0 : Math.max(0, Math.min(255, Math.round((235 - l) / 235 * 255 * 1.15)));   // white and light-gray grid lines → 0, ink → 255
    px[i] = px[i + 1] = px[i + 2] = l < 120 ? 25 : Math.round(px[i] * 0.6); px[i + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  // resample to the original pixel size when a previous file exists, so file dimensions stay stable
  let finalCanvas = out;
  if (prev) { finalCanvas = createCanvas(prev.width, prev.height); finalCanvas.getContext('2d').drawImage(out, 0, 0, prev.width, prev.height); }
  fs.writeFileSync(target, finalCanvas.toBuffer('image/png'));
  report.push(`${name}: cell ${c},${r} ink ${bw}x${bh} → ${finalCanvas.width}x${finalCanvas.height}`);
}
console.log(report.join('\n'));
