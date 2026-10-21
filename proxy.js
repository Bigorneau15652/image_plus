// Checks and uses the optional proxy setting for 360 degree links. The setting is an https address
// that contains {url}, which is replaced by the encoded link of the picture. This file has no
// access to the page: it is pure logic, easy to test with Node.
(function (root) {
  const PLACEHOLDER = `{url}`;
  const MAX_LENGTH = 500;

  // Checks the text typed by the user. Returns { ok: true, template } or { ok: false, reason }
  // where reason is one of `empty`, `https`, `credentials`, `placeholder`, `host`.
  function checkProxyTemplate(text) {
    const template = String(text === null || text === undefined ? `` : text).trim();
    if (!template) return { ok: false, reason: `empty` };
    if (template.length > MAX_LENGTH || !/^https:\/\//i.test(template)) return { ok: false, reason: `https` };
    if (template.split(PLACEHOLDER).length !== 2) return { ok: false, reason: `placeholder` };
    const hostPart = template.slice(`https://`.length).split(/[/?#]/)[0];
    if (hostPart.includes(`{`) || hostPart.includes(`}`)) return { ok: false, reason: `host` };
    let url;
    try {
      url = new URL(template.replace(PLACEHOLDER, encodeURIComponent(`https://example.org/a.jpg`)));
    } catch {
      return { ok: false, reason: `https` };
    }
    if (url.protocol !== `https:`) return { ok: false, reason: `https` };
    if (url.username || url.password) return { ok: false, reason: `credentials` };
    return { ok: true, template };
  }

  // Address to load to get a picture through the proxy.
  function buildProxyUrl(template, href) {
    return template.replace(PLACEHOLDER, encodeURIComponent(href));
  }

  // Reads the stored options of the widget. Returns the template to use, or null when the
  // proxy is off or the stored address is not valid.
  function activeProxy(options) {
    if (!options || options.proxyEnabled !== true) return null;
    const checked = checkProxyTemplate(options.proxyUrl);
    return checked.ok ? checked.template : null;
  }

  const api = { checkProxyTemplate, buildProxyUrl, activeProxy, PLACEHOLDER };
  if (typeof module !== `undefined` && module.exports) module.exports = api;
  else root.imagePlusProxy = api;
})(typeof window !== `undefined` ? window : globalThis);
