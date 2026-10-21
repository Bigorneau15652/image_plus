// Image Plus widget (version 0.2): shows the images of the selected Grist row one at a time,
// with the name, the counter, previous and next buttons and the arrow keys. Images come from
// attachments or from https links (Nextcloud share links are converted). The 360 degree view
// comes in a later version: for now a 360 image is shown flat, with its marker.
(function () {
  const { t, applyTranslations } = window.imagePlusI18n;
  const { parseImages, MAX_IMAGES } = window.imagePlusImages;
  const { toImageUrl } = window.imagePlusDrives;

  const MAX_SAMPLES = 3;
  // A Grist download token is renewed when less than this time is left.
  const TOKEN_MARGIN_MS = 30000;

  const $ = (id) => document.getElementById(id);
  const el = {
    notice: $(`notice`), message: $(`message`), viewer: $(`viewer`), photo: $(`photo`),
    status: $(`status`), error: $(`error`), note360: $(`note360`), bar: $(`bar`),
    name: $(`name`), badge: $(`badge`), counter: $(`counter`), prev: $(`prev`), next: $(`next`)
  };

  // `rowVersion` changes with every row, `showVersion` with every image shown: a load that
  // finishes after a newer one started is ignored.
  const state = { images: [], current: 0, rowVersion: 0, showVersion: 0, token: null };

  // ---------------------------------------------------------------- Messages

  function setMessage(text) {
    el.message.textContent = text || ``;
  }

  function setNotice(text) {
    el.notice.textContent = text || ``;
    el.notice.hidden = !text;
  }

  function setError(text, link) {
    el.error.textContent = text || ``;
    if (text && link) {
      // The link is an https address already checked by the cell analysis, opened in a new tab.
      const anchor = document.createElement(`a`);
      anchor.href = link;
      anchor.target = `_blank`;
      anchor.rel = `noopener noreferrer`;
      anchor.textContent = t(`openLink`);
      el.error.appendChild(document.createTextNode(` `));
      el.error.appendChild(anchor);
    }
    el.error.hidden = !text;
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

  // Address of the picture element for an image of the list.
  async function addressOf(image) {
    return image.kind === `attachment` ? attachmentUrl(image.id) : toImageUrl(image.href).url;
  }

  // ---------------------------------------------------------------- Display

  // Shows the image at the given position: name, counter, then the picture itself.
  async function showImage(index) {
    const count = state.images.length;
    state.current = (index + count) % count;
    const image = state.images[state.current];
    const version = ++state.showVersion;

    el.name.textContent = image.label;
    el.badge.textContent = t(`badge360`);
    el.badge.hidden = !image.is360;
    el.note360.textContent = t(`note360`);
    el.note360.hidden = !image.is360;
    el.counter.textContent = t(`counter`, { current: state.current + 1, total: count });
    el.bar.classList.toggle(`single`, count < 2);
    el.photo.hidden = true;
    el.photo.removeAttribute(`src`);
    el.status.textContent = t(`loading`);
    setError(``);

    let address;
    try {
      address = await addressOf(image);
    } catch {
      if (version === state.showVersion) {
        el.status.textContent = ``;
        setError(t(`needFullAccess`));
      }
      return;
    }
    if (version !== state.showVersion) return;

    el.photo.onload = () => {
      if (version !== state.showVersion) return;
      el.status.textContent = ``;
      el.photo.hidden = false;
      preloadNext();
    };
    el.photo.onerror = () => {
      if (version !== state.showVersion) return;
      el.status.textContent = ``;
      setError(t(`loadError`), image.kind === `link` ? image.href : null);
    };
    el.photo.alt = image.label;
    el.photo.src = address;
  }

  // Loads the next picture in advance when it is a link, so that the next click is instant.
  function preloadNext() {
    const next = state.images[(state.current + 1) % state.images.length];
    if (!next || next.kind !== `link` || state.images.length < 2) return;
    const preload = new Image();
    preload.referrerPolicy = `no-referrer`;
    preload.src = toImageUrl(next.href).url;
  }

  function step(delta) {
    if (state.images.length > 1) showImage(state.current + delta);
  }

  function showEmpty(text) {
    state.images = [];
    state.showVersion += 1;
    el.viewer.hidden = true;
    el.photo.removeAttribute(`src`);
    setNotice(``);
    setMessage(text);
  }

  // Called by Grist each time the selected row (or its content) changes.
  function onRecord(record, mapping) {
    state.rowVersion += 1;
    if (!record) return showEmpty(t(`pickRow`));
    const row = grist.mapColumnNames(record);
    if (!row || !mapping || !(mapping.attachments || mapping.links)) return showEmpty(t(`needMapping`));

    const { images, rejected } = parseImages(row, (n) => t(`imageN`, { n }));
    setNotice(rejected.length ? rejectedNotice(rejected, mapping) : ``);
    state.images = images;
    if (!images.length) {
      state.showVersion += 1;
      el.viewer.hidden = true;
      setMessage(rejected.length ? `` : t(`noImages`));
      return;
    }
    setMessage(``);
    el.viewer.hidden = false;
    showImage(0);
  }

  // -------------------------------------------------------------------- Start

  applyTranslations(document);
  setMessage(t(`pickRow`));
  el.prev.addEventListener(`click`, () => step(-1));
  el.next.addEventListener(`click`, () => step(1));
  document.addEventListener(`keydown`, (event) => {
    if (event.key === `ArrowLeft`) step(-1);
    else if (event.key === `ArrowRight`) step(1);
  });

  grist.ready({
    requiredAccess: `read table`,
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
  grist.onRecord(onRecord);
})();
