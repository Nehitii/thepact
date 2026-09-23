import type { OrdreAffiche } from "@/domaines/accueil/types";

/* LES JOURNEES FEINTES DU BANC DES ORDRES.
 *
 * Les titres, les descriptions, les cibles et les primes sont ceux que
 * pose la base (`assurer_ordres_du_jour`, accents et apostrophes droites
 * compris) : le banc montre les vrais ordres, a differents moments
 * d une journee.
 *
 * La base en pose trois, dans l ordre de leur rang : avancer un pas et
 * tenir le rituel d abord — s il reste un pas a faire, s il y a des
 * rituels tenus —, puis la conscience ecrite, puis le focus. Une
 * journee ordinaire est donc « pas, rituel, journal » ; le focus
 * n entre que quand l un des deux premiers ne s applique pas. */

const ORDRES: Readonly<Record<string, OrdreAffiche>> = {
  pas: {
    id: "pas", kind: "complete_steps", title: "Avancer un pas",
    description: "Termine une étape d'une de tes missions.",
    target: 1, progress: 0, reward_bonds: 15, status: "active",
  },
  rituel: {
    id: "rituel", kind: "log_habit", title: "Tenir le rituel",
    description: "Valide deux habitudes aujourd'hui.",
    target: 2, progress: 0, reward_bonds: 12, status: "active",
  },
  journal: {
    id: "journal", kind: "journal_entry", title: "Conscience écrite",
    description: "Note une pensée dans le Chronolog.",
    target: 1, progress: 0, reward_bonds: 10, status: "active",
  },
  focus: {
    id: "focus", kind: "focus_minutes", title: "Focus profond",
    description: "Cumule vingt-cinq minutes en Focus.",
    target: 25, progress: 0, reward_bonds: 18, status: "active",
  },
};

const RECLAME = "2026-09-23T15:42:00Z";

/** [id, progression, reclame ?] : de quoi ecrire une journee en une ligne. */
type Pose = readonly [string, number, boolean?];

const journee = (...poses: Pose[]): OrdreAffiche[] =>
  poses.map(([id, progress, reclame]) => ({
    ...ORDRES[id],
    progress,
    status: reclame ? "claimed" : progress >= ORDRES[id].target ? "completed" : "active",
    updated_at: reclame ? RECLAME : undefined,
  }));

export interface Scenario {
  id: string;
  nom: string;
  ordres: OrdreAffiche[];
  chargement?: boolean;
}

export const SCENARIOS: readonly Scenario[] = [
  { id: "matin", nom: "Le matin : rien de fait", ordres: journee(["pas", 0], ["rituel", 0], ["journal", 0]) },
  { id: "en-cours", nom: "En cours : un rituel sur deux", ordres: journee(["pas", 0], ["rituel", 1], ["journal", 0]) },
  { id: "a-prendre", nom: "Une prime à prendre", ordres: journee(["pas", 1], ["rituel", 1], ["journal", 0]) },
  { id: "presque", nom: "Presque : deux à prendre", ordres: journee(["pas", 1, true], ["rituel", 2], ["journal", 1]) },
  { id: "close", nom: "Journée close", ordres: journee(["pas", 1, true], ["rituel", 2, true], ["journal", 1, true]) },
  { id: "focus", nom: "Sans rituel : le focus entre", ordres: journee(["pas", 1, true], ["journal", 0], ["focus", 12]) },
  { id: "vide", nom: "Aucun ordre", ordres: [] },
  { id: "chargement", nom: "Chargement", ordres: [], chargement: true },
];

export const scenarioDe = (id: string | null): Scenario =>
  SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[1];

/** Un pas de plus sur un ordre : +1, ou +5 minutes pour le focus. */
export function avancer(o: OrdreAffiche): OrdreAffiche {
  if (o.status === "claimed") return o;
  const progress = Math.min(o.target, o.progress + (o.kind === "focus_minutes" ? 5 : 1));
  return { ...o, progress, status: progress >= o.target ? "completed" : "active" };
}

/** La reclamation, telle que la base la rend : le statut, et l heure du geste. */
export const reclamer = (o: OrdreAffiche, quand: number): OrdreAffiche =>
  ({ ...o, status: "claimed", updated_at: new Date(quand).toISOString() });
