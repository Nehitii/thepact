/* LES TABLES DE STYLE DE LA BANNIERE.
 *
 * Deux tables sorties de `NexusHeroBanner.tsx` : la duree du roulement
 * et le style du libelle. Des donnees, pas de l interface.
 *
 * LA POLICE ET L EFFET DU TITRE NE SONT PLUS ICI. Ils etaient decrits
 * une fois pour le bandeau et une autre fois, a la main, dans l ecran
 * qui les choisit — et les deux copies avaient deja diverge. Ce sont
 * des colonnes de « pacts » : ils appartiennent au pacte, pas a la page
 * qui l affiche. Voir « objectifs/logique/typographieDuPacte ».
 */

export const STYLE_LIBELLE: React.CSSProperties = {
  fontSize: "max(11px, 0.6875rem)",
  letterSpacing: 3,
  color: "var(--nexus-text-dim)",
  textTransform: "uppercase",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

/* ── LE ROULEMENT ──
   La bascule ne change pas une valeur, elle change ce que la valeur
   COMPTE. Un fondu dirait « ça se met à jour » ; un roulement dit
   « on a changé de registre », ce qui est exactement le geste — la
   sortante monte et s'en va, l'entrante monte à sa place. C'est le
   mouvement d'un compteur mécanique, et les chiffres sont déjà en
   chasse fixe pour ça. */
export const ROULEMENT = { duration: 0.34, ease: [0.2, 0.8, 0.2, 1] as const };

export const STYLE_VALEUR: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 24,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
};
