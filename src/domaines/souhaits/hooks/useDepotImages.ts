/**
 * SIGNER LES IMAGES DEPOSEES, TOUTES A LA FOIS.
 *
 * Le depot est prive : un chemin ne s affiche pas, il faut d abord
 * en obtenir une adresse signee. Signer image par image ferait
 * autant d allers-retours que de vignettes ; createSignedUrls en
 * demande une seule pour toute la page.
 *
 * La duree est courte — une heure — parce que la signature ne vit
 * que le temps de la visite. C est la difference avec une signature
 * d un an posee en base : ici rien ne perime, on resigne au prochain
 * chargement.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { DEPOT_WISHLIST } from "@/domaines/souhaits/logique/wishlistDepot";

const UNE_HEURE = 60 * 60;

export function useDepotImages(userId: string | undefined, chemins: string[]) {
  /* La cle porte les chemins tries : deux rendus avec les memes
     images partagent le meme cache, quel que soit l ordre. */
  const cle = [...new Set(chemins)].sort().join("|");

  return useQuery({
    queryKey: ["depot-images", userId, cle],
    enabled: !!userId && chemins.length > 0,
    /* On resigne bien avant l expiration, jamais apres. */
    staleTime: (UNE_HEURE - 300) * 1000,
    queryFn: async () => {
      const liste = [...new Set(chemins)];
      const { data, error } = await supabase.storage
        .from(DEPOT_WISHLIST)
        .createSignedUrls(liste, UNE_HEURE);

      if (error) throw error;

      const parChemin = new Map<string, string>();
      for (const entree of data ?? []) {
        /* Une entree peut porter son propre echec — un fichier
           efface, par exemple. On la passe sans faire tomber les
           autres. */
        if (entree.signedUrl && entree.path) parChemin.set(entree.path, entree.signedUrl);
      }
      return parChemin;
    },
  });
}
