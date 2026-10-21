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
  const id = `1LngFgMZ3bK_rx6f5067ucJcYzlOoDzV0`;
  const expected = { url: `https://lh3.googleusercontent.com/d/${id}`, alternatives: [`https://drive.google.com/uc?export=view&id=${id}`], drive: `google` };
  assert.deepEqual(toImageUrl(`https://drive.google.com/file/d/${id}/view?usp=sharing`), expected);
  assert.deepEqual(toImageUrl(`https://drive.google.com/open?id=${id}`), expected);
  assert.deepEqual(toImageUrl(`https://drive.google.com/uc?export=download&id=${id}`), expected);
});

test(`a Google Drive link without a usable identifier is not changed`, () => {
  assert.equal(toImageUrl(`https://drive.google.com/drive/folders/1LngFgMZ3bK_rx6f5067ucJcYzlOoDzV0`).drive, `direct`);
  assert.equal(toImageUrl(`https://drive.google.com/file/d/short/view`).drive, `direct`);
  assert.equal(toImageUrl(`https://drive.google.com/open?id=a%22b`).drive, `direct`);
});

test(`a OneDrive link becomes an address of the sharing API, with a download address as a second try`, () => {
  const link = `https://1drv.ms/i/c/90ce7aa89d81eed3/IQAJQJxuQuV6R4yDVf2F1KTiAUO0AaoHThSjK9MysfhJQVs?e=A6BmBe`;
  const result = toImageUrl(link);
  assert.equal(result.drive, `onedrive`);
  assert.match(result.url, /^https:\/\/api\.onedrive\.com\/v1\.0\/shares\/u![A-Za-z0-9_-]+\/root\/content$/);
  const encoded = result.url.split(`/shares/u!`)[1].split(`/`)[0];
  assert.equal(Buffer.from(encoded.replace(/-/g, `+`).replace(/_/g, `/`), `base64`).toString(`utf8`), link);
  assert.deepEqual(result.alternatives, [`${link}&download=1`]);
});

test(`the address of a OneDrive photo page gives the same share token as the original link`, () => {
  const link = `https://1drv.ms/i/c/90ce7aa89d81eed3/IQAJQJxuQuV6R4yDVf2F1KTiAUO0AaoHThSjK9MysfhJQVs?e=A6BmBe`;
  const page = `https://onedrive.live.com/photos?photosData=%2Fshare%2F90CE7AA89D81EED3%21s6e9c%3Fe%3DA6BmBe&redeem=aHR0cHM6Ly8xZHJ2Lm1zL2kvYy85MGNlN2FhODlkODFlZWQzL0lRQUpRSnh1UXVWNlI0eURWZjJGMUtUaUFVTzBBYW9IVGhTaks5TXlzZmhKUVZzP2U9QTZCbUJl`;
  const fromPage = toImageUrl(page);
  const fromLink = toImageUrl(link);
  assert.equal(fromPage.url, fromLink.url);
  assert.deepEqual(fromPage.alternatives, fromLink.alternatives);
});

test(`a kDrive share link becomes the API address of the file`, () => {
  const base = `https://kdrive.infomaniak.com/2/app/3072473/share/4efe11be-1c09-483d-a0c5-6ba972a5548f`;
  assert.deepEqual(toImageUrl(`https://kdrive.infomaniak.com/app/share/3072473/4efe11be-1c09-483d-a0c5-6ba972a5548f`), { url: `${base}/download`, alternatives: [`${base}/preview`], drive: `kdrive` });
  assert.equal(toImageUrl(`https://kdrive.infomaniak.com/app/share/abc`).drive, `direct`);
});

test(`the address of a kDrive picture page gives the file number`, () => {
  const base = `https://kdrive.infomaniak.com/2/app/3072473/share/4efe11be-1c09-483d-a0c5-6ba972a5548f/files/1106`;
  assert.deepEqual(toImageUrl(`https://kdrive.infomaniak.com/app/share/3072473/4efe11be-1c09-483d-a0c5-6ba972a5548f/preview/image/1106`), { url: `${base}/download`, alternatives: [`${base}/preview`], drive: `kdrive` });
});
