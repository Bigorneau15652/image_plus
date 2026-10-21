# image_plus

English first, version française plus bas.

## English

A custom widget for [Grist](https://www.getgrist.com) that shows the images of the selected row, including 360 degree panoramas. It is being built in small versions.

Status: version 0.6.0. The widget shows the images of the selected row one at a time, with the name, a counter, previous and next buttons and the arrow keys, and reports the values it ignored. Share links of Nextcloud, Google Drive and kDrive are converted automatically (the public share must show a picture; the commercial drives do not document these addresses, so they may stop working one day). An attachment marked `[360]` opens in a panoramic view (drag to look around, mouse wheel or the + and - buttons to zoom, left and right arrow keys to change image); a picture larger than the graphics card accepts is reduced automatically and the widget says so. A 360 degree link is shown flat, with a note, unless the optional proxy is turned on (see below). Attachments need the access level "Full document access"; links work with "Read table".

### Columns

In the right-hand panel of Grist, under the access level, choose the columns. All three are optional, but the widget needs at least the attachments or the links.

- Attachments: a column of type Attachments.
- Links: a column of type Text with one https link to an image per line.
- Names: a column of type Text with one name per line. The first lines name the attachments, the following lines name the links. A blank line keeps the default name ("Image N"). Add `[360]` to the name of a 360 degree panorama, for example `Hall [360]`: the marker is not shown in the caption. Without the names column, no image is shown as a 360 degree panorama.

A cell may hold several images. Accepted images: PNG, JPEG, GIF, BMP, WebP, SVG and AVIF. Links must be absolute https addresses without embedded credentials. Other formats (PDF, DXF, TIFF, HEIC, RAW...) are reported in a banner naming the column and examples.

For kDrive, paste the address shown in the browser when the picture is open in the share (it ends with `/preview/image/NUMBER`): it holds the file number that the widget needs. OneDrive links cannot be shown in another page: the widget says so and offers to open the link in a new tab.

### Floating window (second screen)

The arrow button at the end of the bar under the picture opens the images in a floating window that you can drag to another screen. Only one display is active at a time: while the window is open, the widget shows a message and a button "Back to the widget". The window has its own previous and next buttons and arrow keys, and it follows the row selected in Grist. Closing the window, or the button, brings the display back into the widget. If nothing opens, allow pop-ups for your Grist site in the browser.

### Proxy for 360 degree links (optional)

A 360 degree view needs the picture to be readable by the page, and most drives forbid that for a link. The widget can send such links through a proxy that you operate (for example a small Cloudflare Worker that adds the missing header and accepts only your own drive domain). The setting is off by default. In the right-hand panel of Grist, click "Open configuration", tick "Use a proxy for 360 degree links" and type an https address that contains `{url}`, for example `https://my-proxy.example/?url={url}`. The address is stored in the options of the widget, never in the code. Only the links marked `[360]` go through the proxy: attachments and flat images never do. The proxy receives the address of each 360 degree link, so only name a proxy you trust.

### Install

1. Publish the repository with GitHub Pages: Settings, Pages, Source "Deploy from a branch", branch `main`, folder `/ (root)`.
2. The widget address is `https://YOUR-ACCOUNT.github.io/image_plus/index.html`.
3. In Grist, add a page with a custom widget and paste that address. Links work with the "Read table" access level.

If your Grist server is not `grist.numerique.gouv.fr`, edit three places in `index.html`: the `src` of the `grist-plugin-api.js` script and, in the Content-Security-Policy line just above it, the host of `script-src` and the host pattern of `connect-src` (for the public service use `https://docs.getgrist.com` and `https://*.getgrist.com`).

### Security and privacy

- The only external script is the Grist plugin API, loaded from your own Grist server. Nothing is loaded from a CDN and no data is sent to any third-party service.
- The 360 degree view uses Pannellum 2.5.6 (MIT licence), copied into `vendor/pannellum/` and loaded from this site only. It is checked for `eval` and inline styles: see `vendor/pannellum/VENDOR.md`.
- The page has a Content-Security-Policy that forbids any other source of scripts. The widget downloads a picture only to give it to the panoramic view: an attachment from your Grist server, or a 360 degree link through the proxy you typed (if any). For that, `connect-src` accepts https addresses: the code only fetches those two kinds of address.
- Links must be absolute https addresses without embedded credentials; anything else is ignored and reported.
- User data (names, links) is only ever inserted into the page as text, never as HTML.

### Development

`npm test` runs the tests of the cell analysis (`images.js`), of the links of drives (`drives.js`) of the proxy setting (`proxy.js`) and of the size decisions of the 360 degree view (`panorama.js`) with Node. The pages reference their scripts with `?v=0.6.0`: change that number in `index.html` with every release so that browsers fetch the new files at once.

### Files

- `index.html`, `widget.js`, `widget.css`: the widget.
- `images.js`: turns the cell values into a list of images (no page access, tested with Node).
- `drives.js`: turns a link of a drive into the addresses of the picture (Nextcloud, Google Drive, OneDrive, kDrive, tested with Node).
- `display.js`: draws one image (flat or 360 degree) in a viewer area; shared by the widget and the floating window.
- `item.js`: describes and checks what is handed over to a display (tested with Node).
- `float.html`, `float.js`: the floating window.
- `proxy.js`: checks the proxy setting and builds the proxied address (no page access, tested with Node).
- `panorama.js`: decides whether a picture is reduced for the graphics card (no page access, tested with Node).
- `vendor/pannellum/`: the Pannellum viewer, with its licence.
- `shared/i18n.js`: French and English texts, picked from the browser language.
- `tests/`: the tests.

Licence: MIT.

## Français

Widget personnalisé pour [Grist](https://www.getgrist.com) qui affiche les images de la ligne sélectionnée, y compris les panoramas à 360°. Il est construit par petites versions.

État : version 0.6.0. Le widget affiche une à une les images de la ligne sélectionnée, avec le nom, un compteur, les boutons précédent et suivant et les flèches du clavier, et signale les valeurs ignorées. Les liens de partage Nextcloud, Google Drive et kDrive sont convertis automatiquement (le partage public doit désigner une image ; les drives commerciaux ne documentent pas ces adresses, elles peuvent donc cesser de fonctionner un jour). Une pièce jointe marquée `[360]` s'ouvre en vue panoramique (glisser pour regarder autour, molette ou boutons + et - pour zoomer, flèches gauche et droite pour changer d'image) ; une image plus grande que ce que la carte graphique accepte est réduite automatiquement et le widget l'indique. Un lien 360° est affiché à plat, avec une note, sauf si le proxy facultatif est activé (voir plus bas). Les pièces jointes demandent le niveau d'accès « Accès complet au document » ; les liens fonctionnent avec « Lire la table ».

### Colonnes

Dans le panneau de droite de Grist, sous le niveau d'accès, choisissez les colonnes. Les trois sont facultatives, mais il faut au moins la colonne des pièces jointes ou celle des liens.

- Pièces jointes : une colonne de type Pièces jointes.
- Liens : une colonne de type Texte avec un lien https vers une image par ligne.
- Noms : une colonne de type Texte avec un nom par ligne. Les premières lignes nomment les pièces jointes, les suivantes nomment les liens. Une ligne vide garde le nom par défaut (« Image N »). Ajoutez `[360]` au nom d'un panorama à 360°, par exemple `Hall [360]` : le repère n'apparaît pas dans la légende. Sans la colonne des noms, aucune image n'est affichée en 360°.

Une cellule peut contenir plusieurs images. Images acceptées : PNG, JPEG, GIF, BMP, WebP, SVG et AVIF. Les liens doivent être des adresses https absolues sans identifiants. Les autres formats (PDF, DXF, TIFF, HEIC, RAW...) sont signalés dans un bandeau qui nomme la colonne et donne des exemples.

Pour kDrive, collez l'adresse affichée par le navigateur quand l'image est ouverte dans le partage (elle se termine par `/preview/image/NUMERO`) : elle contient le numéro de fichier dont le widget a besoin. Les liens OneDrive ne peuvent pas être affichés dans une autre page : le widget l'indique et propose d'ouvrir le lien dans un nouvel onglet.

### Fenêtre flottante (deuxième écran)

Le bouton fléché au bout de la barre sous l'image ouvre les images dans une fenêtre flottante que vous pouvez glisser vers un autre écran. Une seule vue est active à la fois : tant que la fenêtre est ouverte, le widget affiche un message et un bouton « Revenir dans le widget ». La fenêtre a ses propres boutons précédent et suivant et ses flèches du clavier, et elle suit la ligne sélectionnée dans Grist. Fermer la fenêtre, ou le bouton, ramène l'affichage dans le widget. Si rien ne s'ouvre, autorisez les fenêtres surgissantes pour votre site Grist dans le navigateur.

### Proxy pour les liens 360° (facultatif)

Une vue à 360° demande que la page puisse lire l'image, ce que la plupart des drives interdisent pour un lien. Le widget peut faire passer ces liens par un proxy que vous gérez (par exemple un petit Worker Cloudflare qui ajoute l'en-tête manquant et n'accepte que le domaine de votre drive). Le réglage est désactivé par défaut. Dans le panneau de droite de Grist, cliquez sur « Ouvrir la configuration », cochez « Utiliser un proxy pour les liens 360° » et saisissez une adresse https qui contient `{url}`, par exemple `https://mon-proxy.exemple/?url={url}`. L'adresse est enregistrée dans les options du widget, jamais dans le code. Seuls les liens marqués `[360]` passent par le proxy : les pièces jointes et les images plates n'y passent jamais. Le proxy reçoit l'adresse de chaque lien 360°, n'indiquez donc qu'un proxy de confiance.

### Installation

1. Publiez le dépôt avec GitHub Pages : Settings, Pages, Source « Deploy from a branch », branche `main`, dossier `/ (root)`.
2. L'adresse du widget est `https://VOTRE-COMPTE.github.io/image_plus/index.html`.
3. Dans Grist, ajoutez une page avec un widget personnalisé et collez cette adresse. Les liens fonctionnent avec le niveau d'accès « Lire la table ».

Si votre serveur Grist n'est pas `grist.numerique.gouv.fr`, modifiez trois endroits dans `index.html` : l'adresse du script `grist-plugin-api.js` et, dans la ligne Content-Security-Policy située juste au-dessus, l'hôte de `script-src` et le motif d'hôte de `connect-src` (pour le service public, utilisez `https://docs.getgrist.com` et `https://*.getgrist.com`).

Le lecteur panoramique est Pannellum 2.5.6 (licence MIT), copié dans `vendor/pannellum/` : rien n'est chargé depuis un CDN.

Licence : MIT.
