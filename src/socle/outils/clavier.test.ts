import { describe, expect, it } from "vitest";
import { saisieEnCours } from "./clavier";

/* ═══════════════════════════════════════════════════════════════
   JSDOM N IMPLEMENTE PAS `isContentEditable`.

   Mesure : sur un `div` portant `contenteditable=""`, jsdom rend
   `undefined` — comme sur un `div` qui ne le porte pas. Un test qui
   poserait l attribut et attendrait `true` passerait donc POUR LA
   MAUVAISE RAISON le jour ou la fonction cesserait de regarder cette
   propriete.

   On pose donc la propriete a la main, ce que fait le vrai navigateur.
   Et c est aussi pourquoi la fonction compare a `true` plutot que de se
   fier a la verite de la valeur : `undefined` n est pas « editable ».
   ═══════════════════════════════════════════════════════════════ */
function editable(balise = "div"): HTMLElement {
  const el = document.createElement(balise);
  Object.defineProperty(el, "isContentEditable", { value: true });
  return el;
}

describe("reconnaitre quelqu un qui ecrit", () => {
  it("reconnait les trois balises de saisie", () => {
    for (const balise of ["input", "textarea", "select"]) {
      expect(saisieEnCours(document.createElement(balise)), balise).toBe(true);
    }
  });

  it("laisse passer ce qui n est pas une saisie", () => {
    for (const balise of ["div", "button", "a", "span", "body"]) {
      expect(saisieEnCours(document.createElement(balise)), balise).toBe(false);
    }
  });

  /* L EDITEUR DU JOURNAL EST UN `div` EDITABLE — un TipTap. Sans cette
     branche, un raccourci global vole les touches a quelqu un qui
     redige. */
  it("reconnait un bloc editable", () => {
    expect(saisieEnCours(editable())).toBe(true);
    expect(saisieEnCours(editable("p"))).toBe(true);
  });

  /* Un `div` ordinaire rend `undefined` sous jsdom, `false` dans un
     navigateur : les deux doivent donner « non ». */
  it("ne prend pas une propriete absente pour un oui", () => {
    const d = document.createElement("div");
    expect(d.isContentEditable).toBeFalsy();
    expect(saisieEnCours(d)).toBe(false);
  });

  /* UNE CIBLE PEUT NE PAS ETRE UN ELEMENT. `e.target` vaut le document
     ou la fenetre pour un evenement qui n a touche aucun element :
     lire `.tagName` dessus rend `undefined`, et le comparer a une
     balise aurait marche par accident. Ici on le dit. */
  it("survit a une cible qui n est pas un element", () => {
    expect(saisieEnCours(null)).toBe(false);
    expect(saisieEnCours(document)).toBe(false);
    expect(saisieEnCours(window)).toBe(false);
  });
});
