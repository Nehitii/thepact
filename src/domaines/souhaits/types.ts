/* CE QUE LA LISTE REGARDE, ET DANS QUEL ORDRE.
 *
 * ONZIEME FOIS LE MOTIF. Ces deux types etaient declares dans
 * `pages/Wishlist.tsx`, et le premier composant extrait de cette page
 * — la barre de recherche et de tri — ne pouvait donc pas typer son
 * setter autrement qu en `string`. Le compilateur l a refuse, et il
 * avait raison : un composant qui accepte n importe quelle chaine pour
 * un tri accepte une faute de frappe.
 *
 * `Vue` porte `(string & {})` a dessein : aux trois vues fixes
 * s ajoutent les listes de l utilisateur, dont les identifiants ne sont
 * pas connus a la compilation. L astuce garde l autocompletion des
 * trois sans fermer la porte aux autres.
 */
export type Vue = "tout" | "pacte" | (string & {});
export type Tri = "visuel" | "recent" | "cher" | "abordable";

/* Venues de « usePactWishlist.ts », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface PactWishlistItem {
  id: string;
  user_id: string;
  goal_id: string | null;
  /* La liste nommee a laquelle appartient l article. Nulle pour les
     articles rattaches a un objectif du pacte. La requete la
     ramenait deja par « select("*") » ; seul le type l ignorait. */
  list_id: string | null;
  name: string;
  category: string | null;
  estimated_cost: number;
  item_type: PactWishlistItemType;
  acquired: boolean;
  acquired_at: string | null;
  notes: string | null;
  url: string | null;
  image_url: string | null;
  source_type: string;
  source_goal_cost_id: string | null;
  priority: WishlistPriority;
  sort_order: number;
  created_at: string;
  updated_at: string;
  goal?: PactWishlistGoalLink | null;
}

/* Venues de « usePactWishlist.ts », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export type WishlistPriority = "low" | "med" | "high" | "critical";

export interface PactWishlistGoalLink {
  id: string;
  name: string;
  type: string;
  status: string;
}

/* Venues de « usePactWishlist.ts », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export type PactWishlistItemType = "required" | "optional";
