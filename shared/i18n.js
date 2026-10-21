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
      loadError: `Cette image n'a pas pu être chargée. Vérifiez que le lien est public et qu'il pointe vers une image.`,
      openLink: `Ouvrir le lien dans un nouvel onglet`,
      needFullAccess: `Les pièces jointes ne peuvent être lues qu'avec l'accès complet au document. Dans le panneau de droite, réglez le niveau d'accès sur « Accès complet au document ».`,
      noteLink360: `Panorama à 360° sur un lien : la vue panoramique des liens n'est pas encore disponible, l'image est affichée à plat.`,
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
      loadError: `This image could not be loaded. Check that the link is public and points to an image.`,
      openLink: `Open the link in a new tab`,
      needFullAccess: `Attachments can only be read with full document access. In the right-hand panel, set the access level to "Full document access".`,
      noteLink360: `360° panorama on a link: the panoramic view is not yet available for links, the image is shown flat.`,
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
