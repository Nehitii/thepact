import {
  CalendarCheck, Coins, Crosshair, Flag, Footprints, Hourglass, ListChecks, PenLine, Repeat, Target,
  type LucideIcon,
} from "lucide-react";
import type { Lecture } from "@/domaines/accueil/logique/lectureDuTableau";
import type {
  Echeance, EntreeDuJour, GenreDEntree, ObjectifDuScenario, OrdreDuJour,
} from "@/domaines/accueil/logique/scenarioDuTableau";

/* CE QUE LES TROIS REFONTES RECOIVENT DU BANC.
 *
 * Le banc tient l etat — les ordres reclames, la journee qui
 * s allonge, les bonds — et le passe aux trois : changer de structure
 * ne remet rien a zero, et un ordre reclame dans le registre l est
 * encore dans le serment. */
export interface DonneesDuTableau {
  maintenant: Date;
  lecture: Lecture;
  objectifs: readonly ObjectifDuScenario[];
  ordres: readonly OrdreDuJour[];
  journee: readonly EntreeDuJour[];
  aVenir: readonly Echeance[];
  bonds: number;
  reclamer: (id: string) => void;
}

export const ICONE_DU_GENRE: Record<GenreDEntree, LucideIcon> = {
  habitude: Repeat,
  ordre: Coins,
  etape: Footprints,
  journal: PenLine,
  tache: ListChecks,
};

export const ICONE_DE_L_ECHEANCE: Record<Echeance["genre"], LucideIcon> = {
  ordres: Hourglass,
  mission: Crosshair,
  revue: CalendarCheck,
  etape: Footprints,
  objectif: Target,
  pacte: Flag,
};

/* La police d un monde du banc. Elle a rejoint les crochets du domaine :
   les variantes du bandeau s en servent aussi, et un composant de banc
   n a pas a importer une serie qu il ne montre pas. */
export { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";

/* Le compteur qui roule a rejoint les crochets du domaine : l enseigne
   en service s en sert aussi. */
export { useCompteur } from "@/domaines/accueil/hooks/useCompteur";
