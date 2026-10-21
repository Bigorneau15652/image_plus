// Tests of the checks of the proxy setting.
const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const { checkProxyTemplate, buildProxyUrl, activeProxy } = require(`../proxy.js`);

test(`a valid https template with {url} is accepted`, () => {
  assert.deepEqual(checkProxyTemplate(`https://proxy.example/?url={url}`), { ok: true, template: `https://proxy.example/?url={url}` });
  assert.equal(checkProxyTemplate(`  https://proxy.example/get/{url}  `).ok, true);
});

test(`an empty text is reported`, () => {
  assert.equal(checkProxyTemplate(``).reason, `empty`);
  assert.equal(checkProxyTemplate(undefined).reason, `empty`);
});

test(`only https is accepted`, () => {
  assert.equal(checkProxyTemplate(`http://proxy.example/?url={url}`).reason, `https`);
  assert.equal(checkProxyTemplate(`javascript:alert({url})`).reason, `https`);
  assert.equal(checkProxyTemplate(`//proxy.example/?url={url}`).reason, `https`);
});

test(`{url} must appear exactly once`, () => {
  assert.equal(checkProxyTemplate(`https://proxy.example/`).reason, `placeholder`);
  assert.equal(checkProxyTemplate(`https://proxy.example/?a={url}&b={url}`).reason, `placeholder`);
});

test(`{url} cannot be part of the host`, () => {
  assert.equal(checkProxyTemplate(`https://{url}/x`).reason, `host`);
  assert.equal(checkProxyTemplate(`https://{url}.example/`).reason, `host`);
});

test(`credentials in the address are refused`, () => {
  assert.equal(checkProxyTemplate(`https://user:pass@proxy.example/?url={url}`).reason, `credentials`);
});

test(`the link is encoded in the proxy address`, () => {
  assert.equal(buildProxyUrl(`https://proxy.example/?url={url}`, `https://d.example/s/Ab?x=1&y=2`), `https://proxy.example/?url=https%3A%2F%2Fd.example%2Fs%2FAb%3Fx%3D1%26y%3D2`);
});

test(`the proxy is used only when enabled and valid`, () => {
  assert.equal(activeProxy(null), null);
  assert.equal(activeProxy({ proxyEnabled: false, proxyUrl: `https://p.example/?u={url}` }), null);
  assert.equal(activeProxy({ proxyEnabled: true, proxyUrl: `ftp://p.example/{url}` }), null);
  assert.equal(activeProxy({ proxyEnabled: true, proxyUrl: `https://p.example/?u={url}` }), `https://p.example/?u={url}`);
  assert.equal(activeProxy({ proxyEnabled: `true`, proxyUrl: `https://p.example/?u={url}` }), null);
});
