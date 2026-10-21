# image_plus

English first, version française plus bas.

## English

A custom widget for [Grist](https://www.getgrist.com) that shows the images of the selected row, including 360 degree panoramas. It is being built in small versions.

Status: version 0.4. The widget shows the images of the selected row one at a time, with the name, a counter, previous and next buttons and the arrow keys, and reports the values it ignored. Share links of Nextcloud, Google Drive, OneDrive and kDrive are converted automatically (the public share must show a picture; the commercial drives do not document these addresses, so they may stop working one day). An attachment marked `[360]` opens in a panoramic view (drag to look around, mouse wheel or the + and - buttons to zoom, left and right arrow keys to change image); a picture larger than the graphics card accepts is reduced automatically and the widget says so. A 360 degree link is still shown flat, with a note: the panoramic view of links comes in a later version. Attachments need the access level "Full document access"; links work with "Read table".

### Columns

In the right-hand panel of Grist, under the access level, choose the columns. All three are optional, but the widget needs at least the attachments or the links.

- Attachments: a column of type Attachments.
- Links: a column of type Text with one https link to an image per line.
- Names: a column of type Text with one name per line. The first lines name the attachments, the following lines name the links. A blank line keeps the default name ("Image N"). Add `[360]` to the name of a 360 degree panorama, for example `Hall [360]`: the marker is not shown in the caption. Without the names column, no image is shown as a 360 degree panorama.

A cell may hold several images. Accepted images: PNG, JPEG, GIF, BMP, WebP, SVG and AVIF. Links must be absolute https addresses without embedded credentials. Other formats (PDF, DXF, TIFF, HEIC, RAW...) are reported in a banner naming the column and examples.

### Install

1. Publish the repository with GitHub Pages: Settings, Pages, Source "Deploy from a branch", branch `main`, folder `/ (root)`.
2. The widget address is `https://YOUR-ACCOUNT.github.io/image_plus/index.html`.
3. In Grist, add a page with a custom widget and paste that address. Links work with the "Read table" access level.

If your Grist server is not `grist.numerique.gouv.fr`, edit three places in `index.html`: the `src` of the `grist-plugin-api.js` script and, in the Content-Security-Policy line just above it, the host of `script-src` and the host pattern of `connect-src` (for the public service use `https://docs.getgrist.com` and `https://*.getgrist.com`).

### Security and privacy

- The only external script is the Grist plugin API, loaded from your own Grist server. Nothing is loaded from a CDN and no data is sent to any third-party service.
- The 360 degree view uses Pannellum 2.5.6 (MIT licence), copied into `vendor/pannellum/` and loaded from this site only. It is checked for `eval` and inline styles: see `vendor/pannellum/VENDOR.md`.
- The page has a Content-Security-Policy that forbids any other source. The widget downloads an attachment only to give it to the panoramic view, from your Grist server, and the picture never leaves your browser.
- Links must be absolute https addresses without embedded credentials; anything else is ignored and reported.
- User data (names, links) is only ever inserted into the page as text, never as HTML.

### Development

`npm test` runs the tests of the cell analysis (`images.js`), of the links of drives (`drives.js`) and of the size decisions of the 360 degree view (`panorama.js`) with Node. The pages reference their scripts with `?v=0.4.0`: change that number in `index.html` with every release so that browsers fetch the new files at once.

### Files

- `index.html`, `widget.js`, `widget.css`: the widget.
- `images.js`: turns the cell values into a list of images (no page access, tested with Node).
- `drives.js`: turns a link of a drive into the addresses of the picture (Nextcloud, Google Drive, OneDrive, kDrive, tested with Node).
- `panorama.js`: decides whether a picture is reduced for the graphics card (no page access, tested with Node).
- `vendor/pannellum/`: the Pannellum viewer, with its licence.
- `shared/i18n.js`: French and English texts, picked from the browser language.
- `tests/`: the tests.

Licence: MIT.

## Français

Widget personnalisé pour [Grist](https://www.getgrist.com) qui affiche les images de la ligne sélectionnée, y compris les panoramas à 360°. Il est construit par petites versions.

État : version 0.4. Le widget affiche une à une les images de la ligne sélectionnée, avec le nom, un compteur, les boutons précédent et suivant et les flèches du clavier, et signale les valeurs ignorées. Les liens de partage Nextcloud, Google Drive, OneDrive et kDrive sont convertis automatiquement (le partage public doit désigner une image ; les drives commerciaux ne documentent pas ces adresses, elles peuvent donc cesser de fonctionner un jour). Une pièce jointe marquée `[360]` s'ouvre en vue panoramique (glisser pour regarder autour, molette ou boutons + et - pour zoomer, flèches gauche et droite pour changer d'image) ; une image plus grande que ce que la carte graphique accepte est réduite automatiquement et le widget l'indique. Un lien 360° est encore affiché à plat, avec une note : la vue panoramique des liens arrive dans une prochaine version. Les pièces jointes demandent le niveau d'accès « Accès complet au document » ; les liens fonctionnent avec « Lire la table ».

### Colonnes

Dans le panneau de droite de Grist, sous le niveau d'accès, choisissez les colonnes. Les trois sont facultatives, mais il faut au moins la colonne des pièces jointes ou celle des liens.

- Pièces jointes : une colonne de type Pièces jointes.
- Liens : une colonne de type Texte avec un lien https vers une image par ligne.
- Noms : une colonne de type Texte avec un nom par ligne. Les premières lignes nomment les pièces jointes, les suivantes nomment les liens. Une ligne vide garde le nom par défaut (« Image N »). Ajoutez `[360]` au nom d'un panorama à 360°, par exemple `Hall [360]` : le repère n'apparaît pas dans la légende. Sans la colonne des noms, aucune image n'est affichée en 360°.

Une cellule peut contenir plusieurs images. Images acceptées : PNG, JPEG, GIF, BMP, WebP, SVG et AVIF. Les liens doivent être des adresses https absolues sans identifiants. Les autres formats (PDF, DXF, TIFF, HEIC, RAW...) sont signalés dans un bandeau qui nomme la colonne et donne des exemples.

### Installation

1. Publiez le dépôt avec GitHub Pages : Settings, Pages, Source « Deploy from a branch », branche `main`, dossier `/ (root)`.
2. L'adresse du widget est `https://VOTRE-COMPTE.github.io/image_plus/index.html`.
3. Dans Grist, ajoutez une page avec un widget personnalisé et collez cette adresse. Les liens fonctionnent avec le niveau d'accès « Lire la table ».

Si votre serveur Grist n'est pas `grist.numerique.gouv.fr`, modifiez trois endroits dans `index.html` : l'adresse du script `grist-plugin-api.js` et, dans la ligne Content-Security-Policy située juste au-dessus, l'hôte de `script-src` et le motif d'hôte de `connect-src` (pour le service public, utilisez `https://docs.getgrist.com` et `https://*.getgrist.com`).

Le lecteur panoramique est Pannellum 2.5.6 (licence MIT), copié dans `vendor/pannellum/` : rien n'est chargé depuis un CDN.

Licence : MIT.
