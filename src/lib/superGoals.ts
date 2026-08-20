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
 * declaration. Le detail est explique la ou le rattrapage se fait.
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

    /* Une declaration d honneur precede l ecriture des compteurs :
       c est elle qu il faudra defendre juste apres. */
    const etaitHonore = groupe.status === "fully_completed";

    const { error: err } = await supabase
      .from("goals")
      .update({ total_steps: total, validated_steps: faits })
      .eq("id", groupe.id);
    if (err) continue;

    /* UN GROUPE NE S HONORE PAS TOUT SEUL.
     *
     * Le declencheur en base honore un objectif des que ses compteurs
     * sont pleins. Pour un objectif ordinaire c est juste : ses etapes
     * sont son travail. Un groupe, lui, se declare honore — sans quoi
     * il encaisserait son experience le jour ou son dernier membre
     * tombe, sans que personne l ait decide.
     *
     * On rattrape donc le statut dans les deux sens : le groupe arrive
     * au seuil sans le franchir, et celui qui a ete honore le reste
     * quand ses membres bougent ensuite. L ecriture ne porte que sur
     * « status » — le declencheur n ecoute que les deux compteurs, il
     * ne se rallume donc pas.
     *
     * La migration 20260820210000 porte la meme regle en base, ou elle
     * couvrirait tous les chemins d ecriture. Tant qu elle n est pas
     * appliquee, c est ce rattrapage qui tient — et le jour ou elle
     * l est, il devient inutile et doit partir. */
    const auSeuil = total > 0 && faits >= total;
    if (etaitHonore) {
      await supabase.from("goals").update({ status: "fully_completed" }).eq("id", groupe.id);
    } else if (auSeuil) {
      /* Le declencheur a pose une date de franchissement en passant :
         un groupe qui n a pas ete honore n en a pas. Elle appartiendra
         au geste qui l honorera. */
      await supabase
        .from("goals")
        .update({ status: "in_progress", completion_date: null })
        .eq("id", groupe.id);
    }

    corrections.push({
      id: groupe.id,
      nom: groupe.name,
      avant: { total: groupe.total_steps ?? 0, faits: groupe.validated_steps ?? 0 },
      apres: { total, faits },
    });
  }

  return corrections;
}
