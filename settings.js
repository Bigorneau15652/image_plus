// The settings form of the widget (opened by the "Open configuration" button of Grist): turns the
// proxy for 360 degree links on or off and checks the address before it is stored.
(function () {
  const { t } = window.imagePlusI18n;
  const { checkProxyTemplate } = window.imagePlusProxy;

  // Text of the error for each reason given by checkProxyTemplate.
  const ERROR_KEYS = {
    empty: `proxyErrorEmpty`, https: `proxyErrorHttps`, credentials: `proxyErrorCredentials`,
    placeholder: `proxyErrorPlaceholder`, host: `proxyErrorHost`
  };

  // `el` holds the form elements; `save(options)` stores the options (through Grist).
  function createSettings(el, save) {
    // Shows the form with the stored values.
    function open(options) {
      el.enabled.checked = options.proxyEnabled === true;
      el.url.value = typeof options.proxyUrl === `string` ? options.proxyUrl : ``;
      el.error.hidden = true;
      el.panel.hidden = false;
      el.enabled.focus();
    }

    // Hides the form without saving.
    function close() {
      el.panel.hidden = true;
    }

    // True while the form is shown.
    function isOpen() {
      return !el.panel.hidden;
    }

    // Checks the form, then stores the options. An invalid address is refused only when the proxy is on.
    function submit() {
      const enabled = el.enabled.checked;
      const checked = checkProxyTemplate(el.url.value);
      if (enabled && !checked.ok) {
        el.error.textContent = t(ERROR_KEYS[checked.reason]);
        el.error.hidden = false;
        return;
      }
      save({ proxyEnabled: enabled, proxyUrl: checked.ok ? checked.template : `` });
      close();
    }

    el.save.addEventListener(`click`, submit);
    el.cancel.addEventListener(`click`, close);
    return { open, close, isOpen };
  }

  window.imagePlusSettings = { createSettings };
})();
