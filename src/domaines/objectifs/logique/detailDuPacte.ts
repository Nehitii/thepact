import { membresDuGroupe, estFranchi, type ObjectifPourGroupe } from "@/domaines/objectifs/logique/superGoals";
import type { SuperGoalChildInfo } from "@/domaines/objectifs/types";

/* CES FONCTIONS NE DEMANDENT PAS UN `Goal` COMPLET.
   La fiche detaillee tient un `GoalDetailData`, la liste un objectif
   allege : exiger le type le plus riche forcerait un transtypage a
   chaque appel. On demande ce qu on lit, et rien de plus. */
type Membre = ObjectifPourGroupe & {
  name: string;
  total_steps?: number | null;
  validated_steps?: number | null;
  totalStepsCount?: number | null;
  completedStepsCount?: number | null;
};

/* CE QUE LA PAGE D UN OBJECTIF DEDUIT.
 *
 * Quatre lectures qui vivaient dans le corps de la page, entre des
 * `useEffect` de synchronisation et des poignees de mutation. Aucune
 * n ecrit ; toutes decident ce que l ecran affiche.
 */

/* LES MEMBRES D UN GROUPE, ET SES LIENS CASSES.
 *
 * La composition suit la regle partagee. Ne restent ici que les
 * identifiants declares qui ne designent plus rien — un objectif
 * supprime laisse un lien casse, ET MIEUX VAUT LE MONTRER QUE LE FAIRE
 * DISPARAITRE : un groupe qui perd silencieusement un membre affiche un
 * total juste sur une composition fausse.
 *
 * Ils ne comptent dans aucun total, d ou `isMissing`.
 */
export function membresEtLiensCasses(
  objectif: ObjectifPourGroupe | null | undefined,
  tous: Membre[],
  libelleIntrouvable: string,
): SuperGoalChildInfo[] {
  if (!objectif || objectif.goal_type !== "super") return [];
  const membres = membresDuGroupe(objectif, tous);
  /* Un groupe DYNAMIQUE n a pas de liste declaree : sa composition se
     recalcule, donc rien ne peut y etre casse. */
  const casses = objectif.is_dynamic_super
    ? []
    : (objectif.child_goal_ids || []).filter((cid) => !tous.some((g) => g.id === cid));

  return [
    ...membres.map((m) => {
      const total = m.totalStepsCount ?? m.total_steps ?? 0;
      const faits = m.completedStepsCount ?? m.validated_steps ?? 0;
      return {
        id: m.id, name: m.name, difficulty: m.difficulty, status: m.status,
        progress: total > 0 ? Math.round((faits / total) * 100) : 0,
        isCompleted: estFranchi(m), isMissing: false,
      };
    }),
    ...casses.map((cid) => ({
      id: cid, name: libelleIntrouvable,
      difficulty: "medium", status: "not_started", progress: 0,
      isCompleted: false, isMissing: true,
    })),
  ] as SuperGoalChildInfo[];
}

/* CE QU UNE ETAPE TRAINE DERRIERE ELLE.
   Le rail l affiche en bout de ligne, ce qui evite d aller le chercher
   dans le registre d en face. Un poste sans etape n est rattache a
   rien : il compte dans le cout du pacte, pas dans celui d une ligne. */
export function coutParEtape(postes: { step_id?: string | null; price?: unknown }[]): Map<string, number> {
  const par = new Map<string, number>();
  for (const poste of postes) {
    if (!poste.step_id) continue;
    par.set(poste.step_id, (par.get(poste.step_id) ?? 0) + (Number(poste.price) || 0));
  }
  return par;
}

/** Deux statuts disent la meme chose : l objectif est honore. */
export const estHonore = (objectif: { status?: string | null }): boolean =>
  objectif.status === "fully_completed" || objectif.status === "validated";

/* LE ZENITH SE DEDUIT.
   C est le fait que l etape ultime soit franchie — aucune colonne a
   tenir d accord avec elle, donc rien qui puisse diverger. */
export const auZenith = (etapes: { is_ultimate?: boolean | null; status?: string | null }[]): boolean =>
  etapes.some((e) => e.is_ultimate && e.status === "completed");

/* QUELS GROUPES PORTENT CET OBJECTIF.
   On demande a chaque groupe sa composition plutot que de lire la
   liste declaree : un groupe dynamique n en a pas, et serait invisible
   ici alors qu il porte bel et bien l objectif. */
export function groupesPorteurs(objectifId: string, tous: Membre[]): string[] {
  return tous
    .filter((g) => g.goal_type === "super")
    .filter((g) => membresDuGroupe(g, tous).some((m) => m.id === objectifId))
    .map((g) => g.name);
}
