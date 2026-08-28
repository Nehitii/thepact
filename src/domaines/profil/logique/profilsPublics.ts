import { supabase } from "@/integrations/supabase/client";

/**
 * LE PROFIL D AUTRUI NE SE LIT PAS DANS `profiles`.
 *
 * La table n a qu une politique SELECT : `auth.uid() = id`. Un client
 * ne peut donc lire que sa propre ligne — verifie en direct : deux
 * profils demandes, un seul rendu.
 *
 * Six ecrans lisaient pourtant `profiles` pour autrui : le fil de la
 * communaute, ses reponses, les reels, le chat de guilde, les
 * utilisateurs bloques. Ils recevaient un tableau vide, retombaient
 * sur `?? true` puis sur « Anonyme » — donc personne n avait de nom, et
 * couper « profil decouvrable » ne changeait rien puisque l absence de
 * donnee produisait deja le meme resultat.
 *
 * `profils_publics` rend la projection publique et applique la regle
 * cote serveur : quand un profil n est pas visible, son nom et son
 * avatar ne partent pas. Le client ne peut pas divulguer ce qu il ne
 * recoit jamais.
 */

export interface ProfilPublic {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  community_profile_discoverable: boolean;
  share_goals_progress: boolean;
  /* Nul quand le profil n est pas visible, ou que son porteur a coupe
     « Afficher le statut d activite ». */
  last_seen_at: string | null;
}

/* Les noms de la fonction sont francais ; on les remet dans ceux des
   colonnes pour que les appelants n aient pas a changer de vocabulaire
   en cours de route. */
interface LigneRpc {
  id: string;
  nom: string | null;
  avatar: string | null;
  decouvrable: boolean;
  partage_objectifs: boolean;
  vu_a: string | null;
}

export async function chargerProfilsPublics(ids: string[]): Promise<Map<string, ProfilPublic>> {
  const uniques = [...new Set(ids.filter(Boolean))];
  if (!uniques.length) return new Map();

  const { data, error } = await supabase.rpc("profils_publics", { p_ids: uniques });
  if (error) throw error;

  return new Map(
    ((data ?? []) as unknown as LigneRpc[]).map((p) => [
      p.id,
      {
        id: p.id,
        display_name: p.nom,
        avatar_url: p.avatar,
        community_profile_discoverable: p.decouvrable,
        share_goals_progress: p.partage_objectifs,
        last_seen_at: p.vu_a,
      },
    ]),
  );
}
