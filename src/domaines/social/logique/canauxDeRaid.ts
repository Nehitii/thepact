/* LES QUATRE CANAUX D UN RAID, ET LE COMPTE VIDE.
 *
 * Sortis de `GuildRaidsPanel.tsx` avec les pieces qui les dessinent.
 * Ils sont dans `logique/` et non a cote des composants parce qu un
 * fichier qui exporte des composants ET des constantes fait retomber
 * Fast Refresh sur un rechargement complet — la regle
 * `react-refresh/only-export-components` le dit, et elle a raison.
 */
import { CheckCheck, Footprints, PenLine, Target } from "lucide-react";
import type { Metrique, Compte } from "@/domaines/social/types";

export const CANAUX: { cle: Metrique; Icone: typeof Target; defaut: string; pas: number }[] = [
  { cle: "etapes", Icone: Footprints, defaut: "Étapes validées", pas: 5 },
  { cle: "objectifs", Icone: Target, defaut: "Objectifs franchis", pas: 1 },
  { cle: "taches", Icone: CheckCheck, defaut: "Tâches faites", pas: 5 },
  { cle: "journal", Icone: PenLine, defaut: "Jours écrits", pas: 1 },
];

export const VIDE: Compte = { etapes: 0, objectifs: 0, taches: 0, journal: 0 };
