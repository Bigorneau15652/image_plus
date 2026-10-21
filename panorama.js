// Pure helpers for the 360 degree view: decides whether a picture must be reduced to fit the
// graphics card, and to which size. No access to the page, easy to test with Node.
(function (root) {
  // Hard ceiling, even when the graphics card accepts more: keeps memory use reasonable.
  const MAX_SIDE = 16384;
  // Used when the graphics card limit cannot be read.
  const FALLBACK_LIMIT = 4096;

  // Largest picture side allowed: the graphics card limit, capped, or a safe default.
  function textureLimit(gpuLimit) {
    if (!Number.isFinite(gpuLimit) || gpuLimit < 1024) return FALLBACK_LIMIT;
    return Math.min(Math.floor(gpuLimit), MAX_SIDE);
  }

  // Size to use for a picture of width x height. The ratio is kept; `scaled` tells whether the
  // picture was reduced so that the widget can say so.
  function fitSize(width, height, limit) {
    if (!(width > 0) || !(height > 0)) return null;
    const longest = Math.max(width, height);
    if (longest <= limit) return { width, height, scaled: false };
    const ratio = limit / longest;
    return {
      width: Math.max(1, Math.floor(width * ratio)),
      height: Math.max(1, Math.floor(height * ratio)),
      scaled: true
    };
  }

  const api = { textureLimit, fitSize, MAX_SIDE, FALLBACK_LIMIT };
  if (typeof module !== `undefined` && module.exports) module.exports = api;
  else root.imagePlusPanorama = api;
})(typeof window !== `undefined` ? window : globalThis);
