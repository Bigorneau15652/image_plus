const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const { toImageUrl } = require(`../drives.js`);

test(`a Nextcloud share link becomes its download address`, () => {
  assert.deepEqual(toImageUrl(`https://drive.example/s/AbCd123`), { url: `https://drive.example/s/AbCd123/download`, alternatives: [], drive: `nextcloud` });
  assert.equal(toImageUrl(`https://drive.example/s/AbCd123/`).url, `https://drive.example/s/AbCd123/download`);
  assert.equal(toImageUrl(`https://drive.example/index.php/s/AbCd123`).url, `https://drive.example/index.php/s/AbCd123/download`);
  assert.equal(toImageUrl(`https://drive.example/cloud/s/AbCd123#top`).url, `https://drive.example/cloud/s/AbCd123/download`);
});

test(`the query of a share link is kept`, () => {
  assert.equal(toImageUrl(`https://drive.example/s/AbCd123?path=%2Fplans&files=a.png`).url, `https://drive.example/s/AbCd123/download?path=%2Fplans&files=a.png`);
});

test(`a link already pointing to the download, or to a file, is not changed`, () => {
  assert.deepEqual(toImageUrl(`https://drive.example/s/AbCd123/download`), { url: `https://drive.example/s/AbCd123/download`, alternatives: [], drive: `direct` });
  assert.deepEqual(toImageUrl(`https://img.example/photos/a.png`), { url: `https://img.example/photos/a.png`, alternatives: [], drive: `direct` });
  assert.equal(toImageUrl(`https://img.example/s/folder/a.png`).drive, `direct`);
});

test(`Google Drive links become the image address`, () => {
  const id = `1AbCdEfGhIjKlMnOpQrStUvWxYz_012`;
  const expected = { url: `https://lh3.googleusercontent.com/d/${id}`, alternatives: [`https://drive.google.com/uc?export=view&id=${id}`], drive: `google` };
  assert.deepEqual(toImageUrl(`https://drive.google.com/file/d/${id}/view?usp=sharing`), expected);
  assert.deepEqual(toImageUrl(`https://drive.google.com/open?id=${id}`), expected);
  assert.deepEqual(toImageUrl(`https://drive.google.com/uc?export=download&id=${id}`), expected);
});

test(`a Google Drive link without a usable identifier is not changed`, () => {
  assert.equal(toImageUrl(`https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz_012`).drive, `direct`);
  assert.equal(toImageUrl(`https://drive.google.com/file/d/short/view`).drive, `direct`);
  assert.equal(toImageUrl(`https://drive.google.com/open?id=a%22b`).drive, `direct`);
});

test(`a OneDrive link is recognised but not converted`, () => {
  const link = `https://1drv.ms/i/c/0123456789abcdef/ExampleToken123?e=AbCdEf`;
  assert.deepEqual(toImageUrl(link), { url: link, alternatives: [], drive: `onedrive` });
  assert.equal(toImageUrl(`https://onedrive.live.com/photos?redeem=abc`).drive, `onedrive`);
});

test(`a plain kDrive share link is not converted`, () => {
  const link = `https://kdrive.infomaniak.com/app/share/3000000/00000000-1111-2222-3333-444444444444`;
  assert.deepEqual(toImageUrl(link), { url: link, alternatives: [], drive: `direct` });
  assert.equal(toImageUrl(`https://kdrive.infomaniak.com/app/share/abc`).drive, `direct`);
});

test(`the address of a kDrive picture page gives the file number`, () => {
  const base = `https://kdrive.infomaniak.com/2/app/3000000/share/00000000-1111-2222-3333-444444444444/files/1234`;
  assert.deepEqual(toImageUrl(`https://kdrive.infomaniak.com/app/share/3000000/00000000-1111-2222-3333-444444444444/preview/image/1234`), { url: `${base}/download`, alternatives: [`${base}/preview`], drive: `kdrive` });
});
