/* Le pacte et ses pieces chiffrees, par la porte du domaine : c est
   l arbitrage qui les met en face d une somme. */
import type { Goal, CostItem } from "@/domaines/objectifs";

/** Une categorie de depense ou de revenu.
 *
 * Elle etait declaree dans `logique/categories.ts`, au milieu des
 * donnees, et ce fichier allait l y chercher par un import inline — un
 * fichier de TYPES qui depend d un fichier de DONNEES. La garde des
 * couches l a signale des que le domaine s est referme. */
export interface FinanceCategory {
  value: string;
  labelKey: string;      // cle de traduction
  icon: LucideIcon;
  color: string;         // classe de couleur Tailwind
  bg: string;            // classe de fond Tailwind
  hexColor: string;      // couleur hex pour les graphiques
}

// ============================================
// SHARED FINANCE TYPES
// ============================================

import type { LucideIcon } from 'lucide-react';

/**
 * Recurring expense item
 */
export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category?: string | null;
  icon_emoji?: string | null;
  icon_url?: string | null;
  /** Comment l image se pose sur sa plaque — voir lib/finance/cadre.ts. */
  icon_cadre?: unknown;
  /* LA CADENCE — voir src/lib/finance/cadence.ts.
     Un abonnement trimestriel et un paiement en plusieurs fois sont la
     meme mecanique : une charge qui ne tombe pas tous les mois. */
  /** Mois entre deux echeances : 1 mensuel, 3, 6, 12. */
  periode_mois?: number | null;
  /** Mois de la premiere echeance ; dit QUELS mois sont concernes. */
  mois_ancre?: string | null;
  /** Nombre d echeances, ou rien pour une charge sans fin. */
  echeances?: number | null;
  /** Le jour du mois ou l argent bouge — voir lib/finance/cadence.ts. */
  jour_echeance?: number | null;
  /** De combien de mois le mouvement suit le mois concerne. */
  decalage_mois?: number | null;
  /** Prix paye d un echeancier : la division ne tombe pas toujours juste. */
  montant_total?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Recurring income item
 */
export interface RecurringIncome {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category?: string | null;
  icon_emoji?: string | null;
  icon_url?: string | null;
  /** Comment l image se pose sur sa plaque — voir lib/finance/cadre.ts. */
  icon_cadre?: unknown;
  /* LA CADENCE — voir src/lib/finance/cadence.ts.
     Un abonnement trimestriel et un paiement en plusieurs fois sont la
     meme mecanique : une charge qui ne tombe pas tous les mois. */
  /** Mois entre deux echeances : 1 mensuel, 3, 6, 12. */
  periode_mois?: number | null;
  /** Mois de la premiere echeance ; dit QUELS mois sont concernes. */
  mois_ancre?: string | null;
  /** Nombre d echeances, ou rien pour une charge sans fin. */
  echeances?: number | null;
  /** Le jour du mois ou l argent bouge — voir lib/finance/cadence.ts. */
  jour_echeance?: number | null;
  /** De combien de mois le mouvement suit le mois concerne. */
  decalage_mois?: number | null;
  /** Prix paye d un echeancier : la division ne tombe pas toujours juste. */
  montant_total?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Monthly validation record
 */
export interface MonthlyValidation {
  id: string;
  user_id: string;
  month: string;
  confirmed_expenses: boolean;
  confirmed_income: boolean;
  unplanned_expenses: number;
  unplanned_income: number;
  actual_total_income: number;
  actual_total_expenses: number;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Finance settings from profile
 */
export interface FinanceSettings {
  salary_payment_day: number;
  project_funding_target: number;
  project_monthly_allocation: number;
  already_funded: number;
}

/**
 * Category data for charts
 */
export interface CategoryChartData {
  name: string;
  label: string;
  value: number;
  color: string;
  icon?: LucideIcon;
}

/**
 * Balance trend data point
 */
export interface BalanceTrendPoint {
  month: string;
  label: string;
  balance: number;
}

/**
 * Financial item (generic for expense/income)
 */
export interface FinancialItem {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category?: string | null;
  icon_emoji?: string | null;
  icon_url?: string | null;
  /** Comment l image se pose sur sa plaque — voir lib/finance/cadre.ts. */
  icon_cadre?: unknown;
  /* LA CADENCE — voir src/lib/finance/cadence.ts.
     Un abonnement trimestriel et un paiement en plusieurs fois sont la
     meme mecanique : une charge qui ne tombe pas tous les mois. */
  /** Mois entre deux echeances : 1 mensuel, 3, 6, 12. */
  periode_mois?: number | null;
  /** Mois de la premiere echeance ; dit QUELS mois sont concernes. */
  mois_ancre?: string | null;
  /** Nombre d echeances, ou rien pour une charge sans fin. */
  echeances?: number | null;
  /** Le jour du mois ou l argent bouge — voir lib/finance/cadence.ts. */
  jour_echeance?: number | null;
  /** De combien de mois le mouvement suit le mois concerne. */
  decalage_mois?: number | null;
  /** Prix paye d un echeancier : la division ne tombe pas toujours juste. */
  montant_total?: number | null;
}

/**
 * Props for FinancialBlock component
 */
export interface FinancialBlockProps {
  title: string;
  type: 'expense' | 'income';
  items: FinancialItem[];
  categories: FinanceCategory[];
  isLoading: boolean;
  onAdd: (name: string, amount: number, category?: string, iconEmoji?: string, iconUrl?: string) => Promise<void>;
  onUpdate: (id: string, name: string, amount: number, category?: string, iconEmoji?: string, iconUrl?: string) => Promise<void>;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  isPending?: boolean;
}

/**
 * Stats summary for projections
 */
export interface FinanceStats {
  savingsRate: number;
  monthsToGoal: number | null;
  monthlyNet: number;
  yearlyProjection: number;
}

/**
 * User bank account
 */
export interface UserAccount {
  id: string;
  user_id: string;
  name: string;
  bank_name: string | null;
  account_type: string;
  balance: number;
  initial_balance: number;
  balance_date: string | null;
  icon_emoji: string | null;
  icon_url: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Account transfer record
 */
export interface AccountTransfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  note: string | null;
  transfer_date: string;
  created_at: string;
}

/**
 * Bank transaction for detailed tracking
 */
export interface BankTransaction {
  id: string;
  user_id: string;
  account_id: string | null;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: 'debit' | 'credit';
  category: string | null;
  note: string | null;
  source: 'manual' | 'csv_import';
  created_at: string;
}

/* Venues de « ArbitragePanel.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface ArbitragePanelProps {
  goals: Goal[];
  /** Ce qui reste chaque mois, propose comme premiere mise. */
  netMensuel: number;
  /** Ce qui est deja mis de cote. */
  dejaFinance: number;
}

export type Lot = {
  goal: Goal;
  pieces: CostItem[];
  reste: number;
};

/* Venues de « ParcoursDuMois.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
/** Une ligne telle qu elle se presente au pointage. */
export interface Rang {
  item: FinancialItem;
  prevu: number;
  reel: number;
  pointe: boolean;
  /* LA DATE OU L ARGENT BOUGE, ET S IL A DEJA BOUGE.
     Nulles quand la ligne ne dit pas son jour : on ne peut alors ni
     l affirmer ni le nier, et se taire vaut mieux que supposer. */
  quand: Date | null;
  passe: boolean | null;
}

/* Venues de « usePointages.ts », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface Pointage {
  id: string;
  user_id: string;
  mois: string;
  ligne_id: string | null;
  genre: 'expense' | 'income';
  nom: string;
  montant_prevu: number;
  montant_reel: number;
  pointe: boolean;
}

/* Venues de « LigneRecurrente.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface ValeursLigne {
  name: string;
  /** Ce qui part a chaque echeance. Pour un echeancier, c est la part. */
  amount: number;
  category?: string;
  iconEmoji?: string;
  /* NUL EST UNE VALEUR, ET « INDEFINI » N EN EST PAS UNE.
     Retirer une image ne fonctionnait pas : on envoyait undefined, que
     le client Supabase OMET de la requete — la colonne n etait donc
     jamais touchee et l ancien logo restait. Il faut dire null pour
     effacer, et le type doit le permettre. */
  iconUrl?: string | null;
  /* Comment l image se pose. Nul quand rien n a ete regle : ecrire le
     defaut partout ferait croire a une intention. */
  iconCadre?: CadreImage | null;
  /* LA CADENCE. Un abonnement trimestriel et un paiement en plusieurs
     fois sont la meme mecanique : une charge qui ne tombe pas tous les
     mois. Voir src/lib/finance/cadence.ts. */
  periodeMois?: number;
  moisAncre?: string | null;
  echeances?: number | null;
  montantTotal?: number | null;
  /** Le jour du mois ou l argent bouge, et de combien de mois il suit. */
  jourEcheance?: number | null;
  decalageMois?: number;
}

/* Venues de « cadre.ts », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface CadreImage {
  ajustement: Ajustement;
  /** Decalage horizontal, en % de la plaque. Zero est centre. */
  dx: number;
  /** Decalage vertical, en % de la plaque. Zero est centre. */
  dy: number;
  /** De 100 a 300. */
  zoom: number;
  fond: FondDeMarque;
}

/* Venues de « cadre.ts », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export type Ajustement = 'contenir' | 'remplir' | 'etirer';

export type FondDeMarque = 'clair' | 'sombre' | 'teinte';
