// Image Plus widget (version 0.8): the entry point. It talks to Grist (selected row, options,
// columns), turns the cells into images, decides what to show and where: in the widget page or in
// the floating window (one display at a time). The drawing is done by display.js, the floating
// window by float-control.js and float.js, the settings form by settings.js.
(function () {
  const { t, applyTranslations } = window.imagePlusI18n;
  const { parseImages, MAX_IMAGES } = window.imagePlusImages;
  const { toImageUrl } = window.imagePlusDrives;
  const { buildProxyUrl, activeProxy } = window.imagePlusProxy;

  const MAX_SAMPLES = 3;
  // A Grist download token is renewed when less than this time is left.
  const TOKEN_MARGIN_MS = 30000;
  // A picture larger than this is not downloaded: it would fill the memory of the browser tab.
  const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
  const MAX_DOWNLOAD_MB = MAX_DOWNLOAD_BYTES / (1024 * 1024);

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
    rejectedNotice: ``, actionNotice: ``, empty: ``, signature: ``,
    floating: false
  };

  const display = window.imagePlusDisplay.createDisplay(el, { onFlatLoaded: preloadNext });
  const floatControl = window.imagePlusFloatControl.createFloatControl({
    url: `float.html?v=0.8.0`,
    name: `imageplus-float`,
    onStep: step,
    onClosed: leaveWindow
  });
  const settings = window.imagePlusSettings.createSettings(
    {
      panel: $(`settings`), enabled: $(`proxyEnabled`), url: $(`proxyUrl`), error: $(`settingsError`),
      save: $(`settingsSave`), cancel: $(`settingsCancel`)
    },
    (options) => grist.widgetApi.setOptions(options)
  );

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

  // Downloads a picture to memory (an attachment, or a 360 link through the proxy). A picture
  // above MAX_DOWNLOAD_BYTES is refused, from its announced size first and from its real size next.
  async function downloadBlob(address) {
    const response = await fetch(address, { referrerPolicy: `no-referrer`, credentials: `omit` });
    if (!response.ok) throw new Error(`download`);
    if (Number(response.headers.get(`content-length`)) > MAX_DOWNLOAD_BYTES) throw new Error(`tooLarge`);
    const blob = await response.blob();
    if (blob.size > MAX_DOWNLOAD_BYTES) throw new Error(`tooLarge`);
    return blob;
  }

  // Message for a failed download: a dedicated one when the picture is too large.
  function downloadFailureText(error, fallbackKey) {
    return error && error.message === `tooLarge` ? t(`downloadTooLarge`, { max: MAX_DOWNLOAD_MB }) : t(fallbackKey);
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
      } catch (error) {
        item.notes.push(downloadFailureText(error, failureKey));
      }
    }

    if (isLink) {
      item.candidates = candidatesOf(image);
    } else if (forWindow) {
      // The floating window cannot use the Grist token: the picture is handed over as a blob.
      try {
        item.blob = await downloadBlob(address);
      } catch (error) {
        item.errorText = downloadFailureText(error, `attachmentDownloadFailed`);
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
    if (forWindow) floatControl.post({ type: `imageplus:begin`, item: lite });
    else display.begin(lite);

    const item = await resolveItem(image, state.current, forWindow);
    if (version !== state.showVersion || forWindow !== state.floating) return;
    if (forWindow) floatControl.post({ type: `imageplus:show`, item });
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

  // Moves to the previous (-1) or next (1) image of the row, when there are several.
  function step(delta) {
    if (state.images.length > 1) showImage(state.current + delta);
  }

  // Nothing to show: the widget shows a message, the floating window too.
  function showEmpty(text, keepNotice) {
    state.images = [];
    state.showVersion += 1;
    state.empty = text;
    state.signature = ``;
    display.clear();
    el.viewer.hidden = true;
    if (!keepNotice) {
      state.rejectedNotice = ``;
      refreshNotice();
    }
    setMessage(state.floating ? `` : text);
    if (state.floating) floatControl.post({ type: `imageplus:empty`, text });
  }

  // Called by Grist each time the selected row (or its content) changes.
  function onRecord(record, mapping) {
    if (!record) return showEmpty(t(`pickRow`));
    const row = grist.mapColumnNames(record);
    if (!row || !mapping || !(mapping.attachments || mapping.links)) return showEmpty(t(`needMapping`));

    const { images, rejected } = parseImages(row, (n) => t(`imageN`, { n }));
    state.rejectedNotice = rejected.length ? rejectedNotice(rejected, mapping) : ``;
    refreshNotice();
    // Grist calls us again for any change of the row, even a cell that is not an image column:
    // when the images are the same, the display is left alone (no new download, no jump to image 1).
    const signature = JSON.stringify(images.map((image) => [image.kind, image.id, image.href, image.label, image.is360]));
    const unchanged = signature === state.signature && images.length > 0;
    state.images = images;
    if (!images.length) return showEmpty(rejected.length ? `` : t(`noImages`), true);
    state.signature = signature;
    if (unchanged) return;
    setMessage(``);
    el.viewer.hidden = state.floating;
    showImage(0);
  }

  // ---------------------------------------------------------- Floating window

  // Back to the widget: the window is closed, the widget draws the current image again.
  function leaveWindow() {
    if (!state.floating) return;
    state.floating = false;
    floatControl.close();
    el.floating.hidden = true;
    if (state.images.length) {
      el.viewer.hidden = false;
      showImage(state.current);
    } else {
      setMessage(state.empty);
    }
  }

  // Called by the button of the caption line: moves the display to the floating window.
  async function enterWindow() {
    if (state.floating) return;
    const result = await floatControl.open();
    state.actionNotice = result === `blocked` ? t(`popupBlocked`) : result === `silent` ? t(`floatFailed`) : ``;
    refreshNotice();
    if (result !== `ok`) return;
    state.floating = true;
    display.clear();
    el.viewer.hidden = true;
    setMessage(``);
    el.floating.hidden = false;
    if (state.images.length) showImage(state.current);
    else floatControl.post({ type: `imageplus:empty`, text: state.empty });
  }

  // ----------------------------------------------------------------- Settings

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
  el.prev.addEventListener(`click`, () => step(-1));
  el.next.addEventListener(`click`, () => step(1));
  el.floatButton.addEventListener(`click`, enterWindow);
  el.backButton.addEventListener(`click`, leaveWindow);
  document.addEventListener(`keydown`, (event) => {
    if (event.key === `Escape` && settings.isOpen()) settings.close();
    else if (settings.isOpen()) return;
    else if (event.key === `ArrowLeft`) step(-1);
    else if (event.key === `ArrowRight`) step(1);
  });

  grist.ready({
    requiredAccess: `read table`,
    onEditOptions: () => settings.open(state.options),
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
