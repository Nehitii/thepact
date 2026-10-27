/* LES DEUX INTERDITS, ET CE QUI RESTE PERMIS.
 *
 * Le geste est simple a decrire et facile a rendre faux : un article
 * du pacte qu on arrive a deplacer casse le financement d un objectif
 * sans rien dire, et un depot sur sa propre liste ecrit une mutation
 * pour rien.
 */
import { describe, expect, it } from "vitest";
import {
  HORS_LISTE, VUE_PACTE, accepteLeDepot, apresLeDepot, compterDansLaListe,
  estDeplacable, listeDesignee, type ArticleRangeable,
} from "./rangementEntreListes";

const libre = (id: string, list: string | null = null): ArticleRangeable =>
  ({ id, list_id: list, source_goal_cost_id: null });
const duPacte = (id: string, list: string | null = null): ArticleRangeable =>
  ({ id, list_id: list, source_goal_cost_id: "piece-" + id });

describe("estDeplacable : un article du pacte ne bouge pas", () => {
  it("l article libre se saisit", () => {
    expect(estDeplacable(libre("a"))).toBe(true);
    expect(estDeplacable(libre("a", "envies"))).toBe(true);
    expect(estDeplacable({ id: "a" })).toBe(true);
  });

  it("l article venu d un objectif ne se saisit pas", () => {
    /* La table le refuse : « source_goal_cost_id » non nul interdit la
       liste. Offrir le geste ne ferait que reporter le refus. */
    expect(estDeplacable(duPacte("a"))).toBe(false);
    expect(estDeplacable(duPacte("a", "envies"))).toBe(false);
  });
});

describe("accepteLeDepot", () => {
  it("range un article libre dans une autre liste", () => {
    expect(accepteLeDepot(libre("a"), "envies")).toBe(true);
    expect(accepteLeDepot(libre("a", "envies"), "cadeaux")).toBe(true);
  });

  it("REFUSE l article du pacte, quelle que soit la cible", () => {
    for (const cible of ["envies", HORS_LISTE, VUE_PACTE]) {
      expect(accepteLeDepot(duPacte("a"), cible)).toBe(false);
    }
  });

  it("REFUSE la vue du pacte comme destination", () => {
    /* On n entre pas dans le pacte en lachant une carte : un article
       y entre en etant reclame par un objectif, pas par un geste. */
    expect(accepteLeDepot(libre("a"), VUE_PACTE)).toBe(false);
    expect(accepteLeDepot(libre("a", "envies"), VUE_PACTE)).toBe(false);
  });

  it("REFUSE un lacher a cote", () => {
    expect(accepteLeDepot(libre("a", "envies"), null)).toBe(false);
  });

  it("REFUSE la liste d ou l on vient — c est un deplacement nul", () => {
    /* Lacher une carte la ou elle etait ecrirait une mutation, ferait
       clignoter les comptes et n aurait rien change. */
    expect(accepteLeDepot(libre("a", "envies"), "envies")).toBe(false);
    expect(accepteLeDepot(libre("a", null), HORS_LISTE)).toBe(false);
    expect(accepteLeDepot(libre("a"), HORS_LISTE)).toBe(false);
  });

  it("« Global » SORT de la liste, et c est un vrai deplacement", () => {
    /* C est ce qui rend le geste reversible sans menu. */
    expect(accepteLeDepot(libre("a", "envies"), HORS_LISTE)).toBe(true);
    expect(listeDesignee(HORS_LISTE)).toBeNull();
    expect(listeDesignee("envies")).toBe("envies");
  });
});

describe("apresLeDepot : ce qu on affiche avant la reponse", () => {
  const articles = [libre("a", "envies"), libre("b", null), duPacte("c")];

  it("ne change que l article vise", () => {
    const apres = apresLeDepot(articles, "a", "cadeaux");
    expect(apres.map((x) => x.list_id ?? null)).toEqual(["cadeaux", null, null]);
  });

  it("SORT l article quand la liste est nulle", () => {
    expect(apresLeDepot(articles, "a", null)[0].list_id).toBeNull();
  });

  it("NE MODIFIE PAS la liste recue — le cache est partage", () => {
    /* Corriger sur place ferait mentir toute vue qui lit deja ce
       tableau, et le retour arriere n aurait plus rien a restaurer. */
    const avant = JSON.stringify(articles);
    const apres = apresLeDepot(articles, "a", "cadeaux");
    expect(JSON.stringify(articles)).toBe(avant);
    expect(apres).not.toBe(articles);
    expect(apres[1]).toBe(articles[1]);
  });

  it("un identifiant inconnu ne touche a rien", () => {
    expect(apresLeDepot(articles, "zzz", "cadeaux")).toEqual(articles);
  });
});

describe("compterDansLaListe : les onglets pendant le vol", () => {
  const articles = [libre("a", "envies"), libre("b", "envies"), libre("c", null), duPacte("d")];

  it("compte par liste, et les sans-liste ensemble", () => {
    expect(compterDansLaListe(articles, "envies")).toBe(2);
    expect(compterDansLaListe(articles, null)).toBe(2);
    expect(compterDansLaListe(articles, "cadeaux")).toBe(0);
  });

  it("suit le deplacement optimiste", () => {
    /* Sans cela, l onglet garde son ancien chiffre jusqu au retour du
       serveur et le deplacement parait n avoir rien fait. */
    const apres = apresLeDepot(articles, "a", "cadeaux");
    expect(compterDansLaListe(apres, "envies")).toBe(1);
    expect(compterDansLaListe(apres, "cadeaux")).toBe(1);
  });
});
