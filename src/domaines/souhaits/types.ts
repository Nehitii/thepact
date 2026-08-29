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
