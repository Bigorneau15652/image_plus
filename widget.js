// Image Plus widget (version 0.6): shows the images of the selected Grist row one at a time,
// with the name, the counter, previous and next buttons and the arrow keys. Images come from
// attachments or from https links (Nextcloud, Google Drive and kDrive share links are converted).
// An attachment marked 360, or a 360 link when the proxy setting is on, opens in the panoramic
// viewer. The images can be shown in a floating window (second screen): one display at a time.
// This file talks to Grist and decides what to show; display.js draws it.
(function () {
  const { t, applyTranslations } = window.imagePlusI18n;
  const { parseImages, MAX_IMAGES } = window.imagePlusImages;
  const { toImageUrl } = window.imagePlusDrives;
  const { checkProxyTemplate, buildProxyUrl, activeProxy } = window.imagePlusProxy;

  const MAX_SAMPLES = 3;
  // A Grist download token is renewed when less than this time is left.
  const TOKEN_MARGIN_MS = 30000;
  const FLOAT_NAME = `imageplus-float`;
  const FLOAT_URL = `float.html?v=0.6.1`;
  const HANDSHAKE_INTERVAL_MS = 250;
  const CLOSE_CHECK_MS = 1000;

  const $ = (id) => document.getElementById(id);
  const el = {
    notice: $(`notice`), message: $(`message`), viewer: $(`viewer`), photo: $(`photo`),
    status: $(`status`), pano: $(`pano`), error: $(`error`), note: $(`note360`),
    name: $(`name`), badge: $(`badge`), counter: $(`counter`), prev: $(`prev`), next: $(`next`),
    floatButton: $(`floatButton`), floating: $(`floating`), backButton: $(`backButton`)
  };

  // `showVersion` changes with every image requested: a resolution that ends after a newer
  // request started is ignored.
  const state = {
    images: [], current: 0, showVersion: 0, token: null, options: {}, proxy: null,
    rejectedNotice: ``, actionNotice: ``, empty: ``,
    popup: null, floating: false, closeTimer: null
  };

  const display = window.imagePlusDisplay.createDisplay(el, { onFlatLoaded: preloadNext });

  // ---------------------------------------------------------------- Messages

  function setMessage(text) {
    el.message.textContent = text || ``;
  }

  // The banner shows the ignored values and the last action problem, if any.
  function refreshNotice() {
    const text = [state.rejectedNotice, state.actionNotice].filter(Boolean).join(` `);
    el.notice.textContent = text;
    el.notice.hidden = !text;
  }

  // Describes the ignored values: which column to check and a few examples.
  function describeRejected(items, reason, columnName) {
    const shown = items.slice(0, MAX_SAMPLES).map((item) => item.text).join(` ; `);
    const rest = items.length - MAX_SAMPLES;
    return t(reason === `format` ? `rejectedFormat` : `rejectedLink`, {
      count: items.length,
      column: columnName,
      examples: rest > 0 ? t(`andOthers`, { examples: shown, rest }) : shown
    });
  }

  // Builds the banner text of all the ignored values, one sentence per reason.
  function rejectedNotice(rejected, mapping) {
    const sentences = [];
    [`link`, `format`].forEach((reason) => {
      const items = rejected.filter((item) => item.reason === reason);
      if (items.length) sentences.push(describeRejected(items, reason, mapping[items[0].source]));
    });
    if (rejected.some((item) => item.reason === `limit`)) sentences.push(t(`rejectedLimit`, { max: MAX_IMAGES }));
    return sentences.join(` `);
  }

  // ------------------------------------------------------------- Attachments

  // Asks Grist for a short-lived read-only token and builds the download address.
  async function attachmentUrl(id) {
    const now = Date.now();
    if (!state.token || state.token.expires - now < TOKEN_MARGIN_MS) {
      const info = await grist.docApi.getAccessToken({ readOnly: true });
      state.token = {
        baseUrl: info.baseUrl,
        token: info.token,
        expires: now + (info.ttlMsecs || 60000)
      };
    }
    return `${state.token.baseUrl}/attachments/${id}/download?auth=${state.token.token}`;
  }

  // Downloads a picture to memory (an attachment, or a 360 link through the proxy).
  async function downloadBlob(address) {
    const response = await fetch(address, { referrerPolicy: `no-referrer`, credentials: `omit` });
    if (!response.ok) throw new Error(`download`);
    return response.blob();
  }

  // All the addresses to try for a link, the most likely first.
  function candidatesOf(image) {
    const converted = toImageUrl(image.href);
    return [converted.url, ...converted.alternatives];
  }

  // ------------------------------------------------------------------- Items

  // Turns an image of the list into an item that a display can draw (see item.js). The pictures
  // that need the Grist token, or the proxy, are downloaded here; the display does the rest.
  async function resolveItem(image, index, forWindow) {
    const item = {
      label: image.label, is360: image.is360, position: index + 1, count: state.images.length,
      notes: [], candidates: [], blob: null, panorama: false, errorText: ``,
      errorLink: image.kind === `link` ? image.href : ``
    };
    const isLink = image.kind === `link`;
    if (isLink && toImageUrl(image.href).drive === `onedrive`) {
      item.errorText = t(`onedriveUnsupported`);
      return item;
    }
    const viaProxy = image.is360 && isLink && Boolean(state.proxy);
    if (image.is360 && isLink && !viaProxy) item.notes.push(t(`noteLink360`));

    let address = ``;
    if (image.kind === `attachment`) {
      try {
        address = await attachmentUrl(image.id);
      } catch {
        item.errorText = t(`needFullAccess`);
        item.errorLink = ``;
        return item;
      }
    }

    if (image.is360 && (!isLink || viaProxy)) {
      const failureKey = viaProxy ? `panoramaProxyFailed` : `panoramaDownloadFailed`;
      try {
        item.blob = await downloadBlob(viaProxy ? buildProxyUrl(state.proxy, toImageUrl(image.href).url) : address);
        item.panorama = true;
        return item;
      } catch {
        item.notes.push(t(failureKey));
      }
    }

    if (isLink) {
      item.candidates = candidatesOf(image);
    } else if (forWindow) {
      // The floating window cannot use the Grist token: the picture is handed over as a blob.
      try {
        item.blob = await downloadBlob(address);
      } catch {
        item.errorText = t(`attachmentDownloadFailed`);
      }
    } else {
      item.candidates = [address];
    }
    return item;
  }

  // ---------------------------------------------------------------- Display

  // Shows the image at the given position, in the widget or in the floating window.
  async function showImage(index) {
    const count = state.images.length;
    state.current = (index + count) % count;
    const image = state.images[state.current];
    const version = ++state.showVersion;
    const forWindow = state.floating;

    const lite = { label: image.label, is360: image.is360, position: state.current + 1, count, notes: [] };
    if (forWindow) postToWindow({ type: `imageplus:begin`, item: lite });
    else display.begin(lite);

    const item = await resolveItem(image, state.current, forWindow);
    if (version !== state.showVersion || forWindow !== state.floating) return;
    if (forWindow) postToWindow({ type: `imageplus:show`, item });
    else display.show(item);
  }

  // Loads the next picture in advance when it is a link, so that the next click is instant.
  function preloadNext() {
    const next = state.images[(state.current + 1) % state.images.length];
    if (!next || next.kind !== `link` || state.images.length < 2) return;
    if (toImageUrl(next.href).drive === `onedrive` || (next.is360 && state.proxy)) return;
    const preload = new Image();
    preload.referrerPolicy = `no-referrer`;
    preload.src = toImageUrl(next.href).url;
  }

  function step(delta) {
    if (state.images.length > 1) showImage(state.current + delta);
  }

  // Nothing to show: the widget shows a message, the floating window too.
  function showEmpty(text, keepNotice) {
    state.images = [];
    state.showVersion += 1;
    state.empty = text;
    display.clear();
    el.viewer.hidden = true;
    if (!keepNotice) {
      state.rejectedNotice = ``;
      refreshNotice();
    }
    setMessage(state.floating ? `` : text);
    if (state.floating) postToWindow({ type: `imageplus:empty`, text });
  }

  // Called by Grist each time the selected row (or its content) changes.
  function onRecord(record, mapping) {
    if (!record) return showEmpty(t(`pickRow`));
    const row = grist.mapColumnNames(record);
    if (!row || !mapping || !(mapping.attachments || mapping.links)) return showEmpty(t(`needMapping`));

    const { images, rejected } = parseImages(row, (n) => t(`imageN`, { n }));
    state.rejectedNotice = rejected.length ? rejectedNotice(rejected, mapping) : ``;
    refreshNotice();
    state.images = images;
    if (!images.length) return showEmpty(rejected.length ? `` : t(`noImages`), true);
    setMessage(``);
    el.viewer.hidden = state.floating;
    showImage(0);
  }

  // ---------------------------------------------------------- Floating window

  function windowIsOpen() {
    return Boolean(state.popup) && !state.popup.closed;
  }

  function postToWindow(message) {
    if (!windowIsOpen()) return;
    try {
      state.popup.postMessage(message, location.origin);
    } catch {
      // The window is closing: the close check will notice.
    }
  }

  // Opens the window, or finds the one that is already open. Must run inside a click.
  // Returns false when the browser blocks it.
  function ensureWindow() {
    if (windowIsOpen()) return true;
    const width = Math.min(1200, Math.max(600, screen.availWidth - 100));
    const height = Math.min(860, Math.max(400, screen.availHeight - 100));
    const opened = window.open(``, FLOAT_NAME, `popup=yes,width=${width},height=${height},resizable=yes`);
    if (!opened) return false;
    // The link between the window and the widget is deliberately kept: Grist runs widgets in
    // a sandboxed frame, and such a frame may only navigate windows it is the opener of.
    state.popup = opened;
    return true;
  }

  // Pings the window until its page answers, so that we know its message listener is ready.
  function waitForWindow(timeoutMs) {
    return new Promise((resolve) => {
      let finished = false;
      const finish = (answered) => {
        if (finished) return;
        finished = true;
        clearInterval(timer);
        clearTimeout(deadline);
        window.removeEventListener(`message`, onMessage);
        resolve(answered);
      };
      const onMessage = (event) => {
        if (event.source === state.popup && event.origin === location.origin &&
            event.data && event.data.type === `imageplus:ready`) finish(true);
      };
      const ping = () => {
        try {
          state.popup.postMessage({ type: `imageplus:hello` }, location.origin);
        } catch {
          // Opaque origin or closed window: the deadline ends the wait.
        }
      };
      window.addEventListener(`message`, onMessage);
      const timer = setInterval(ping, HANDSHAKE_INTERVAL_MS);
      const deadline = setTimeout(() => finish(false), timeoutMs);
      ping();
    });
  }

  // Makes sure the window shows our page and is listening.
  async function connectWindow() {
    if (await waitForWindow(700)) return true;
    state.popup.location.href = FLOAT_URL;
    return waitForWindow(10000);
  }

  // Back to the widget: the window is closed, the widget draws the current image again.
  function leaveWindow() {
    clearInterval(state.closeTimer);
    state.closeTimer = null;
    if (!state.floating) return;
    state.floating = false;
    el.floating.hidden = true;
    if (windowIsOpen()) state.popup.close();
    state.popup = null;
    if (state.images.length) {
      el.viewer.hidden = false;
      showImage(state.current);
    } else {
      setMessage(state.empty);
    }
  }

  // Called by the button of the bar: moves the display to the floating window.
  async function enterWindow() {
    if (state.floating) return;
    if (!ensureWindow()) {
      state.actionNotice = t(`popupBlocked`);
      refreshNotice();
      return;
    }
    state.actionNotice = ``;
    refreshNotice();
    if (!await connectWindow()) {
      if (windowIsOpen()) state.popup.close();
      state.popup = null;
      state.actionNotice = t(`floatFailed`);
      refreshNotice();
      return;
    }
    state.floating = true;
    display.clear();
    el.viewer.hidden = true;
    setMessage(``);
    el.floating.hidden = false;
    state.closeTimer = setInterval(() => {
      if (!windowIsOpen()) leaveWindow();
    }, CLOSE_CHECK_MS);
    if (state.images.length) showImage(state.current);
    else postToWindow({ type: `imageplus:empty`, text: state.empty });
  }

  // Messages sent by the floating window: only our own page may talk to us.
  window.addEventListener(`message`, (event) => {
    if (event.origin !== location.origin || event.source !== state.popup || !event.data) return;
    const message = event.data;
    if (message.type === `imageplus:step` && (message.delta === 1 || message.delta === -1)) step(message.delta);
    else if (message.type === `imageplus:closed`) setTimeout(() => {
      if (!windowIsOpen()) leaveWindow();
    }, 0);
  });

  // ----------------------------------------------------------------- Settings

  const form = {
    panel: $(`settings`), enabled: $(`proxyEnabled`), url: $(`proxyUrl`), error: $(`settingsError`),
    save: $(`settingsSave`), cancel: $(`settingsCancel`)
  };

  // Opens the settings form with the stored values.
  function openSettings() {
    form.enabled.checked = state.options.proxyEnabled === true;
    form.url.value = typeof state.options.proxyUrl === `string` ? state.options.proxyUrl : ``;
    form.error.hidden = true;
    form.panel.hidden = false;
    form.enabled.focus();
  }

  function closeSettings() {
    form.panel.hidden = true;
  }

  // Checks the form and stores the options. An invalid address is refused only when the proxy is on.
  function saveSettings() {
    const enabled = form.enabled.checked;
    const checked = checkProxyTemplate(form.url.value);
    if (enabled && !checked.ok) {
      const keys = {
        empty: `proxyErrorEmpty`, https: `proxyErrorHttps`, credentials: `proxyErrorCredentials`,
        placeholder: `proxyErrorPlaceholder`, host: `proxyErrorHost`
      };
      form.error.textContent = t(keys[checked.reason]);
      form.error.hidden = false;
      return;
    }
    grist.widgetApi.setOptions({ proxyEnabled: enabled, proxyUrl: checked.ok ? checked.template : `` });
    closeSettings();
  }

  // Called by Grist with the stored options. A change of the proxy redraws the current 360 link.
  function onOptions(options) {
    state.options = options || {};
    const next = activeProxy(state.options);
    if (next === state.proxy) return;
    state.proxy = next;
    const current = state.images[state.current];
    if (current && current.is360 && current.kind === `link`) showImage(state.current);
  }

  // -------------------------------------------------------------------- Start

  applyTranslations(document);
  setMessage(t(`pickRow`));
  form.save.addEventListener(`click`, saveSettings);
  form.cancel.addEventListener(`click`, closeSettings);
  el.prev.addEventListener(`click`, () => step(-1));
  el.next.addEventListener(`click`, () => step(1));
  el.floatButton.addEventListener(`click`, enterWindow);
  el.backButton.addEventListener(`click`, leaveWindow);
  document.addEventListener(`keydown`, (event) => {
    if (event.key === `Escape` && !form.panel.hidden) closeSettings();
    else if (!form.panel.hidden) return;
    else if (event.key === `ArrowLeft`) step(-1);
    else if (event.key === `ArrowRight`) step(1);
  });

  grist.ready({
    requiredAccess: `read table`,
    onEditOptions: openSettings,
    columns: [
      {
        name: `attachments`,
        title: t(`columnAttachments`),
        type: `Attachments`,
        optional: true
      },
      {
        name: `links`,
        title: t(`columnLinks`),
        type: `Text`,
        optional: true
      },
      {
        name: `names`,
        title: t(`columnNames`),
        description: t(`columnNamesHelp`),
        type: `Text`,
        optional: true
      }
    ]
  });
  grist.onOptions(onOptions);
  grist.onRecord(onRecord);
})();
