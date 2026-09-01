/* CE QUE LE TEMPS COMMANDE, ET CE QUE LE NOMBRE DE TOURS NE COMMANDE
   PLUS.
 *
 * Le defaut n etait pas visible dans le resultat : au bout de trente-
 * trois secondes, le solde d octobre etait juste. Il etait faux
 * PENDANT. Ces tests fixent donc la seule propriete qui manquait — a
 * une milliseconde donnee correspond une valeur donnee, quel que soit
 * le nombre d appels qui ont eu lieu avant.
 */
import { describe, expect, it } from "vitest";
import { DUREE_MS, avancement, estArrivee, valeurALInstant } from "./nombreAnime";

describe("avancement", () => {
  it("part de zero et finit a un", () => {
    expect(avancement(0)).toBe(0);
    expect(avancement(DUREE_MS)).toBe(1);
  });

  it("adoucit la fin : a mi-parcours, on a deja fait plus de la moitie", () => {
    const mi = avancement(DUREE_MS / 2);
    expect(mi).toBeGreaterThan(0.5);
    expect(mi).toBeLessThan(1);
  });

  it("ne sort jamais de l intervalle, meme si l horloge recule ou deborde", () => {
    /* « performance.now() » ne recule pas, mais un ecoule negatif peut
       naitre d une soustraction faite dans le mauvais sens. Le jour ou
       cela arrive, le nombre doit rester dans ses bornes plutot que de
       partir a l infini. */
    expect(avancement(-500)).toBe(0);
    expect(avancement(DUREE_MS * 40)).toBe(1);
  });

  it("une duree nulle est deja finie", () => {
    expect(avancement(0, 0)).toBe(1);
    expect(avancement(10, -5)).toBe(1);
  });
});

describe("valeurALInstant : le temps commande, pas le nombre de tours", () => {
  it("part du depart et arrive EXACTEMENT sur la cible", () => {
    expect(valeurALInstant(100, -11.7, 0)).toBe(100);
    expect(valeurALInstant(100, -11.7, DUREE_MS)).toBe(-11.7);
  });

  it("une arrivee depassee reste la cible exacte, pas une approximation", () => {
    /* LE DEFAUT QU ON NE VOIT PAS : interpoler jusqu au bout rend
       -11.699999999999999. Arrondi a l affichage il passe ; compare a
       la vraie valeur, il ment. */
    expect(valeurALInstant(829.73, -11.7, DUREE_MS * 3)).toBe(-11.7);
    expect(valeurALInstant(0, 2550, DUREE_MS + 1)).toBe(2550);
  });

  it("TROIS IMAGES DONNENT LE MEME RESULTAT QUE CINQUANTE", () => {
    /* LE COEUR DE LA CORRECTION. La page qui rame ne dessine que
       quelques images ; celle qui est au repos en dessine cinquante.
       Les deux doivent afficher la MEME CHOSE A LA MEME HEURE — sinon
       la lenteur ne ralentit pas l animation, elle la FAUSSE.
       C est vrai parce que la valeur ne se deduit que de l heure : on
       joue ici deux cadences sur les memes instants de controle, et
       on verifie qu aucune trace du passe ne subsiste. */
    const controle = [0, 137, 400, 613, DUREE_MS];
    const cinquante = Array.from({ length: 50 }, (_, i) => (i * DUREE_MS) / 49);
    const trois = [0, DUREE_MS / 2, DUREE_MS];

    const jouer = (cadence: number[]) => {
      /* on « dessine » toute la cadence, puis on releve aux instants
         de controle : si un etat s accumulait, il se verrait ici */
      for (const ms of cadence) valeurALInstant(829.73, -11.7, ms);
      return controle.map((ms) => valeurALInstant(829.73, -11.7, ms));
    };

    expect(jouer(trois)).toEqual(jouer(cinquante));
    /* et l arrivee est la meme dans les deux cas */
    expect(jouer(trois)[controle.length - 1]).toBe(-11.7);
  });

  it("monte quand la cible est plus haute, descend quand elle est plus basse", () => {
    const monte = [0, 200, 400, 600, 800].map((ms) => valeurALInstant(0, 100, ms));
    const descend = [0, 200, 400, 600, 800].map((ms) => valeurALInstant(100, 0, ms));
    for (let i = 1; i < monte.length; i++) {
      expect(monte[i]).toBeGreaterThan(monte[i - 1]);
      expect(descend[i]).toBeLessThan(descend[i - 1]);
    }
  });

  it("traverse le zero sans s y arreter : un solde qui devient negatif", () => {
    /* Le cas d octobre exactement : on part d un solde positif et on
       finit sous zero. Rien ne doit borner a zero en chemin. */
    const fin = valeurALInstant(829.73, -11.7, DUREE_MS);
    expect(fin).toBeLessThan(0);
    expect(valeurALInstant(829.73, -11.7, DUREE_MS * 0.9)).toBeLessThan(
      valeurALInstant(829.73, -11.7, DUREE_MS * 0.5),
    );
  });

  it("un depart egal a la cible ne bouge pas", () => {
    for (const ms of [0, 100, DUREE_MS, DUREE_MS * 5]) {
      expect(valeurALInstant(42, 42, ms)).toBe(42);
    }
  });
});

describe("estArrivee", () => {
  it("dit non avant la duree, oui a la duree et apres", () => {
    expect(estArrivee(0)).toBe(false);
    expect(estArrivee(DUREE_MS - 1)).toBe(false);
    expect(estArrivee(DUREE_MS)).toBe(true);
    expect(estArrivee(DUREE_MS * 41)).toBe(true);
  });

  it("UNE SEULE IMAGE TRES EN RETARD SUFFIT A FINIR", () => {
    /* C est ce qui manquait : trente-trois secondes de retard
       n allongent plus rien, elles terminent. */
    expect(estArrivee(33_000)).toBe(true);
    expect(valeurALInstant(829.73, -11.7, 33_000)).toBe(-11.7);
  });
});
