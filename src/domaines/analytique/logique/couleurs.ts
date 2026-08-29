/* LA PALETTE DE L ANALYTIQUE, ET POURQUOI CE SONT DES JETONS.
 *
 * Sortie de `pages/Analytics.tsx` pour que la page et ses trois
 * briques lisent les memes valeurs — elles etaient declarees dans la
 * page, donc invisibles depuis un composant extrait.
 */

export const AXE = { fontSize: 11, fill: "var(--nexus-text-dimmer)" } as const;
export const TRAIT = "hsl(var(--primary) / 0.16)";
export const ACCENT = "hsl(var(--primary))";
export const AMBRE = "hsl(var(--signal-ambre))";
/* Une reference de jeton plutot quune couleur : le JS ne sait pas
   quel theme est actif, le CSS si. Sur fond clair, #00ff88 tombe a
   1,22 — le compteur dXP etait illisible. */
export const VERT = "hsl(var(--signal-vert))";
export const ROUGE = "hsl(var(--signal-rouge))";
export const LEGENDE = { fontSize: 11, fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;
