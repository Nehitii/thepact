import { describe, expect, it } from "vitest";
import {
  commandesFiltrees, ECART_CURSEUR, HAUTEUR_MENU, indexBorne, indexSuivant,
  LARGEUR_MENU, MARGE_ECRAN, placementDuMenu, requeteOblique, REQUETE_OBLIQUE,
  versLeHaut,
} from "./menuOblique";

const FENETRE = { largeur: 1600, hauteur: 900 };

describe("versLeHaut — le menu s ouvre en haut quand il ne tient pas en bas", () => {
  /* ON COMPARE LE BAS DU CURSEUR, pas son haut : c est de la que le
     menu descendrait. */
  it("descend quand il y a la place", () => {
    expect(versLeHaut(100, 900)).toBe(false);
  });

  it("remonte quand il n y a plus la place", () => {
    expect(versLeHaut(800, 900)).toBe(true);
  });

  it("bascule exactement au pixel ou il deborde", () => {
    const pile = 900 - HAUTEUR_MENU;
    expect(versLeHaut(pile, 900)).toBe(false);
    expect(versLeHaut(pile + 1, 900)).toBe(true);
  });

  /* SUR UNE FENETRE PLUS COURTE QUE LE MENU, il remonte toujours —
     et depassera par le haut. C est constate : il n y a pas de bon
     choix quand rien ne tient. */
  it("remonte toujours sur une fenetre plus courte que lui", () => {
    expect(versLeHaut(0, HAUTEUR_MENU - 1)).toBe(true);
  });
});

describe("placementDuMenu", () => {
  it("se pose sous le curseur, avec un ecart", () => {
    const p = placementDuMenu({ x: 400, y: 300, versLeHaut: false }, FENETRE);
    expect(p).toEqual({ left: 400, top: 300 + ECART_CURSEUR, bottom: undefined });
  });

  /* QUAND IL REMONTE, C EST LE BAS QUI S ANCRE : mesure depuis le bas
     de la fenetre, pas depuis le haut. */
  it("s ancre par le bas quand il remonte", () => {
    const p = placementDuMenu({ x: 400, y: 700, versLeHaut: true }, FENETRE);
    expect(p).toEqual({ left: 400, top: undefined, bottom: 900 - 700 + ECART_CURSEUR });
  });

  it("ne pose jamais les deux ancrages a la fois", () => {
    for (const haut of [true, false]) {
      const p = placementDuMenu({ x: 10, y: 10, versLeHaut: haut }, FENETRE);
      expect(p.top === undefined).toBe(haut);
      expect(p.bottom === undefined).toBe(!haut);
    }
  });

  /* LE PLACEMENT HORIZONTAL EST BORNE AUX DEUX BOUTS. */
  it("ne colle pas au bord gauche", () => {
    expect(placementDuMenu({ x: 0, y: 10, versLeHaut: false }, FENETRE).left).toBe(MARGE_ECRAN);
    expect(placementDuMenu({ x: -50, y: 10, versLeHaut: false }, FENETRE).left).toBe(MARGE_ECRAN);
  });

  it("ne deborde pas a droite", () => {
    const p = placementDuMenu({ x: 1590, y: 10, versLeHaut: false }, FENETRE);
    expect(p.left).toBe(1600 - LARGEUR_MENU - MARGE_ECRAN);
    expect(p.left + LARGEUR_MENU + MARGE_ECRAN).toBe(FENETRE.largeur);
  });

  it("laisse le menu entier a l ecran pour toute abscisse", () => {
    for (let x = -100; x <= 1700; x += 50) {
      const { left } = placementDuMenu({ x, y: 10, versLeHaut: false }, FENETRE);
      expect(left).toBeGreaterThanOrEqual(MARGE_ECRAN);
      expect(left + LARGEUR_MENU).toBeLessThanOrEqual(FENETRE.largeur - MARGE_ECRAN);
    }
  });

  /* SUR UN ECRAN PLUS ETROIT QUE LE MENU, la borne GAUCHE l emporte :
     le menu depasse a droite plutot qu a gauche, ce qui laisse au
     moins son debut lisible. L ordre des deux bornes est donc voulu. */
  it("garde le debut lisible sur un ecran plus etroit que lui", () => {
    const etroit = { largeur: 200, hauteur: 900 };
    expect(placementDuMenu({ x: 100, y: 10, versLeHaut: false }, etroit).left).toBe(MARGE_ECRAN);
  });
});

describe("les deux nombres partages avec la feuille de style", () => {
  /* `journal.css` declare `.jr-slash { width: 260px; max-height:
     264px }`. Ces deux constantes les SUPPOSENT. Elargir le menu dans
     le CSS sans toucher a ce fichier le ferait deborder de l ecran,
     et rien ne le dirait. Ce test ne verifie pas le CSS — il ne peut
     pas — mais il fixe les deux valeurs pour qu un changement d un
     seul cote se voie au moins dans le diff. */
  it("porte la largeur et la hauteur declarees dans le CSS", () => {
    expect(LARGEUR_MENU).toBe(260);
    expect(HAUTEUR_MENU).toBe(264);
  });

  it("garde une marge et un ecart plus petits que le menu", () => {
    expect(MARGE_ECRAN).toBe(8);
    expect(ECART_CURSEUR).toBe(6);
    expect(MARGE_ECRAN).toBeLessThan(LARGEUR_MENU);
  });
});

describe("indexBorne — la liste retrecit pendant qu on tape", () => {
  it("laisse un index valide tranquille", () => {
    expect(indexBorne(2, 5)).toBe(2);
  });

  /* LE CURSEUR PEUT POINTER AU-DELA DE LA FIN : on le ramene au
     dernier element. */
  it("ramene au dernier element", () => {
    expect(indexBorne(9, 3)).toBe(2);
  });

  /* UNE LISTE VIDE RAMENE A ZERO plutot qu a moins un, qui ne
     designerait rien. */
  it("rend zero sur une liste vide", () => {
    expect(indexBorne(4, 0)).toBe(0);
    expect(indexBorne(0, 0)).toBe(0);
  });

  it("ne rend jamais un index hors de la liste", () => {
    for (const n of [0, 1, 3, 12]) {
      for (const v of [-1, 0, 2, 99]) {
        const i = indexBorne(v, n);
        expect(i).toBeLessThanOrEqual(Math.max(0, n - 1));
      }
    }
  });
});

describe("indexSuivant — les fleches bouclent aux deux bouts", () => {
  it("avance d un cran", () => {
    expect(indexSuivant(0, 1, 5)).toBe(1);
    expect(indexSuivant(3, 1, 5)).toBe(4);
  });

  it("boucle apres le dernier", () => {
    expect(indexSuivant(4, 1, 5)).toBe(0);
  });

  /* LE « + n » AVANT LE MODULO N EST PAS DECORATIF : en JavaScript,
     (-1) % 5 vaut MOINS UN, pas quatre. Sans lui, remonter depuis le
     premier element ne surlignerait plus rien du tout. */
  it("boucle avant le premier", () => {
    expect(indexSuivant(0, -1, 5)).toBe(4);
    expect((0 - 1) % 5).toBe(-1);
  });

  it("recule d un cran ailleurs", () => {
    expect(indexSuivant(3, -1, 5)).toBe(2);
  });

  /* L INDEX D OU L ON PART PEUT DEJA ETRE PERIME : la liste a pu
     retrecir depuis le dernier deplacement. */
  it("repart du dernier element quand l index est perime", () => {
    expect(indexSuivant(9, 1, 3)).toBe(0);
    expect(indexSuivant(9, -1, 3)).toBe(1);
  });

  it("rend zero sur une liste vide", () => {
    expect(indexSuivant(0, 1, 0)).toBe(0);
    expect(indexSuivant(3, -1, 0)).toBe(0);
  });

  it("reste sur place avec une liste d un seul element", () => {
    expect(indexSuivant(0, 1, 1)).toBe(0);
    expect(indexSuivant(0, -1, 1)).toBe(0);
  });

  it("rend toujours un index dans la liste", () => {
    for (const n of [1, 2, 7]) {
      for (const v of [-3, 0, 5, 40]) {
        for (const d of [-1, 1]) {
          const i = indexSuivant(v, d, n);
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(n);
        }
      }
    }
  });
});

describe("requeteOblique — ce qui ouvre le menu", () => {
  it("reconnait une barre oblique seule", () => {
    expect(requeteOblique("/")).toEqual({ requete: "", longueur: 1 });
  });

  it("reconnait une barre suivie de lettres", () => {
    expect(requeteOblique("/titre")).toEqual({ requete: "titre", longueur: 6 });
  });

  it("accepte les chiffres et les accents", () => {
    expect(requeteOblique("/h1")?.requete).toBe("h1");
    expect(requeteOblique("/éclat")?.requete).toBe("éclat");
  });

  /* LA REQUETE NE PREND QUE DES LETTRES ET DES CHIFFRES, ce qui EXCLUT
     L ESPACE : taper « / puis un mot puis une espace » referme le
     menu au lieu de chercher une commande a deux mots. */
  it.each(["/deux mots", "/a-b", "/a_b", "/a.b"])("referme le menu sur « %s »", (texte) => {
    expect(requeteOblique(texte)).toBeNull();
  });

  /* LA BARRE DOIT ETRE AU DEBUT DE LA LIGNE : « du texte /titre » ne
     doit pas ouvrir le menu au milieu d une phrase. */
  it("ne reconnait pas une barre au milieu d une ligne", () => {
    expect(requeteOblique("du texte /titre")).toBeNull();
  });

  it("ne reconnait rien sans barre", () => {
    expect(requeteOblique("titre")).toBeNull();
    expect(requeteOblique("")).toBeNull();
  });

  /* LA LONGUEUR SERT A RETROUVER OU LA REQUETE COMMENCE, pour
     l effacer quand la commande s applique : elle compte la barre. */
  it("compte la barre dans la longueur", () => {
    expect(requeteOblique("/titre")?.longueur).toBe("/titre".length);
  });

  it("porte le drapeau unicode", () => {
    expect(REQUETE_OBLIQUE.flags).toContain("u");
  });
});

describe("commandesFiltrees", () => {
  const COMMANDES = [
    { id: "titre", cles: "h1 heading" },
    { id: "liste", cles: "ul bullet" },
    { id: "citation", cles: "quote blockquote" },
  ];
  const libelle = (c: { id: string }) => ({ titre: "Titre", liste: "Liste", citation: "Citation" })[c.id] ?? "";

  it("rend tout sur une requete vide", () => {
    expect(commandesFiltrees(COMMANDES, "", libelle)).toHaveLength(3);
  });

  it("trouve par le libelle traduit", () => {
    expect(commandesFiltrees(COMMANDES, "titr", libelle).map((c) => c.id)).toEqual(["titre"]);
  });

  /* ON CHERCHE AUSSI DANS LES MOTS-CLES : sans eux, il faudrait
     connaitre la langue de l interface pour s en servir. */
  it("trouve par les mots-cles", () => {
    expect(commandesFiltrees(COMMANDES, "h1", libelle).map((c) => c.id)).toEqual(["titre"]);
    expect(commandesFiltrees(COMMANDES, "blockquote", libelle).map((c) => c.id)).toEqual(["citation"]);
  });

  it("ignore la casse", () => {
    expect(commandesFiltrees(COMMANDES, "TITRE", libelle).map((c) => c.id)).toEqual(["titre"]);
  });

  it("rend une liste vide quand rien ne correspond", () => {
    expect(commandesFiltrees(COMMANDES, "chimere", libelle)).toEqual([]);
  });

  it("ne modifie pas la liste qu on lui donne", () => {
    const origine = [...COMMANDES];
    commandesFiltrees(COMMANDES, "h1", libelle);
    expect(COMMANDES).toEqual(origine);
  });
});
