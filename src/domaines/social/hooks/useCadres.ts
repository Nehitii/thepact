import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { nombre } from "@/socle/outils/nombre";

/* LES CADRES D AVATAR.
 *
 * L application entretient dix-sept cadres cosmetiques — une
 * decoration posee sur l avatar, avec sa bordure et sa lueur — que la
 * boutique vend, que la salle d essayage montre et que le profil
 * arbore. Community les ignorait : ses pastilles etaient nues, ici
 * comme dans le classement.
 *
 * La base expose meme deux fonctions faites pour ca,
 * get_community_profile(s), qui rendent avatar_frame et
 * active_frame_id. On ne les utilise pas : elles rendent aussi les
 * bannieres, les titres et les badges, dont le fil n a que faire, et
 * la colonne avatar_frame est un vestige — elle vaut « default » ou
 * « void » chez les quatre profils, tandis que active_frame_id porte
 * le vrai lien.
 *
 * Deux requetes, et non une jointure : aucune cle etrangere ne relie
 * profiles.active_frame_id a cosmetic_frames, PostgREST ne peut donc
 * pas imbriquer les deux. On demande les profils, puis les seuls
 * cadres reellement portes.
 *
 * Les mesures du cadre sont stockees en texte (« 1.15 ») : elles sont
 * converties ici, une fois, plutot qu a chaque rendu. */

export interface Cadre {
  image: string | null;
  bordure: string | null;
  lueur: string | null;
  montrerBordure: boolean;
  echelle: number;
  decalageX: number;
  decalageY: number;
}


export function useCadres(identifiants: (string | null | undefined)[]) {
  /* La cle est triee et dedoublonnee : deux rendus qui voient les
     memes membres dans un ordre different partagent le cache. */
  const cle = [...new Set(identifiants.filter((i): i is string => !!i))].sort();

  return useQuery({
    queryKey: ["cadres-avatar", cle.join(",")],
    enabled: cle.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const parMembre = new Map<string, Cadre>();

      const { data: profils, error } = await supabase
        .from("profiles")
        .select("id, active_frame_id")
        .in("id", cle);
      if (error) throw error;

      const idsCadres = [...new Set(
        (profils || []).map((p) => p.active_frame_id).filter((i): i is string => !!i),
      )];
      if (idsCadres.length === 0) return parMembre;

      const { data: cadres } = await supabase
        .from("cosmetic_frames")
        .select("id, preview_url, border_color, glow_color, avatar_border_color, show_border, frame_scale, frame_offset_x, frame_offset_y")
        .in("id", idsCadres);

      const parId = new Map((cadres || []).map((c) => [c.id, c]));

      for (const p of profils || []) {
        const c = p.active_frame_id ? parId.get(p.active_frame_id) : null;
        if (!c) continue;
        parMembre.set(p.id, {
          image: c.preview_url,
          bordure: c.avatar_border_color || c.border_color,
          lueur: c.glow_color,
          montrerBordure: !!c.show_border,
          echelle: nombre(c.frame_scale, 1),
          decalageX: nombre(c.frame_offset_x, 0),
          decalageY: nombre(c.frame_offset_y, 0),
        });
      }

      return parMembre;
    },
  });
}
