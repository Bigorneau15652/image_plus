// Shared tools of the integration tests: a small web server for the widget files, a picture
// generator, a fake Grist object and the launch of the browser (Playwright, Chromium).
const http = require(`node:http`);
const fs = require(`node:fs`);
const path = require(`node:path`);
const zlib = require(`node:zlib`);
const { chromium } = require(`playwright`);

const ROOT = path.resolve(__dirname, `..`, `..`);
const TYPES = new Map([[`.html`, `text/html`], [`.js`, `text/javascript`], [`.css`, `text/css`], [`.md`, `text/plain`]]);
const GRIST_HOST = `https://grist.numerique.gouv.fr`;

// Serves the files of the repository on a free port. Resolves to { url, close }.
function startServer() {
  const server = http.createServer((request, response) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(request.url, `http://x`).pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { [`content-type`]: TYPES.get(path.extname(file)) || `application/octet-stream` });
    response.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, `127.0.0.1`, () => {
      resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() });
    });
  });
}

// A plain-colour PNG picture of the given size, as a Buffer.
function png(width, height, color = [40, 120, 200]) {
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(width).fill(color).flat())]);
  const data = Buffer.concat(Array(height).fill(row));
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buffer) => {
    let c = 0xffffffff;
    for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, body) => {
    const head = Buffer.alloc(4);
    head.writeUInt32BE(body.length);
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc(Buffer.concat([Buffer.from(type), body])));
    return Buffer.concat([head, Buffer.from(type), body, tail]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk(`IHDR`, header), chunk(`IDAT`, zlib.deflateSync(data, { level: 1 })), chunk(`IEND`, Buffer.alloc(0))
  ]);
}

// The fake `grist` object that replaces the Grist plugin API in the page.
const FAKE_GRIST = `
window.__setOptions = [];
window.grist = {
  ready(options) { window.__ready = options; },
  onRecord(callback) { window.__onRecord = callback; },
  onOptions(callback) { window.__onOptions = callback; },
  widgetApi: { setOptions(options) { window.__setOptions.push(options); } },
  mapColumnNames(record) { return { attachments: record.A, links: record.L, names: record.N }; },
  docApi: { getAccessToken: async () => ({ baseUrl: \`${GRIST_HOST}/api/docs/D\`, token: \`T\`, ttlMsecs: 60000 }) }
};`;

// Launches Chromium. CHROMIUM_PATH points to an existing browser; without it Playwright uses its own.
function launch() {
  return chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [`--use-gl=angle`, `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`, `--ignore-gpu-blocklist`]
  });
}

// Opens the widget in a new page with the fake Grist. `routes` maps an address pattern to a handler.
// Returns { page, errors, deliver(cells, mapping), requests }.
async function openWidget(browser, baseUrl, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 500, height: 420 },
    colorScheme: options.colorScheme || `light`
  });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on(`pageerror`, (error) => errors.push(String(error)));
  page.on(`console`, (message) => {
    if ([`error`, `warning`].includes(message.type()) && !message.text().includes(`Failed to load resource`)) errors.push(message.text());
  });
  await page.addInitScript(options.initScript || ``);
  await page.route(`**/grist-plugin-api.js`, (route) => route.fulfill({ body: FAKE_GRIST, contentType: `text/javascript` }));
  await page.route(`${GRIST_HOST}/api/**`, (route) => {
    requests.push(route.request().url());
    const missing = route.request().url().includes(`/attachments/9/`);
    if (missing) return route.fulfill({ status: 404, body: `missing` });
    const big = route.request().url().includes(`/attachments/2/`);
    return route.fulfill({ body: big ? png(5000, 2500) : png(1024, 512), contentType: `image/png`, headers: { [`access-control-allow-origin`]: `*` } });
  });
  for (const [pattern, handler] of Object.entries(options.routes || {})) await page.route(pattern, handler);
  await page.goto(`${baseUrl}/index.html`);
  await page.waitForFunction(() => typeof window.__onRecord === `function`);
  const deliver = (cells, mapping = { attachments: `P`, links: `L` }) =>
    page.evaluate(([c, m]) => window.__onRecord(c, m), [cells, mapping]);
  return { page, context, errors, requests, deliver };
}

// Waits until the condition (run in the page) is true. A headless browser that never receives
// an input event can leave picture decoding pending, so the pointer is moved while waiting.
async function until(page, condition, arg) {
  const timer = setInterval(() => page.mouse.move(40 + Math.random() * 20, 40).catch(() => {}), 150);
  try {
    await page.waitForFunction(condition, arg, { timeout: 15000 });
  } finally {
    clearInterval(timer);
  }
}

module.exports = { startServer, png, launch, openWidget, until, GRIST_HOST };
