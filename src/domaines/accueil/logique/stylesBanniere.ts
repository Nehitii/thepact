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
