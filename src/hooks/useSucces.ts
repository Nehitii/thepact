import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* LES SUCCES.
 *
 * Ils etaient juges sur achievement_tracking — quarante-cinq compteurs
 * incrementes par le code au moment de l action. Un chemin qui oublie
 * d incrementer, une suppression qui ne decremente pas, et le compteur
 * s ecarte. Mesure sur un compte reel : todos_created a zero pour
 * soixante-sept taches, guilds_joined a zero pour une guilde fondee,
 * pomodoro_sessions a vingt-neuf pour une table vide.
 *
 * Ils derivaient DANS LES DEUX SENS : des succes gagnes ne se
 * declenchaient pas, d autres s ouvraient sans raison. Vingt succes
 * merites n avaient jamais ete accordes.
 *
 * La base les juge maintenant sur les tables sources, et rend
 * l avancement de chacun — pas seulement l acquis. Un succes
 * verrouille sans jauge ne dit pas s il est a portee ou hors
 * d atteinte, et c est pourtant la seule chose qui donne envie. */

export interface Succes {
  cle: string;
  nom: string;
  categorie: string;
  rarete: string;
  description: string | null;
  saveur: string | null;
  icone: string | null;
  cache: boolean;
  points: number;
  bonds: number;
  mesure: string | null;
  seuil: number | null;
  valeur: number | null;
  obtenu: boolean;
  obtenu_le: string | null;
  avancement: number;
}

export interface Coffre {
  categorie: string;
  total: number;
  obtenus: number;
  points: number;
  /* Une categorie entierement franchie vaut un trophee. C est ce qui
     transforme une liste de cent cases a cocher en une collection. */
  complet: boolean;
}

/* L ordre des raretes, du plus commun au plus rare. La base les rend
   en desordre alphabetique, ce qui ferait passer « common » avant
   « rare » mais aussi « epic » avant « legendary ». */
export const RARETES = ["common", "uncommon", "rare", "epic", "mythic", "legendary"] as const;
export type Rarete = (typeof RARETES)[number];

export function rangDeRarete(r: string): number {
  const i = RARETES.indexOf(r as Rarete);
  return i < 0 ? 0 : i;
}

export function useSucces(userId: string | undefined) {
  return useQuery({
    queryKey: ["succes", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Succes[]> => {
      const { data, error } = await supabase.rpc("succes_du_membre", { p_user_id: userId! });
      if (error) throw error;
      return (data || []).map((s) => ({
        ...s,
        points: s.points ?? 0,
        bonds: s.bonds ?? 0,
        avancement: Number(s.avancement ?? 0),
        seuil: s.seuil === null ? null : Number(s.seuil),
        valeur: s.valeur === null ? null : Number(s.valeur),
      })) as Succes[];
    },
  });
}

/** Les coffres : une ligne par categorie, et le trophee qui va avec. */
export function useCoffres(succes: Succes[]): Coffre[] {
  return useMemo(() => {
    const par = new Map<string, Coffre>();
    for (const s of succes) {
      const c = par.get(s.categorie) ?? {
        categorie: s.categorie, total: 0, obtenus: 0, points: 0, complet: false,
      };
      c.total++;
      if (s.obtenu) { c.obtenus++; c.points += s.points; }
      par.set(s.categorie, c);
    }
    return [...par.values()]
      .map((c) => ({ ...c, complet: c.total > 0 && c.obtenus === c.total }))
      /* Les coffres finis d abord — ce sont les trophees. Puis les plus
         avances, parce que ce sont les prochains. */
      .sort((a, b) =>
        Number(b.complet) - Number(a.complet)
        || b.obtenus / b.total - a.obtenus / a.total
        || b.total - a.total);
  }, [succes]);
}

/* MARQUER COMME VU.
 *
 * Vingt succes viennent d etre accordes d un coup par le rattrapage :
 * sans ce drapeau, la page les annoncerait comme neufs a chaque
 * visite, indefiniment. */
export function useMarquerVus(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cles: string[]) => {
      if (!userId || !cles.length) return;
      const { error } = await supabase
        .from("user_achievements")
        .update({ seen: true })
        .eq("user_id", userId)
        .in("achievement_key", cles);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["succes-neufs", userId] }),
  });
}

/** Ceux qui n ont jamais ete montres. */
export function useNeufs(userId: string | undefined) {
  return useQuery({
    queryKey: ["succes-neufs", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_key")
        .eq("user_id", userId!)
        .eq("seen", false);
      if (error) throw error;
      return new Set((data || []).map((r) => r.achievement_key));
    },
  });
}
