/* CONSTRUIRE LA SAUVEGARDE.
 *
 * Cette fonction est la seule promesse de l application : « tu peux
 * partir avec tes donnees ». Elle vivait dans la page, melee a
 * Supabase, a des `toast` et a un `setState` — donc ineprouvable, donc
 * jamais eprouvee.
 *
 * UNE SAUVEGARDE MUETTE N EN EST PAS UNE. Le commentaire de la page
 * disait ce defaut corrige : une lecture qui echoue rendait `null` et
 * le fichier partait incomplet, sans un mot. Il l etait pour CINQ
 * lectures sur QUINZE. Les six requetes de finance, celle de sante,
 * le profil complet et les succes jetaient toujours leur erreur.
 *
 * Ici il n y a plus de chemin discret : `lire` leve, ou rend. Une
 * categorie absente du fichier ne peut plus etre confondue avec une
 * categorie vide.
 */
export interface Lecture {
  data: unknown;
  error: { message: string } | null;
}

/* LES DOUZE TABLES QUE LA SAUVEGARDE LIT.
   Ecrites une fois, elles disent ce que le fichier contient — et
   Supabase, qui refuse un nom de table dynamique, les verifie. */
export type TableExportee =
  | "profiles" | "pacts" | "goals" | "steps" | "journal_entries" | "health_data"
  | "recurring_income" | "recurring_expenses" | "finance"
  | "monthly_finance_validations" | "pact_spending" | "user_achievements";

/** Ce dont l export a besoin du monde exterieur, et rien de plus. */
export type Lire = (demande: {
  table: TableExportee;
  colonnes?: string;
  /** Egalites a poser sur la requete. */
  ou?: Record<string, string>;
  /** Appartenance a un ensemble — les etapes de ces objectifs-la. */
  parmi?: [colonne: string, valeurs: string[]];
  /** Une seule ligne attendue, ou aucune. */
  unique?: boolean;
  ordre?: [colonne: string, croissant: boolean];
  limite?: number;
}) => Promise<Lecture>;

export type Categorie = "all" | "goals-steps" | "journal" | "finance" | "health";

export interface DemandeDExport {
  lire: Lire;
  categorie: Categorie;
  utilisateur: { id: string; email?: string | null };
  /** Les compteurs deja affiches a l ecran ; ils voyagent avec. */
  stats?: unknown;
  /** L horodatage du fichier. Passe pour que le test soit reproductible. */
  maintenant?: Date;
}

/* Une ligne quelconque : l export ne connait pas le detail des tables,
   il les transporte. */
type Ligne = Record<string, unknown>;

export async function construireExport({
  lire, categorie, utilisateur, stats, maintenant = new Date(),
}: DemandeDExport): Promise<Record<string, unknown>> {
  /* AUCUNE LECTURE NE PASSE AILLEURS QUE PAR ICI. C est la seule
     garantie qui compte : ce n est pas la presence de `verifier` a un
     endroit qui protege, c est l absence de chemin qui l evite. */
  const verifier = async (demande: Parameters<Lire>[0], quoi: string): Promise<unknown> => {
    const r = await lire(demande);
    if (r.error) throw new Error(`${quoi} : ${r.error.message}`);
    return r.data;
  };
  const lignes = async (demande: Parameters<Lire>[0], quoi: string): Promise<Ligne[]> =>
    ((await verifier(demande, quoi)) as Ligne[] | null) ?? [];
  const uneLigne = async (demande: Parameters<Lire>[0], quoi: string): Promise<Ligne | null> =>
    ((await verifier({ ...demande, unique: true }, quoi)) as Ligne | null) ?? null;

  let sortie: Record<string, unknown> = {
    exportedAt: maintenant.toISOString(),
    category: categorie,
    user: { email: utilisateur.email, id: utilisateur.id },
  };

  /* Le pacte ACTIF, et non « le » pacte : supposer qu il n y en ait
     qu un echoue des le second. */
  const profilPacte = await uneLigne(
    { table: "profiles", colonnes: "active_pact_id", ou: { id: utilisateur.id } }, "profil");
  const pactId = (profilPacte?.active_pact_id as string | undefined)
    ?? ((await uneLigne({ table: "pacts", colonnes: "id", ou: { user_id: utilisateur.id },
          ordre: ["created_at", false], limite: 1 }, "pacte"))?.id as string | undefined)
    ?? null;
  const pact = pactId
    ? await uneLigne({ table: "pacts", colonnes: "*", ou: { id: pactId } }, "pacte")
    : null;

  if (categorie === "all" || categorie === "goals-steps") {
    const goals = pactId
      ? await lignes({ table: "goals", colonnes: "*", ou: { pact_id: pactId } }, "objectifs")
      : [];
    const goalIds = goals.map((g) => g.id as string);
    const steps = goalIds.length
      ? await lignes({ table: "steps", colonnes: "*", parmi: ["goal_id", goalIds] }, "étapes")
      : [];
    sortie = { ...sortie, goals, steps };
  }

  if (categorie === "all" || categorie === "journal") {
    sortie = { ...sortie, journalEntries: await lignes(
      { table: "journal_entries", colonnes: "*", ou: { user_id: utilisateur.id } }, "journal") };
  }

  if (categorie === "all" || categorie === "health") {
    const healthData = await lignes({ table: "health_data", colonnes: "*",
      ou: { user_id: utilisateur.id }, ordre: ["entry_date", true] }, "santé");
    if (healthData.length) sortie = { ...sortie, healthData };
  }

  if (categorie === "all" || categorie === "finance") {
    const de = (table: TableExportee, quoi: string) =>
      lignes({ table, colonnes: "*", ou: { user_id: utilisateur.id } }, quoi);
    sortie = { ...sortie, finance: {
      settings: await uneLigne({ table: "profiles",
        colonnes: "project_funding_target, project_monthly_allocation, already_funded, salary_payment_day",
        ou: { id: utilisateur.id } }, "réglages de finance"),
      recurringIncome: await de("recurring_income", "revenus récurrents"),
      recurringExpenses: await de("recurring_expenses", "dépenses récurrentes"),
      monthlyRecords: await de("finance", "relevés mensuels"),
      monthlyValidations: await de("monthly_finance_validations", "validations mensuelles"),
      pactSpending: await de("pact_spending", "dépenses du pacte"),
    } };
  }

  if (categorie === "all") {
    const profileComplet = await uneLigne(
      { table: "profiles", colonnes: "*", ou: { id: utilisateur.id } }, "profil complet");
    /* `select("*")` emportait aussi `goal_unlock_code` — le code a
       quatre chiffres qui masque le contenu d un objectif — en clair
       dans un fichier fait pour etre range ailleurs. */
    const profile = profileComplet
      ? Object.fromEntries(Object.entries(profileComplet).filter(([c]) => c !== "goal_unlock_code"))
      : null;
    const achievements = await lignes(
      { table: "user_achievements", colonnes: "*", ou: { user_id: utilisateur.id } }, "succès");
    sortie = { ...sortie, profile, pact, achievements, stats };
  }

  return sortie;
}

/* LES QUINZE COLONNES DE SANTE, EN FRANCAIS.
   Les seuls mots anglais de la page vivaient dans ce CSV, que personne
   ne relit avant de l ouvrir dans un tableur. */
const COLONNES_SANTE: [titre: string, champ: string][] = [
  ["Date", "entry_date"],
  ["Heures de sommeil", "sleep_hours"],
  ["Qualité du sommeil", "sleep_quality"],
  ["Énergie au réveil", "wake_energy"],
  ["Niveau d’activité", "activity_level"],
  ["Minutes de mouvement", "movement_minutes"],
  ["Niveau de stress", "stress_level"],
  ["Charge mentale", "mental_load"],
  ["Verres d’eau", "hydration_glasses"],
  ["Équilibre des repas", "meal_balance"],
  ["Humeur", "mood_level"],
  ["Énergie matin", "energy_morning"],
  ["Énergie après-midi", "energy_afternoon"],
  ["Énergie soir", "energy_evening"],
  ["Notes", "notes"],
];

export function csvDeSante(lignes: Record<string, unknown>[]): string {
  const entete = COLONNES_SANTE.map(([titre]) => titre).join(",");
  const corps = lignes.map((d) => COLONNES_SANTE.map(([, champ]) =>
    /* Un champ absent ne demande pas de `?? ""` : `join` ecrit deja une
       case vide pour `undefined`. Le garde etait mort — c est une
       mutation qui l a montre, aucun test ne pouvant le faire tomber.
       Seules les notes sont du texte libre : elles seules ont besoin
       d etre entourees, et leurs guillemets doubles. */
    champ === "notes" ? `"${String(d.notes ?? "").replace(/"/g, '""')}"` : d[champ],
  ).join(","));
  return [entete, ...corps].join("\n");
}
