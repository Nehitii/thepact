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

/* LES PREREGLAGES, TOUS HEXADECIMAUX.
   Le premier valait « hsl(var(--ds-accent-primary)) » : c est lui qui
   a produit la panne. Il porte desormais la valeur que cette variable
   rend dans le theme sombre, mesuree, et il est donc manipulable
   comme les sept autres. */
export const PREREGLAGES_DE_TEINTE: { cle: string; teinte: string }[] = [
  { cle: "cyan", teinte: "#5bb4ff" },
  { cle: "or", teinte: "#f59e0b" },
  { cle: "violet", teinte: "#a855f7" },
  { cle: "cramoisi", teinte: "#ef4444" },
  { cle: "emeraude", teinte: "#10b981" },
  { cle: "rose", teinte: "#f43f5e" },
  { cle: "ambre", teinte: "#fbbf24" },
  { cle: "indigo", teinte: "#6366f1" },
];
