/**
 * LA BRIGADE — trois objectifs au maximum.
 *
 * L etoile ne servait a rien de visible. Elle faisait pourtant deux
 * choses en silence : elle retrecissait le vivier du tirage de
 * mission, et elle alimentait une alerte qui ne se declenche qu a
 * quatre-vingt-cinq pour cent du pacte ecoule. Rien ne le disait, et
 * l inscription marquait le tout premier objectif — un nouvel
 * utilisateur avait donc un tirage qui ne piochait que dans un seul
 * objectif, sans jamais l apprendre.
 *
 * Elle devient une limite d encours. Le probleme d un pacte de
 * trente-huit objectifs n est pas d en manquer, c est d en avoir
 * vingt-quatre en l air a la fois. Trois places, pas quatre : la
 * quatrieme etoile demande d en relacher une.
 *
 * Un groupe ne se recrute pas — il s honore, et ses membres se
 * recrutent a sa place. Une habitude non plus : elle se tient chaque
 * jour, elle n a pas d etape a mettre au front.
 */
import type { Goal } from "@/domaines/objectifs/types";

export const PLAFOND_BRIGADE = 3;

interface ObjectifBrigade {
  id?: string;
  goal_type?: string | null;
  status?: string | null;
  is_focus?: boolean | null;
}

/** Seuls les objectifs ordinaires portent des etapes a mettre au front. */
export const recrutable = (g: ObjectifBrigade): boolean =>
  (g.goal_type ?? "normal") === "normal";

/** Un objectif honore ou archive quitte la brigade de lui-meme. */
const enService = (g: ObjectifBrigade): boolean =>
  g.status !== "fully_completed" && g.status !== "validated" && g.status !== "archived";

export const brigadeDe = <T extends ObjectifBrigade>(goals: T[]): T[] =>
  goals.filter((g) => g.is_focus && recrutable(g) && enService(g));

/**
 * Ce qui empeche de recruter, ou rien.
 *
 * Retourne une cle de traduction plutot qu une phrase : le refus se
 * dit dans la langue de l application, et le meme controle sert la
 * page des objectifs comme la fiche.
 */
export function refusDeRecrutement(
  tous: Goal[],
  goal: ObjectifBrigade,
): "brigade.refusType" | "brigade.refusPlein" | null {
  if (goal.is_focus) return null;               // relacher est toujours permis
  if (!recrutable(goal)) return "brigade.refusType";
  if (brigadeDe(tous).length >= PLAFOND_BRIGADE) return "brigade.refusPlein";
  return null;
}
