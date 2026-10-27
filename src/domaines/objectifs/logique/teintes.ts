/* LA TEINTE D UN PALIER.
 *
 * Sortie de `hooks/useCarteObjectif.ts`. Ce n est pas un hook : c est
 * une table de couleurs et une conversion. Elle devait descendre parce
 * que `logique/ligneDuRegistre.ts`, au rang 1, en a besoin — un module
 * de logique ne remonte pas vers un hook, la garde des couches le
 * refuse.
 */

/** Les composantes d une couleur hexadecimale, pour les variables CSS. */
export function composantes(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return TEINTE_PAR_DEFAUT.rgb;
  return [1, 2, 3].map((i) => parseInt(m[i], 16)).join(", ");
}

/** La palette du registre, en hexadecimal et en composantes. */
export const TEINTES: Record<string, { couleur: string; rgb: string }> = {
  easy: { couleur: "#4ade80", rgb: "74, 222, 128" },
  medium: { couleur: "#facc15", rgb: "250, 204, 21" },
  hard: { couleur: "#fb923c", rgb: "251, 146, 60" },
  extreme: { couleur: "#f87171", rgb: "248, 113, 113" },
  impossible: { couleur: "#c084fc", rgb: "192, 132, 252" },
};

export const TEINTE_PAR_DEFAUT = { couleur: "#94a3b8", rgb: "148, 163, 184" };

export function teinteDuPalier(palier: string | null | undefined, couleurPerso?: string) {
  if (palier === "custom") {
    const c = couleurPerso || "#a855f7";
    return { couleur: c, rgb: composantes(c) };
  }
  return TEINTES[palier ?? ""] ?? TEINTE_PAR_DEFAUT;
}
