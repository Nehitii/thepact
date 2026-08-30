/* QUAND UN SOUHAIT DEVIENT UNE DEPENSE.
 *
 * Cocher « acquis » sur un article ecrit une ligne dans le mois en
 * cours. Trois refus silencieux gardent cette porte, et aucun ne se
 * voyait : ils etaient poses en trois `return` au milieu d un
 * gestionnaire de clic.
 *
 * Un montant faux ici n echoue pas : il fait un mois qui ne tombe pas
 * juste, et personne ne saura d ou venaient les euros en trop.
 */
import { format, startOfMonth } from "date-fns";

export interface ArticleAcquis {
  id: string;
  name: string;
  estimated_cost?: number | string | null;
  /* Rempli quand l article vient du cout d un objectif. */
  source_goal_cost_id?: string | null;
}

/* ── LE MOIS OU LA DEPENSE TOMBE ─────────────────────────────── */

export interface MoisDAchat {
  /** Le premier du mois, pour l affichage comme pour la cle. */
  debut: Date;
  /** La cle que porte la table des pointages. */
  cle: string;
}

/* UNE SEULE LECTURE D HORLOGE POUR LES DEUX. Le code d avant appelait
   `new Date()` deux fois de suite — une pour la cle, une pour le
   libelle. Deux lectures a une milliseconde d intervalle ne tombent
   jamais de part et d autre d un mois en pratique ; il n empeche qu il
   y avait deux sources pour un seul instant. */
export function moisDeLAchat(maintenant: Date): MoisDAchat {
  const debut = startOfMonth(maintenant);
  return { debut, cle: format(debut, "yyyy-MM-dd") };
}

/* ── CE QUE LA LIGNE PORTE ───────────────────────────────────── */

/** La contrainte de la table refuse un nom vide et coupe a 120. */
export const NOM_PAR_DEFAUT = "Achat";
export const LONGUEUR_DU_NOM = 120;

/* L ORDRE COMPTE : on coupe les blancs, PUIS on retombe sur le defaut,
   PUIS on tronque. Tronquer avant de trimer laisserait un nom finissant
   par une espace ; retomber sur le defaut avant de trimer laisserait
   passer un nom fait de blancs. */
export function nomDeLaDepense(nom: string): string {
  return (nom.trim() || NOM_PAR_DEFAUT).slice(0, LONGUEUR_DU_NOM);
}

/* ═══════════════════════════════════════════════════════════════
   TROIS REFUS, ET LE TROISIEME N EST PAS ECRIT COMME ON L ECRIRAIT.

   1. Pas d article : rien a faire.

   2. UN ARTICLE VENU DU COUT D UN OBJECTIF NE DEVIENT PAS UNE
      DEPENSE DU MOIS. Il est deja compte dans le pacte ; l ecrire une
      seconde fois le compterait deux fois.

   3. `!(montant > 0)` — ET NON `montant <= 0`. Les deux disent la meme
      chose pour tout nombre, mais PAS pour NaN : `NaN <= 0` est faux,
      donc la seconde forme laisserait passer un montant illisible
      jusque dans la ligne du mois. La negation d une comparaison est
      ce qui rattrape NaN, et c est la seule raison de l ecrire ainsi.
   ═══════════════════════════════════════════════════════════════ */
export type RefusDAcquisition = "sans-article" | "compte-dans-le-pacte" | "montant-nul";

export function montantDeLArticle(article: Pick<ArticleAcquis, "estimated_cost">): number {
  return Number(article.estimated_cost || 0);
}

export interface LigneDeDepense {
  ligne_id: string;
  genre: "expense";
  nom: string;
  montant_prevu: number;
  montant_reel: number;
  pointe: true;
}

/* LE PREVU ET LE REEL SONT LE MEME NOMBRE. Un souhait n a qu une
   estimation : la porter des deux cotes evite d inventer un ecart que
   personne n a constate. */
export function depenseDUnAchat(
  article: ArticleAcquis | null | undefined,
): { ligne: LigneDeDepense } | { refus: RefusDAcquisition } {
  if (!article) return { refus: "sans-article" };
  if (article.source_goal_cost_id) return { refus: "compte-dans-le-pacte" };
  const montant = montantDeLArticle(article);
  if (!(montant > 0)) return { refus: "montant-nul" };
  return {
    ligne: {
      /* L IDENTIFIANT DE L ARTICLE SERT DE CLE : repointer corrige au
         lieu d empiler, et decocher retrouve la bonne ligne. */
      ligne_id: article.id,
      genre: "expense",
      nom: nomDeLaDepense(article.name),
      montant_prevu: montant,
      montant_reel: montant,
      pointe: true,
    },
  };
}
