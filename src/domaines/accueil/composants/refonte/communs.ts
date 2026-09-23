import { useEffect, useRef, useState } from "react";
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

/**
 * Un nombre qui roule jusqu a sa valeur au lieu d y sauter.
 *
 * Il part de la valeur precedente, pas de zero : un solde qui passe de
 * 1 240 a 1 260 compte vingt, il ne recompte pas mille. Sous mouvement
 * reduit, il saute — c est exactement ce qu on a demande.
 */
export function useCompteur(valeur: number, duree = 700, depart?: number): number {
  /* `depart` : d ou partir au premier rendu. Absent, le nombre est la
     tout de suite ; a zero, il se compte sous les yeux — c est l entree
     du serment, et elle ne se rejoue pas. */
  const [affiche, setAffiche] = useState(depart ?? valeur);
  const depuis = useRef(depart ?? valeur);

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.getAttribute("data-reduce-motion") === "true";
    const debut = depuis.current;
    if (reduit || debut === valeur) {
      depuis.current = valeur;
      setAffiche(valeur);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const pas = (t: number) => {
      const p = Math.min(1, (t - t0) / duree);
      const e = 1 - Math.pow(1 - p, 4);
      setAffiche(debut + (valeur - debut) * e);
      if (p < 1) raf = requestAnimationFrame(pas);
      else depuis.current = valeur;
    };
    raf = requestAnimationFrame(pas);
    return () => {
      cancelAnimationFrame(raf);
      depuis.current = valeur;
    };
  }, [valeur, duree]);

  return affiche;
}
