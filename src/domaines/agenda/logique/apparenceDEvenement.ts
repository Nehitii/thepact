/* CE QUE PORTE UN EVENEMENT.
 *
 * Les douze teintes proposees, et la duree pretee a un evenement
 * dont on ne saisit que le debut : une heure, parce quun evenement
 * de duree nulle ne se voit pas sur une grille horaire.
 */
export const COLORS: { hex: string; key: string }[] = [
  { hex: "#3b82f6", key: "blue" },
  { hex: "#ef4444", key: "red" },
  { hex: "#22c55e", key: "green" },
  { hex: "#f59e0b", key: "amber" },
  { hex: "#8b5cf6", key: "violet" },
  { hex: "#ec4899", key: "pink" },
  { hex: "#06b6d4", key: "cyan" },
  { hex: "#f97316", key: "orange" },
  { hex: "#14b8a6", key: "teal" },
  { hex: "#6366f1", key: "indigo" },
];

export const DUREE_DEFAUT = 3600000;
