/* DEPLACER UN ARTICLE D UNE LISTE A L AUTRE.
 *
 * Les listes existaient, la mutation qui range un article existait —
 * « useRangerDansListe » — et rien ne l appelait. On pouvait creer des
 * listes et n avait aucun moyen d y mettre quoi que ce soit.
 *
 * ON DEPLACE ENTRE LISTES, ON NE REORDONNE PAS DEDANS. Le tri manuel
 * par « sort_order » a ete retire de ce domaine ; le rendre par la
 * porte du glissement le ferait revenir sans que personne l ait
 * decide. L ordre d une liste vient de son tri, pas de la main.
 *
 * UN ARTICLE DU PACTE NE BOUGE PAS. Il est finance par un objectif —
 * « source_goal_cost_id » le dit — et la table refuse de lui donner
 * une liste. Un geste que la base rejettera ne doit pas s offrir : la
 * carte ne prend pas le curseur de glissement, et aucune liste ne
 * l accepte. Le decouvrir apres coup, par un message d erreur, serait
 * la meme panne racontee plus tard.
 *
 * Ces regles sont ici, hors de tout composant, parce qu elles se
 * trompent silencieusement : un article qui refuse de bouger
 * ressemble a un article qu on a mal attrape, et un deplacement vers
 * la liste ou l on est deja ressemble a un deplacement reussi.
 */

/** Ce qu il faut d un article pour decider s il bouge. */
export interface ArticleRangeable {
  id: string;
  /** Non nul : l article vient d un objectif, il appartient au pacte. */
  source_goal_cost_id?: string | null;
  list_id?: string | null;
}

/** Le nom de la vue « tout », qui est aussi la sortie de toute liste. */
export const HORS_LISTE = "tout";
/** La vue du pacte : ni source ni destination d un rangement. */
export const VUE_PACTE = "pacte";

/**
 * L article peut-il etre saisi ?
 *
 * Le pacte, non. C est la seule condition — un article libre se
 * deplace, qu il soit deja range ou non.
 */
export const estDeplacable = (a: ArticleRangeable): boolean => !a.source_goal_cost_id;

/**
 * La cible designee est-elle une destination valable pour cet article ?
 *
 * Quatre refus, et chacun correspond a un geste qu on fait vraiment :
 * lacher un article du pacte, lacher sur la vue du pacte, lacher a
 * cote (aucune cible), et lacher sur la liste d ou l on vient.
 */
export function accepteLeDepot(a: ArticleRangeable, cible: string | null): boolean {
  if (!estDeplacable(a)) return false;
  if (cible === null || cible === VUE_PACTE) return false;
  return listeDesignee(cible) !== (a.list_id ?? null);
}

/**
 * La liste que designe une cible : `null` pour « tout », qui SORT
 * l article de sa liste au lieu de l y garder.
 *
 * C est ce qui rend le geste reversible sans menu : on range en
 * lachant sur une liste, on desarchive en lachant sur « Global ».
 */
export const listeDesignee = (cible: string): string | null => (cible === HORS_LISTE ? null : cible);

/**
 * L etat qu on affiche AVANT que la base ait repondu.
 *
 * Rendre une nouvelle liste plutot que modifier celle recue : le
 * cache de React Query est partage, et le corriger sur place ferait
 * mentir toute vue qui le lit deja.
 */
export function apresLeDepot<T extends ArticleRangeable>(
  articles: readonly T[], itemId: string, listId: string | null,
): T[] {
  return articles.map((a) => (a.id === itemId ? { ...a, list_id: listId } : a));
}

/**
 * De combien d articles cette liste heritera-t-elle ?
 *
 * Sert au compte des onglets pendant le vol : sans lui, l onglet
 * garde son ancien chiffre jusqu au retour du serveur, et le
 * deplacement parait n avoir rien fait.
 */
export function compterDansLaListe(
  articles: readonly ArticleRangeable[], listId: string | null,
): number {
  return articles.filter((a) => (a.list_id ?? null) === listId).length;
}
