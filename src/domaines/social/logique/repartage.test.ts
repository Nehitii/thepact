/* LES TROIS REFUS, ET LE CAS QUI SE CONFOND.
 *
 * Les refus sont tenus en base ; ces tests fixent ce que l ECRAN en
 * fait, parce qu offrir un geste qui finira en message d erreur est
 * une panne a part entiere.
 *
 * Et surtout : une originale supprimee laisse une reference NULLE. Si
 * la marque n etait pas lue, ce repartage se lirait comme une
 * publication ordinaire — une carte amputee de sa raison d etre, sans
 * que rien ne casse.
 */
import { describe, expect, it } from "vitest";
import {
  estUnRepartage, etatDeLaCitation, peutEtreRepartagee, pourquoiPasRepartageable,
  type PublicationCitable,
} from "./repartage";

const MOI = "moi";
const AUTRE = "autre";

const publication = (p: Partial<PublicationCitable> = {}): PublicationCitable =>
  ({ id: "p1", user_id: AUTRE, is_public: true, shared_post_id: null, shared_post_gone: false, ...p });

describe("etatDeLaCitation : les trois etats se distinguent", () => {
  it("une publication ordinaire ne cite rien", () => {
    expect(etatDeLaCitation(publication())).toBe("aucune");
    expect(etatDeLaCitation({ id: "p", user_id: AUTRE })).toBe("aucune");
  });

  it("un repartage cite quelque chose", () => {
    expect(etatDeLaCitation(publication({ shared_post_id: "source" }))).toBe("citee");
  });

  it("UNE ORIGINALE SUPPRIMEE NE SE CONFOND PAS AVEC RIEN DU TOUT", () => {
    /* C est le cas qui produit le bug si la marque n est pas lue : la
       reference est nulle dans les deux cas. */
    const orphelin = publication({ shared_post_id: null, shared_post_gone: true });
    expect(etatDeLaCitation(orphelin)).toBe("disparue");
    expect(etatDeLaCitation(publication())).toBe("aucune");
  });

  it("la marque l emporte sur une reference qui trainerait", () => {
    /* La base ne permet pas les deux a la fois — « chk_marque_orpheline
       _coherente » l interdit — mais un cache un peu vieux le peut. */
    expect(etatDeLaCitation(publication({ shared_post_id: "source", shared_post_gone: true })))
      .toBe("citee");
  });
});

describe("estUnRepartage", () => {
  it("vrai que l originale soit la ou non", () => {
    expect(estUnRepartage(publication({ shared_post_id: "source" }))).toBe(true);
    expect(estUnRepartage(publication({ shared_post_gone: true }))).toBe(true);
  });

  it("faux pour une publication ordinaire", () => {
    expect(estUnRepartage(publication())).toBe(false);
  });
});

describe("peutEtreRepartagee : les trois refus", () => {
  it("celle d un autre, publique et originale : oui", () => {
    expect(peutEtreRepartagee(publication(), MOI)).toBe(true);
  });

  it("REFUSE un repartage — la citation ne s empile pas", () => {
    expect(peutEtreRepartagee(publication({ shared_post_id: "source" }), MOI)).toBe(false);
    /* Y compris quand l originale a disparu : c est toujours un
       repartage, et le citer citerait un vide. */
    expect(peutEtreRepartagee(publication({ shared_post_gone: true }), MOI)).toBe(false);
  });

  it("REFUSE une publication qui n est pas publique", () => {
    /* Ce qui n est pas public ne le devient pas parce qu un tiers l a
       repartage. */
    expect(peutEtreRepartagee(publication({ is_public: false }), MOI)).toBe(false);
  });

  it("REFUSE la sienne", () => {
    expect(peutEtreRepartagee(publication({ user_id: MOI }), MOI)).toBe(false);
  });

  it("REFUSE a qui n est pas connecte", () => {
    expect(peutEtreRepartagee(publication(), undefined)).toBe(false);
  });

  it("une publicite non renseignee ne bloque pas", () => {
    /* Le fil ne rend que du public : l absence du champ ne doit pas
       eteindre le bouton sur toutes les cartes. */
    expect(peutEtreRepartagee({ id: "p", user_id: AUTRE }, MOI)).toBe(true);
  });
});

describe("pourquoiPasRepartageable : dire, pas seulement griser", () => {
  it("nomme chaque refus", () => {
    expect(pourquoiPasRepartageable(publication(), undefined)).toBe("hors-ligne");
    expect(pourquoiPasRepartageable(publication({ shared_post_id: "s" }), MOI)).toBe("deja-un-repartage");
    expect(pourquoiPasRepartageable(publication({ is_public: false }), MOI)).toBe("non-publique");
    expect(pourquoiPasRepartageable(publication({ user_id: MOI }), MOI)).toBe("la-mienne");
  });

  it("se tait quand le geste est possible", () => {
    expect(pourquoiPasRepartageable(publication(), MOI)).toBeNull();
  });

  it("s accorde toujours avec « peutEtreRepartagee »", () => {
    /* Deux reponses a la meme question finissent par diverger si rien
       ne les tient ensemble. */
    const cas: [PublicationCitable, string | undefined][] = [
      [publication(), MOI],
      [publication(), undefined],
      [publication({ shared_post_id: "s" }), MOI],
      [publication({ shared_post_gone: true }), MOI],
      [publication({ is_public: false }), MOI],
      [publication({ user_id: MOI }), MOI],
      [{ id: "p", user_id: AUTRE }, MOI],
    ];
    for (const [p, moi] of cas) {
      expect(peutEtreRepartagee(p, moi)).toBe(pourquoiPasRepartageable(p, moi) === null);
    }
  });
});
