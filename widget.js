// Image Plus widget (version 0.1): reads the cells of the selected Grist row and lists the
// images found, with the 360 marker and a banner for the values that were ignored.
// The display of the images themselves comes in the next versions.
(function () {
  const { t, applyTranslations } = window.imagePlusI18n;
  const { parseImages, MAX_IMAGES } = window.imagePlusImages;

  const MAX_SAMPLES = 3;

  const listEl = document.getElementById(`list`);
  const messageEl = document.getElementById(`message`);
  const noticeEl = document.getElementById(`notice`);
  const previewNoteEl = document.getElementById(`preview-note`);

  // ---------------------------------------------------------------- Messages

  function setMessage(text) {
    messageEl.textContent = text || ``;
  }

  function setNotice(text) {
    noticeEl.textContent = text || ``;
    noticeEl.hidden = !text;
  }

  // ---------------------------------------------------------------- Rendering

  // One line per image: its name, and the 360 marker when it has one.
  function renderImages(images) {
    listEl.textContent = ``;
    images.forEach((image) => {
      const item = document.createElement(`li`);
      item.className = `image-item`;
      // User data is only ever inserted as text, never as HTML.
      item.appendChild(document.createTextNode(image.label));
      if (image.is360) {
        const badge = document.createElement(`span`);
        badge.className = `badge-360`;
        badge.textContent = t(`badge360`);
        item.appendChild(badge);
      }
      listEl.appendChild(item);
    });
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

  function showEmpty(text) {
    renderImages([]);
    setNotice(``);
    setMessage(text);
    previewNoteEl.hidden = true;
  }

  // Called by Grist each time the selected row (or its content) changes.
  function onRecord(record, mapping) {
    if (!record) return showEmpty(t(`pickRow`));
    const row = grist.mapColumnNames(record);
    if (!row || !mapping || !(mapping.attachments || mapping.links)) return showEmpty(t(`needMapping`));

    const { images, rejected } = parseImages(row, (n) => t(`imageN`, { n }));
    renderImages(images);
    setNotice(rejected.length ? rejectedNotice(rejected, mapping) : ``);
    setMessage(images.length || rejected.length ? `` : t(`noImages`));
    previewNoteEl.hidden = false;
  }

  // -------------------------------------------------------------------- Start

  applyTranslations(document);
  previewNoteEl.hidden = true;
  setMessage(t(`pickRow`));

  grist.ready({
    requiredAccess: `read table`,
    columns: [
      {
        name: `attachments`,
        title: t(`columnAttachments`),
        description: t(`columnAttachmentsHelp`),
        type: `Attachments`,
        optional: true
      },
      {
        name: `links`,
        title: t(`columnLinks`),
        description: t(`columnLinksHelp`),
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
