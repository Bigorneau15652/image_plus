# Changelog

## 0.8.0

- `widget.js` is split into three files with one role each: the entry point (`widget.js`), the floating window control (`float-control.js`) and the settings form (`settings.js`). The behaviour does not change.
- Integration tests in a real browser (`npm run test:integration`, Playwright as a development tool).
- README completed: columns table, access level, services contacted, security, limits, tests. Screenshot made with invented data. `package.json` carries the Grist metadata.

## 0.7.0

- When Grist calls the widget again for a row whose images did not change, the display is not redrawn and nothing is downloaded again.
- Downloads made by the widget are limited to 100 MB.
- The settings form warns that the proxy address must hold no secret.
- The conversion of a plain kDrive share link, which could not be checked, is removed.
- The test links are invented values.

## 0.6.1

- The name is a small caption under the picture; the previous and next arrows and the counter are on the picture.

## 0.6.0

- Floating window for a second screen: one display at a time, own navigation, follows the selected row.

## 0.5.0

- Optional proxy for 360 degree links, set in the settings form. OneDrive links get a dedicated message.

## 0.4.1

- kDrive: the address of the picture page gives the address of the file.

## 0.4.0

- Links to Google Drive, OneDrive and kDrive.

## 0.3.0

- Panoramic view of 360 degree attachments (Pannellum 2.5.6), with automatic reduction of pictures larger than the graphics card accepts.

## 0.2.0

- Flat images from attachments and links, several images per cell, names, Nextcloud share links.

## 0.1.0

- First version: columns chosen in the right-hand panel of Grist.
