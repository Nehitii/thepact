/**
 * LES ETAPES OUVERTES — ce sur quoi on peut partir.
 *
 * L application savait deja repondre a cette question, mais au
 * hasard : le tirage de mission de l accueil prend un objectif et sa
 * premiere etape ouverte. Ce hook donne la reponse deliberee — toutes
 * les etapes qui restent, avec l objectif d ou elles viennent.
 *
 * Les habitudes et les groupes n en ont pas : une habitude se coche
 * par jour, un groupe compte ses membres. Seuls les objectifs
 * ordinaires ont des etapes a montrer.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Goal } from "@/hooks/useGoals";

export interface EtapeOuverte {
  id: string;
  titre: string;
  rang: number;
  objectifId: string;
  objectifNom: string;
  teinte: string;
  /** Avancement de l objectif d ou vient l etape, en pourcentage. */
  avancement: number;
  /** L objectif est deja engage : reprendre plutot qu ouvrir. */
  engage: boolean;
  /** Le tirage de mission ne propose jamais cette etape. */
  exclue: boolean;
}

const PALIER: Record<string, string> = {
  easy: "#4ade80",
  medium: "#facc15",
  hard: "#fb923c",
  extreme: "#f87171",
  impossible: "#c084fc",
};

export function useEtapesOuvertes(goals: Goal[], couleurPersonnalisee?: string) {
  /* Un objectif archive n a plus de front ; un groupe et une habitude
     n ont pas d etapes du tout. */
  const concernes = goals.filter(
    (g) => (g.goal_type ?? "normal") === "normal" && g.status !== "archived",
  );
  const ids = concernes.map((g) => g.id);

  return useQuery({
    queryKey: ["etapes-ouvertes", [...ids].sort().join(",")],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<EtapeOuverte[]> => {
      const { data, error } = await supabase
        .from("steps")
        .select("id, goal_id, title, order, exclude_from_spin")
        .in("goal_id", ids)
        .neq("status", "completed")
        .order("order", { ascending: true });
      if (error) throw error;

      const parId = new Map(concernes.map((g) => [g.id, g]));

      return (data ?? []).flatMap((s) => {
        const g = parId.get(s.goal_id);
        if (!g) return [];
        const total = g.totalStepsCount ?? g.total_steps ?? 0;
        const faites = g.completedStepsCount ?? g.validated_steps ?? 0;
        return [{
          id: s.id,
          titre: s.title,
          rang: s.order ?? 0,
          objectifId: g.id,
          objectifNom: g.name,
          teinte: g.difficulty === "custom"
            ? (couleurPersonnalisee || "#a855f7")
            : (PALIER[g.difficulty] || "#94a3b8"),
          avancement: total > 0 ? Math.round((faites / total) * 100) : 0,
          engage: g.status === "in_progress",
          exclue: !!s.exclude_from_spin,
        }];
      });
    },
  });
}

/**
 * Le classement du front.
 *
 * Aucune etape ne porte d echeance — la colonne existe, elle est vide
 * sur les soixante-cinq. Le seul ordre qui dise quelque chose d utile
 * est donc celui de l objectif le plus proche du but : finir ce qui
 * est presque fini avant d ouvrir un chantier de plus. A egalite,
 * l ordre des etapes dans leur objectif.
 */
export function classerLeFront(
  etapes: EtapeOuverte[],
  options: { engagesSeuls: boolean; sansExclues: boolean },
): EtapeOuverte[] {
  let retenues = etapes;
  if (options.engagesSeuls) retenues = retenues.filter((e) => e.engage);
  if (options.sansExclues) retenues = retenues.filter((e) => !e.exclue);
  return [...retenues].sort(
    (a, b) => b.avancement - a.avancement || a.rang - b.rang,
  );
}
