import { describe, expect, it } from "vitest";
import { PIEGEABLES, fermeAuFond, indiceDuPiege } from "./calque";

describe("ou la tabulation revient quand elle sort", () => {
  /* Elle ne sort que par deux endroits. Partout ailleurs, `null` veut
     dire « laisse faire le navigateur », qui s en tire mieux. */
  it("laisse faire au milieu du calque", () => {
    expect(indiceDuPiege(5, 2, false)).toBeNull();
    expect(indiceDuPiege(5, 2, true)).toBeNull();
    expect(indiceDuPiege(5, 0, false)).toBeNull();
    expect(indiceDuPiege(5, 4, true)).toBeNull();
  });

  it("boucle par la fin en avant, par le debut en arriere", () => {
    expect(indiceDuPiege(5, 4, false)).toBe(0);
    expect(indiceDuPiege(5, 0, true)).toBe(4);
  });

  /* UN CALQUE VIDE NE PIEGE RIEN. Sans cette sortie, la tabulation
     tournerait dans le vide : rien a atteindre, et rien pour en
     sortir. */
  it("ne piege pas un calque sans rien a prendre", () => {
    expect(indiceDuPiege(0, -1, false)).toBeNull();
    expect(indiceDuPiege(0, -1, true)).toBeNull();
    expect(indiceDuPiege(0, 0, false)).toBeNull();
  });

  /* LE FOCUS PEUT ETRE AILLEURS QUE DANS LE CALQUE — sur le corps de
     la page, juste apres l ouverture. `indexOf` rend alors -1, et on
     laisse faire plutot que de sauter quelque part. */
  it("laisse faire quand le focus n est pas dans le calque", () => {
    expect(indiceDuPiege(5, -1, false)).toBeNull();
    expect(indiceDuPiege(5, -1, true)).toBeNull();
  });

  /* UN SEUL ELEMENT SE PIEGE SUR LUI-MEME, dans les deux sens : c est
     ce qui empeche la tabulation de partir sur la page de dessous. */
  it("garde la tabulation sur l unique element", () => {
    expect(indiceDuPiege(1, 0, false)).toBe(0);
    expect(indiceDuPiege(1, 0, true)).toBe(0);
  });
});

describe("ce qui compte comme un clic sur le fond", () => {
  /* IL FAUT PARTIR DU FOND ET Y FINIR. Selectionner du texte dans le
     panneau et relacher sur le fond produit un clic dont la cible est
     le fond : fermer la fenetre a ce moment-la effacerait la saisie de
     quelqu un qui voulait copier une ligne. */
  it("ne ferme que si le geste commence ET finit sur le fond", () => {
    expect(fermeAuFond(true, true)).toBe(true);
    expect(fermeAuFond(true, false)).toBe(false);
    expect(fermeAuFond(false, true)).toBe(false);
    expect(fermeAuFond(false, false)).toBe(false);
  });
});

describe("ce qui se prend au clavier", () => {
  const monter = (html: string) => {
    const d = document.createElement("div");
    d.innerHTML = html;
    return [...d.querySelectorAll<HTMLElement>(PIEGEABLES)].map((e) => e.getAttribute("data-nom"));
  };

  it("prend les commandes ordinaires", () => {
    expect(monter(`
      <button data-nom="bouton"></button>
      <a href="/x" data-nom="lien"></a>
      <input data-nom="champ" />
      <select data-nom="liste"></select>
      <textarea data-nom="zone"></textarea>
    `)).toEqual(["bouton", "lien", "champ", "liste", "zone"]);
  });

  /* UN ELEMENT DESACTIVE N EST PAS UNE ETAPE. Le laisser entrer ferait
     buter la boucle sur une case que la touche ne peut pas atteindre —
     et la boucle s arreterait la. */
  it("ecarte ce qui est desactive", () => {
    expect(monter('<button disabled data-nom="off"></button><input disabled data-nom="off2" />'))
      .toEqual([]);
  });

  /* `tabindex="-1"` s atteint par programme, jamais par tabulation :
     il n a rien a faire dans le piege. */
  it("ecarte un tabindex negatif et garde les autres", () => {
    expect(monter('<div tabindex="-1" data-nom="hors"></div><div tabindex="0" data-nom="dedans"></div>'))
      .toEqual(["dedans"]);
  });

  /* UN LIEN SANS ADRESSE N EN EST PAS UN : le navigateur ne lui donne
     pas le focus, le selecteur non plus. */
  it("ecarte un lien sans adresse", () => {
    expect(monter('<a data-nom="ancre"></a><a href="#x" data-nom="vrai"></a>')).toEqual(["vrai"]);
  });
});
