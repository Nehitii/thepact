import { describe, expect, it } from "vitest";
import {
  accorde, hauteurDuChamp, HAUTEUR_MAX_DU_CHAMP, largeurDepuisLePointeur,
  LARGEUR_DEFAUT, LARGEUR_MAX, LARGEUR_MIN, largeurRetenue, partEcoulee,
  pluriel, TITRE_MAX, titreDuFil,
} from "./console";

describe("largeurDepuisLePointeur — la poignee est a gauche", () => {
  /* LA CONSOLE EST A DROITE : la largeur est la distance du pointeur
     au BORD DROIT. Tirer vers la gauche elargit. */
  it("mesure depuis le bord droit", () => {
    expect(largeurDepuisLePointeur(1600, 1000)).toBe(600);
    expect(largeurDepuisLePointeur(1600, 900)).toBe(700);
  });

  it("ecrete au minimum et au maximum", () => {
    expect(largeurDepuisLePointeur(1600, 1590)).toBe(LARGEUR_MIN);
    expect(largeurDepuisLePointeur(1600, 10)).toBe(LARGEUR_MAX);
  });

  it("garde les trois bornes en clair", () => {
    expect([LARGEUR_MIN, LARGEUR_DEFAUT, LARGEUR_MAX]).toEqual([380, 560, 900]);
  });

  it("place le defaut entre les deux bornes", () => {
    expect(LARGEUR_MIN).toBeLessThan(LARGEUR_DEFAUT);
    expect(LARGEUR_DEFAUT).toBeLessThan(LARGEUR_MAX);
  });

  /* UN POINTEUR SORTI DE LA FENETRE — glissement rapide, ecran
     secondaire — ne doit pas donner une largeur negative. */
  it("reste dans les bornes meme hors de la fenetre", () => {
    for (const x of [-500, 0, 800, 1600, 3000]) {
      const l = largeurDepuisLePointeur(1600, x);
      expect(l).toBeGreaterThanOrEqual(LARGEUR_MIN);
      expect(l).toBeLessThanOrEqual(LARGEUR_MAX);
    }
  });

  /* SUR UN ECRAN PLUS ETROIT QUE LE MINIMUM, la console prend quand
     meme sa largeur minimale et deborde. C est constate : la borner a
     la fenetre la rendrait inutilisable. */
  it("garde le minimum sur un ecran plus etroit que lui", () => {
    expect(largeurDepuisLePointeur(320, 0)).toBe(LARGEUR_MIN);
  });
});

describe("largeurRetenue — une valeur hors bornes est oubliee, pas ecretee", () => {
  it("garde une largeur valide", () => {
    expect(largeurRetenue("640")).toBe(640);
    expect(largeurRetenue(String(LARGEUR_MIN))).toBe(LARGEUR_MIN);
    expect(largeurRetenue(String(LARGEUR_MAX))).toBe(LARGEUR_MAX);
  });

  /* C EST DELIBEREMENT DIFFERENT DE LA POIGNEE : une valeur ecrite
     sur un ecran large n a pas de sens sur un ecran etroit, et
     l ECRETER donnerait une console qui mange tout. */
  it("oublie une largeur trop grande au lieu de l ecreter", () => {
    expect(largeurRetenue("1200")).toBe(LARGEUR_DEFAUT);
    expect(largeurDepuisLePointeur(2000, 800)).toBe(LARGEUR_MAX);
  });

  it("oublie une largeur trop petite", () => {
    expect(largeurRetenue("100")).toBe(LARGEUR_DEFAUT);
  });

  /* Number(null) ET Number("") VALENT ZERO, qui echoue le minimum :
     une preference absente retombe sur le defaut sans test special. */
  it.each([null, "", "  ", "abc", "NaN"])("retombe sur le defaut pour %s", (brut) => {
    expect(largeurRetenue(brut)).toBe(LARGEUR_DEFAUT);
  });

  it("refuse l infini", () => {
    expect(largeurRetenue("Infinity")).toBe(LARGEUR_DEFAUT);
  });

  it("rend toujours une largeur dans les bornes", () => {
    for (const brut of ["100", "640", "5000", "", null, "abc", "-40"]) {
      const l = largeurRetenue(brut);
      expect(l).toBeGreaterThanOrEqual(LARGEUR_MIN);
      expect(l).toBeLessThanOrEqual(LARGEUR_MAX);
    }
  });
});

describe("hauteurDuChamp — le plafond sert deux fois", () => {
  it("suit le texte tant qu il tient", () => {
    expect(hauteurDuChamp(40)).toEqual({ hauteur: 40, plein: false });
  });

  it("plafonne et marque le debordement", () => {
    expect(hauteurDuChamp(400)).toEqual({ hauteur: HAUTEUR_MAX_DU_CHAMP, plein: true });
  });

  /* A EXACTEMENT CENT SOIXANTE-HUIT PIXELS, le champ est plein sans
     etre marque : il n a pas encore de quoi defiler. Les deux
     comparaisons ne sont donc pas la meme. */
  it("ne marque pas le debordement pile au plafond", () => {
    expect(hauteurDuChamp(HAUTEUR_MAX_DU_CHAMP)).toEqual({
      hauteur: HAUTEUR_MAX_DU_CHAMP, plein: false,
    });
    expect(hauteurDuChamp(HAUTEUR_MAX_DU_CHAMP + 1).plein).toBe(true);
  });

  it("garde le plafond en clair", () => {
    expect(HAUTEUR_MAX_DU_CHAMP).toBe(168);
  });

  it("supporte un champ vide", () => {
    expect(hauteurDuChamp(0)).toEqual({ hauteur: 0, plein: false });
  });
});

describe("partEcoulee — l anneau du pacte", () => {
  it("laisse passer une part valide", () => {
    expect(partEcoulee(46)).toBe(46);
    expect(partEcoulee(0)).toBe(0);
    expect(partEcoulee(100)).toBe(100);
  });

  /* UN PACTE DONT LA FIN EST PASSEE DONNE PLUS DE CENT ; un pacte qui
     commence demain donne moins de zero. Les deux dessineraient un
     anneau faux. */
  it("ecrete aux deux bouts", () => {
    expect(partEcoulee(140)).toBe(100);
    expect(partEcoulee(-20)).toBe(0);
  });

  it.each([null, undefined, NaN])("rend zero pour %s", (v) => {
    expect(partEcoulee(v)).toBe(0);
  });

  it("rend toujours une part dessinable", () => {
    for (const v of [-999, 0, 50, 100, 999, NaN, null, undefined]) {
      const p = partEcoulee(v);
      expect(Number.isFinite(p)).toBe(true);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });
});

describe("le pluriel francais", () => {
  /* IL PREND UN « S » A PARTIR DE DEUX : « 0 etape », « 1 etape »,
     « 2 etapes ». La regle anglaise — « s » sauf a un — mettrait un
     « s » a zero. */
  it("ne met pas de s a zero ni a un", () => {
    expect(pluriel(0)).toBe("");
    expect(pluriel(1)).toBe("");
  });

  it("met un s a partir de deux", () => {
    expect(pluriel(2)).toBe("s");
    expect(pluriel(59)).toBe("s");
  });

  it("accorde le nombre et son mot", () => {
    expect(accorde(0, "étape")).toBe("0 étape");
    expect(accorde(1, "tâche")).toBe("1 tâche");
    expect(accorde(3, "jour")).toBe("3 jours");
  });

  /* LA REGLE ETAIT ECRITE CINQ FOIS, a chaque fois sous la forme
     `${n > 1 ? "s" : ""}`. Ce test fixe l ecart avec la regle
     anglaise, qui aurait ecrit « 0 etapes ». */
  it("differe de la regle anglaise sur zero", () => {
    const plurielAnglais = (n: number) => (n !== 1 ? "s" : "");
    expect(accorde(0, "étape")).toBe("0 étape");
    expect(`0 étape${plurielAnglais(0)}`).toBe("0 étapes");
    expect(pluriel(0)).not.toBe(plurielAnglais(0));
  });
});

describe("titreDuFil", () => {
  it("garde le message court tel quel", () => {
    expect(titreDuFil("où j en suis")).toBe("où j en suis");
  });

  /* SOIXANTE CARACTERES : couper plus court rendrait deux
     conversations voisines indistinguables dans la liste. */
  it("coupe a soixante caracteres", () => {
    expect(TITRE_MAX).toBe(60);
    expect(titreDuFil("x".repeat(200))).toHaveLength(60);
  });

  it("ne coupe pas a soixante caracteres pile", () => {
    const pile = "y".repeat(60);
    expect(titreDuFil(pile)).toBe(pile);
  });

  it("supporte un message vide", () => {
    expect(titreDuFil("")).toBe("");
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE LE BALAYAGE A LAISSE PASSER, ET POURQUOI.
   ═══════════════════════════════════════════════════════════════ */
describe("la largeur retenue, au detail", () => {
  /* TROU — Number et parseInt ne lisent pas pareil une valeur avec un
     suffixe. Le code ecrit toujours un entier nu dans la preference,
     mais le stockage local survit aux versions et se modifie a la
     main : « 640px » doit retomber sur le defaut, pas etre lu a
     moitie. Le balayage l a montre en laissant survivre le passage a
     parseInt. */
  it.each(["640px", "640 pixels"])("refuse une largeur mal formee : %s", (brut) => {
    expect(largeurRetenue(brut)).toBe(LARGEUR_DEFAUT);
    /* La preuve du piege : parseInt en lirait une partie, et
       l accepterait. */
    expect(parseInt(brut, 10)).toBe(640);
  });

  /* LES DEUX LECTURES DIVERGENT DANS LES DEUX SENS, et c est ce qui
     rend le choix reel. Number lit la notation scientifique — « 6e2 »
     vaut six cents — la ou parseInt s arrete au « e » et rend six,
     qui echoue le minimum. Number est le bon choix ici : la
     preference est un nombre, pas un prefixe de nombre. */
  it("accepte la notation scientifique, que parseInt refuserait", () => {
    expect(largeurRetenue("6e2")).toBe(600);
    expect(parseInt("6e2", 10)).toBe(6);
  });

  /* DOMINE — le test « Number.isFinite » ne peut rien refuser que les
     deux bornes ne refusent deja : Infinity echoue le maximum,
     -Infinity et NaN echouent le minimum. Le balayage a laisse
     survivre son retrait, et c est correct. Il dit l intention ; il
     n ajoute pas de refus — TANT QUE LES DEUX BORNES SONT FINIES, ce
     que le test des valeurs en clair garantit. */
  it("refuse l infini par les bornes seules, sans le test de finitude", () => {
    const sansFinitude = (brut: string | null) => {
      const v = Number(brut);
      return v >= LARGEUR_MIN && v <= LARGEUR_MAX ? v : LARGEUR_DEFAUT;
    };
    for (const brut of ["Infinity", "-Infinity", "NaN", "", null, "1200", "640"]) {
      expect(largeurRetenue(brut)).toBe(sansFinitude(brut));
    }
    expect(Number.isFinite(LARGEUR_MIN) && Number.isFinite(LARGEUR_MAX)).toBe(true);
  });
});
