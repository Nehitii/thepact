import DOMPurify from "dompurify";

/* CE QUI A LE DROIT D ENTRER DANS UNE PAGE DE JOURNAL
 *
 * L editeur ecrit du HTML, la carte le rend. Entre les deux, une
 * seule porte — et elle est ici, pour que la liste des balises
 * autorisees ne soit ecrite qu une fois.
 *
 * L assainissement etait laisse aux reglages par defaut : ils sont
 * larges, et ils le resteront a chaque nouvelle version de la
 * bibliotheque. La liste est desormais explicite : elle contient ce
 * que l editeur sait produire, et rien d autre.
 *
 * Les cases a cocher ne sont pas rendues avec un vrai <input> : dans
 * une page qu on relit, une case cliquable ment. La case est dessinee
 * par la feuille de style a partir de « data-checked ».
 */

const BALISES = [
  "p", "br", "span",
  "strong", "em", "u", "s",
  "h2", "h3",
  "ul", "ol", "li", "div",
  "blockquote", "hr",
  "code", "pre",
  "a",
];

const ATTRIBUTS = ["class", "href", "target", "rel", "data-type", "data-checked"];

/* L editeur enveloppe chaque case dans un <label> qui contient, pour
   les lecteurs d ecran, le texte « Task item checkbox… ». Retirer la
   balise seule laissait ce texte dans la page : il faut emporter le
   contenu avec elle. */
const SANS_CONTENU = ["label"];

let hookPose = false;

/** Un lien de journal s ouvre ailleurs, et n emmene rien avec lui. */
function poserHook() {
  if (hookPose) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
  });
  hookPose = true;
}

export function assainirJournal(html: string): string {
  poserHook();
  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS: BALISES,
    ALLOWED_ATTR: ATTRIBUTS,
    ALLOW_DATA_ATTR: false,
    FORBID_CONTENTS: SANS_CONTENU,
  });
}

/** Le texte nu d une page : pour compter les mots, pas pour l afficher. */
export function texteNu(html: string): string {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function compterMots(html: string): number {
  const t = texteNu(html);
  return t ? t.split(" ").filter(Boolean).length : 0;
}

/* L editeur garde un paragraphe vide en fin de document pour qu on
   puisse cliquer sous une liste et continuer d ecrire. C est bon pour
   la main, pas pour l archive : range tel quel, il ajoute une ligne
   blanche a la piece — et un numero de ligne pour rien. */
export function sansParagrapheFinal(html: string): string {
  return (html ?? "").replace(/(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+$/i, "");
}

/** La cote du document, telle qu elle parait sur la piece rangee. */
export function referenceDe(id: string): string {
  return "REF·" + id.replace(/[^0-9a-f]/gi, "").slice(-4).toUpperCase();
}

/** Deux cents mots la minute : la mesure usuelle pour de la prose. */
export function minutesDeLecture(mots: number): number {
  return Math.max(1, Math.round(mots / 200));
}
