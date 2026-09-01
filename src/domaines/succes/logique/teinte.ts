/* LA TEINTE D UN PALIER, DANS UN SEUL FORMAT.
 *
 * ═══ CE QUI ETAIT CASSE, ET POURQUOI ═══
 *
 * `ranks.frame_color` est une colonne de texte libre, et l editeur y
 * ecrivait deux formes incompatibles. Son prereglage « Cyan » posait
 * la chaine « hsl(var(--ds-accent-primary)) » — une VARIABLE CSS —
 * quand les sept autres posaient un hexadecimal.
 *
 * Le panneau des rangs fabriquait ensuite ses transparences par
 * concatenation : `${rank.frame_color}60`. Sur un hexadecimal, cela
 * donne « #f59e0b60 », qui est valide. Sur la variable, cela donne
 * « hsl(var(--ds-accent-primary))60 », qui n est pas du CSS. LE RANG
 * CYAN ETAIT DONC SANS COULEUR PARTOUT — bordure, pastille, nom, lueur.
 *
 * Deux fautes, pas une : un format non manipulable, et une
 * transparence obtenue en collant des caracteres au bout d une
 * couleur. La seconde ne peut jamais marcher sur une variable, quelle
 * qu elle soit.
 *
 * ═══ CE QUE CE MODULE POSE ═══
 *
 * UN SEUL FORMAT — l hexadecimal, six chiffres, parsable. Ce qui n en
 * est pas un ne franchit pas cette porte : il ressort `null`, et le
 * noyau retombe alors sur `--primary`. Les paliers deja enregistres
 * avec la variable CSS retombent donc proprement sur le repli au lieu
 * d afficher du CSS invalide.
 *
 * UNE SEULE TEINTE PAR PALIER. `frame_color` et `glow_color` bougeaient
 * deja ensemble dans l editeur — la lueur n etait jamais que le cadre
 * a cinquante pour cent. Les deux colonnes restent ecrites, pour ne
 * rien casser de ce qui les lit, mais elles descendent d une seule
 * valeur : `lueurDeLaTeinte` la fabrique.
 *
 * ET AUCUNE TRANSPARENCE PAR CONCATENATION. Les transparences se font
 * en CSS, par `color-mix()`, qui accepte aussi bien un hexadecimal
 * qu une variable. Voir `rang.css`.
 */

/** Six chiffres hexadecimaux, precedes du croisillon. Rien d autre. */
const HEXA = /^#[0-9a-fA-F]{6}$/;
const HEXA_COURT = /^#[0-9a-fA-F]{3}$/;

/**
 * La teinte enregistree, ramenee a un hexadecimal — ou `null`.
 *
 * `null` n est pas un echec : c est « ce palier n a pas de teinte a
 * lui », et le noyau prend alors la couleur de l application.
 */
export function normaliserTeinte(brut: string | null | undefined): string | null {
  if (typeof brut !== "string") return null;
  const v = brut.trim();
  if (HEXA.test(v)) return v.toLowerCase();
  /* « #abc » vaut « #aabbcc » : la forme courte est du CSS valide, et
     la refuser perdrait une couleur que l utilisateur a bien choisie. */
  if (HEXA_COURT.test(v)) return ("#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toLowerCase();
  return null;
}

/** Les trois canaux d une teinte deja normalisee. */
export function canauxDeLaTeinte(hexa: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hexa.slice(i, i + 2), 16)) as [number, number, number];
}

/**
 * La lueur qui accompagne une teinte, pour `ranks.glow_color`.
 *
 * Elle n a jamais ete un reglage distinct : l editeur l a toujours
 * derivee du cadre a cinquante pour cent. On garde la colonne et la
 * forme `rgba()` — d autres lecteurs s en servent — mais elle n est
 * plus une decision, seulement une consequence.
 */
export function lueurDeLaTeinte(teinte: string | null): string | null {
  const hexa = normaliserTeinte(teinte);
  if (!hexa) return null;
  const [r, g, b] = canauxDeLaTeinte(hexa);
  return `rgba(${r},${g},${b},0.5)`;
}

/** La teinte d un palier, telle que le noyau doit la recevoir. */
export function teinteDuPalier(
  palier: { frame_color?: string | null } | null | undefined,
): string | null {
  return normaliserTeinte(palier?.frame_color);
}

/* ═══ LES PREREGLAGES : VINGT, ET AUCUN QUI NE SE LISE PAS ═══
 *
 * Ils etaient huit, et le premier valait « hsl(var(--ds-accent-primary)) »
 * — c est lui qui a produit la panne du cadre sans couleur. Ils sont
 * desormais tous hexadecimaux, et deux fois et demie plus nombreux :
 * le tour du cercle chromatique, plus les metaux, qui sont le
 * vocabulaire d un palier.
 *
 * MAIS LA TEINTE N EST PAS QU UN ORNEMENT : le nom du palier s ecrit
 * DEDANS, sur le fond du panneau. Une teinte trop sombre y devient
 * illisible. Chacune a donc ete mesuree contre le fond reel — releve
 * a l ecran, rgb(3, 13, 23) — et trois candidates ont ete ecartees
 * pour une nuance plus claire de la meme famille :
 *
 *   indigo  #6366f1 → 4,38   remplace par #818cf8 → 6,56
 *   acier   #64748b → 4,11   remplace par #8595ab → 6,41
 *   bronze  #b45309 → 3,89   remplace par #cd7f32 → 6,22
 *
 * `teinte.test.ts` refait ce calcul sur les vingt : en ajouter une
 * qui ne se lit pas fera tomber la chaine, pas l ecran de quelqu un.
 */
export const PREREGLAGES_DE_TEINTE: { cle: string; teinte: string }[] = [
  /* Les metaux — le registre d un palier. */
  { cle: "platine", teinte: "#e2e8f0" },
  { cle: "acier", teinte: "#8595ab" },
  { cle: "bronze", teinte: "#cd7f32" },
  { cle: "or", teinte: "#f59e0b" },
  /* Les chauds. */
  { cle: "ambre", teinte: "#fbbf24" },
  { cle: "orange", teinte: "#fb923c" },
  { cle: "cramoisi", teinte: "#ef4444" },
  { cle: "framboise", teinte: "#fb7185" },
  { cle: "rose", teinte: "#f43f5e" },
  /* Les pourpres. */
  { cle: "magenta", teinte: "#e879f9" },
  { cle: "orchidee", teinte: "#c084fc" },
  { cle: "violet", teinte: "#a855f7" },
  { cle: "indigo", teinte: "#818cf8" },
  /* Les froids. */
  { cle: "bleu", teinte: "#5bb4ff" },
  { cle: "azur", teinte: "#38bdf8" },
  { cle: "cyan", teinte: "#22d3ee" },
  /* Les verts. */
  { cle: "jade", teinte: "#2dd4bf" },
  { cle: "emeraude", teinte: "#10b981" },
  { cle: "vert", teinte: "#22c55e" },
  { cle: "lime", teinte: "#a3e635" },
];

/* Le fond du panneau des paliers, releve a l ecran. C est contre lui
   que le nom d un palier se lit, et donc contre lui qu une teinte se
   mesure. */
export const FOND_DU_PANNEAU: [number, number, number] = [3, 13, 23];

/** Le contraste WCAG 2.1 entre une teinte et un fond. */
export function contrasteDeLaTeinte(hexa: string, fond = FOND_DU_PANNEAU): number {
  const canal = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]: [number, number, number]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  const [haut, bas] = [lum(canauxDeLaTeinte(hexa)), lum(fond)].sort((a, b) => b - a);
  return (haut + 0.05) / (bas + 0.05);
}
