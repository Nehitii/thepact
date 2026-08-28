import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";

/* LA CORDEE : un classement simule, calibre sur votre propre pacte.
 *
 * Un classement a un seul inscrit ne classe rien. Tant que personne
 * d autre n est la, la cordee donne des grimpeurs sur la meme voie —
 * et cette voie est LA VOTRE : leurs points sont une fraction du pacte
 * que vous avez ecrit, leurs rangs sont les dix que vous avez nommes.
 *
 * Le premier est a 90 % du pacte complet : a portee, pas au sommet.
 * Les autres descendent sur une courbe creuse, dense au milieu, pour
 * qu il y ait toujours quelqu un juste devant.
 *
 * ILS NE BOUGENT PAS, et c est le coeur du dispositif : des rivaux qui
 * progresseraient en meme temps que vous ne se rattraperaient jamais.
 * Ici la distance ne se reduit que d une facon.
 *
 * Rien n est enregistre : aucun compte, aucune ligne. Tout est calcule
 * a la lecture depuis le pacte, ce qui rend la cordee incapable de se
 * desynchroniser de ce qu elle mesure. */

export interface Grimpeur {
  place: number;
  nom: string;
  devise: string | null;
  xp: number;
  objectifs: number;
  etapes: number;
  serie: number;
  rang: string | null;
  couleur: string | null;
  vu_il_y_a_h: number;
}

export function useCordee(userId: string | undefined) {
  return useQuery({
    queryKey: ["cordee", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Grimpeur[]> => {
      const { data, error } = await supabase.rpc("cordee", { p_user_id: userId! });
      if (error) throw error;
      return (data || []) as Grimpeur[];
    },
  });
}
