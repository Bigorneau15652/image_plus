const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const { parseImages, parseHttpsUrl, extensionOf, readName, MAX_IMAGES } = require(`../images.js`);

const label = (n) => `Image ${n}`;

test(`an empty cell gives no image and nothing rejected`, () => {
  assert.deepEqual(parseImages({}, label), { images: [], rejected: [] });
  assert.deepEqual(parseImages({ attachments: null, links: ``, names: null }, label), { images: [], rejected: [] });
});

test(`attachments come first, with the marker of Grist lists ignored`, () => {
  const { images } = parseImages({ attachments: [`L`, 4, 9], links: `https://example.org/a.png` }, label);
  assert.deepEqual(images.map((i) => [i.kind, i.id ?? i.href]), [
    [`attachment`, 4],
    [`attachment`, 9],
    [`link`, `https://example.org/a.png`]
  ]);
  assert.deepEqual(images.map((i) => i.label), [`Image 1`, `Image 2`, `Image 3`]);
});

test(`links are read one per line, blank lines and spaces are tolerated`, () => {
  const { images, rejected } = parseImages({ links: `  https://a.example/x.jpg \n\n https://b.example/s/AbCd \r\n` }, label);
  assert.equal(images.length, 2);
  assert.equal(images[1].href, `https://b.example/s/AbCd`);
  assert.deepEqual(rejected, []);
});

test(`names follow the order: attachments first then links, a blank line keeps its place`, () => {
  const { images } = parseImages({
    attachments: [`L`, 1],
    links: `https://a.example/1\n\nhttps://a.example/3`,
    names: `Entrée\nHall\n\nCouloir`
  }, label);
  assert.deepEqual(images.map((i) => i.label), [`Entrée`, `Hall`, `Couloir`]);
  // The attachment is position 0, the first link position 1, the blank line position 2, the second link position 3.
  const second = parseImages({ links: `https://a.example/1\n\nhttps://a.example/3`, names: `Un\nignoré\nTrois` }, label);
  assert.deepEqual(second.images.map((i) => i.label), [`Un`, `Trois`]);
});

test(`the 360 marker is read in the name, in any case, and removed from the label`, () => {
  assert.deepEqual(readName(`Salle 101 [360]`), { label: `Salle 101`, is360: true });
  assert.deepEqual(readName(`[360] Hall`), { label: `Hall`, is360: true });
  assert.deepEqual(readName(`Hall [ 360 ]`), { label: `Hall`, is360: true });
  assert.deepEqual(readName(`Hall (360)`), { label: `Hall (360)`, is360: false });
  assert.deepEqual(readName(`[360]`), { label: ``, is360: true });
  const { images } = parseImages({ links: `https://a.example/s/1\nhttps://a.example/s/2`, names: `Plan\nVue [360]` }, label);
  assert.deepEqual(images.map((i) => i.is360), [false, true]);
  // An image whose name is only the marker gets the default label.
  const bare = parseImages({ links: `https://a.example/s/1`, names: `[360]` }, label);
  assert.equal(bare.images[0].label, `Image 1`);
  assert.equal(bare.images[0].is360, true);
});

test(`without a names column no image is a 360`, () => {
  const { images } = parseImages({ links: `https://a.example/s/1_360.jpg` }, label);
  assert.equal(images[0].is360, false);
});

test(`only absolute https links without credentials are accepted, the others are reported`, () => {
  assert.equal(parseHttpsUrl(`http://a.example/x.png`), null);
  assert.equal(parseHttpsUrl(`https://user:pw@a.example/x.png`), null);
  assert.equal(parseHttpsUrl(`javascript:alert(1)`), null);
  assert.equal(parseHttpsUrl(`data:image/png;base64,AAAA`), null);
  assert.equal(parseHttpsUrl(`/relative/x.png`), null);
  const { images, rejected } = parseImages({ links: `http://a.example/x.png\nhttps://ok.example/y.png\njavascript:alert(1)` }, label);
  assert.equal(images.length, 1);
  assert.deepEqual(rejected.map((r) => [r.source, r.reason]), [[`links`, `link`], [`links`, `link`]]);
});

test(`links to files that a browser cannot show as a picture are reported with the reason format`, () => {
  const { images, rejected } = parseImages({
    links: `https://a.example/doc.PDF\nhttps://a.example/plan.dxf?x=1\nhttps://a.example/p.tiff\nhttps://a.example/p.heic\nhttps://a.example/ok.webp\nhttps://a.example/s/AbCd`
  }, label);
  assert.deepEqual(images.map((i) => i.href), [`https://a.example/ok.webp`, `https://a.example/s/AbCd`]);
  assert.equal(rejected.length, 4);
  assert.ok(rejected.every((r) => r.reason === `format`));
  assert.equal(extensionOf(new URL(`https://a.example/dir/My%20Photo.JPG?x=1`)), `jpg`);
  assert.equal(extensionOf(new URL(`https://a.example/s/AbCd`)), ``);
});

test(`a value of the wrong type in the links column is reported, an attachment id list in the links column too`, () => {
  assert.equal(parseImages({ links: 42 }, label).rejected.length, 1);
  assert.equal(parseImages({ links: [`L`, 3] }, label).rejected.length, 1);
});

test(`a long label is cut and a long text in the banner is shortened`, () => {
  const { images } = parseImages({ links: `https://a.example/1`, names: `x`.repeat(500) }, label);
  assert.equal(images[0].label.length, 120);
  const long = `ftp://` + `y`.repeat(200);
  assert.ok(parseImages({ links: long }, label).rejected[0].text.length <= 61);
});

test(`a cell with too many images is cut and the cut is reported`, () => {
  const links = Array.from({ length: MAX_IMAGES + 5 }, (_, i) => `https://a.example/${i}.png`).join(`\n`);
  const { images, rejected } = parseImages({ links }, label);
  assert.equal(images.length, MAX_IMAGES);
  assert.deepEqual(rejected.map((r) => r.reason), [`limit`]);
});

test(`image keys are unique even when the same link is repeated`, () => {
  const { images } = parseImages({ attachments: [`L`, 1, 1], links: `https://a.example/1\nhttps://a.example/1` }, label);
  assert.equal(new Set(images.map((i) => i.key)).size, images.length);
});
