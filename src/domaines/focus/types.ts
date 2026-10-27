/** Ce sur quoi porte la seance : un objectif, une tache, ou rien.
 *
 * Ce type vivait dans `pages/Focus.tsx`, et `FocusToolbar` l y allait
 * chercher — un composant qui importe une page, la derniere inversion
 * `composants → pages` du depot. Il descend ici, ou il n a jamais cesse
 * d appartenir : un type ne rend rien. */
export type ObjetClause = { type: "goal" | "todo"; id: string } | null;

/* CE QUE « usePomodoro.ts » DECLARAIT EN PLUS DE CALCULER.
 * Un type est inerte : il n a pas a vivre dans un fichier qui traine
 * React Query et Supabase derriere lui. Le fichier d origine les
 * REEXPORTE, parce que ses appelants les importaient depuis lui. */
export type PomodoroPhase = "work" | "break" | "idle";

export interface PomodoroSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  break_minutes: number;
  completed: boolean;
  linked_todo_id: string | null;
  linked_goal_id: string | null;
  linked_step_id: string | null;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

/** Un cycle de travail acheve, tel que le minuteur le rapporte. */
export interface CycleAcheve {
  minutes: number;
  debutISO: string;
  complet: boolean;
}

/* DEUX ETATS QUI VIVAIENT DANS CE QUI LES FAIT VIVRE.
 *
 * `Etat` etait declare dans le composant du fond, `EtatMinuteur` dans
 * le hook de la minuterie. En sortant leurs peintres et leur couche de
 * persistance — tous deux au rang 1 — ces deux modules se sont mis a
 * remonter vers un composant et vers un hook. La garde des couches l a
 * dit tout de suite.
 *
 * DOUZIEME ET TREIZIEME FOIS LE MOTIF. Il ne se presente plus par
 * accident : il apparait chaque fois qu on sort la logique d un fichier
 * qui declare aussi ses formes. */

export interface Etat {
  w: number; h: number; dpr: number;
  ctx: CanvasRenderingContext2D;
  teinte: [number, number, number];
  or: [number, number, number];
  /* Une pointe d hyphe. `gen` est sa generation — zero pour le tronc
     sorti du germe, un pour ses branches, et ainsi de suite : c est
     d elle que viennent l epaisseur et la pâleur, pas de l age.
     `reste` est ce qu il lui reste a pousser avant de s arreter. */
  pointes?: { x: number; y: number; a: number; v: number; vie: number; gen: number; reste: number; seg: number }[];
  /* Les germes deja poses : une colonie neuve se tient a l ecart des
     precedentes, sinon tout pousse au meme endroit. */
  germes?: { x: number; y: number }[];
  parts?: { x: number; y: number; vie: number }[];
  cols?: { x: number; y: number; plan: number; v: number; lg: number }[];
  temps: number;
  dissipe: number;
  impulsion: number;
}

export interface EtatMinuteur {
  phase: PomodoroPhase;
  secondsLeft: number;
  totalPhase: number;
  cycles: number;
  enPause: boolean;
}
