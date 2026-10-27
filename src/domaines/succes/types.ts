import type { Json } from "@/socle/supabase/types";
export interface Rank {
  id: string;
  name: string;
  min_points: number;
  max_points?: number | null;
  logo_url?: string | null;
  background_url?: string | null;
  background_opacity?: number | null;
  frame_color?: string | null;
  glow_color?: string | null;
  quote?: string | null;
}

/* CE QUE « achievements.ts » DECLARAIT EN PLUS DE CALCULER.
 * Un type est inerte : il n a pas a vivre dans un fichier qui traine
 * React Query et Supabase derriere lui. Le fichier d origine les
 * REEXPORTE, parce que ses appelants les importaient depuis lui. */
export type AchievementCategory =
  | "Connection"
  | "GoalsCreation"
  | "Difficulty"
  | "Time"
  | "Pact"
  | "Finance"
  | "Hidden"
  | "Series"
  | "Todo"
  | "Focus"
  | "Journal"
  | "Social"
  | "Community"
  | "Wishlist"
  | "Calendar"
  | "Shop"
  | "ModuleGated"
  | "Legendary";

export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

/**
 * CE QUE PORTE UNE CONDITION DE SUCCES.
 *
 * La colonne est du Json : elle ne peut pas etre typee par la base. Mais
 * le code n en lit que deux champs, et les asserter nommement vaut mieux
 * que de tout rendre opaque avec un « as any » — qui laissait passer
 * n importe quelle faute de frappe sur condition.type.
 */
export interface ConditionSucces {
  type: string;
  value?: number;
  [autre: string]: unknown;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  category: AchievementCategory;
  description: string;
  flavor_text?: string;
  rarity: AchievementRarity;
  icon_key: string;
  is_hidden: boolean;
  /* Json en base. La condition n est lue que par ses deux champs
     ci-dessous — voir ConditionSucces. */
  conditions: Json;
  unlocked?: boolean;
  unlocked_at?: string;
  progress?: number;
  required_module?: string | null;
  bond_reward?: number;
  points?: number;
}

/* Venues de « useSucces.ts », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface Succes {
  cle: string;
  nom: string;
  categorie: string;
  rarete: string;
  description: string | null;
  saveur: string | null;
  icone: string | null;
  cache: boolean;
  points: number;
  bonds: number;
  mesure: string | null;
  seuil: number | null;
  valeur: number | null;
  obtenu: boolean;
  obtenu_le: string | null;
  avancement: number;
  /* Pourquoi il ne bouge pas, quand la raison n est pas « vous n avez
     pas encore commence » : module manquant, personne autour, ou une
     partie du produit ou rien n a jamais ete enregistre. */
  sommeil: "module" | "personne" | "inactif" | null;
}
