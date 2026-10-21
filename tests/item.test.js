// Tests of the checks applied to what the floating window receives.
const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const { sanitizeItem, safeHttps } = require(`../item.js`);

test(`a normal item is kept`, () => {
  const item = sanitizeItem({ label: `Hall`, is360: true, position: 2, count: 3, notes: [`a`], candidates: [`https://d.example/a.png`], panorama: false });
  assert.deepEqual(item, { label: `Hall`, is360: true, position: 2, count: 3, notes: [`a`], candidates: [`https://d.example/a.png`], blob: null, panorama: false, errorText: ``, errorLink: `` });
});

test(`something that is not an item gives null`, () => {
  assert.equal(sanitizeItem(null), null);
  assert.equal(sanitizeItem(`text`), null);
  assert.equal(sanitizeItem(42), null);
});

test(`only https addresses without credentials are kept`, () => {
  assert.equal(safeHttps(`https://d.example/a.png`), `https://d.example/a.png`);
  assert.equal(safeHttps(`http://d.example/a.png`), ``);
  assert.equal(safeHttps(`javascript:alert(1)`), ``);
  assert.equal(safeHttps(`https://user:pw@d.example/`), ``);
  assert.equal(safeHttps(`not a link`), ``);
  assert.equal(safeHttps(42), ``);
  const item = sanitizeItem({ candidates: [`http://x.example/`, `https://ok.example/a.png`, `data:text/html,x`], errorLink: `javascript:x` });
  assert.deepEqual(item.candidates, [`https://ok.example/a.png`]);
  assert.equal(item.errorLink, ``);
});

test(`texts and lists are cut, wrong types are dropped`, () => {
  const item = sanitizeItem({ label: `x`.repeat(500), notes: [`n`.repeat(900), 5, ``, `ok`, `a`, `b`, `c`], errorText: 7 });
  assert.equal(item.label.length, 120);
  assert.equal(item.notes.length <= 5, true);
  assert.equal(item.notes[0].length, 600);
  assert.equal(item.errorText, ``);
});

test(`counters are brought back into a sane range`, () => {
  assert.equal(sanitizeItem({ count: 5000 }).count, 1);
  assert.equal(sanitizeItem({ count: 3, position: 9 }).position, 1);
  assert.equal(sanitizeItem({ count: 3, position: 2 }).position, 2);
  assert.equal(sanitizeItem({ count: `3` }).count, 1);
});

test(`a panorama needs a real blob`, () => {
  assert.equal(sanitizeItem({ panorama: true, blob: `x` }).panorama, false);
  const blob = new Blob([`x`]);
  const item = sanitizeItem({ panorama: true, blob });
  assert.equal(item.panorama, true);
  assert.equal(item.blob, blob);
  assert.equal(sanitizeItem({ panorama: false, blob }).panorama, false);
});
