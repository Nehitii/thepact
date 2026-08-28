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
import type { Goal } from "@/domaines/objectifs/hooks/useGoals";

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
  /** Le palier de l objectif d ou vient l etape. */
  difficulte: string;
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
    /* La cle commence par « goals » a dessein. React Query invalide
       par prefixe : les quatorze endroits qui invalident deja
       « goals » quand une etape change rafraichissent donc aussi le
       front, sans avoir a y penser. Sous sa propre cle, il gardait un
       titre modifie jusqu a l expiration de sa fraicheur — c est
       exactement ce qui s est vu. */
    queryKey: ["goals", "etapes-du-pacte", [...ids].sort().join(",")],
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
          difficulte: g.difficulty,
        }];
      });
    },
  });
}

/**
 * Le classement du front.
 *
 * UNE ETAPE N A QUE DEUX ETATS : elle est faite, ou elle ne l est pas.
 * « En cours » est un mot d objectif, et le plaquer sur une etape ne
 * decrivait rien. Les trois onglets de la page se lisent donc ici comme
 * un total et ses deux moities : toutes, celles qui restent, celles qui
 * sont faites. Et 184 = 65 + 119, verifiable en base.
 *
 * Un seul filtre s ajoute, parce qu il repond a une autre question :
 * « seulement mes trois objectifs ? ». La brigade est une notion
 * d objectif, pas d etape — une etape n est pas « focus », c est son
 * objectif qui l est. Le filtre retient donc les etapes QUI VIENNENT
 * d un objectif de la brigade, et son libelle le dit.
 *
 * Ont disparu ici : la portee a trois valeurs, dont « engages » que
 * personne ne pouvait deviner, et le filtre de tirage, un icone d oeil
 * sans libelle qui retirait vingt-six etapes du compte en silence. Une
 * etape hors tirage reste marquee sur sa ligne : l information est
 * gardee, c est le retranchement muet qui part.
 *
 * Aucune etape ne porte d echeance — la colonne existe, elle est vide
 * sur les soixante-cinq. Le seul ordre qui dise quelque chose d utile
 * est donc celui de l objectif le plus proche du but : finir ce qui est
 * presque fini avant d ouvrir un chantier de plus. A egalite, l ordre
 * des etapes dans leur objectif.
 */
export type EtatFront = "afaire" | "faites" | "toutes";

/**
 * Les tris qui veulent dire quelque chose pour une etape.
 *
 * La page en propose dix, taillees pour des objectifs — date de
 * creation, statut, groupes d abord, groupes en dernier. Une etape n a
 * ni date ni statut a trois valeurs, et n appartient a aucun groupe :
 * la moitie de ce menu ne triait rien. Il en reste trois, qui portent
 * chacun sur quelque chose que l etape possede vraiment.
 *
 * Aucune etape ne porte d echeance — la colonne existe, elle est vide
 * sur les soixante-cinq. « Avancement » reste donc le defaut : finir ce
 * qui est presque fini avant d ouvrir un chantier de plus.
 */
export type TriFront = "progression" | "difficulty" | "name";
export const TRIS_FRONT: TriFront[] = ["progression", "difficulty", "name"];
export const estTriDeFront = (t: string): t is TriFront =>
  (TRIS_FRONT as string[]).includes(t);

const RANG_PALIER: Record<string, number> = {
  easy: 0, medium: 1, hard: 2, extreme: 3, impossible: 4, custom: 5,
};

export function classerLeFront(
  etapes: Etape[],
  options: { etat: EtatFront; brigadeSeule: boolean; tri?: TriFront; sens?: "asc" | "desc" },
): Etape[] {
  let retenues = etapes;
  if (options.brigadeSeule) retenues = retenues.filter((e) => e.brigade);

  if (options.etat === "afaire") retenues = retenues.filter((e) => !e.faite);
  else if (options.etat === "faites") retenues = retenues.filter((e) => e.faite);

  /* Chaque comparateur est ecrit dans le sens croissant ; le sens
     descendant l inverse. Le defaut de la page etant « decroissant »,
     « avancement » place donc en tete ce qui est le plus pres du but. */
  const tri = options.tri ?? "progression";
  const croissant = (a: Etape, b: Etape) => {
    if (tri === "name") return a.titre.localeCompare(b.titre, undefined, { numeric: true });
    if (tri === "difficulty") {
      return (
        (RANG_PALIER[a.difficulte] ?? 9) - (RANG_PALIER[b.difficulte] ?? 9) ||
        a.avancement - b.avancement ||
        a.rang - b.rang
      );
    }
    return a.avancement - b.avancement || b.rang - a.rang;
  };

  const signe = options.sens === "asc" ? 1 : -1;
  return [...retenues].sort((a, b) => signe * croissant(a, b));
}
