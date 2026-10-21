// Tests of the size decisions of the 360 degree view.
const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const { textureLimit, fitSize, MAX_SIDE, FALLBACK_LIMIT } = require(`../panorama.js`);

test(`textureLimit uses the graphics card limit`, () => {
  assert.equal(textureLimit(8192), 8192);
});

test(`textureLimit caps very large limits`, () => {
  assert.equal(textureLimit(65536), MAX_SIDE);
});

test(`textureLimit falls back when the limit is unknown or absurd`, () => {
  assert.equal(textureLimit(undefined), FALLBACK_LIMIT);
  assert.equal(textureLimit(0), FALLBACK_LIMIT);
  assert.equal(textureLimit(NaN), FALLBACK_LIMIT);
});

test(`fitSize keeps a picture that fits`, () => {
  assert.deepEqual(fitSize(4096, 2048, 4096), { width: 4096, height: 2048, scaled: false });
});

test(`fitSize reduces a picture that is too large and keeps the ratio`, () => {
  assert.deepEqual(fitSize(16384, 8192, 4096), { width: 4096, height: 2048, scaled: true });
  const r = fitSize(10001, 5000, 4096);
  assert.equal(r.scaled, true);
  assert.ok(r.width <= 4096 && r.height <= 4096);
});

test(`fitSize rejects empty sizes`, () => {
  assert.equal(fitSize(0, 100, 4096), null);
  assert.equal(fitSize(100, -1, 4096), null);
});
