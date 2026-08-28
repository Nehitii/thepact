import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* LA CARTE DE PROFIL PUBLIC DE QUELQU UN D AUTRE.
 *
 * La carte existe depuis longtemps — banniere, avatar encadre, titre,
 * rang — mais uniquement POUR SOI, dans les reglages du profil public,
 * assemblee sur place a partir de six requetes et de l etat du
 * formulaire. Personne ne pouvait voir celle d un autre.
 *
 * Un survol doit repondre vite : tout arrive en un seul appel, et la
 * requete n est meme lancee qu au moment ou la carte est demandee. */

export interface Cadre {
  image: string | null;
  bordure: string | null;
  lueur: string | null;
  montrerBordure: boolean | null;
  echelle: number | string | null;
  decalageX: number | string | null;
  decalageY: number | string | null;
}

export interface Banniere {
  image: string | null;
  debut: string | null;
  fin: string | null;
  rarete: string | null;
}

export interface Titre {
  texte: string | null;
  couleur: string | null;
  lueur: string | null;
  /* La rarete decide du traitement : la carte ne pouvait pas
     distinguer un legendaire d un commun faute de la connaitre. */
  rarete: string | null;
}

export interface Rang {
  nom: string | null;
  seuil: number | null;
  couleur: string | null;
  lueur: string | null;
  logo: string | null;
}

export interface CarteProfil {
  trouve: boolean;
  /* Un profil non decouvrable reste invisible aux inconnus — mais pas
     a ses compagnons de guilde, qui partagent deja une liste de
     membres et un fil. La carte le dit plutot que de rendre un cadre
     vide, qu on prendrait pour une panne. */
  visible: boolean;
  nom: string | null;
  avatar: string | null;
  accent: string | null;
  phrase: string | null;
  xp: number;
  pacte: string | null;
  objectifs: number;
  cadre: Cadre | null;
  banniere: Banniere | null;
  titre: Titre | null;
  rang: Rang | null;
  rangSuivant: { nom: string | null; seuil: number | null } | null;
}

/** Les mesures d un cadre sont stockees en texte (« 1.15 »). */
export const nombre = (v: number | string | null | undefined, defaut: number): number => {
  const n = typeof v === "number" ? v : parseFloat(v ?? "");
  return Number.isFinite(n) ? n : defaut;
};

export function useCarteProfil(userId: string | undefined, actif: boolean) {
  return useQuery({
    queryKey: ["carte-profil", userId],
    /* Rien ne part tant que la carte n est pas reclamee : un survol qui
       ne s attarde pas ne coute rien. */
    enabled: !!userId && actif,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CarteProfil> => {
      const { data, error } = await supabase.rpc("carte_profil_public", { p_user_id: userId! });
      if (error) throw error;
      const r = (data ?? {}) as Partial<CarteProfil>;
      return {
        trouve: r.trouve === true,
        visible: r.visible === true,
        nom: r.nom ?? null,
        avatar: r.avatar ?? null,
        accent: r.accent ?? null,
        phrase: r.phrase ?? null,
        xp: typeof r.xp === "number" ? r.xp : 0,
        pacte: r.pacte ?? null,
        objectifs: typeof r.objectifs === "number" ? r.objectifs : 0,
        cadre: r.cadre ?? null,
        banniere: r.banniere ?? null,
        titre: r.titre ?? null,
        rang: r.rang ?? null,
        rangSuivant: r.rangSuivant ?? null,
      };
    },
  });
}
