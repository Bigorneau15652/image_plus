# Working notes for Claude sessions (image_plus)

image_plus is a Grist custom widget: it shows the images of the selected row, including 360 degree panoramas (Pannellum). It is hosted by GitHub Pages, with no build step. The maintainer is not a programmer.

## Dialogue

- Talk to the maintainer in French, in plain words, without flattery. Ask the questions that remove ambiguity before programming, in small groups, with a recommendation. Work by small versions that the maintainer can test one by one.
- Explain every GitHub step with the exact names of the buttons (merging a pull request, enabling GitHub Pages, updating the widget).
- Texts meant to be pasted into Word contain no emoji, no horizontal rules and no needless bullets. In French, never put a comma before "et" and avoid long dashes in the middle of a sentence.

## Code rules

- Every JavaScript string is a template literal (backticks), never single or double quotes, so that French apostrophes cause no syntax error.
- Identifiers and comments are in English: one short block above every function and file. Texts shown to the user go through `shared/i18n.js` (French and English).
- No code or library loaded from a CDN: anything the widget needs is copied into the repository with its licence. No `eval`, no `new Function`. User data is inserted into the page as text only, never as HTML.
- Only https links without credentials are used. The Content-Security-Policy of `index.html` stays as strict as the current version allows.
- Never copy content of the private reference note of the maintainer (Grist-SIPI-informations) into this public repository. The widget knows no table or column name: the columns are chosen by the user in the right-hand panel.
- Banners and messages must stay readable at a narrow width (about 340 px) and in dark mode: explicit colours, wrapping text, no truncation.
- Do not rebuild what Grist already provides (for example a full-screen button inside the Grist frame).

## Tests and versions

- `npm test` runs the Node tests of the pure modules (`images.js`, `drives.js`, `item.js`, `panorama.js`, `proxy.js`). Add a test for every behaviour of the cell analysis and of the other pure modules.
- `npm run test:integration` runs the browser tests of `tests/integration/` (Playwright, a development tool the widget never loads). Run them before every release; they are not part of the automatic GitHub check. Add a scenario for every visible behaviour.
- Structure: `widget.js` (entry point), `display.js` (drawing, shared with the floating window), `float-control.js` and `float.js` (floating window), `settings.js` (settings form). Keep each file to one role.
- Pages reference their scripts with `?v=X.Y.Z`: change that number in `index.html` and `float.html` with every release, and in `package.json`. Add a section to `CHANGELOG.md`.
- Commit message: `Version 0.2.0 : short description in French`. Work on a branch, push, open a draft pull request.
- The widget cannot be tried inside Grist from a session: give the maintainer the list of manual tests after each version.

## Decisions of the maintainer

- Accepted: images that a browser shows (PNG, JPEG, GIF, BMP, WebP, SVG, AVIF) and 360 degree panoramas. No PDF reader and no DXF reader.
- A 360 degree panorama is marked by `[360]` in its name, in the names column. Without the names column there is no 360 degree image.
- Drives for links: Nextcloud, Google Drive and kDrive (the kDrive address must be the one of the page that shows the picture, ending with `/preview/image/NUMBER`). OneDrive links cannot be shown in another page: the widget says so. The test links of the tests are invented values, never the real links of the maintainer. Only Nextcloud has a 360 degree test link.
- Optional proxy setting for 360 degree links (off by default, https and `{url}` only, never used for Grist attachments or flat images, stored in the options of the widget, never in the code, and the form warns that the address must hold no secret because anyone with access to the document can read it). The maintainer's own proxy is a Cloudflare Worker restricted to one domain; its address is never written in this public repository.
- Downloads made by the widget itself (attachments, 360 links through the proxy) are limited to 100 MB. When the images of a row do not change, the display is not redrawn.
- Grist server by default: `grist.numerique.gouv.fr`, as in `pdf_plus`. The display is in the widget, plus a floating window that takes over (one display at a time).
