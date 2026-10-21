const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const { toImageUrl } = require(`../drives.js`);

test(`a Nextcloud share link becomes its download address`, () => {
  assert.deepEqual(toImageUrl(`https://drive.example/s/AbCd123`), { url: `https://drive.example/s/AbCd123/download`, drive: `nextcloud` });
  assert.equal(toImageUrl(`https://drive.example/s/AbCd123/`).url, `https://drive.example/s/AbCd123/download`);
  assert.equal(toImageUrl(`https://drive.example/index.php/s/AbCd123`).url, `https://drive.example/index.php/s/AbCd123/download`);
  assert.equal(toImageUrl(`https://drive.example/cloud/s/AbCd123#top`).url, `https://drive.example/cloud/s/AbCd123/download`);
});

test(`the query of a share link is kept`, () => {
  assert.equal(toImageUrl(`https://drive.example/s/AbCd123?path=%2Fplans&files=a.png`).url, `https://drive.example/s/AbCd123/download?path=%2Fplans&files=a.png`);
});

test(`a link already pointing to the download, or to a file, is not changed`, () => {
  assert.deepEqual(toImageUrl(`https://drive.example/s/AbCd123/download`), { url: `https://drive.example/s/AbCd123/download`, drive: `direct` });
  assert.deepEqual(toImageUrl(`https://img.example/photos/a.png`), { url: `https://img.example/photos/a.png`, drive: `direct` });
  assert.equal(toImageUrl(`https://img.example/s/folder/a.png`).drive, `direct`);
});
