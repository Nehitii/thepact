/**
 * CE QU'UN ÉCRAN DE BOUTIQUE LIT D'UN ARTICLE, QUEL QUE SOIT SON RAYON.
 *
 * Les cinq rayons n'ont pas la même forme : un cadre porte `preview_url`,
 * une bannière un dégradé, un titre son `title_text`. Mais tout ce que la
 * confirmation d'achat en lit tient ici — et c'est la seule chose que les
 * signatures `onPurchase` / `onPreview` avaient besoin de dire.
 *
 * Elles disaient `item: any`, ce qui n'était pas « un article de n'importe
 * quel rayon » mais « ne vérifie plus rien » : `item.pirce` serait passé
 * sans un mot, jusqu'à un prix `undefined` dans la boîte de confirmation.
 */
export interface ArticleAchetable {
  id: string;
  name: string;
  price: number;
  rarity: string;
  /** Le rayon, quand l'article le porte lui-même (liste d'envies). */
  type?: string;
}
