/* LA DISPOSITION DE LA LISTE D OBJECTIFS.
 *
 * Deux tables sorties de « GoalsList.tsx » : le vocabulaire des
 * onglets du front, et la grille de chaque mode d affichage. Ni l une
 * ni l autre ne rend quoi que ce soit ; elles decident, et le
 * composant applique.
 */
import type { GoalTab, DisplayMode } from "@/domaines/objectifs/types";
export const CLES_FRONT: Record<GoalTab, string> = {
  all: "front.allSteps",
  active: "front.todo",
  completed: "front.done",
};

export function getGridClass(displayMode: DisplayMode) {
  if (displayMode === "grid") {
    // True responsive CSS grid: 2 cols on phones (avoids stretched giant cards),
    // 2 / 3 / 4 above. Tighter gaps on small screens.
    return "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6 w-full";
  }
  if (displayMode === "bookmark") return "flex flex-wrap justify-center gap-6";
  return "grid grid-cols-1 gap-4 w-full max-w-4xl mx-auto";
}
