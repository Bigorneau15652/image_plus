// Turns the raw values of the Grist cells into the list of images the widget can show.
// This file has no access to the page: it is pure logic, easy to test with Node.
(function (root) {
  const MAX_LABEL_LENGTH = 120;
  const MAX_SAMPLE_LENGTH = 60;
  // A cell with more images than this is cut, so that a pasted list can never flood the page.
  const MAX_IMAGES = 200;

  // The 360 marker: written anywhere in the name of an image, in any case, spaces allowed inside.
  const TAG_360 = /\[\s*360\s*\]/gi;

  // File types that a browser cannot show as a picture. A link ending with one of them is
  // reported to the user instead of failing silently. Share links have no extension and pass.
  const UNSUPPORTED_EXTENSIONS = new Set([
    `pdf`, `dxf`, `dwg`, `tif`, `tiff`, `heic`, `heif`, `raw`, `psd`, `ai`, `eps`
  ]);

  // Splits a multi-line cell. Blank lines are kept so that line N of the names column
  // always matches position N of the images.
  function splitLines(value) {
    if (typeof value !== `string`) return [];
    return value.split(/\r?\n/).map((line) => line.trim());
  }

  // Accepts only absolute https links without embedded credentials.
  function parseHttpsUrl(text) {
    let url;
    try {
      url = new URL(text);
    } catch {
      return null;
    }
    if (url.protocol !== `https:` || url.username || url.password) return null;
    return url;
  }

  // Lower-case extension of the last path segment of a link, or an empty text.
  function extensionOf(url) {
    const lastSegment = url.pathname.split(`/`).filter(Boolean).pop() || ``;
    let decoded = lastSegment;
    try {
      decoded = decodeURIComponent(lastSegment);
    } catch {
      // A malformed percent sequence: the raw segment is used.
    }
    const dot = decoded.lastIndexOf(`.`);
    return dot < 0 ? `` : decoded.slice(dot + 1).toLowerCase();
  }

  // Shortens text shown in the "ignored values" banner.
  function sample(text) {
    return text.length > MAX_SAMPLE_LENGTH ? `${text.slice(0, MAX_SAMPLE_LENGTH)}…` : text;
  }

  // Reads one line of the names column: the label to show, and whether the 360 marker is present.
  function readName(line) {
    const text = String(line || ``);
    const is360 = new RegExp(TAG_360.source, `i`).test(text);
    const label = text.replace(TAG_360, ` `).replace(/\s+/g, ` `).trim().slice(0, MAX_LABEL_LENGTH);
    return { label, is360 };
  }

  // Main entry point.
  //   cells.attachments: raw value of the attachments column (array of ids), may be undefined
  //   cells.links:       raw value of the links column (text, one https link per line)
  //   cells.names:       raw value of the names column (one name per line)
  //   defaultLabel:      function (n) => label of the n-th image that has no name
  // Images come out in a fixed order: attachments first, then links. Line N of the names
  // column names the N-th image of that order (blank link lines keep their place).
  // Returns { images, rejected }. Each rejected value carries the column it came from
  // (`attachments` or `links`) and the reason (`link`, `format` or `limit`).
  function parseImages(cells, defaultLabel) {
    const images = [];
    const rejected = [];
    const names = splitLines(cells.names);
    let position = 0;
    let truncated = false;

    // Adds one image; its name is on line `nameIndex` of the names column.
    function add(image, nameIndex) {
      if (images.length >= MAX_IMAGES) {
        truncated = true;
        return;
      }
      const name = readName(names[nameIndex]);
      images.push({
        ...image,
        label: name.label || defaultLabel(images.length + 1),
        is360: name.is360,
        key: `${image.kind}:${images.length}`
      });
    }

    // Adds one attachment. Grist gives numeric ids, sometimes preceded by a marker.
    function addAttachment(id) {
      add({ kind: `attachment`, id }, position);
      position += 1;
    }

    // Adds one link line, or reports it. Blank lines keep their place for the names.
    function addLinkLine(line) {
      const index = position;
      position += 1;
      if (!line) return;
      const url = parseHttpsUrl(line);
      if (!url) {
        rejected.push({ text: sample(line), source: `links`, reason: `link` });
        return;
      }
      if (UNSUPPORTED_EXTENSIONS.has(extensionOf(url))) {
        rejected.push({ text: sample(line), source: `links`, reason: `format` });
        return;
      }
      add({ kind: `link`, href: url.href }, index);
    }

    const attachments = cells.attachments;
    if (Array.isArray(attachments)) {
      attachments.filter((id) => Number.isInteger(id) && id > 0).forEach(addAttachment);
    }
    const links = cells.links;
    if (typeof links === `string`) {
      splitLines(links).forEach(addLinkLine);
    } else if (links !== null && links !== undefined && links !== ``) {
      rejected.push({ text: sample(String(links)), source: `links`, reason: `link` });
    }

    if (truncated) rejected.push({ text: String(MAX_IMAGES), source: `links`, reason: `limit` });
    return { images, rejected };
  }

  const api = { parseImages, parseHttpsUrl, extensionOf, readName, MAX_IMAGES };
  if (typeof module !== `undefined` && module.exports) module.exports = api;
  else root.imagePlusImages = api;
})(typeof window !== `undefined` ? window : globalThis);
