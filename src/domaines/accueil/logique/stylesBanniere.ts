/* LES TABLES DE STYLE DE LA BANNIERE.
 *
 * Trois tables sorties de `NexusHeroBanner.tsx` : les effets de la
 * plaque, ceux du papier, et le style du libelle. Des donnees, pas de
 * l interface.
 */

export const EFFECT_STYLES: Record<string, React.CSSProperties> = {
  none: {},
  "cyan-glow": { textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
  "fire-glow": { textShadow: "0 0 8px rgba(255,106,0,0.7), 0 0 30px rgba(255,60,0,0.25)" },
  "purple-glow": { textShadow: "0 0 8px rgba(168,85,247,0.7), 0 0 30px rgba(168,85,247,0.25)" },
  "gold-glow": { textShadow: "0 0 8px rgba(255,200,0,0.7), 0 0 30px rgba(255,200,0,0.25)" },
  glitch: { animation: "glitchReveal 1.6s ease-out forwards" },
};

/* ── LES MEMES EFFETS, SUR DU PAPIER ──

   Un halo de 30 px autour d une lettre, c est de la lumiere qui
   s ajoute au noir. Sur du blanc rien ne s ajoute : le halo ne peut
   que salir le fond autour du mot, et le titre parait flou au lieu
   de paraitre allume.

   L effet choisi par l utilisateur n est pas supprime pour autant :
   il change de nature. Le halo devient une BAVURE D ENCRE, serree et
   posee juste sous la lettre — ce que fait une impression appuyee sur
   du papier. Le titre garde sa couleur et sa presence, il les obtient
   autrement. */

export const EFFETS_PAPIER: Record<string, React.CSSProperties> = {
  none: {},
  "cyan-glow": { textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(0,105,127,0.34)" },
  "fire-glow": { textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(150,64,0,0.34)" },
  "purple-glow": { textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(113,65,163,0.34)" },
  "gold-glow": { textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(115,90,0,0.34)" },
  glitch: { animation: "glitchReveal 1.6s ease-out forwards" },
};

export const STYLE_LIBELLE: React.CSSProperties = {
  fontSize: "max(11px, 0.6875rem)",
  letterSpacing: 3,
  color: "var(--nexus-text-dim)",
  textTransform: "uppercase",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

/* Trois tables de plus, du meme fichier et pour la meme raison : une
   correspondance de polices, la duree du roulement, le style du
   nombre. Le commentaire du papier suit EFFETS_PAPIER, qu il explique
   et dont il etait separe par deux cents lignes de rendu. */
export const FONT_MAP: Record<string, string> = {
  orbitron: "'Orbitron', sans-serif",
  rajdhani: "'Rajdhani', sans-serif",
  "share-tech-mono": "'JetBrains Mono', ui-monospace, monospace",
  "space-grotesk": "'Space Grotesk', sans-serif",
  inter: "'Inter', sans-serif",
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
