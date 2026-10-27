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

/* CE QUE « useMia.ts » DECLARAIT EN PLUS DE CALCULER.
 * Un type est inerte : il n a pas a vivre dans un fichier qui traine
 * React Query et Supabase derriere lui. Le fichier d origine les
 * REEXPORTE, parce que ses appelants les importaient depuis lui. */
export interface FilMia {
  id: string;
  user_id: string;
  title: string;
  archived: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface MessageMia {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  created_at: string;
  metadata?: MetaMessageMia | null;
}

export interface SourceMia {
  source_type: string;
  source_id: string;
  snippet: string;
  similarity?: number;
}

export interface ActeMia {
  tool: string;
  status: "ok" | "error";
  label: string;
  ref_id?: string;
  ref_type?: string;
  error?: string;
}

export interface MetaMessageMia {
  citations?: SourceMia[];
  actions?: ActeMia[];
  /* Par quelle couche la réponse est venue. Absent = le modèle a répondu.
     C'est ce qui permet de retrouver le badge et le visage après un
     rechargement, au lieu de les perdre avec l'état du composant. */
  couche?: "reflexe" | "geste";
  expression?: string;
}
