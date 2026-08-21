/**
 * LES ETAPES DU PACTE.
 *
 * Ce hook ne connaissait que les etapes ouvertes : il demandait a la
 * base tout ce qui n etait pas termine. Le front y gagnait sa raison
 * d etre — savoir sur quoi partir — mais la page, elle, y perdait une
 * moitie de sa verite. Les trois onglets filtrent des objectifs ; le
 * front qui les suit n avait rien a montrer sous « Termines »,
 * puisqu un objectif termine n a par construction plus une seule
 * etape ouverte. L onglet existait, la vue etait vide.
 *
 * Il lit donc toutes les etapes, et chacune dit si elle est faite. Le
 * tri se fait ensuite en memoire, avec un axe de plus : ce qui reste a
 * faire, ce qui est fait, ou tout. Le compte affiche est celui de ce
 * qu on montre — il ne peut donc pas mentir.
 *
 * Les habitudes et les groupes n en ont pas : une habitude se coche
 * par jour, un groupe compte ses membres. Seuls les objectifs
 * ordinaires ont des etapes a montrer.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Goal } from "@/hooks/useGoals";

export interface Etape {
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
  /** L objectif fait partie des trois de la brigade. */
  brigade: boolean;
  /** Le tirage de mission ne propose jamais cette etape. */
  exclue: boolean;
  /** L etape est franchie. */
  faite: boolean;
}

const PALIER: Record<string, string> = {
  easy: "#4ade80",
  medium: "#facc15",
  hard: "#fb923c",
  extreme: "#f87171",
  impossible: "#c084fc",
};

export function useEtapes(goals: Goal[], couleurPersonnalisee?: string) {
  /* Un objectif archive n a plus de front ; un groupe et une habitude
     n ont pas d etapes du tout. */
  const concernes = goals.filter(
    (g) => (g.goal_type ?? "normal") === "normal" && g.status !== "archived",
  );
  const ids = concernes.map((g) => g.id);

  return useQuery({
    queryKey: ["etapes-du-pacte", [...ids].sort().join(",")],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<Etape[]> => {
      const { data, error } = await supabase
        .from("steps")
        .select("id, goal_id, title, order, exclude_from_spin, status")
        .in("goal_id", ids)
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
          brigade: !!g.is_focus,
          exclue: !!s.exclude_from_spin,
          /* « validated » est un statut d objectif ; une etape ne
             connait que « pending » et « completed ». */
          faite: s.status === "completed",
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
 *
 * Deux axes, qui sont deux questions distinctes. La portee demande
 * « lesquelles me regardent ? » — la brigade, les objectifs engages ou
 * tous. L etat demande « lesquelles restent ? ». Les croiser permet de
 * lire la meme collection comme un plan de travail ou comme un releve
 * de ce qui est acquis.
 */
export type PorteeFront = "brigade" | "engages" | "tout";
export type EtatFront = "afaire" | "faites" | "toutes";

export function classerLeFront(
  etapes: Etape[],
  options: { portee: PorteeFront; etat: EtatFront; sansExclues: boolean },
): Etape[] {
  let retenues = etapes;
  if (options.portee === "brigade") retenues = retenues.filter((e) => e.brigade);
  else if (options.portee === "engages") retenues = retenues.filter((e) => e.engage);

  if (options.etat === "afaire") retenues = retenues.filter((e) => !e.faite);
  else if (options.etat === "faites") retenues = retenues.filter((e) => e.faite);

  /* L exclusion du tirage ne mord que sur ce qui reste a faire : une
     etape franchie n attend plus rien d un tirage.
     Sans cette reserve, « Faites » annonçait 48 et « Toutes » n en
     montrait que 46 — deux etapes franchies disparaissaient au motif
     qu elles etaient hors tirage, et le compte changeait sans qu on
     ait rien demande. */
  if (options.sansExclues) retenues = retenues.filter((e) => e.faite || !e.exclue);

  /* Ce qui est fait se lit a l envers de ce qui reste : on descend
     depuis les objectifs les plus aboutis, et l ordre des etapes
     remonte le temps au lieu de l annoncer. */
  return [...retenues].sort((a, b) =>
    options.etat === "faites"
      ? b.avancement - a.avancement || b.rang - a.rang
      : b.avancement - a.avancement || a.rang - b.rang,
  );
}
