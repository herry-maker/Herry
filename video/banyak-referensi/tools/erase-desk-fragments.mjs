// erase-desk-fragments.mjs — remove the small table-edge fragments baked into generated seated poses,
// so the project's own desk is the only desk on screen. A fragment = a connected ink component that is
// wide (>150 px at 2x), short (<100 px) and lies entirely in the left half of the canvas.
import fs from 'node:fs'; import path from 'node:path'; import {createRequire} from 'node:module';
const {createCanvas, loadImage} = createRequire(path.join(process.env.SKILL_DIR, 'package.json'))('@napi-rs/canvas');
for (const name of process.argv.slice(2)) {
  const img = await loadImage(name), W = img.width, H = img.height, c = createCanvas(W, H), ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, W, H), px = d.data, seen = new Uint8Array(W * H); let removed = 0;
  const ink = i => px[i * 4 + 3] > 60;
  for (let s = 0; s < W * H; s++) {
    if (seen[s] || !ink(s)) continue;
    const stack = [s], comp = []; seen[s] = 1; let minX = W, maxX = 0, minY = H, maxY = 0;
    while (stack.length) { const i = stack.pop(); comp.push(i); const x = i % W, y = (i / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!seen[j] && ink(j)) { seen[j] = 1; stack.push(j); } } }
    const w = maxX - minX, h = maxY - minY;
    if (w > 150 && h < 100 && maxX < W * 0.5) { for (const i of comp) px[i * 4 + 3] = 0; removed++; }
  }
  ctx.putImageData(d, 0, 0); fs.writeFileSync(name, c.toBuffer('image/png'));
  console.log(path.basename(name), 'removed components:', removed);
}

// Second pass: a table edge that touches the hand is one component with the body, so also erase thin
// horizontal ink runs that start at the left margin, stopping where the stroke thickens (the hand).
for (const name of process.argv.slice(2)) {
  const img = await loadImage(name), W = img.width, H = img.height, c = createCanvas(W, H), ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, W, H), px = d.data; let cleared = 0;
  const ink = (x, y) => x >= 0 && y >= 0 && x < W && y < H && px[(y * W + x) * 4 + 3] > 60;
  const thickness = (x, y) => { let n = 0; for (let yy = y - 10; yy <= y + 10; yy++) if (ink(x, yy)) n++; return n; };
  const done = new Set();
  for (let y = 0; y < H; y++) {
    let x = 0; while (x < W && !ink(x, y)) x++;
    if (x > W * 0.12 || done.has(y)) continue;                        // must start near the left margin
    let len = 0; while (ink(x + len, y) && thickness(x + len, y) <= 12) len++;
    if (len < 100) continue;                                           // a long thin stroke = table edge
    for (let yy = Math.max(0, y - 8); yy <= Math.min(H - 1, y + 8); yy++) { done.add(yy); for (let xx = x; xx < x + len; xx++) if (thickness(xx, yy) <= 12) { px[(yy * W + xx) * 4 + 3] = 0; cleared++; } }
  }
  if (cleared) { ctx.putImageData(d, 0, 0); fs.writeFileSync(name, c.toBuffer('image/png')); }
  console.log(path.basename(name), 'thin left-margin run pixels cleared:', cleared);
}
