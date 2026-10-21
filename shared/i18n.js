// Minimal translation helper shared by the widget page and the viewer window.
// The language is picked from the browser: French if it starts with "fr", English otherwise.
(function () {
  const dictionaries = {
    fr: {
      // Column mapping shown in the Grist creator panel
      columnAttachments: `Pièces jointes`,
      columnLinks: `Liens (un par ligne)`,
      columnNames: `Noms (un par ligne)`,
      columnNamesHelp: `Ajoutez [360] pour un panorama à 360°`,

      // Widget messages
      pickRow: `Sélectionnez une ligne du tableau.`,
      needMapping: `Dans le panneau de droite, sous le niveau d'accès, choisissez la colonne des pièces jointes ou la colonne des liens.`,
      noImages: `Aucune image pour cette ligne.`,
      imageN: `Image {n}`,
      badge360: `360°`,
      previousImage: `Image précédente`,
      nextImage: `Image suivante`,
      counter: `{current} / {total}`,
      loading: `Chargement de l'image…`,
      loadError: `Cette image n'a pas pu être chargée. Vérifiez que le lien est public et qu'il pointe vers une image. Certains services (Google Drive, OneDrive, kDrive) peuvent refuser l'affichage dans une page extérieure : ouvrez alors le lien dans un nouvel onglet.`,
      openLink: `Ouvrir le lien dans un nouvel onglet`,
      needFullAccess: `Les pièces jointes ne peuvent être lues qu'avec l'accès complet au document. Dans le panneau de droite, réglez le niveau d'accès sur « Accès complet au document ».`,
      noteLink360: `Panorama à 360° sur un lien : pour la vue panoramique, activez le proxy dans la configuration du widget (bouton « Ouvrir la configuration » du panneau de droite). L'image est affichée à plat.`,
      onedriveUnsupported: `Les liens OneDrive ne peuvent pas être affichés dans cette page : OneDrive les réserve à son propre site. Utilisez un autre drive ou ouvrez le lien dans un nouvel onglet.`,
      panoramaProxyFailed: `Le proxy n'a pas pu fournir l'image pour la vue panoramique. Vérifiez l'adresse du proxy dans la configuration du widget. L'image est affichée à plat.`,
      openFloat: `Afficher dans une fenêtre flottante (deuxième écran)`,
      floatingNotice: `Les images s'affichent dans la fenêtre flottante. La fenêtre suit la ligne sélectionnée dans Grist.`,
      backToWidget: `Revenir dans le widget`,
      popupBlocked: `Le navigateur a bloqué la fenêtre flottante. Autorisez les fenêtres surgissantes pour ce site Grist, puis recommencez.`,
      floatFailed: `La fenêtre flottante n'a pas répondu. Fermez-la puis recommencez.`,
      attachmentDownloadFailed: `La pièce jointe n'a pas pu être téléchargée.`,
      downloadTooLarge: `Ce fichier dépasse {max} Mo : il n'est pas téléchargé.`,
      settingsTitle: `Configuration`,
      settingsProxyEnable: `Utiliser un proxy pour les liens 360°`,
      settingsProxyUrl: `Adresse du proxy`,
      settingsProxyHelp: `Adresse https qui contient {url}, par exemple https://mon-proxy.exemple/?url={url}`,
      settingsProxyWarning: `Quand ce réglage est activé, l'adresse de chaque lien 360° est envoyée au proxy indiqué, qui télécharge l'image à la place du navigateur. N'indiquez qu'un proxy de confiance et ne mettez aucun jeton ni mot de passe dans l'adresse : elle est visible par toute personne qui a accès au document. Les pièces jointes et les images plates ne passent jamais par le proxy.`,
      settingsSave: `Enregistrer`,
      settingsCancel: `Annuler`,
      proxyErrorEmpty: `Indiquez l'adresse du proxy.`,
      proxyErrorHttps: `L'adresse doit commencer par https://.`,
      proxyErrorCredentials: `L'adresse ne doit pas contenir d'identifiant ni de mot de passe.`,
      proxyErrorPlaceholder: `L'adresse doit contenir {url} une seule fois.`,
      proxyErrorHost: `{url} ne peut pas faire partie du nom du serveur.`,
      noteScaled: `Image réduite à {width} × {height} pixels pour tenir dans la carte graphique de cet ordinateur.`,
      panoramaFailed: `La vue panoramique n'a pas pu démarrer sur cet ordinateur. L'image est affichée à plat.`,
      panoramaDownloadFailed: `La pièce jointe n'a pas pu être téléchargée pour la vue panoramique. L'image est affichée à plat.`,
      rejectedLink: `{count} valeur(s) ignorée(s) dans la colonne « {column} » (exemples : {examples}). Seuls les liens https:// sont acceptés. Vérifiez cette colonne dans la ligne sélectionnée.`,
      rejectedFormat: `{count} lien(s) ignoré(s) dans la colonne « {column} » (exemples : {examples}) : ce format n'est pas une image que le navigateur sait afficher. Formats acceptés : PNG, JPEG, GIF, BMP, WebP, SVG, AVIF. Convertissez les autres formats.`,
      rejectedLimit: `Seules les {max} premières images de la cellule sont prises en compte.`,
      andOthers: `{examples} et {rest} autres`
    },
    en: {
      columnAttachments: `Attachments`,
      columnLinks: `Links (one per line)`,
      columnNames: `Names (one per line)`,
      columnNamesHelp: `Add [360] for a 360° panorama`,

      pickRow: `Select a row in the table.`,
      needMapping: `In the right-hand panel, under the access level, choose the attachments column or the links column.`,
      noImages: `No image for this row.`,
      imageN: `Image {n}`,
      badge360: `360°`,
      previousImage: `Previous image`,
      nextImage: `Next image`,
      counter: `{current} / {total}`,
      loading: `Loading the image…`,
      loadError: `This image could not be loaded. Check that the link is public and points to an image. Some services (Google Drive, OneDrive, kDrive) may refuse to display it in an outside page: open the link in a new tab instead.`,
      openLink: `Open the link in a new tab`,
      needFullAccess: `Attachments can only be read with full document access. In the right-hand panel, set the access level to "Full document access".`,
      noteLink360: `360° panorama on a link: for the panoramic view, turn on the proxy in the widget settings ("Open configuration" button of the right-hand panel). The image is shown flat.`,
      onedriveUnsupported: `OneDrive links cannot be shown in this page: OneDrive keeps them for its own site. Use another drive or open the link in a new tab.`,
      panoramaProxyFailed: `The proxy could not provide the image for the panoramic view. Check the proxy address in the widget settings. The image is shown flat.`,
      openFloat: `Show in a floating window (second screen)`,
      floatingNotice: `The images are shown in the floating window. The window follows the row selected in Grist.`,
      backToWidget: `Back to the widget`,
      popupBlocked: `The browser blocked the floating window. Allow pop-ups for this Grist site, then try again.`,
      floatFailed: `The floating window did not answer. Close it and try again.`,
      attachmentDownloadFailed: `The attachment could not be downloaded.`,
      downloadTooLarge: `This file is larger than {max} MB: it is not downloaded.`,
      settingsTitle: `Settings`,
      settingsProxyEnable: `Use a proxy for 360° links`,
      settingsProxyUrl: `Proxy address`,
      settingsProxyHelp: `An https address that contains {url}, for example https://my-proxy.example/?url={url}`,
      settingsProxyWarning: `When this setting is on, the address of each 360° link is sent to the proxy you name, which downloads the image in place of the browser. Only name a proxy you trust, and put no token or password in the address: it can be read by anyone who has access to the document. Attachments and flat images never go through the proxy.`,
      settingsSave: `Save`,
      settingsCancel: `Cancel`,
      proxyErrorEmpty: `Enter the proxy address.`,
      proxyErrorHttps: `The address must start with https://.`,
      proxyErrorCredentials: `The address must not contain a user name or a password.`,
      proxyErrorPlaceholder: `The address must contain {url} exactly once.`,
      proxyErrorHost: `{url} cannot be part of the server name.`,
      noteScaled: `Image reduced to {width} × {height} pixels to fit the graphics card of this computer.`,
      panoramaFailed: `The panoramic view could not start on this computer. The image is shown flat.`,
      panoramaDownloadFailed: `The attachment could not be downloaded for the panoramic view. The image is shown flat.`,
      rejectedLink: `{count} value(s) ignored in column "{column}" (examples: {examples}). Only https:// links are accepted. Check this column in the selected row.`,
      rejectedFormat: `{count} link(s) ignored in column "{column}" (examples: {examples}): this format is not an image that the browser can show. Accepted formats: PNG, JPEG, GIF, BMP, WebP, SVG, AVIF. Convert other formats.`,
      rejectedLimit: `Only the first {max} images of the cell are used.`,
      andOthers: `{examples} and {rest} more`
    }
  };

  const lang = String(navigator.language || ``).toLowerCase().startsWith(`fr`) ? `fr` : `en`;

  // Returns the translated text for a key, replacing each {name} with values[name].
  function t(key, values) {
    const template = dictionaries[lang][key];
    if (template === undefined) return key;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      values && values[name] !== undefined ? String(values[name]) : match
    );
  }

  // Fills every element carrying a data-i18n* attribute (text, title and placeholder).
  function applyTranslations(root) {
    document.documentElement.lang = lang;
    root.querySelectorAll(`[data-i18n]`).forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll(`[data-i18n-title]`).forEach((el) => {
      const text = t(el.dataset.i18nTitle);
      el.title = text;
      el.setAttribute(`aria-label`, text);
    });
    root.querySelectorAll(`[data-i18n-placeholder]`).forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
  }

  window.imagePlusI18n = { t, lang, applyTranslations };
})();
