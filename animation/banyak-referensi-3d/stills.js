// Render a handful of check stills at given times (seconds). Usage: node stills.js 1 20 48 86 110 178
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = __dirname;
const times = process.argv.slice(2).map(Number);
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
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('[console.error]', msg.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.READY === true, { timeout: 20000 });
  fs.mkdirSync(path.join(ROOT, 'out', 'stills'), { recursive: true });
  for (const t of times) {
    await page.evaluate((tt) => window.renderAt(tt), t);
    const buf = await page.locator('#stage').screenshot();
    const name = `t_${String(t).padStart(3, '0')}.png`;
    fs.writeFileSync(path.join(ROOT, 'out', 'stills', name), buf);
    console.log('wrote', name);
  }
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
