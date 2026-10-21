// Floating window of Image Plus: shows the images that the widget hands over (same site,
// postMessage). It has no access to Grist: the widget resolves every picture, this page only
// draws it, and sends back the requests to go to the previous or the next image.
(function () {
  const { t, applyTranslations } = window.imagePlusI18n;
  const { sanitizeItem } = window.imagePlusItem;

  const $ = (id) => document.getElementById(id);
  const el = {
    message: $(`message`), viewer: $(`viewer`), photo: $(`photo`), status: $(`status`), pano: $(`pano`),
    error: $(`error`), note: $(`note360`), name: $(`name`), badge: $(`badge`),
    counter: $(`counter`), prev: $(`prev`), next: $(`next`)
  };
  const display = window.imagePlusDisplay.createDisplay(el, null);

  // Sends a request to the widget that opened this window.
  function sendToWidget(message) {
    if (!window.opener || window.opener.closed) return;
    try {
      window.opener.postMessage(message, location.origin);
    } catch {
      // The widget is gone: the window stays on its last image.
    }
  }

  // Asks the widget for the previous (-1) or next (1) image, when there are several.
  function step(delta) {
    if (!el.viewer.classList.contains(`single`)) sendToWidget({ type: `imageplus:step`, delta });
  }

  // Empties the window and shows a message instead of an image.
  function showMessage(text) {
    display.clear();
    el.viewer.hidden = true;
    el.message.textContent = text;
  }

  // Only the widget page of our own site may talk to this window.
  window.addEventListener(`message`, (event) => {
    if (event.origin !== location.origin || event.source !== window.opener || !event.data) return;
    const message = event.data;
    try {
      if (message.type === `imageplus:hello`) {
        event.source.postMessage({ type: `imageplus:ready` }, event.origin);
      } else if (message.type === `imageplus:begin`) {
        const item = sanitizeItem(message.item);
        if (!item) return;
        el.message.textContent = ``;
        el.viewer.hidden = false;
        display.begin(item);
      } else if (message.type === `imageplus:show`) {
        const item = sanitizeItem(message.item);
        if (!item) return;
        el.message.textContent = ``;
        el.viewer.hidden = false;
        display.show(item);
      } else if (message.type === `imageplus:empty`) {
        showMessage(typeof message.text === `string` ? message.text.slice(0, 600) : ``);
      }
    } catch {
      // A malformed message must never break the window.
    }
  });

  applyTranslations(document);
  el.message.textContent = t(`pickRow`);
  el.prev.addEventListener(`click`, () => step(-1));
  el.next.addEventListener(`click`, () => step(1));
  document.addEventListener(`keydown`, (event) => {
    if (event.key === `ArrowLeft`) step(-1);
    else if (event.key === `ArrowRight`) step(1);
  });
  window.addEventListener(`pagehide`, () => sendToWidget({ type: `imageplus:closed` }));
})();
