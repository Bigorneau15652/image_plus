# Pannellum

- Version: 2.5.6 (npm package `pannellum@2.5.6`, files `build/pannellum.js` and `build/pannellum.css`, unmodified)
- Author: Matthew Petroff, licence MIT (see `LICENSE`), https://github.com/mpetroff/pannellum
- Use: 360 degree panorama viewer of the widget. The files are copied here and loaded from this site only: no CDN.
- Checked for the Content-Security-Policy of `index.html`: no `eval`, no `new Function`, styles are set through the DOM (not inline attributes), icons are `data:` images. The library reads the image with an `XMLHttpRequest` on the `blob:` address given by the widget (hence `connect-src blob:`).
- Update: replace the two files with a newer release, then repeat the checks above and the manual tests.
