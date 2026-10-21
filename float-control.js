// Controls the floating window from the widget page: opens it, waits until its page answers,
// sends it messages, receives its requests (previous or next image) and notices when it is closed.
// The window is a page of our own site, so every message is checked for origin and sender.
(function () {
  const HANDSHAKE_INTERVAL_MS = 250;
  const CLOSE_CHECK_MS = 1000;
  // Time given to an already open window to answer, then to a freshly loaded page.
  const ANSWER_WAIT_MS = 700;
  const LOAD_WAIT_MS = 10000;

  // `url` is the page of the window, `name` its target name (a second click reuses the window).
  // `onStep(delta)` receives -1 or 1; `onClosed()` is called once when the user closes the window.
  function createFloatControl({ url, name, onStep, onClosed }) {
    let popup = null;
    let watching = false;
    let closeTimer = null;

    // True while the window exists and is not closed.
    function isOpen() {
      return Boolean(popup) && !popup.closed;
    }

    // Sends a message to the window; it only accepts messages that come from our own site.
    function post(message) {
      if (!isOpen()) return;
      try {
        popup.postMessage(message, location.origin);
      } catch {
        // The window is closing: the close check notices it.
      }
    }

    // Opens the window, or finds the one that is already open. Must run inside a click.
    // Returns false when the browser blocks it.
    function ensureWindow() {
      if (isOpen()) return true;
      const width = Math.min(1200, Math.max(600, screen.availWidth - 100));
      const height = Math.min(860, Math.max(400, screen.availHeight - 100));
      const opened = window.open(``, name, `popup=yes,width=${width},height=${height},resizable=yes`);
      if (!opened) return false;
      // The link between the window and the widget is deliberately kept: Grist runs widgets in
      // a sandboxed frame, and such a frame may only navigate windows it is the opener of.
      popup = opened;
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
          window.removeEventListener(`message`, onAnswer);
          resolve(answered);
        };
        const onAnswer = (event) => {
          if (event.source === popup && event.origin === location.origin &&
              event.data && event.data.type === `imageplus:ready`) finish(true);
        };
        window.addEventListener(`message`, onAnswer);
        const timer = setInterval(() => post({ type: `imageplus:hello` }), HANDSHAKE_INTERVAL_MS);
        const deadline = setTimeout(() => finish(false), timeoutMs);
        post({ type: `imageplus:hello` });
      });
    }

    // Makes sure the window shows our page and is listening.
    async function connect() {
      if (await waitForWindow(ANSWER_WAIT_MS)) return true;
      popup.location.href = url;
      return waitForWindow(LOAD_WAIT_MS);
    }

    // Stops watching and tells the widget that the window is gone (only once).
    function reportClosed() {
      if (!watching) return;
      stopWatching();
      onClosed();
    }

    // Stops the periodic check of the window (the window may stay open).
    function stopWatching() {
      watching = false;
      clearInterval(closeTimer);
      closeTimer = null;
    }

    // Opens the window and waits for its page. Resolves to `ok`, `blocked` (pop-up blocker) or
    // `silent` (the page did not answer). On `ok` the window is watched until it is closed.
    async function open() {
      if (!ensureWindow()) return `blocked`;
      if (!await connect()) {
        close();
        return `silent`;
      }
      watching = true;
      closeTimer = setInterval(() => {
        if (!isOpen()) reportClosed();
      }, CLOSE_CHECK_MS);
      return `ok`;
    }

    // Closes the window from the widget side (no notice to the widget).
    function close() {
      stopWatching();
      if (isOpen()) popup.close();
      popup = null;
    }

    // Requests sent by the window: only our own page, from the window we opened.
    window.addEventListener(`message`, (event) => {
      if (event.origin !== location.origin || event.source !== popup || !event.data) return;
      const message = event.data;
      if (message.type === `imageplus:step` && (message.delta === 1 || message.delta === -1)) onStep(message.delta);
      else if (message.type === `imageplus:closed`) setTimeout(() => {
        if (!isOpen()) reportClosed();
      }, 0);
    });

    return { isOpen, post, open, close };
  }

  window.imagePlusFloatControl = { createFloatControl };
})();
