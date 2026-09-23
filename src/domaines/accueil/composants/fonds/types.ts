import type { MesureDuRendu } from "@/domaines/accueil/hooks/useRenduDuFond";

/** Ce que tout fond recoit du banc — et, demain, du tableau de bord. */
export interface ProprietesDuFond {
  /** La couleur du pacte, en hexadecimal. */
  teinte: string;
  /** De 0 (a peine la) a 1 (pleine presence). */
  intensite: number;
  /** Faux : une image fixe, comme sous « mouvement reduit ». */
  mouvement: boolean;
  /** Images par seconde au plus. */
  cadence: number;
  surMesure?: (m: MesureDuRendu) => void;
  /** Le nom de la carte graphique, quand un fond en ouvre une. */
  surCarte?: (nom: string | null) => void;
}

/** Ce que les fonds qui dessinent le sceau recoivent en plus. */
export interface SceauDuFond {
  ordre: number;
  pas: number;
  /** Les valeurs du pacte, et le sommet de l etoile ou chacune se tient. */
  valeurs: readonly { nom: string; sommet: number }[];
  /** La part des objectifs accomplis, de 0 a 1. */
  progression: number;
}
