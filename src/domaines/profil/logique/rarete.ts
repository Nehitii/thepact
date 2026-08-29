/* LES COULEURS D UNE RARETE.
 *
 * Sorties de `composants/CartePublique.tsx` : une table de couleurs et
 * une fonction pure exportees a cote de composants font retomber Fast
 * Refresh sur un rechargement complet — la regle
 * `react-refresh/only-export-components` le disait, et elle a raison.
 */

/* `rarite(x)` plutot que `rarityColors[x]` : l acces direct sur une
   rarete absente rend `undefined`, et le `.bg` qui suit fait tomber
   la page. Les quatre raretes en base correspondent aujourd hui ; une
   cinquieme suffirait. */
export const rarityColors: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  common: { bg: "bg-slate-500/10", text: "text-slate-400", glow: "", border: "border-slate-500/30" },
  rare: { bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-blue-500/20", border: "border-blue-500/50" },
  epic: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
    border: "border-purple-500/50",
  },
  legendary: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    glow: "shadow-amber-500/30",
    border: "border-amber-500/50",
  },
};

export const rarite = (r?: string | null) => rarityColors[r ?? ""] ?? rarityColors.common;
