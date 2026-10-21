// Describes the "item" that the widget hands over to a display (the widget page or the floating
// window): one image, already resolved to what can be drawn. The floating window receives items
// from another page, so every field is checked and cut before use. This file has no access to the
// page: it is pure logic, easy to test with Node.
(function (root) {
  const MAX_LABEL = 120;
  const MAX_NOTE = 600;
  const MAX_NOTES = 5;
  const MAX_CANDIDATES = 4;
  const MAX_COUNT = 1000;

  // Keeps only an absolute https address without credentials, or returns an empty text.
  function safeHttps(text) {
    if (typeof text !== `string`) return ``;
    let url;
    try {
      url = new URL(text);
    } catch {
      return ``;
    }
    return url.protocol === `https:` && !url.username && !url.password ? url.href : ``;
  }

  // Text cut to a maximum length; anything that is not text gives an empty text.
  function safeText(value, max) {
    return typeof value === `string` ? value.slice(0, max) : ``;
  }

  // Whole number inside a range, or the fallback.
  function safeInteger(value, min, max, fallback) {
    return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  }

  // Returns a clean item, or null when the value is not an item at all.
  function sanitizeItem(raw) {
    if (!raw || typeof raw !== `object`) return null;
    const count = safeInteger(raw.count, 1, MAX_COUNT, 1);
    const blob = typeof Blob !== `undefined` && raw.blob instanceof Blob ? raw.blob : null;
    return {
      label: safeText(raw.label, MAX_LABEL),
      is360: raw.is360 === true,
      position: safeInteger(raw.position, 1, count, 1),
      count,
      notes: Array.isArray(raw.notes) ? raw.notes.slice(0, MAX_NOTES).map((n) => safeText(n, MAX_NOTE)).filter(Boolean) : [],
      candidates: Array.isArray(raw.candidates) ? raw.candidates.slice(0, MAX_CANDIDATES).map(safeHttps).filter(Boolean) : [],
      blob,
      panorama: raw.panorama === true && blob !== null,
      errorText: safeText(raw.errorText, MAX_NOTE),
      errorLink: safeHttps(raw.errorLink)
    };
  }

  const api = { sanitizeItem, safeHttps };
  if (typeof module !== `undefined` && module.exports) module.exports = api;
  else root.imagePlusItem = api;
})(typeof window !== `undefined` ? window : globalThis);
