// Minimal translation helper shared by the widget page and the viewer window.
// The language is picked from the browser: French if it starts with "fr", English otherwise.
(function () {
  const dictionaries = {
    fr: {
      // Column mapping shown in the Grist creator panel
      columnAttachments: `Pièces jointes (images)`,
      columnAttachmentsHelp: `Colonne de type Pièces jointes`,
      columnLinks: `Liens vers des images (un par ligne)`,
      columnLinksHelp: `Colonne de type Texte contenant des liens https vers des images, un par ligne`,
      columnNames: `Noms des images (pièces jointes puis liens)`,
      columnNamesHelp: `Un nom par ligne, dans cet ordre : d'abord le nom de chaque pièce jointe, puis le nom de chaque lien. Ajoutez [360] au nom d'une image panoramique à 360°. Exemple : « Hall [360] ».`,

      // Widget messages
      pickRow: `Sélectionnez une ligne du tableau.`,
      needMapping: `Dans le panneau de droite, sous le niveau d'accès, choisissez la colonne des pièces jointes ou la colonne des liens.`,
      noImages: `Aucune image pour cette ligne.`,
      imageN: `Image {n}`,
      badge360: `360°`,
      previewNote: `Version de développement : les cellules sont analysées, l'affichage des images arrive dans la prochaine version.`,
      rejectedLink: `{count} valeur(s) ignorée(s) dans la colonne « {column} » (exemples : {examples}). Seuls les liens https:// sont acceptés. Vérifiez cette colonne dans la ligne sélectionnée.`,
      rejectedFormat: `{count} lien(s) ignoré(s) dans la colonne « {column} » (exemples : {examples}) : ce format n'est pas une image que le navigateur sait afficher. Formats acceptés : PNG, JPEG, GIF, BMP, WebP, SVG, AVIF. Convertissez les autres formats.`,
      rejectedLimit: `Seules les {max} premières images de la cellule sont prises en compte.`,
      andOthers: `{examples} et {rest} autres`
    },
    en: {
      columnAttachments: `Attachments (images)`,
      columnAttachmentsHelp: `Column of type Attachments`,
      columnLinks: `Links to images (one per line)`,
      columnLinksHelp: `Text column holding https links to images, one per line`,
      columnNames: `Image names (attachments then links)`,
      columnNamesHelp: `One name per line, in this order: first the name of each attachment, then the name of each link. Add [360] to the name of a 360 degree panorama. Example: "Hall [360]".`,

      pickRow: `Select a row in the table.`,
      needMapping: `In the right-hand panel, under the access level, choose the attachments column or the links column.`,
      noImages: `No image for this row.`,
      imageN: `Image {n}`,
      badge360: `360°`,
      previewNote: `Development version: the cells are analysed, the display of the images comes in the next version.`,
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
