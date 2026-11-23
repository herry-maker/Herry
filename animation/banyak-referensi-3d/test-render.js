// Proof-of-concept: load index.html in headless Chromium with software WebGL and capture a frame.
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = __dirname;
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
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--ignore-gpu-blocklist', '--enable-webgl', '--use-gl=angle'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', (msg) => console.log('[page]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.READY === true, { timeout: 15000 });
  const webglInfo = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'no webgl context';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });
  console.log('WebGL renderer:', webglInfo);
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  for (const t of [0, 1, 2]) {
    await page.evaluate((tt) => window.renderAt(tt), t);
    const buf = await page.locator('#c').screenshot();
    fs.writeFileSync(path.join(ROOT, 'out', `test_t${t}.png`), buf);
  }
  await browser.close();
  server.close();
  console.log('ok');
})().catch((e) => { console.error(e); process.exit(1); });
