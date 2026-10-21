// Integration tests of the widget page: it runs in a real browser (Chromium) with a fake Grist object.
// Run them with `npm run test:integration` (see the README for the browser).
const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const { startServer, png, launch, openWidget, until } = require(`./helpers.js`);

let server;
let browser;
test.before(async () => {
  server = await startServer();
  browser = await launch();
});
test.after(async () => {
  await browser.close();
  server.close();
});

// Text of an element of the page.
const text = (page, selector) => page.locator(selector).innerText();
// True when an element is hidden (attribute or display).
const hidden = (page, selector) => page.$eval(selector, (e) => e.hidden || getComputedStyle(e).display === `none`);
const imageRoute = (route) => route.fulfill({ body: png(300, 200, [60, 140, 90]), contentType: `image/png` });

test(`links: navigation, counter, arrows and the caption`, async () => {
  const w = await openWidget(browser, server.url, { routes: { 'https://drive.example/**': imageRoute } });
  await w.deliver({ L: `https://drive.example/a.png\nhttps://drive.example/b.png`, N: `Hall\nPlan` });
  await until(w.page, () => !document.getElementById(`photo`).hidden);
  assert.equal(await text(w.page, `#name`), `Hall`);
  assert.equal(await text(w.page, `#counter`), `1 / 2`);
  await w.page.hover(`#stage`);
  await until(w.page, () => getComputedStyle(document.getElementById(`prev`)).opacity === `1`);
  await w.page.click(`#next`);
  await until(w.page, () => document.getElementById(`name`).textContent === `Plan`);
  await w.page.keyboard.press(`ArrowRight`);
  await until(w.page, () => document.getElementById(`name`).textContent === `Hall`);
  assert.deepEqual(w.errors, []);
});

test(`a single image hides the arrows and the counter`, async () => {
  const w = await openWidget(browser, server.url, { routes: { 'https://drive.example/**': imageRoute } });
  await w.deliver({ L: `https://drive.example/a.png`, N: `Seule` });
  await until(w.page, () => !document.getElementById(`photo`).hidden);
  assert.equal(await hidden(w.page, `#prev`), true);
  assert.equal(await hidden(w.page, `#counter`), true);
});

test(`the same row delivered again is not redrawn nor downloaded again`, async () => {
  const w = await openWidget(browser, server.url);
  const cells = { A: [1, 3], N: `Hall [360]\nPlan` };
  await w.deliver(cells);
  await until(w.page, () => !!document.querySelector(`#pano canvas`));
  await w.page.click(`#next`);
  await until(w.page, () => document.getElementById(`name`).textContent === `Plan`);
  const before = w.requests.length;
  await w.deliver(cells);
  await w.deliver(cells);
  await w.page.waitForTimeout(500);
  assert.equal(w.requests.length, before);
  assert.equal(await text(w.page, `#name`), `Plan`);
});

test(`Google Drive: the second address is tried when the first fails`, async () => {
  const seen = [];
  const w = await openWidget(browser, server.url, {
    routes: {
      'https://lh3.googleusercontent.com/**': (route) => { seen.push(`lh3`); return route.fulfill({ status: 403, body: `no` }); },
      'https://drive.google.com/**': (route) => { seen.push(`uc`); return imageRoute(route); }
    }
  });
  await w.deliver({ L: `https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_012/view?usp=sharing` });
  await until(w.page, () => !document.getElementById(`photo`).hidden);
  assert.deepEqual(seen, [`lh3`, `uc`]);
});

test(`kDrive: the address of the picture page gives the address of the file`, async () => {
  const seen = [];
  const w = await openWidget(browser, server.url, {
    routes: { 'https://kdrive.infomaniak.com/**': (route) => { seen.push(route.request().url()); return imageRoute(route); } }
  });
  await w.deliver({ L: `https://kdrive.infomaniak.com/app/share/3000000/00000000-1111-2222-3333-444444444444/preview/image/1234` });
  await until(w.page, () => !document.getElementById(`photo`).hidden);
  assert.deepEqual(seen, [`https://kdrive.infomaniak.com/2/app/3000000/share/00000000-1111-2222-3333-444444444444/files/1234/download`]);
});

test(`OneDrive: a dedicated message and no request`, async () => {
  const seen = [];
  const w = await openWidget(browser, server.url, {
    routes: { 'https://api.onedrive.com/**': (route) => { seen.push(1); return route.abort(); } }
  });
  await w.deliver({ L: `https://1drv.ms/i/c/0123456789abcdef/ExampleToken123?e=AbCdEf` });
  await until(w.page, () => document.getElementById(`error`).textContent.length > 0);
  assert.match(await text(w.page, `#error`), /OneDrive/);
  assert.equal(await w.page.$eval(`#error a`, (a) => a.rel), `noopener noreferrer`);
  assert.equal(seen.length, 0);
});

test(`a broken link shows the error with a link to open it`, async () => {
  const w = await openWidget(browser, server.url, { routes: { 'https://drive.example/**': (route) => route.fulfill({ status: 404, body: `no` }) } });
  await w.deliver({ L: `https://drive.example/missing.png` });
  await until(w.page, () => document.getElementById(`error`).textContent.length > 0);
  assert.equal(await w.page.$eval(`#error a`, (a) => a.getAttribute(`href`)), `https://drive.example/missing.png`);
});

test(`values that are not accepted are reported with their column`, async () => {
  const w = await openWidget(browser, server.url, { routes: { 'https://drive.example/**': imageRoute } });
  await w.deliver({ L: `http://insecure.example/a.png\nhttps://drive.example/plan.pdf\nhttps://drive.example/ok.png` });
  await until(w.page, () => document.getElementById(`notice`).textContent.length > 0);
  const notice = await text(w.page, `#notice`);
  assert.match(notice, /"L"|« L »/);
  assert.match(notice, /insecure\.example/);
  assert.match(notice, /plan\.pdf/);
});

test(`360 attachment: panoramic view, with the zoom buttons and no full screen button`, async () => {
  const w = await openWidget(browser, server.url);
  await w.deliver({ A: [1], N: `Hall [360]` });
  await until(w.page, () => !!document.querySelector(`#pano canvas`));
  assert.equal(await w.page.$$eval(`#pano .pnlm-zoom-controls div`, (d) => d.length), 2);
  assert.equal(await w.page.$eval(`#pano .pnlm-fullscreen-toggle-button`, (e) => getComputedStyle(e).display), `none`);
});

test(`360 attachment larger than the graphics card: reduced, with a note`, async () => {
  const w = await openWidget(browser, server.url, {
    initScript: `const g = WebGLRenderingContext.prototype.getParameter; WebGLRenderingContext.prototype.getParameter = function (p) { return p === this.MAX_TEXTURE_SIZE ? 2048 : g.call(this, p); };`
  });
  await w.deliver({ A: [2], N: `Grand [360]` });
  await until(w.page, () => !!document.querySelector(`#pano canvas`));
  assert.match(await text(w.page, `#note360`), /2048 × 1024/);
});

test(`360 attachment that cannot be downloaded: flat picture and a note`, async () => {
  const w = await openWidget(browser, server.url);
  await w.deliver({ A: [9], N: `Cassé [360]` });
  await until(w.page, () => !document.getElementById(`note360`).hidden);
  assert.match(await text(w.page, `#note360`), /downloaded/);
  assert.equal(await hidden(w.page, `#pano`), true);
});

test(`a file above 100 MB is refused, announced or real size`, async () => {
  const w = await openWidget(browser, server.url, {
    initScript: `const f = window.fetch; window.fetch = async (u, o) => {
      if (String(u).includes(\`/attachments/7/\`)) return new Response(new Blob([\`x\`]), { headers: { [\`content-length\`]: \`200000000\` } });
      if (String(u).includes(\`/attachments/8/\`)) return new Response(new Blob([new Uint8Array(101 * 1024 * 1024)]));
      return f(u, o);
    };`
  });
  for (const id of [7, 8]) {
    await w.deliver({ A: [id], N: `Enorme [360]` });
    await until(w.page, () => /100 MB/.test(document.getElementById(`note360`).textContent));
  }
});

test(`360 link without proxy: shown flat with a note that explains the setting`, async () => {
  const w = await openWidget(browser, server.url, { routes: { 'https://drive.example/**': imageRoute } });
  await w.deliver({ L: `https://drive.example/pano.png`, N: `Hall [360]` });
  await until(w.page, () => !document.getElementById(`photo`).hidden);
  assert.match(await text(w.page, `#note360`), /proxy/);
});

test(`settings: the address is checked, then stored; with the proxy a 360 link opens as a panorama`, async () => {
  const proxied = [];
  const w = await openWidget(browser, server.url, {
    routes: {
      'https://drive.example/**': imageRoute,
      'https://proxy.example/**': (route) => {
        proxied.push(route.request().url());
        return route.fulfill({ body: png(1024, 512), contentType: `image/png`, headers: { [`access-control-allow-origin`]: `*` } });
      }
    }
  });
  await w.deliver({ L: `https://drive.example/s/AbCd`, N: `Hall [360]` });
  await until(w.page, () => !document.getElementById(`photo`).hidden);

  await w.page.evaluate(() => window.__ready.onEditOptions());
  assert.equal(await hidden(w.page, `#settings`), false);
  await w.page.check(`#proxyEnabled`);
  await w.page.fill(`#proxyUrl`, `http://proxy.example/?url={url}`);
  await w.page.click(`#settingsSave`);
  assert.match(await text(w.page, `#settingsError`), /https/);
  await w.page.fill(`#proxyUrl`, `https://proxy.example/?url={url}`);
  await w.page.click(`#settingsSave`);
  assert.deepEqual(await w.page.evaluate(() => window.__setOptions), [{ proxyEnabled: true, proxyUrl: `https://proxy.example/?url={url}` }]);
  assert.equal(await hidden(w.page, `#settings`), true);

  await w.page.evaluate(() => window.__onOptions({ proxyEnabled: true, proxyUrl: `https://proxy.example/?url={url}` }));
  await until(w.page, () => !!document.querySelector(`#pano canvas`));
  assert.deepEqual(proxied, [`https://proxy.example/?url=https%3A%2F%2Fdrive.example%2Fs%2FAbCd%2Fdownload`]);
});

test(`the floating window follows the row, has its own navigation and gives the display back`, async () => {
  const w = await openWidget(browser, server.url);
  await w.deliver({ A: [1, 3], N: `Hall [360]\nPlan` });
  await until(w.page, () => !!document.querySelector(`#pano canvas`));
  const opened = w.context.waitForEvent(`page`);
  await w.page.click(`#floatButton`);
  const popup = await opened;
  await until(popup, () => !!document.querySelector(`#pano canvas`));
  assert.equal(await text(popup, `#name`), `Hall`);
  assert.equal(await hidden(w.page, `#viewer`), true);
  assert.equal(await hidden(w.page, `#floating`), false);

  await popup.click(`#next`);
  await until(popup, () => document.getElementById(`name`).textContent === `Plan`);
  await w.deliver({ A: [1, 3], N: `Un [360]\nDeux` });
  await until(popup, () => document.getElementById(`name`).textContent === `Un`);
  await w.page.evaluate(() => window.__onRecord(null, null));
  await until(popup, () => document.getElementById(`viewer`).hidden);

  await w.deliver({ A: [3], N: `Retour` });
  await w.page.click(`#backButton`);
  await until(w.page, () => document.getElementById(`name`).textContent === `Retour`);
  assert.equal(popup.isClosed(), true);
  assert.deepEqual(w.errors, []);
});

test(`closing the floating window brings the display back`, async () => {
  const w = await openWidget(browser, server.url);
  await w.deliver({ A: [3], N: `Plan` });
  const opened = w.context.waitForEvent(`page`);
  await w.page.click(`#floatButton`);
  const popup = await opened;
  await until(popup, () => document.getElementById(`photo`) && !document.getElementById(`photo`).hidden);
  await popup.close();
  await until(w.page, () => document.getElementById(`floating`).hidden && !document.getElementById(`viewer`).hidden);
});

test(`narrow panel in dark mode: nothing overflows and the messages stay inside`, async () => {
  const w = await openWidget(browser, server.url, {
    viewport: { width: 340, height: 420 }, colorScheme: `dark`,
    routes: { 'https://drive.example/**': imageRoute }
  });
  await w.deliver({ L: `http://bad.example/a.png\nhttps://drive.example/a.png`, N: `Un nom assez long pour passer à la ligne dans un panneau étroit [360]` });
  await until(w.page, () => !document.getElementById(`photo`).hidden);
  const layout = await w.page.evaluate(() => {
    const boxes = [`notice`, `note360`, `bar`, `stage`].map((id) => document.getElementById(id).getBoundingClientRect());
    return { overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, right: Math.max(...boxes.map((b) => b.right)) };
  });
  assert.equal(layout.overflow, false);
  assert.ok(layout.right <= 340);
});

test(`pages carry no inline script and the content policy of the widget page`, async () => {
  const w = await openWidget(browser, server.url);
  const policy = await w.page.$eval(`meta[http-equiv="Content-Security-Policy"]`, (m) => m.content);
  assert.match(policy, /script-src 'self' https:\/\/grist\.numerique\.gouv\.fr/);
  assert.equal(await w.page.$$eval(`script:not([src])`, (s) => s.length), 0);
});
