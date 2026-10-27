import { describe, expect, it } from "vitest";
import { commandeDuFocus, type ToucheLue } from "./raccourcis";

const touche = (p: Partial<ToucheLue>): ToucheLue => ({
  code: "", key: "", shiftKey: false, target: document.createElement("div"), ...p,
});

describe("les trois touches d une session", () => {
  it("bascule sur la barre d espace", () => {
    expect(commandeDuFocus(touche({ code: "Space", key: " " }))).toBe("basculer");
  });

  it("passe la phase sur Maj + S", () => {
    expect(commandeDuFocus(touche({ key: "S", shiftKey: true }))).toBe("passer");
    expect(commandeDuFocus(touche({ key: "s", shiftKey: true }))).toBe("passer");
  });

  it("sort sur Echap", () => {
    expect(commandeDuFocus(touche({ key: "Escape" }))).toBe("sortir");
  });

  it("ne dit rien du reste", () => {
    for (const key of ["a", "S", "Enter", "ArrowLeft", "Tab"]) {
      expect(commandeDuFocus(touche({ key })), key).toBeNull();
    }
  });

  /* « S » SANS MAJUSCULE NE PASSE PAS LA PHASE : c est la touche Maj
     qui distingue le raccourci d une lettre tapee par megarde. */
  it("demande la touche Maj pour passer", () => {
    expect(commandeDuFocus(touche({ key: "s", shiftKey: false }))).toBeNull();
  });

  /* ET LA TOUCHE MAJ NE SUFFIT PAS. Sans ce test, remplacer la
     condition par « Maj seule » passait le balayage de mutations :
     rien ne tenait la lettre. Or Maj se tient pour ecrire une
     majuscule, un point d interrogation, un caractere accentue. */
  it("ne passe pas la phase pour n importe quelle touche tenue avec Maj", () => {
    for (const key of ["A", "?", "1", "É", "ArrowLeft", "Enter"]) {
      expect(commandeDuFocus(touche({ key, shiftKey: true })), key).toBeNull();
    }
  });

  /* Maj + Echap reste une sortie : la lettre n est pas « s », la
     condition suivante prend la main. */
  it("laisse Echap sortir meme avec Maj tenue", () => {
    expect(commandeDuFocus(touche({ key: "Escape", shiftKey: true }))).toBe("sortir");
  });

  /* LA BARRE D ESPACE SE LIT PAR SON `code`, PAS PAR SA `key` : sur un
     clavier ou la disposition change ce qu elle produit, la position
     physique reste la meme. */
  it("lit la barre d espace par sa position", () => {
    expect(commandeDuFocus(touche({ code: "Space", key: "Unidentified" }))).toBe("basculer");
    expect(commandeDuFocus(touche({ code: "", key: " " }))).toBeNull();
  });
});

describe("on ne vole pas les touches de quelqu un qui ecrit", () => {
  it("se tait dans un champ, une zone de texte, une liste", () => {
    for (const balise of ["input", "textarea", "select"]) {
      expect(commandeDuFocus(touche({ code: "Space", target: document.createElement(balise) })), balise)
        .toBeNull();
    }
  });

  /* AJOUTE PAR LA COUPE, ET MESURE INERTE : la page Focus ne porte
     aucun bloc editable — relevé le 30/08/2026, zéro `[contenteditable]`
     sur `/focus`, une seule saisie (le champ de recherche de l en-tete).
     La garde ne change donc rien aujourd hui ; elle tiendra le jour ou
     un editeur arrivera sur cette page. */
  it("se tait aussi dans un bloc editable", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "isContentEditable", { value: true });
    expect(commandeDuFocus(touche({ code: "Space", target: el }))).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE LES RACCOURCIS FONT DE TROP.

   Ces deux tests ne decrivent pas ce qu il faudrait, mais ce qui est.
   Ils sont la pour qu une correction se VOIE — pas pour la benir.
   ═══════════════════════════════════════════════════════════════ */
describe("les modificateurs que personne ne regarde", () => {
  /* Ctrl+Maj+S est une capture d ecran sous Firefox, « enregistrer
     sous » ailleurs. Pendant une session, il saute une phase. */
  it("passe la phase meme avec Ctrl ou Cmd tenus", () => {
    expect(commandeDuFocus({ ...touche({ key: "s", shiftKey: true }), ctrlKey: true } as ToucheLue))
      .toBe("passer");
    expect(commandeDuFocus({ ...touche({ key: "s", shiftKey: true }), metaKey: true } as ToucheLue))
      .toBe("passer");
  });

  it("bascule meme avec Ctrl ou Cmd tenus sur la barre d espace", () => {
    expect(commandeDuFocus({ ...touche({ code: "Space" }), ctrlKey: true } as ToucheLue))
      .toBe("basculer");
  });
});
