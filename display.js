// Draws one image in a viewer area: the caption bar, the flat picture or the 360 degree view,
// the notes and the error. The widget page and the floating window both use it, so that they
// look and behave the same. An image arrives as an "item" (see item.js).
(function () {
  const { t } = window.imagePlusI18n;
  const { textureLimit, fitSize } = window.imagePlusPanorama;

  // `el` holds the elements of the area (viewer, photo, status, pano, error, note, name, badge, counter).
  // `hooks.onFlatLoaded` is called when a flat picture is on screen.
  function createDisplay(el, hooks) {
    // Changes with every image: a load that ends after a newer one started is ignored.
    let version = 0;
    let gpuLimit = null;
    let viewer = null;
    let panoramaUrl = null;
    let flatUrl = null;

    // Largest texture side the graphics card accepts, read once through a throw-away canvas.
    function readGpuLimit() {
      if (gpuLimit === null) {
        try {
          const gl = document.createElement(`canvas`).getContext(`webgl`);
          gpuLimit = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0;
        } catch {
          gpuLimit = 0;
        }
      }
      return gpuLimit;
    }

    // Shows an error under the picture, with a link to open the original address when there is one.
    function setError(text, link) {
      el.error.textContent = text || ``;
      if (text && link) {
        // The link is an https address already checked, opened in a new tab.
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

    // Shows the notes under the picture (one sentence each).
    function setNotes(notes) {
      el.note.textContent = notes.join(` `);
      el.note.hidden = !notes.length;
    }

    // Stops the panoramic viewer and frees the pictures held in memory.
    function release() {
      if (viewer) {
        try {
          viewer.destroy();
        } catch {
          // The viewer is already gone.
        }
        viewer = null;
      }
      if (panoramaUrl) {
        URL.revokeObjectURL(panoramaUrl);
        panoramaUrl = null;
      }
      if (flatUrl) {
        URL.revokeObjectURL(flatUrl);
        flatUrl = null;
      }
      el.pano.textContent = ``;
      el.pano.hidden = true;
      el.photo.hidden = true;
      el.photo.removeAttribute(`src`);
    }

    // Decodes a picture from a blob and gives it with its pixel size.
    async function decodePicture(blob) {
      const url = URL.createObjectURL(blob);
      try {
        const picture = new Image();
        picture.src = url;
        await picture.decode();
        return { width: picture.naturalWidth, height: picture.naturalHeight, source: picture };
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    // Reduces a picture that is larger than the graphics card accepts.
    // Returns { blob, size } where size is the final size when the picture was reduced.
    async function reducePanorama(blob) {
      const bitmap = await decodePicture(blob);
      try {
        const size = fitSize(bitmap.width, bitmap.height, textureLimit(readGpuLimit()));
        if (!size || !size.scaled) return { blob, size: null };
        const canvas = document.createElement(`canvas`);
        canvas.width = size.width;
        canvas.height = size.height;
        canvas.getContext(`2d`).drawImage(bitmap.source, 0, 0, size.width, size.height);
        const reduced = await new Promise((resolve) => canvas.toBlob(resolve, `image/jpeg`, 0.92));
        if (!reduced) throw new Error(`reduce`);
        return { blob: reduced, size };
      } finally {
        bitmap.source.removeAttribute(`src`);
      }
    }

    // Starts the panoramic viewer on a local picture. Resolves once the picture is shown.
    function startViewer(url) {
      return new Promise((resolve, reject) => {
        el.pano.hidden = false;
        viewer = window.pannellum.viewer(el.pano, {
          type: `equirectangular`,
          panorama: url,
          autoLoad: true,
          showFullscreenCtrl: false,
          showZoomCtrl: true,
          disableKeyboardCtrl: true,
          compass: false,
          hfov: 100,
          minHfov: 30,
          maxHfov: 120,
          strings: { loadingLabel: t(`loading`) }
        });
        viewer.on(`load`, () => resolve());
        viewer.on(`error`, () => reject(new Error(`viewer`)));
      });
    }

    // Shows a flat picture, from a blob or from a list of candidate addresses: when one fails
    // to load, the next one is tried before the error is shown.
    function showFlat(item, current) {
      let candidates = item.candidates;
      if (item.blob) {
        flatUrl = URL.createObjectURL(item.blob);
        candidates = [flatUrl];
      }
      let attempt = 0;
      el.photo.onload = () => {
        if (current !== version) return;
        el.status.textContent = ``;
        el.photo.hidden = false;
        if (hooks && hooks.onFlatLoaded) hooks.onFlatLoaded();
      };
      el.photo.onerror = () => {
        if (current !== version) return;
        attempt += 1;
        if (attempt < candidates.length) {
          el.photo.src = candidates[attempt];
          return;
        }
        el.status.textContent = ``;
        setError(t(`loadError`), item.errorLink);
      };
      el.photo.alt = item.label;
      el.photo.src = candidates[0];
    }

    // Opens the picture in the panoramic viewer; on failure the flat picture is shown instead.
    async function showPanorama(item, current) {
      try {
        const prepared = await reducePanorama(item.blob);
        if (current !== version) return;
        panoramaUrl = URL.createObjectURL(prepared.blob);
        await startViewer(panoramaUrl);
        if (current !== version) return;
        el.status.textContent = ``;
        if (prepared.size) setNotes([...item.notes, t(`noteScaled`, prepared.size)]);
      } catch {
        if (current !== version) return;
        release();
        setNotes([...item.notes, t(`panoramaFailed`)]);
        showFlat(item, current);
      }
    }

    // Starts a new image: caption, counter and "loading", before the picture is ready.
    function begin(item) {
      version += 1;
      release();
      el.name.textContent = item.label;
      el.badge.textContent = t(`badge360`);
      el.badge.hidden = !item.is360;
      el.counter.textContent = t(`counter`, { current: item.position, total: item.count });
      el.viewer.classList.toggle(`single`, item.count < 2);
      setNotes([]);
      setError(``);
      el.status.textContent = t(`loading`);
      return version;
    }

    // Shows a resolved item.
    function show(item) {
      const current = begin(item);
      setNotes(item.notes);
      if (item.errorText) {
        el.status.textContent = ``;
        setError(item.errorText, item.errorLink);
      } else if (item.panorama) {
        showPanorama(item, current);
      } else {
        showFlat(item, current);
      }
    }

    // Empties the area (nothing to show).
    function clear() {
      version += 1;
      release();
      el.status.textContent = ``;
      setError(``);
      setNotes([]);
    }

    return { begin, show, clear };
  }

  window.imagePlusDisplay = { createDisplay };
})();
