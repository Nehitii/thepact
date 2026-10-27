import { nombre } from "@/socle/outils/nombre";
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

/* ═══════════════════════════════════════════════════════════════
   LIRE UN PRIX DEJA ENREGISTRE — SIX ECRITURES POUR UNE COLONNE.

   `wishlist_items.estimated_cost` est un `numeric` NON NUL. Le domaine
   le relisait de six facons differentes :

     Number(x || 0)        l archive, la fiche, le poste, le registre,
                           et `montantDeLArticle`
     Number(x ?? 0)        les deux apercus de doublon
     Number(x)             le tri par prix du registre — SANS repli
     Number(x) || 0        les deux tris de l inventaire
     nombre(x)             une fonction locale a l inventaire, qui est
                           exactement `Number(x) || 0`
     String(x ?? 0)        la fiche, pour amorcer le champ de saisie

   ELLES NE DIVERGENT QUE SUR CE QUE LA BASE NE PRODUIT PAS : une
   valeur illisible. `Number(x || 0)` rend alors NaN — NaN est truthy,
   il traverse le `||` — et UN SEUL NaN contamine toute une somme, qui
   s affiche « NaN € ». Le `Number(x)` nu du tri est pire : un
   comparateur qui rend NaN laisse l ordre a la discretion du moteur.

   MESURE LE 30/08/2026 : 83 lignes, aucune nulle (la colonne est NOT
   NULL), aucune a zero, aucune negative, de 7 a 4 199, total
   30 678,34 — et c est exactement ce que la page affiche. Les six
   ecritures s accordent donc sur la totalite des donnees reelles :
   les unifier ne change rien aujourd hui, et ferme le jour ou.

   `nombre` du socle plutot qu un `|| 0` : il garde le zero, refuse NaN
   et les infinis, et lit un nombre qui commence une chaine. */
export function prixEnregistre(valeur: number | string | null | undefined): number {
  return nombre(valeur, 0);
}

/* ═══════════════════════════════════════════════════════════════
   CE QUE LA FENETRE DE DOUBLON MONTRE DE L ARTICLE DEJA LA.

   Huit lignes, ecrites DEUX FOIS mot pour mot — a la creation et a
   l edition. Elles decident surtout des replis : le nom du doublon
   quand la ligne complete manque, « optionnel » quand le type manque,
   zero quand le prix manque.

   L ENTRANT, LUI, N EST PAS PARTAGE, et c est voulu : le formulaire de
   creation n a pas de champ notes — il passe donc `null` — la ou celui
   d edition transmet ce qui est ecrit. Les fondre masquerait cette
   difference au lieu de la dire. */
export interface ApercuDArticle extends ArticleAFusionner {
  /* LA FUSION TOLERE UN PRIX ABSENT, L APERCU NON : la fenetre montre
     toujours un montant, et « rien » ne s affiche pas. */
  estimatedCost: number;
  /** Pour l afficher seulement : la fusion ne s en sert pas. */
  goalName?: string | null;
}

export function apercuDeLExistant(
  complet: PactWishlistItem | undefined,
  doublon: { name: string },
): ApercuDArticle {
  return {
    name: complet?.name ?? doublon.name,
    goalId: complet?.goal_id ?? null,
    goalName: complet?.goal?.name ?? null,
    category: complet?.category ?? null,
    estimatedCost: prixEnregistre(complet?.estimated_cost),
    itemType: complet?.item_type ?? "optional",
    notes: complet?.notes ?? null,
  };
}
