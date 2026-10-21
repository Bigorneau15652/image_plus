// Turns the https link of an image, as written in a Grist cell, into the address that a picture
// element can load. This file has no access to the page: it is pure logic, easy to test with Node.
// Version 0.2 knows Nextcloud share links; any other https link is used as it is.
(function (root) {
  // A Nextcloud public share: .../s/CODE or .../index.php/s/CODE, with or without a final slash.
  const NEXTCLOUD_SHARE = /^(.*\/s\/[A-Za-z0-9._-]+)\/?$/;

  // Returns { url, drive } for a link that parseHttpsUrl of images.js already accepted.
  // `drive` is `nextcloud` when the link was converted, `direct` otherwise.
  function toImageUrl(href) {
    const url = new URL(href);
    const share = NEXTCLOUD_SHARE.exec(url.pathname);
    if (!share) return { url: url.href, drive: `direct` };
    // The download address of a share gives the file itself instead of the page of the share.
    url.pathname = `${share[1]}/download`;
    url.hash = ``;
    return { url: url.href, drive: `nextcloud` };
  }

  const api = { toImageUrl };
  if (typeof module !== `undefined` && module.exports) module.exports = api;
  else root.imagePlusDrives = api;
})(typeof window !== `undefined` ? window : globalThis);
