import { describe, expect, it } from "vitest";
import {
  avancementDuRituel, BLANC, CASSURE_BLANCHE, CASSURE_CHAUDE, chargeEnPourcent,
  CHAUD, clamp, DUREE, FROID, lerp, MAGENTA, melange, palierDe,
  resteEnSecondes, teinteDe,
} from "./rituel";

const rgb = (c: readonly number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

describe("clamp et lerp", () => {
  it("borne aux deux bouts", () => {
    expect(clamp(-3, 0, 1)).toBe(0);
    expect(clamp(7, 0, 1)).toBe(1);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });

  it("interpole entre deux bornes", () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 1)).toBe(100);
    expect(lerp(0, 100, 0.25)).toBe(25);
  });

  it("interpole vers le bas aussi", () => {
    expect(lerp(100, 0, 0.25)).toBe(75);
  });
});

describe("melange — une couleur css entiere", () => {
  it("rend la premiere couleur a zero et la seconde a un", () => {
    expect(melange(FROID, CHAUD, 0)).toBe(rgb(FROID));
    expect(melange(FROID, CHAUD, 1)).toBe(rgb(CHAUD));
  });

  /* LES TROIS COMPOSANTES SONT ARRONDIES : « rgb(6.5, ... ) » n est
     pas une couleur css valide, et le navigateur l ignorerait en
     silence — la teinte resterait figee. */
  it("rend trois entiers, jamais des decimales", () => {
    const c = melange([0, 0, 0], [1, 1, 1], 0.5);
    expect(c).toBe("rgb(1, 1, 1)");
    expect(c).not.toMatch(/\./);
  });

  it("melange chaque composante separement", () => {
    expect(melange([0, 100, 200], [100, 0, 0], 0.5)).toBe("rgb(50, 50, 100)");
  });
});

describe("teinteDe — la rampe et ses deux cassures", () => {
  /* LES TROIS BORNES DE LA RAMPE SONT EXACTES : c est ce qui garantit
     qu il n y a pas de saut de couleur au passage d une cassure. */
  it("part du froid, passe par le chaud, finit au blanc", () => {
    expect(teinteDe(0)).toBe(rgb(FROID));
    expect(teinteDe(CASSURE_CHAUDE)).toBe(rgb(CHAUD));
    expect(teinteDe(CASSURE_BLANCHE)).toBe(rgb(MAGENTA));
    expect(teinteDe(1)).toBe(rgb(BLANC));
  });

  /* AUCUN SAUT AUX CASSURES : la couleur juste avant une cassure doit
     etre a un cheveu de celle qui la suit. Un decalage de segment
     ferait sauter la teinte a l ecran. */
  it("ne saute pas a la premiere cassure", () => {
    const avant = teinteDe(CASSURE_CHAUDE - 0.0001);
    expect(avant).toBe(rgb(CHAUD));
  });

  it("ne saute pas a la seconde cassure", () => {
    expect(teinteDe(CASSURE_BLANCHE - 0.0001)).toBe(rgb(MAGENTA));
  });

  /* LA CASSURE APPARTIENT AUX DEUX SEGMENTS A LA FOIS, et c est
     exactement ce qu on veut. Le balayage de mutations a laisse
     survivre le passage de « < » a « <= » sur la premiere cassure :
     a p = 0,5 le premier segment finit sur CHAUD et le second en
     part, donc les deux branches rendent la meme couleur. Ce n est
     pas un trou dans les tests — c est la CONTINUITE de la rampe qui
     rend le choix de la borne inobservable, et c est la propriete
     qu on veut. Le test ci-dessous est ce qui la garantit : si
     quelqu un decalait un segment, la mutation redeviendrait
     observable et ce test rougirait le premier. */
  it("fait coincider les deux branches sur chaque cassure", () => {
    /* Fin du premier segment et debut du second, calcules a la main. */
    expect(melange(FROID, CHAUD, 1)).toBe(melange(CHAUD, MAGENTA, 0));
    expect(melange(CHAUD, MAGENTA, 1)).toBe(melange(MAGENTA, BLANC, 0));
  });

  it("atteint le milieu de chaque segment", () => {
    expect(teinteDe(0.25)).toBe(melange(FROID, CHAUD, 0.5));
    expect(teinteDe(0.675)).toBe(melange(CHAUD, MAGENTA, 0.5));
    expect(teinteDe(0.925)).toBe(melange(MAGENTA, BLANC, 0.5));
  });

  /* LE DERNIER SEGMENT EST TROIS FOIS PLUS COURT que le premier :
     c est ce qui fait que la fin se voit venir. */
  it("garde un dernier segment plus court que les deux autres", () => {
    expect(1 - CASSURE_BLANCHE).toBeLessThan(CASSURE_BLANCHE - CASSURE_CHAUDE);
    expect(CASSURE_BLANCHE - CASSURE_CHAUDE).toBeLessThan(CASSURE_CHAUDE);
  });

  it("rend toujours une couleur css valide", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(teinteDe(Math.min(p, 1))).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    }
  });
});

describe("avancementDuRituel", () => {
  it("part de zero et atteint un au bout de la duree", () => {
    expect(avancementDuRituel(0, 0, 1)).toBe(0);
    expect(avancementDuRituel(DUREE, 0, 1)).toBe(1);
    expect(avancementDuRituel(DUREE / 2, 0, 1)).toBe(0.5);
  });

  /* SANS LA BORNE HAUTE, garder le doigt une image de trop donnerait
     un avancement superieur a un — et une teinte hors rampe. */
  it("ne depasse jamais un", () => {
    expect(avancementDuRituel(DUREE * 3, 0, 1)).toBe(1);
  });

  /* SANS LA BORNE BASSE, une horloge qui recule — changement d heure,
     sortie de veille — donnerait un avancement negatif. */
  it("ne descend jamais sous zero", () => {
    expect(avancementDuRituel(0, 5000, 1)).toBe(0);
  });

  /* LE MODE DEMONSTRATION ACCELERE, et c est la vitesse qui le fait :
     rien d autre ne change. */
  it("va deux fois plus vite a vitesse deux", () => {
    expect(avancementDuRituel(DUREE / 2, 0, 2)).toBe(1);
  });

  it("compte a partir du depart, pas de zero", () => {
    expect(avancementDuRituel(5000 + DUREE / 4, 5000, 1)).toBe(0.25);
  });
});

describe("palierDe — trois rendus au lieu de mille deux cents", () => {
  it("reste en attente a zero exactement", () => {
    expect(palierDe(0)).toBe("attente");
  });

  it("passe en montee des le premier pouce", () => {
    expect(palierDe(0.0001)).toBe("montee");
    expect(palierDe(0.84)).toBe("montee");
  });

  /* LE PALIER CRITIQUE COMMENCE A LA SECONDE CASSURE, borne comprise :
     c est le meme seuil que la rampe de couleur, et ce n est pas un
     hasard — le rouge et le mot arrivent ensemble. */
  it("passe en critique a la cassure blanche, borne comprise", () => {
    expect(palierDe(CASSURE_BLANCHE)).toBe("critique");
    expect(palierDe(CASSURE_BLANCHE - 0.0001)).toBe("montee");
    expect(palierDe(1)).toBe("critique");
  });
});

describe("les deux textes du cadran", () => {
  /* LE COMPTE A REBOURS SE DEDUIT DE LA DUREE. Il etait ecrit
     « 20 - p * 20 », un vingt en dur a cote d une constante valant
     vingt mille : changer la duree aurait laisse le compte annoncer
     vingt secondes pour un appui qui en dure trente. */
  it("part de la duree et tombe a zero", () => {
    expect(resteEnSecondes(0)).toBe("20.0s");
    expect(resteEnSecondes(1)).toBe("0.0s");
    expect(resteEnSecondes(0.5)).toBe("10.0s");
  });

  it("suit une autre duree si on la lui donne", () => {
    expect(resteEnSecondes(0, 30000)).toBe("30.0s");
    expect(resteEnSecondes(0.5, 30000)).toBe("15.0s");
  });

  it("garde un chiffre apres la virgule", () => {
    expect(resteEnSecondes(0.333)).toMatch(/^\d+\.\ds$/);
  });

  it("rend la charge en pourcent entier", () => {
    expect(chargeEnPourcent(0)).toBe("0%");
    expect(chargeEnPourcent(0.5)).toBe("50%");
    expect(chargeEnPourcent(1)).toBe("100%");
    expect(chargeEnPourcent(0.336)).toBe("34%");
  });
});
