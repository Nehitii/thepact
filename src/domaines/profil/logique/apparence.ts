/* LA PALETTE D ACCENT, SES NOMS, ET LES SONS.
 *
 * Des donnees, pas de l interface : sorties de `pages/DisplaySound.tsx`
 * pour que la page ne declare plus ce qu elle se contente d afficher.
 */

export const ACCENTS = [
  { hex: "#5bb4ff", cle: "cyber" },
  { hex: "#8b5cf6", cle: "violet" },
  { hex: "#22c55e", cle: "emeraude" },
  { hex: "#f59e0b", cle: "ambre" },
  { hex: "#ef4444", cle: "rouge" },
  { hex: "#ec4899", cle: "rose" },
  { hex: "#06b6d4", cle: "cyan" },
  { hex: "#f97316", cle: "orange" },
] as const;

export const NOMS_ACCENT: Record<string, string> = {
  cyber: "Bleu cyber", violet: "Violet", emeraude: "Émeraude", ambre: "Ambre",
  rouge: "Rouge", rose: "Rose", cyan: "Cyan", orange: "Orange",
};

export const SONS: Record<string, string> = { ui: "/sounds/ui-click.mp3" };
