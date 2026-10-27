import { supabase } from "@/socle/supabase/client";
import { chargerProfilsPublics } from "@/domaines/profil";
import type { CommunityPost } from "@/domaines/social/types";

/**
 * LES PUBLICATIONS CITEES, EN UNE PASSE.
 *
 * Un repartage montre l originale. Aller la chercher carte par carte
 * ferait une requete par repartage — vingt cartes, vingt allers-
 * retours. On demande donc toutes celles que la page cite d un coup,
 * et leurs auteurs avec, comme le fil le fait deja pour les profils.
 *
 * ON NE PREND QUE CE QUE LA CARTE CITEE MONTRE. Pas de compteurs, pas
 * de reponses : LES REACTIONS ET LES REPONSES RESTENT SUR
 * L ORIGINALE, et la carte imbriquee n est pas interactive — elle
 * mene a l originale, elle ne la commente pas. Les ramener ferait
 * croire qu on peut agir dessus.
 *
 * UNE ORIGINALE SUPPRIMEE N EST PAS ICI. Sa reference a ete coupee et
 * « shared_post_gone » posee a sa place ; la carte lit la marque, pas
 * l absence — voir « logique/repartage.ts ». Sans cela, un repartage
 * orphelin se lirait comme une publication ordinaire.
 */
export async function chargerLesCitees(ids: string[]): Promise<Map<string, CommunityPost>> {
  const cites = new Map<string, CommunityPost>();
  if (ids.length === 0) return cites;

  const { data: sources } = await supabase
    .from("community_posts")
    .select("id, user_id, content, post_type, goal_name, image_url, created_at")
    .in("id", ids);
  if (!sources || sources.length === 0) return cites;

  const profils = await chargerProfilsPublics([...new Set(sources.map((s) => s.user_id))] as string[]);
  for (const src of sources) {
    cites.set(src.id, {
      ...src,
      post_type: src.post_type as CommunityPost["post_type"],
      profile: profils.get(src.user_id),
    } as CommunityPost);
  }
  return cites;
}
