import { joursEcoules, joursRestants, MS_PAR_JOUR } from "./bornes.ts";

/* CE QUE M.I.A LIT AVANT DE REPONDRE.
 *
 * Chaque nombre de ce fichier finit dans une phrase qu elle prononce.
 * Un compte faux ici ne plante rien : il fait dire une chose fausse,
 * avec assurance.
 *
 * ═══════════════════════════════════════════════════════════════
 * ON DONNE LES TOTAUX DEJA FAITS, PAS LEURS INGREDIENTS.
 *
 * C est le commentaire d origine, et il rapporte un echec reel. Le
 * premier essai annoncait « 14 en cours, 11 non commences, etapes
 * 142/423 » et laissait le modele en deduire ce qu on lui demandait.
 * Reponse obtenue : « 48 etapes sur 11 objectifs en cours, 276 au
 * total ». TROIS CHIFFRES, TROIS FAUX — la verite etait 59 sur 14, et
 * 281 au total.
 *
 * Un modele ne somme pas quatorze lignes de tete. Chaque nombre qu on
 * risque de lui demander est donc calcule ici, et il n a plus qu a le
 * lire. C est pour cela que ce fichier existe, et pour cela qu il est
 * teste.
 * ═══════════════════════════════════════════════════════════════
 */

/* ── LE FUSEAU ───────────────────────────────────────────────── */

/* UN FUSEAU INVENTE FERAIT LEVER Intl. On l essaie avant de s en
   servir, et on retombe sur UTC plutot que de rendre une erreur : une
   date approximative vaut mieux qu une reponse qui n arrive pas. */
export const ZONE_DE_REPLI = "UTC";

export function zoneHoraireValide(fuseau: string | undefined, quand: Date): string {
  for (const z of [fuseau, ZONE_DE_REPLI]) {
    if (!z) continue;
    try {
      new Intl.DateTimeFormat("fr-FR", { timeZone: z }).format(quand);
      return z;
    } catch {
      /* zone refusee : on essaie la suivante */
    }
  }
  return ZONE_DE_REPLI;
}

/* ── LE PACTE ────────────────────────────────────────────────── */

export interface PacteLu {
  id: string;
  name: string;
  project_start_date?: string | null;
  project_end_date?: string | null;
}

/* CELUI QUI EST MARQUE ACTIF, SINON LE PREMIER. Un compte peut avoir
   plusieurs pactes et aucun marque : repondre sur le premier vaut
   mieux que de dire qu il n y en a aucun. */
export function pacteActif<T extends { id: string }>(
  actifId: string | null | undefined,
  pactes: T[],
): T | null {
  return pactes.find((p) => p.id === actifId) ?? pactes[0] ?? null;
}

export interface DureeDuPacte {
  total: number;
  ecoule: number;
  reste: number;
}

/* SANS DEUX DATES COHERENTES, ON NE COMPTE RIEN. Une fin avant le
   debut donnerait un total negatif et un « jour -12 / -40 » que le
   modele repeterait tel quel. */
export function dureeDuPacte(
  debut: number | null,
  fin: number | null,
  maintenant: number,
): DureeDuPacte | null {
  if (!debut || !fin || fin <= debut) return null;
  return {
    total: Math.round((fin - debut) / MS_PAR_JOUR),
    ecoule: joursEcoules(debut, maintenant),
    reste: joursRestants(fin, maintenant),
  };
}

/* ── LES OBJECTIFS ───────────────────────────────────────────── */

export interface ObjectifLu {
  name: string;
  status?: string | null;
  total_steps?: number | null;
  validated_steps?: number | null;
  is_focus?: boolean | null;
  pact_id?: string | null;
}

export const STATUTS_FINIS = ["fully_completed", "validated"];

export interface ComptesDesObjectifs {
  enCours: number;
  aVenir: number;
  finis: number;
  faites: number;
  etapes: number;
  restantes: number;
}

/* « FINI » VEUT DIRE « fully_completed » OU « validated », comme
   partout ailleurs dans l application — un objectif valide compte
   pour fait.

   LE Math.max(0, …) N EST PAS UNE PRECAUTION THEORIQUE : deux chemins
   connus produisent des objectifs dont les etapes faites depassent le
   total. L onboarding pose total_steps a cinq sans creer une seule
   etape ; la duplication perd le rang d etape ultime et rend une
   copie a trois etapes ordinaires pour un total de deux. Sans ce
   garde, M.I.A annoncerait un nombre d etapes restantes NEGATIF. */
export function comptesDesObjectifs(buts: ObjectifLu[]): ComptesDesObjectifs {
  const faites = buts.reduce((s, g) => s + (g.validated_steps ?? 0), 0);
  const etapes = buts.reduce((s, g) => s + (g.total_steps ?? 0), 0);
  return {
    enCours: buts.filter((g) => g.status === "in_progress").length,
    aVenir: buts.filter((g) => g.status === "not_started").length,
    finis: buts.filter((g) => STATUTS_FINIS.includes(g.status ?? "")).length,
    faites,
    etapes,
    restantes: Math.max(0, etapes - faites),
  };
}

/** Les etapes qui restent, pour les seuls objectifs d un statut. */
export function etapesRestantes(buts: ObjectifLu[], statut: string): number {
  return buts
    .filter((g) => g.status === statut)
    .reduce((s, g) => s + resteDe(g), 0);
}

export function resteDe(but: ObjectifLu): number {
  return Math.max(0, (but.total_steps ?? 0) - (but.validated_steps ?? 0));
}

export const PLUS_GROS_RESTES = 3;

/* LES TROIS PLUS GROS RESTES, PARMI LES SEULS OBJECTIFS EN COURS.
   Ceux qui n ont plus rien a faire sont ecartes AVANT le tri : sans
   cela, un objectif a zero reste pourrait entrer dans les trois par
   simple manque de concurrents, et M.I.A citerait comme « plus gros
   reste » quelque chose qui n a plus rien a faire. */
export function plusGrosRestes(
  buts: ObjectifLu[],
  combien = PLUS_GROS_RESTES,
): { nom: string; reste: number }[] {
  return buts
    .filter((g) => g.status === "in_progress")
    .map((g) => ({ nom: g.name, reste: resteDe(g) }))
    .filter((g) => g.reste > 0)
    .sort((a, b) => b.reste - a.reste)
    .slice(0, combien);
}

/* LA BRIGADE EXCLUT CE QUI EST « fully_completed » MAIS PAS
   « validated » — contrairement au compte des finis juste au-dessus.
   Les deux notions divergent donc sur un objectif valide : il compte
   comme fini, et reste pourtant dans la brigade. Constate, non
   corrige : ce fichier reproduit ce que faisait le code d origine. */
export function brigadeDe(buts: ObjectifLu[]): string[] {
  return buts.filter((g) => g.is_focus && g.status !== "fully_completed").map((g) => g.name);
}

/** On ne compte que les objectifs qui appartiennent a un pacte connu. */
export function butsDesPactes<T extends { pact_id?: string | null }>(
  buts: T[],
  pactes: { id: string }[],
): T[] {
  return buts.filter((g) => pactes.some((p) => p.id === g.pact_id));
}

/* ── LES ORDRES ET LE FOCUS ──────────────────────────────────── */

export interface OrdreLu {
  status?: string | null;
  reward_bonds?: number | null;
}

/* LA PRIME ACQUISE NE COMPTE QUE LES ORDRES RECLAMES : un ordre
   termine mais dont la prime n a pas ete prise n est pas acquis. */
export function primeDesOrdres(ordres: OrdreLu[]): { acquise: number; totale: number } {
  return {
    acquise: ordres
      .filter((q) => q.status === "claimed")
      .reduce((s, q) => s + (q.reward_bonds ?? 0), 0),
    totale: ordres.reduce((s, q) => s + (q.reward_bonds ?? 0), 0),
  };
}

export function minutesDeFocus(seances: { duration_minutes?: number | null }[]): number {
  return seances.reduce((s, p) => s + (p.duration_minutes ?? 0), 0);
}
