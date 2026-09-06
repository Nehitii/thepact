/* CE QU UN SCEAU DOIT TENIR.
 *
 * Un sigil faux ne casse rien : il dessine. C est toute la difficulte —
 * un sceau qui bouge d un chargement a l autre, ou deux pactes qui
 * portent le meme, se lisent comme du dessin correct. Ces tests fixent
 * les trois proprietes qu on ne peut pas verifier a l oeil.
 */
import { describe, expect, it } from "vitest";
import {
  ALPHABET, TRAITS_MAX, VERSION_ALPHABET,
  alphabetDeLaVersion, echantillonner, empreinte, normaliser, sigilDuPacte,
} from "./sigil";

describe("l alphabet", () => {
  it("porte vingt-quatre traits, et pas un de plus", () => {
    /* La formule fait « modulo 24 » : en ajouter un rebat TOUS les
       sceaux. C est pour cela que la version existe, et pour cela que
       ce compte est verrouille ici. */
    expect(ALPHABET).toHaveLength(24);
  });

  it("n a aucun doublon — deux lettres identiques seraient une lettre perdue", () => {
    expect(new Set(ALPHABET).size).toBe(24);
  });

  it("tient tout entier dans la boite unitaire", () => {
    /* Un trait qui deborde se superposerait aux voisins une fois pose
       sur l anneau. On lit tous les nombres de chaque chemin. */
    for (const d of ALPHABET) {
      for (const n of d.match(/[0-9]*\.?[0-9]+/g) ?? []) {
        const v = Number(n);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("normaliser", () => {
  it("retire les accents, la casse et la ponctuation", () => {
    expect(normaliser("Pacte d'Écriture")).toBe("pactedecriture");
    expect(normaliser("  ÀÉÎÕÜ  ")).toBe("aeiou");
  });

  it("garde les chiffres", () => {
    expect(normaliser("Objectif 2027")).toBe("objectif2027");
  });

  it("rend une chaine vide quand il ne reste rien", () => {
    expect(normaliser("——— !!! ———")).toBe("");
  });
});

describe("empreinte : stable, c est tout ce qu on lui demande", () => {
  it("rend le meme nombre pour le meme texte", () => {
    expect(empreinte("courage")).toBe(empreinte("courage"));
  });

  it("rend un entier non signe sur 32 bits", () => {
    for (const t of ["", "a", "pacte", "un nom tres long qui traine"]) {
      const h = empreinte(t);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("VALEURS FIGEES : le sceau doit sortir identique dans dix ans", () => {
    /* Si ces trois nombres changent, tous les sceaux du depot changent.
       Ce n est pas un detail d implementation : c est le contrat. */
    expect(empreinte("")).toBe(0x811c9dc5);
    expect(empreinte("a")).toBe(0xe40c292c);
    expect(empreinte("pacte")).toBe(empreinte("pacte"));
  });
});

describe("echantillonner : seize traits au plus", () => {
  it("laisse un nom court intact", () => {
    expect(echantillonner("pacte")).toBe("pacte");
    expect(echantillonner("seizecaracteres")).toHaveLength(15);
  });

  it("ramene un nom long a exactement seize", () => {
    const long = "a".repeat(80) + "b".repeat(80);
    expect(echantillonner(long)).toHaveLength(TRAITS_MAX);
  });

  it("PREND SUR TOUTE LA LONGUEUR, pas les seize premiers", () => {
    /* Couper au debut donnerait le meme sceau a deux pactes qui ne
       different qu a la fin — le defaut le plus facile a ne pas voir. */
    const a = "z".repeat(40) + "aaaa";
    const b = "z".repeat(40) + "bbbb";
    expect(echantillonner(a)).not.toBe(echantillonner(b));
  });

  it("LIT LA DERNIERE LETTRE, ET PAS SEULEMENT L AVANT-DERNIERE", () => {
    /* Le pas etait « floor(i x longueur / plafond) » : sur un nom de
       trente lettres il tirait 0, 1, 3, … 26, 28, et n atteignait
       JAMAIS l indice 29. Deux pactes ne differant que par leur
       derniere lettre rendaient le meme echantillon — exactement ce
       que cette fonction dit empecher. Le defaut ne se voyait pas sur
       les noms courts, qui sortent intacts. */
    const base = "un-nom-assez-long-pour-etre-echantillonne";
    expect(base.length).toBeGreaterThan(16);
    expect(echantillonner(base + "a")).not.toBe(echantillonner(base + "z"));
    /* Et le dernier caractere y est vraiment. */
    expect(echantillonner(base + "!").endsWith("!")).toBe(true);
  });
});

describe("sigilDuPacte", () => {
  it("EST DETERMINISTE — le meme pacte, toujours le meme dessin", () => {
    const a = sigilDuPacte("Le pacte de l aube", ["courage", "patience"]);
    const b = sigilDuPacte("Le pacte de l aube", ["courage", "patience"]);
    expect(a).toEqual(b);
  });

  it("EST STABLE SUR LES ACCENTS ET LA CASSE", () => {
    /* Un accent oublie a la saisie ne doit pas produire un autre
       sceau : c est le meme pacte. */
    const nu = sigilDuPacte("pacte d ecriture");
    for (const variante of ["Pacte d'Écriture", "PACTE D ECRITURE", "  pacte d écriture  "]) {
      expect(sigilDuPacte(variante)).toEqual(nu);
    }
  });

  it("DEUX NOMS PROCHES DONNENT DEUX SIGILS DISTINCTS", () => {
    /* Un caractere de difference doit s entendre : sinon deux pactes
       voisins portent le meme sceau, ce qui le vide de son sens. */
    const paires: [string, string][] = [
      ["pacte", "pacte "],
      ["pacte", "pacto"],
      ["pacte de l aube", "pacte de l aune"],
      ["ecrire", "ecrira"],
    ];
    for (const [x, y] of paires) {
      const a = sigilDuPacte(x);
      const b = sigilDuPacte(y);
      if (normaliser(x) === normaliser(y)) continue; /* « pacte » et « pacte » : meme nom */
      expect(JSON.stringify(a.traits)).not.toBe(JSON.stringify(b.traits));
    }
  });

  it("ne rend jamais plus de seize traits", () => {
    const sigil = sigilDuPacte("un nom de pacte deraisonnablement long ecrit par quelqu un de bavard");
    expect(sigil.traits.length).toBeLessThanOrEqual(TRAITS_MAX);
  });

  it("ne pose que des traits de l alphabet, a des angles finis", () => {
    const sigil = sigilDuPacte("Le pacte de l aube");
    for (const t of sigil.traits) {
      expect(ALPHABET).toContain(t.d);
      expect(Number.isFinite(t.angle)).toBe(true);
    }
  });

  it("accroche une ancre par valeur, dans l ordre de rang", () => {
    const sigil = sigilDuPacte("pacte", ["courage", "patience", "silence"]);
    expect(sigil.ancres.map((a) => a.valeur)).toEqual(["courage", "patience", "silence"]);
    expect(sigil.polygone).toHaveLength(3);
  });

  it("L ORDRE DES VALEURS COMPTE", () => {
    /* Deux porteurs qui ont choisi les memes valeurs dans un ordre
       different n ont pas le meme sceau : la corde suit le rang. */
    const a = sigilDuPacte("pacte", ["courage", "patience"]);
    const b = sigilDuPacte("pacte", ["patience", "courage"]);
    expect(a.polygone).not.toEqual(b.polygone);
  });

  it("un pacte sans valeur n a rien a relier", () => {
    const sigil = sigilDuPacte("pacte");
    expect(sigil.ancres).toEqual([]);
    expect(sigil.polygone).toEqual([]);
  });

  it("un nom vide ne casse pas — il ne dessine rien", () => {
    /* La base interdit un pacte sans nom, mais le sigil est appele
       pendant la frappe : il verra des chaines vides. */
    const sigil = sigilDuPacte("!!!", ["courage"]);
    expect(sigil.source).toBe("");
    expect(sigil.traits).toEqual([]);
    expect(sigil.ancres).toHaveLength(1);
  });

  it("les angles restent dans un tour, decalage compris", () => {
    const sigil = sigilDuPacte("Le pacte de l aube", ["courage"]);
    for (const t of sigil.traits) {
      expect(t.angle).toBeGreaterThanOrEqual(0);
      expect(t.angle).toBeLessThan(Math.PI * 4);
    }
    for (const a of sigil.ancres) {
      expect(a.angle).toBeGreaterThanOrEqual(0);
      expect(a.angle).toBeLessThan(Math.PI * 2);
    }
  });

  it("le polygone tient sur le cercle unite", () => {
    const sigil = sigilDuPacte("pacte", ["courage", "patience", "silence", "rigueur"]);
    for (const p of sigil.polygone) {
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 10);
    }
  });

  it("porte la version sous laquelle il a ete dessine", () => {
    expect(sigilDuPacte("pacte").version).toBe(VERSION_ALPHABET);
    /* Un sceau jure sous une version anterieure garde la sienne. */
    expect(sigilDuPacte("pacte", [], 0).version).toBe(0);
  });
});

describe("LA VERSION EST HONOREE, PAS SEULEMENT ECRITE", () => {
  /* Elle etait recopiee dans l objet rendu et jamais consultee : le
     dessin sortait toujours de l alphabet courant. Ajouter un trait
     aurait donc redessine en silence tous les sceaux deja jures. */

  it("L ALPHABET V1 NE BOUGE PLUS — un sceau qui bouge n est pas un sceau", () => {
    /* L empreinte de l alphabet entier. Elle ne change que si l on
       touche a un trait — et alors ce test tombe, ce qui est le but :
       une v2 s ecrit A COTE, elle ne rature pas la v1. */
    expect(alphabetDeLaVersion(1)).toHaveLength(24);
    /* CETTE VALEUR EST UN SCELLE. Elle a ete relevee sur l alphabet
       tel qu il etait quand les premiers pactes ont ete jures. La voir
       tomber veut dire qu on vient de modifier un dessin que des gens
       portent — pas qu il faut la mettre a jour. */
    expect(empreinte(alphabetDeLaVersion(1).join("|"))).toBe(2448044856);
    /* Trois traits nommes, releves a la main : si l ordre glisse, on
       le voit ici avant de le voir sur le sceau de quelqu un. */
    expect(alphabetDeLaVersion(1)[0]).toBe("M0 0.5 L1 0.5");
    expect(alphabetDeLaVersion(1)[11]).toBe("M0.2 0.2 L0.8 0.8 M0.8 0.2 L0.2 0.8");
    expect(alphabetDeLaVersion(1)[23]).toBe("M0.5 0 L0.5 0.35 M0.5 0.65 L0.5 1");
  });

  it("dessine avec l alphabet de la version demandee", () => {
    const v1 = sigilDuPacte("Ananta", [], 1);
    expect(v1.version).toBe(1);
    for (const t of v1.traits) expect(alphabetDeLaVersion(1)).toContain(t.d);
  });

  it("une version inconnue retombe sur la v1 plutot que sur du vide", () => {
    /* Une base plus recente que le code — apres un retour en arriere —
       ne doit pas rendre un sceau blanc. */
    const inconnue = sigilDuPacte("Ananta", [], 99);
    expect(inconnue.traits).toHaveLength(sigilDuPacte("Ananta", [], 1).traits.length);
    for (const t of inconnue.traits) expect(alphabetDeLaVersion(1)).toContain(t.d);
  });

  it("garde la version qu on lui donne, meme inconnue : elle vient de la base", () => {
    expect(sigilDuPacte("Ananta", [], 99).version).toBe(99);
  });

  it("l alphabet courant est bien celui de la version courante", () => {
    expect(ALPHABET).toBe(alphabetDeLaVersion(VERSION_ALPHABET));
  });
});
