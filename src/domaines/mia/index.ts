/**
 * LA PORTE DU DOMAINE M.I.A.
 *
 * Tout ce que le reste de l application connait de M.I.A. passe par ce
 * fichier. L interieur — `composants/`, `hooks/`, `logique/` — ne
 * s importe qu entre soi ; `npm run domaines:check` le verifie.
 *
 * CE QUI N EST PAS ICI EST VOLONTAIRE. Les onze reflexes, les humeurs,
 * les excuses, le cadrage du visage, les fils de conversation : rien de
 * cela n a de raison d etre appele du dehors. Une porte qui exporte
 * tout n est pas une porte, c est un mur qu on a peint en jaune.
 *
 * LA CONSOLE EST DERRIERE UN `lazy`, ET C EST LE POINT DELICAT.
 * `MiaConsole` pese 979 lignes ; `AppLayout` la chargeait deja en
 * differe. Si cette porte la reexportait normalement, le simple
 * `import { ReseauMia } from "@/domaines/mia"` de `AppLayout` la
 * ramenerait dans le paquet de demarrage — la fermeture du domaine
 * aurait alors coute 979 lignes de chemin critique. Le `lazy` vit donc
 * ICI : le domaine possede son propre decoupage, ce qui est sa place.
 */
import { lazy } from "react";

export { ReseauMia, type EtatMia } from "./composants/ReseauMia";
export { PassageMia } from "./composants/PassageMia";
export { VisageMia } from "./composants/VisageMia";

/** Reglage lu et ecrit par l ecran « Affichage et sons ». */
export { reagitAuxAbsences, reglerReactionAuxAbsences } from "./logique/humeur";

/** La console entiere. Ne se charge qu a la premiere ouverture. */
export const MiaConsole = lazy(() =>
  import("./composants/MiaConsole").then((m) => ({ default: m.MiaConsole })),
);
