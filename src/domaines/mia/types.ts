/* CE QUE M.I.A. SAIT DU JOUR, EN QUATRE FORMES.
 *
 * DIXIEME FOIS LE MOTIF, ET LA PREMIERE OU IL VIENT D UN HOOK.
 * Les neuf precedentes descendaient un type d un COMPOSANT ; celle-ci
 * le descend d un HOOK. Quatre fichiers de logique pure importaient
 * `useEtatDuJour` — donc React Query, donc Supabase, donc le contexte
 * d authentification — pour connaitre la FORME d un objet qu ils
 * recoivent deja en argument.
 *
 * LA TOLERANCE DISAIT AUTRE CHOSE, ET ELLE AVAIT TORT. Elle annoncait
 * « appelle useEtatDuJour ; doit le recevoir en argument », c est-a-dire
 * un vrai defaut de conception a corriger. En ouvrant les quatre
 * fichiers : aucun ne l appelle. Tous prennent `etat: EtatDuJour |
 * undefined` en parametre, et n importent que le type. Le defaut etait
 * deja corrige ; il ne restait que sa trace dans l import.
 *
 * Une exception qui se decrit elle-meme finit par etre crue sur parole.
 * Celle-ci a survecu a deux passes du plan de masse en annoncant un
 * travail qui n existait plus.
 */
export type PhaseDuPacte = "nominal" | "attention" | "critique" | "inconnue";

export interface OrdreDuJour {
  titre: string;
  progression: number;
  cible: number;
  reclame: boolean;
  prime: number;
}

export interface TacheProche {
  id: string;
  nom: string;
  echeance: string | null;
  enRetard: boolean;
}

export interface EtatDuJour {
  nom: string | null;
  pacte: {
    id: string;
    nom: string;
    jour: number;
    total: number;
    reste: number;
    pctEcoule: number;
    fin: string | null;
  } | null;
  phase: PhaseDuPacte;
  /* Jours depuis le dernier pointage. `null` s il n y en a jamais eu :
     une absence n a de sens que par rapport a une presence. */
  joursSansPointage: number | null;
  objectifs: {
    enCours: number;
    aVenir: number;
    finis: number;
    restantEnCours: number;
    restantAVenir: number;
    faites: number;
    etapes: number;
    plusGros: { nom: string; reste: number }[];
  };
  ordres: OrdreDuJour[];
  focusMinutes: number;
  taches: { ouvertes: number; prochaines: TacheProche[] };
  solde: number | null;
}
