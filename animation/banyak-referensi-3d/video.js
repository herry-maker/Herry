// Render every frame of the 3D film and stream it straight into ffmpeg (no intermediate PNG files).
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = __dirname;
const FPS = 24, DURATION = 180;
const TOTAL = process.env.FRAMES ? +process.env.FRAMES : Math.round(FPS * DURATION);
const OUT = path.join(ROOT, 'out', 'video.mp4');
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    const ext = path.extname(file);
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (err) => console.error('[pageerror]', err.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.READY === true, { timeout: 30000 });
  const stage = page.locator('#stage');

  const ffmpeg = spawn(process.env.FFMPEG || 'ffmpeg', [
    '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', OUT,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  let ffmpegDone = new Promise((resolve, reject) => { ffmpeg.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg exit ' + code)))); });

  const t0 = Date.now();
  for (let f = 0; f < TOTAL; f++) {
    const t = f / FPS;
    await page.evaluate((tt) => window.renderAt(tt), t);
    const buf = await stage.screenshot({ type: 'png' });
    if (!ffmpeg.stdin.write(buf)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
    if (f % 60 === 0 || f === TOTAL - 1) {
      const elapsed = (Date.now() - t0) / 1000, fps = (f + 1) / elapsed, eta = (TOTAL - f - 1) / Math.max(fps, 0.01);
      console.log(`${f + 1}/${TOTAL} frames  ${fps.toFixed(1)} fps  eta ${eta.toFixed(0)}s`);
    }
  }
  ffmpeg.stdin.end();
  await ffmpegDone;
  await browser.close();
  server.close();
  console.log('out/video.mp4 done');
})().catch((e) => { console.error(e); process.exit(1); });
