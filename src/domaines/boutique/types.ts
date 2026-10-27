import type { Json } from "@/socle/supabase/types";
/* LES TYPES DU FILTRE DE LA BOUTIQUE.
 *
 * Ils etaient declares dans `composants/ShopFilters.tsx`, et
 * `logique/appliquerFiltres.ts` importait donc un composant React pour
 * connaitre la forme d un filtre.
 *
 * L IRONIE VAUT D ETRE NOTEE : `appliquerFiltres.ts` s ouvre sur « LE
 * FILTRE DE LA BOUTIQUE, SORTI DU FICHIER DE SON PANNEAU ». Quelqu un
 * avait deja sorti la FONCTION ; les TYPES etaient restes derriere, et
 * ils suffisaient a maintenir la dependance.
 *
 * Sixieme fois le meme motif, apres ExpressionMia, ObjetClause,
 * FinanceCategory, les neuf des taches et les quatre de l agenda.
 */
export type SortOption = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "rarity";
export type RarityFilter = "all" | "common" | "rare" | "epic" | "legendary";

export interface ShopFilterState {
  search: string;
  sort: SortOption;
  rarity: RarityFilter;
  hideOwned: boolean;
}

/* CE QUE « useShop.ts » DECLARAIT EN PLUS DE CALCULER.
 * Un type est inerte : il n a pas a vivre dans un fichier qui traine
 * React Query et Supabase derriere lui. Le fichier d origine les
 * REEXPORTE, parce que ses appelants les importaient depuis lui. */
export interface BondBalance {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface BondPack {
  id: string;
  name: string;
  bond_amount: number;
  price_eur: number;
  bonus_percentage: number;
  is_active: boolean;
  display_order: number;
}

export interface ShopModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price_bonds: number;
  price_eur: number | null;
  rarity: string;
  icon_key: string | null;
  is_active: boolean;
  is_coming_soon: boolean;
  display_order: number;
}

export interface SpecialOffer {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_bonds: number | null;
  price_eur: number | null;
  original_price_bonds: number | null;
  original_price_eur: number | null;
  /* Json en base. */
  items: Json | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
}

export interface CosmeticFrame {
  id: string;
  name: string;
  rarity: string;
  preview_url: string | null;
  border_color: string;
  glow_color: string;
  is_active: boolean;
  is_default: boolean;
  price: number;
  frame_scale?: number;
  frame_offset_x?: number;
  frame_offset_y?: number;
  /* Presentes en base et rapportees par le select, mais absentes de
     cette copie de l interface — celle de ProfileBoundedProfile les
     declare. FittingRoom les lisait donc par transtypage. */
  show_border?: boolean | null;
  avatar_border_color?: string | null;
}

export interface CosmeticBanner {
  id: string;
  name: string;
  rarity: string;
  preview_url: string | null;
  banner_url: string | null;
  gradient_start: string | null;
  gradient_end: string | null;
  is_active: boolean;
  is_default: boolean;
  price: number;
}

export interface CosmeticTitle {
  id: string;
  title_text: string;
  rarity: string;
  glow_color: string | null;
  text_color: string | null;
  is_active: boolean;
  is_default: boolean;
  price: number;
}
