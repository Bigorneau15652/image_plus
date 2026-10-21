# image_plus

English first, version française plus bas.

## English

A custom widget for [Grist](https://www.getgrist.com) that shows the images of the selected row, including 360 degree panoramas. It is being built in small versions.

Status: version 0.1. The widget reads the cells of the selected row, lists the images it finds and reports the values it ignored. The display of the images comes in the next versions.

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

If your Grist server is not `grist.numerique.gouv.fr`, edit two places in `index.html`: the `src` of the `grist-plugin-api.js` script and the host named in the Content-Security-Policy line just above it (for the public service use `https://docs.getgrist.com`).

### Security and privacy

- The only external script is the Grist plugin API, loaded from your own Grist server. Nothing is loaded from a CDN and no data is sent to any third-party service.
- The page has a Content-Security-Policy that forbids any other source.
- Links must be absolute https addresses without embedded credentials; anything else is ignored and reported.
- User data (names, links) is only ever inserted into the page as text, never as HTML.

### Development

`npm test` runs the tests of the cell analysis (`images.js`) with Node. The pages reference their scripts with `?v=0.1.0`: change that number in `index.html` with every release so that browsers fetch the new files at once.

### Files

- `index.html`, `widget.js`, `widget.css`: the widget.
- `images.js`: turns the cell values into a list of images (no page access, tested with Node).
- `shared/i18n.js`: French and English texts, picked from the browser language.
- `tests/`: the tests.

Licence: MIT.

## Français

Widget personnalisé pour [Grist](https://www.getgrist.com) qui affiche les images de la ligne sélectionnée, y compris les panoramas à 360°. Il est construit par petites versions.

État : version 0.1. Le widget lit les cellules de la ligne sélectionnée, liste les images trouvées et signale les valeurs ignorées. L'affichage des images arrive dans les prochaines versions.

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

Si votre serveur Grist n'est pas `grist.numerique.gouv.fr`, modifiez deux endroits dans `index.html` : l'adresse du script `grist-plugin-api.js` et l'hôte indiqué dans la ligne Content-Security-Policy située juste au-dessus (pour le service public, utilisez `https://docs.getgrist.com`).

Licence : MIT.
