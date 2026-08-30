import type { PactWishlistItem, PactWishlistItemType } from "@/domaines/souhaits/types";

/* LIRE UN PRIX TAPE A LA MAIN, ET FUSIONNER DEUX ARTICLES.
 *
 * Le meme champ de prix etait lu a TROIS endroits, avec DEUX regles
 * differentes — voir les deux fonctions ci-dessous, qui gardent cette
 * difference plutot que de la masquer.
 */

/* LA VIRGULE EST UN SEPARATEUR DECIMAL ICI. Un clavier francais en
   produit une, et « 12,50 » vaut douze euros cinquante, pas NaN.
 *
 * DEUX PRECAUTIONS ONT ETE RETIREES parce qu elles ne pouvaient rien
 * faire, et le balayage de mutations l a montre en les laissant
 * survivre : un « .trim() », alors que Number() coupe deja les blancs
 * lui-meme, et un repli « || "0" » sur le champ vide, alors que
 * Number("") vaut deja zero. Les deux tests d equivalence plus bas
 * fixent ces deux faits de JavaScript, pour que le retrait reste
 * justifie et qu on ne les rajoute pas « au cas ou ».
 *
 * IL EN RESTE UNE, INOBSERVABLE ET GARDEE : « replace » ne traduit
 * que la PREMIERE virgule, la ou « replaceAll » les traduirait
 * toutes. Aucune saisie ne les distingue — avec deux virgules ou
 * plus, « replace » laisse une virgule et « replaceAll » laisse deux
 * points, et Number rend NaN dans les deux cas. */
export function nombreDuPrix(saisie: string): number {
  return Number(saisie.replace(",", "."));
}

/* DEUX REGLES POUR LE MEME CHAMP, ET ELLES NE DISENT PAS LA MEME
 * CHOSE. C est constate ici, pas arbitre.
 *
 * A LA CORRECTION EN LIGNE — le crayon sur une ligne existante — un
 * prix illisible ou negatif est REFUSE : rien n est ecrit, l ancien
 * montant reste. On ne remplace pas un prix connu par une invention.
 *
 * A LA CREATION ET A L EDITION — les deux formulaires — le meme prix
 * illisible devient ZERO, en silence. Taper « 12,50 € » avec le
 * symbole enregistre donc un article a zero euro, et le bordereau
 * compte un article de plus pour pas un centime de plus.
 *
 * Un prix NEGATIF diverge dans l autre sens : la correction le
 * refuse, les formulaires l acceptent tel quel.
 */

/* CORRECTION EN LIGNE : null veut dire « ne rien ecrire ».
 *
 * ATTENTION AU CHAMP VIDE : Number("") vaut ZERO en JavaScript, et
 * zero est fini et positif — le garde le laisse donc passer. Effacer
 * le prix d un article a la main l ecrit a « 0 € », c est-a-dire a
 * « gratuit », et non a « inconnu ». Constate, non corrige. */
export function prixCorrige(saisie: string): number | null {
  const n = nombreDuPrix(saisie);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Formulaires : un prix illisible devient zero. */
export function prixDuFormulaire(saisie: string): number {
  const n = nombreDuPrix(saisie);
  return Number.isFinite(n) ? n : 0;
}

/* FUSIONNER DEUX ARTICLES EN DOUBLE.
 *
 * Les couts s ADDITIONNENT : deux fois le meme article, c est deux
 * fois la depense. Les autres champs se resolvent par preference —
 * celui qu on garde d abord, l entrant en repli.
 */
export interface ArticleAFusionner {
  name: string;
  goalId?: string | null;
  category?: string | null;
  estimatedCost?: number;
  itemType: PactWishlistItemType;
  notes?: string | null;
}

export function fusionDeDeuxArticles(
  garde: Pick<PactWishlistItem, "name" | "goal_id" | "category" | "estimated_cost" | "item_type" | "notes"> | undefined,
  entrant: ArticleAFusionner,
) {
  return {
    name: garde?.name ?? entrant.name,
    goal_id: garde?.goal_id ?? entrant.goalId ?? null,
    /* Deux fois le meme article, c est deux fois la depense. */
    estimated_cost: Number(garde?.estimated_cost ?? 0) + Number(entrant.estimatedCost ?? 0),
    /* « REQUIS » L EMPORTE : si l un des deux est indispensable, le
       fusionne l est. Retomber sur « optionnel » ferait disparaitre
       une obligation. */
    item_type: (garde?.item_type === "required" || entrant.itemType === "required"
      ? "required"
      : "optional") as PactWishlistItemType,
    /* La categorie de celui qu on garde, sinon celle de l entrant. Des
       blancs ne comptent pas pour une categorie. */
    category: (garde?.category ?? "").trim() || (entrant.category ?? "").trim() || null,
    /* LES DEUX NOTES SONT GARDEES, l une sous l autre : perdre ce qui
       a ete ecrit sur un article est irrattrapable. */
    notes: [garde?.notes?.trim(), entrant.notes?.trim()].filter(Boolean).join("\n\n") || null,
  };
}
