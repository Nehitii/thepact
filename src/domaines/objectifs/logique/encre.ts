/**
 * L encre a poser sur une pastille de couleur.
 *
 * L etiquette de palier prend la teinte du palier en fond. Avec une
 * encre noire fixe elle tient sur le vert, le jaune, l orange et le
 * rouge — mais tombe a 3,19:1 sur le violet d « impossible », et rien
 * ne dit ce que vaut une couleur choisie a la main dans le profil.
 * On mesure donc la luminance du fond et on choisit l encre qui
 * garde le plus d ecart.
 */

/* ═══ UNE COULEUR PEUT ETRE UN JETON DE THEME ═══
 *
 * Deux entrees de la palette des objectifs s ecrivent
 * `var(--succes-papier, hsl(142 70% 50%))` : l etiquette « sante » et
 * la difficulte « facile ». Sans cette resolution, la chaine n etait
 * pas lisible, le repli rendait l encre SOMBRE, et le navigateur
 * peignait quand meme le fond avec la vraie valeur de la variable.
 *
 * En theme sombre la variable n existe pas : le repli du `var` — un
 * vert moyen — s applique, et l encre sombre y tient (10,61:1). En
 * THEME CLAIR la variable vaut `hsl(152 100% 20%)`, un vert profond :
 * l encre sombre y tombait a 2,80:1. L encre claire y vaut 6,65.
 *
 * On lit donc la variable la ou elle est posee. Hors navigateur, ou si
 * elle n est pas definie, on retombe sur le repli ecrit dans le `var`
 * — c est exactement ce que ferait le moteur de style.
 */
const VARIABLE = /^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+?)\s*)?\)$/;

const resolue = (couleur: string, profondeur = 0): string => {
  const m = VARIABLE.exec(couleur.trim());
  if (!m || profondeur > 4) return couleur.trim();
  if (typeof document !== "undefined") {
    const posee = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
    if (posee) return resolue(posee, profondeur + 1);
  }
  return m[2] ? resolue(m[2], profondeur + 1) : "";
};

const versCanaux = (couleur: string): [number, number, number] | null => {
  const c = resolue(couleur);

  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const v = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }

  const hsl = c.match(/^hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
  if (hsl) {
    const h = Number(hsl[1]) / 360, s = Number(hsl[2]) / 100, l = Number(hsl[3]) / 100;
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const canal = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [canal(h + 1 / 3), canal(h), canal(h - 1 / 3)].map((x) => Math.round(x * 255)) as [number, number, number];
  }

  const rgb = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];

  return null;
};

const SOMBRE = "#0a0a00";
const CLAIRE = "#f2f8ff";

export function encreSurFond(couleur: string): string {
  const canaux = versCanaux(couleur);
  if (!canaux) return SOMBRE;
  const lineaire = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lineaire(canaux[0]) + 0.7152 * lineaire(canaux[1]) + 0.0722 * lineaire(canaux[2]);
  const avecSombre = (L + 0.05) / 0.05;
  const avecClaire = 1.05 / (L + 0.05);
  return avecSombre >= avecClaire ? SOMBRE : CLAIRE;
}
