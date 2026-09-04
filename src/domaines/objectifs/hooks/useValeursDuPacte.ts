import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";

/**
 * LES VALEURS DU PORTEUR, DANS LEUR ORDRE DE RANG.
 *
 * L ORDRE EST LA DONNEE, pas seulement la liste. C est lui qui place
 * les medaillons de la rosace : deux porteurs qui ont choisi les memes
 * valeurs dans un ordre different n ont pas le meme sceau, et ce sceau
 * les suit a vie. Un « order » oublie ici redessinerait le sceau a
 * chaque chargement selon l ordre ou la base a rendu les lignes.
 *
 * Elles n avaient aucun crochet de lecture : « useSceller » les
 * ecrivait, et personne ne les relisait. Le sceau du tableau de bord
 * est le premier a en avoir besoin.
 */
export function useValeursDuPacte(userId: string | undefined) {
  return useQuery({
    queryKey: ["valeurs-du-pacte", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("user_values")
        .select("label")
        .eq("user_id", userId!)
        .order("rank");
      if (error) throw error;
      return (data ?? []).map((v) => v.label);
    },
  });
}
