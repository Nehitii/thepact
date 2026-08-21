/**
 * LES GROUPES ET LEURS MEMBRES.
 *
 * Un groupe n a ni etape ni jour a cocher : son avancement, c est
 * celui de ses membres. Mais le statut d un objectif est derive en
 * base par un declencheur qui lit « validated_steps » et
 * « total_steps » — deux colonnes que rien ne renseignait pour un
 * groupe. Elles restaient donc a zero, et les six groupes du pacte
 * s affichaient « non engage » alors que leurs membres avançaient,
 * l un d eux avec ses quatre objectifs honores.
 *
 * On ecrit donc le compte des membres et celui des membres franchis,
 * et le declencheur existant en tire le statut — la meme arithmetique
 * que pour un objectif ordinaire, au lieu d une seconde regle posee a
 * cote.
 *
 * A une reserve pres : un groupe ne s honore pas tout seul. Le
 * declencheur mene un objectif jusqu au bout des que ses compteurs
 * sont pleins ; un groupe, lui, s arrete au seuil et attend une
 * declaration — et une fois declaree, elle tient meme si un membre
 * retombe. Cette reserve vit dans le declencheur lui-meme, pose par
 * la migration 20260820210000 : ecrire les compteurs suffit ici.
 *
 * La composition d un groupe etait ecrite deux fois, dans le registre
 * et dans la fiche, avec deux definitions differentes du « franchi ».
 * Elle vit ici, une seule fois.
 */
import { supabase } from "@/integrations/supabase/client";
import { filterGoalsByRule, type SuperGoalRule } from "@/components/goals/super";

export interface ObjectifPourGroupe {
  id: string;
  goal_type?: string | null;
  status?: string | null;
  difficulty?: string | null;
  is_focus?: boolean | null;
  tags?: string[];
  child_goal_ids?: string[] | null;
  super_goal_rule?: unknown;
  is_dynamic_super?: boolean | null;
}

/** Un objectif compte comme franchi qu il ait ete valide ou honore. */
export const estFranchi = (g: { status?: string | null }): boolean =>
  g.status === "fully_completed" || g.status === "validated";

/**
 * PRET A HONORER — l etat entre « en cours » et « franchi ».
 *
 * Depuis qu un groupe s honore a la main, il existe un moment ou tout
 * le travail est fait et ou il ne reste plus que le geste : maintenir
 * le bouton. Ce moment est une information — c est celui ou il faut
 * aller chercher son du — et il n avait pas de nom. Faute de nom, il
 * se confondait avec « en cours », et le geste restait invisible
 * depuis la liste.
 *
 * Seuls les groupes connaissent cet etat. Un objectif ordinaire passe
 * a « franchi » de lui-meme des que sa derniere etape est cochee : il
 * n attend rien de personne.
 */
export function estPretAHonorer<T extends ObjectifPourGroupe>(
  groupe: ObjectifPourGroupe,
  tous: T[],
): boolean {
  if (groupe.goal_type !== "super") return false;
  if (estFranchi(groupe)) return false;
  const membres = membresDuGroupe(groupe, tous);
  // Un groupe vide n attend pas un geste : il attend des membres.
  return membres.length > 0 && membres.every(estFranchi);
}

/** Membres d un groupe : liste declaree, ou regle pour un groupe automatique. */
/* Le groupe et le vivier n ont pas forcement le meme type : la fiche
   detaillee tient un objectif complet et une liste allegee. Seul le
   vivier porte le parametre de type — c est lui qui ressort. */
export function membresDuGroupe<T extends ObjectifPourGroupe>(
  groupe: ObjectifPourGroupe,
  tous: T[],
): T[] {
  const ordinaires = tous.filter((x) => x.goal_type !== "super");
  if (groupe.is_dynamic_super && groupe.super_goal_rule) {
    return filterGoalsByRule(
      ordinaires.filter((x) => x.id !== groupe.id),
      groupe.super_goal_rule as SuperGoalRule,
    );
  }
  return ((groupe.child_goal_ids || []) as string[])
    .map((id) => ordinaires.find((x) => x.id === id))
    .filter(Boolean) as T[];
}

export interface CorrectionGroupe {
  id: string;
  nom: string;
  avant: { total: number; faits: number };
  apres: { total: number; faits: number };
}

/**
 * Remet les compteurs de chaque groupe d accord avec ses membres.
 *
 * A appeler apres tout geste qui peut franchir ou defaire un
 * objectif. Sans membre, les compteurs restent a zero et le
 * declencheur laisse le statut tel quel : un groupe vide n est ni
 * engage ni honore.
 */
export async function synchroniserGroupes(pactId: string | undefined): Promise<CorrectionGroupe[]> {
  if (!pactId) return [];

  const { data, error } = await supabase
    .from("goals")
    .select("id, name, status, goal_type, difficulty, is_focus, child_goal_ids, super_goal_rule, is_dynamic_super, total_steps, validated_steps, goal_tags(tag)")
    .eq("pact_id", pactId);
  if (error || !data) return [];

  /* La regle d un groupe automatique peut filtrer sur les etiquettes :
     elles arrivent par la jointure, comme dans les listes. */
  const objectifs = data.map((g) => ({
    ...g,
    tags: Array.isArray((g as { goal_tags?: { tag: string }[] }).goal_tags)
      ? (g as { goal_tags: { tag: string }[] }).goal_tags.map((t) => t.tag)
      : [],
  }));

  const corrections: CorrectionGroupe[] = [];

  for (const groupe of objectifs.filter((g) => g.goal_type === "super")) {
    const membres = membresDuGroupe(groupe, objectifs);
    const total = membres.length;
    const faits = membres.filter(estFranchi).length;
    if (total === (groupe.total_steps ?? 0) && faits === (groupe.validated_steps ?? 0)) continue;

    const { error: err } = await supabase
      .from("goals")
      .update({ total_steps: total, validated_steps: faits })
      .eq("id", groupe.id);
    if (err) continue;

    corrections.push({
      id: groupe.id,
      nom: groupe.name,
      avant: { total: groupe.total_steps ?? 0, faits: groupe.validated_steps ?? 0 },
      apres: { total, faits },
    });
  }

  return corrections;
}
