// Turns the https link of an image, as written in a Grist cell, into the addresses that a picture
// element can load. This file has no access to the page: it is pure logic, easy to test with Node.
// It knows Nextcloud, Google Drive and kDrive share links, and recognises OneDrive links (which
// cannot be shown); any other https link is used as it is. The address formats of the commercial drives are not documented as stable: for each
// drive the first address is the most likely one and the others are tried in turn by the widget.
(function (root) {
  // A Nextcloud public share: .../s/CODE or .../index.php/s/CODE, with or without a final slash.
  const NEXTCLOUD_SHARE = /^(.*\/s\/[A-Za-z0-9._-]+)\/?$/;
  // A Google Drive file identifier.
  const GOOGLE_ID = /^[A-Za-z0-9_-]{10,}$/;
  // A kDrive share: /app/share/DRIVE_NUMBER/SHARE_UUID.
  const KDRIVE_SHARE = /^\/app\/share\/(\d+)\/([0-9a-fA-F-]{20,})\/?$/;
  // The page that shows one picture of a kDrive share: /app/share/DRIVE/UUID/preview/TYPE/FILE.
  const KDRIVE_PREVIEW = /^\/app\/share\/(\d+)\/([0-9a-fA-F-]{20,})\/preview\/[a-z]+\/(\d+)\/?$/;
  const ONEDRIVE_HOSTS = new Set([`1drv.ms`, `onedrive.live.com`]);

  // Result for a link that is not converted.
  function direct(url) {
    return { url: url.href, alternatives: [], drive: `direct` };
  }

  // Google Drive: file/d/ID/view, open?id=ID or uc?id=ID.
  function googleDrive(url) {
    const fromPath = /^\/file\/d\/([^/]+)/.exec(url.pathname);
    const id = fromPath ? fromPath[1] : url.searchParams.get(`id`);
    const isOpen = /^\/(open|uc)$/.test(url.pathname);
    if (!id || !GOOGLE_ID.test(id) || !(fromPath || isOpen)) return null;
    return {
      url: `https://lh3.googleusercontent.com/d/${id}`,
      alternatives: [`https://drive.google.com/uc?export=view&id=${id}`],
      drive: `google`
    };
  }

  // OneDrive: recent links cannot be shown in another page, so the link is not converted. The
  // widget reports it with a dedicated message and offers to open it in a new tab.
  function oneDrive(url) {
    return { url: url.href, alternatives: [], drive: `onedrive` };
  }

  // kDrive: the API address of the shared file. The file number is only in the address of the
  // page that shows the picture (.../preview/image/NUMBER); a plain share address does not hold it.
  function kDrive(url) {
    const page = KDRIVE_PREVIEW.exec(url.pathname);
    if (page) {
      const base = `https://kdrive.infomaniak.com/2/app/${page[1]}/share/${page[2]}/files/${page[3]}`;
      return { url: `${base}/download`, alternatives: [`${base}/preview`], drive: `kdrive` };
    }
    const share = KDRIVE_SHARE.exec(url.pathname);
    if (!share) return null;
    const base = `https://kdrive.infomaniak.com/2/app/${share[1]}/share/${share[2]}`;
    return { url: `${base}/download`, alternatives: [`${base}/preview`], drive: `kdrive` };
  }

  // Returns { url, alternatives, drive } for a link that parseHttpsUrl of images.js already
  // accepted. `url` is the address to load first, `alternatives` the ones to try if it fails,
  // `drive` the drive that was recognised, or `direct` when the link is used as it is.
  function toImageUrl(href) {
    const url = new URL(href);
    if (url.hostname === `drive.google.com`) return googleDrive(url) || direct(url);
    if (ONEDRIVE_HOSTS.has(url.hostname)) return oneDrive(url);
    if (url.hostname === `kdrive.infomaniak.com`) return kDrive(url) || direct(url);
    const share = NEXTCLOUD_SHARE.exec(url.pathname);
    if (!share) return direct(url);
    // The download address of a share gives the file itself instead of the page of the share.
    url.pathname = `${share[1]}/download`;
    url.hash = ``;
    return { url: url.href, alternatives: [], drive: `nextcloud` };
  }

  const api = { toImageUrl };
  if (typeof module !== `undefined` && module.exports) module.exports = api;
  else root.imagePlusDrives = api;
})(typeof window !== `undefined` ? window : globalThis);
