import { describe, expect, it } from "vitest";
import {
  etapesACreer, joursNeufs, piecesACreer, POTENTIEL_PAR_DEFAUT, POTENTIELS,
  potentielDuPalier, PREFIXE_RANG, rienDeSaisi, totalChiffre, totalDesEtapes,
} from "./creation";
import type { CostItemData, EditStepItem } from "@/domaines/objectifs/types";

const etape = (name: string, extra: Partial<EditStepItem> = {}): EditStepItem =>
  ({ name, ...extra }) as EditStepItem;

describe("potentielDuPalier — ce que vaut un objectif", () => {
  it("donne son potentiel a chaque palier", () => {
    expect(POTENTIELS).toEqual({
      easy: 10, medium: 25, hard: 50, extreme: 100, impossible: 200, custom: 500,
    });
  });

  it.each(Object.entries(POTENTIELS))("le palier %s vaut %i", (palier, valeur) => {
    expect(potentielDuPalier(palier)).toBe(valeur);
  });

  /* UN PALIER INCONNU VAUT AUTANT QU UN PALIER MOYEN, pas zero : un
     objectif qui ne rapporterait rien serait indistinguable d un
     objectif qu on n a pas fait. */
  it.each(["", "chimere", "MEDIUM"])("retombe sur 25 pour « %s »", (p) => {
    expect(potentielDuPalier(p)).toBe(25);
    expect(POTENTIEL_PAR_DEFAUT).toBe(25);
  });

  /* « ?? » ET « || » SONT ICI INTERCHANGEABLES, et le balayage de
     mutations l a montre en laissant survivre le passage de l un a
     l autre. Ils ne different que sur une valeur presente mais
     fausse — c est-a-dire un potentiel de ZERO — et aucun palier n en
     a. Ce n est pas un trou dans les tests : c est du code domine par
     le contenu de la table. Le test ci-dessous est ce qui rend cette
     equivalence vraie, et la garde vraie : le jour ou un palier
     vaudrait zero, il rougirait, et le choix de l operateur
     redeviendrait un vrai choix. */
  it("ne rend jamais zero", () => {
    for (const p of ["easy", "custom", "inconnu", ""]) {
      expect(potentielDuPalier(p)).toBeGreaterThan(0);
    }
  });
});

describe("totalDesEtapes — le total qui sert d avancement", () => {
  const etapes = [etape("a"), etape("b"), etape("z", { estUltime: true })];

  /* L ETAPE ULTIME EST UN BONUS : elle ouvre le zenith et ne fait pas
     avancer. C est aussi ce que compte validated_steps a la bascule :
     les deux colonnes se lisent dans la meme unite. */
  it("exclut l etape ultime d un objectif ordinaire", () => {
    expect(totalDesEtapes("normal", etapes, 7)).toBe(2);
  });

  it("compte les jours d une habitude, pas ses etapes", () => {
    expect(totalDesEtapes("habit", etapes, 30)).toBe(30);
  });

  /* UN GROUPE COMPTE ZERO : ses membres ne sont pas des etapes, et son
     avancement se recalcule a partir d eux. */
  it("laisse un groupe a zero", () => {
    expect(totalDesEtapes("super", etapes, 30)).toBe(0);
  });

  it("laisse un objectif sans etape a zero", () => {
    expect(totalDesEtapes("normal", [], 7)).toBe(0);
  });

  it("laisse a zero un objectif dont la seule etape est l ultime", () => {
    expect(totalDesEtapes("normal", [etape("z", { estUltime: true })], 7)).toBe(0);
  });
});

describe("joursNeufs", () => {
  it("rend un tableau de faux de la longueur voulue", () => {
    const j = joursNeufs("habit", 30);
    expect(j).toHaveLength(30);
    expect(j?.every((x) => x === false)).toBe(true);
  });

  it.each(["normal", "super"] as const)("ne donne pas de jours a un objectif « %s »", (g) => {
    expect(joursNeufs(g, 30)).toBeNull();
  });
});

describe("totalChiffre — la somme des pieces", () => {
  it("additionne les prix", () => {
    expect(totalChiffre([{ price: 29 }, { price: 15.5 }])).toBe(44.5);
  });

  /* SANS LE REPLI, UNE SEULE PIECE SANS PRIX RENDRAIT LE TOTAL NaN, et
     l objectif s enregistrerait avec un cout qui ne s affiche pas. */
  it.each([null, undefined, NaN])("ne devient pas NaN sur un prix absent (%s)", (p) => {
    const t = totalChiffre([{ price: 29 }, { price: p as number }]);
    expect(Number.isNaN(t)).toBe(false);
    expect(t).toBe(29);
  });

  it("rend zero pour une liste vide", () => {
    expect(totalChiffre([])).toBe(0);
  });
});

describe("etapesACreer", () => {
  it("renumerote les rangs a partir de un", () => {
    const e = etapesACreer([etape("a"), etape("b")], "g1", (r) => `Etape ${r}`);
    expect(e.map((x) => x.order)).toEqual([1, 2]);
  });

  /* UNE ETAPE SANS TITRE EN RECOIT UN plutot que d entrer vide en
     base — et le rang qu on lui donne est le SIEN, pas l index. */
  it.each(["", "   ", undefined])("nomme une etape sans titre (%s)", (n) => {
    const e = etapesACreer([etape("a"), etape(n as string)], "g1", (r) => `Etape ${r}`);
    expect(e[1].title).toBe("Etape 2");
  });

  it("coupe les blancs autour d un titre", () => {
    expect(etapesACreer([etape("  Gammes  ")], "g1", () => "x")[0].title).toBe("Gammes");
  });

  it("pose faux, et non rien, pour les deux drapeaux", () => {
    const e = etapesACreer([etape("a")], "g1", () => "x")[0];
    expect(e.is_ultimate).toBe(false);
    expect(e.exclude_from_spin).toBe(false);
  });

  it("emporte les deux drapeaux quand ils sont poses", () => {
    const e = etapesACreer(
      [etape("z", { estUltime: true, excludeFromSpin: true })], "g1", () => "x",
    )[0];
    expect(e.is_ultimate).toBe(true);
    expect(e.exclude_from_spin).toBe(true);
  });
});

describe("piecesACreer — traduire un rang en identifiant", () => {
  const creees = [{ id: "e-un", order: 1 }, { id: "e-deux", order: 2 }];
  const piece = (nom: string, stepId?: string): CostItemData =>
    ({ id: nom, name: nom, price: 10, stepId }) as CostItemData;

  /* AVANT L ENREGISTREMENT, UNE PIECE POINTE UNE ETAPE PAR SON RANG :
     les etapes n ont pas encore d identifiant. */
  it("traduit le rang en identifiant reel", () => {
    const p = piecesACreer([piece("m", `${PREFIXE_RANG}0`), piece("p", `${PREFIXE_RANG}1`)], "g1", creees);
    expect(p.map((x) => x.step_id)).toEqual(["e-un", "e-deux"]);
  });

  /* UNE PIECE DONT LE RANG NE CORRESPOND A RIEN EST DETACHEE plutot
     que rattachee au hasard. */
  it("detache une piece dont le rang ne correspond a rien", () => {
    expect(piecesACreer([piece("m", `${PREFIXE_RANG}9`)], "g1", creees)[0].step_id).toBeNull();
  });

  it("laisse detachee une piece qui ne pointe aucune etape", () => {
    expect(piecesACreer([piece("m")], "g1", creees)[0].step_id).toBeNull();
  });

  it("remplace un prix absent par zero", () => {
    const p = piecesACreer([{ id: "x", name: "x", price: undefined } as unknown as CostItemData], "g1", []);
    expect(p[0].price).toBe(0);
  });

  it("remplace une categorie vide par rien", () => {
    const p = piecesACreer([{ id: "x", name: "x", price: 1, category: "" } as CostItemData], "g1", []);
    expect(p[0].category).toBeNull();
  });
});

describe("rienDeSaisi — Echap ne ferme que tant que rien n a ete saisi", () => {
  const vide = { nom: "", notes: "", image: "", pieces: [], membres: [] };

  it("laisse fermer un formulaire intact", () => {
    expect(rienDeSaisi(vide)).toBe(true);
  });

  /* LES ETAPES PAR DEFAUT NE COMPTENT PAS : elles sont la avant qu on
     ait touche a quoi que ce soit. Elles n entrent pas dans ce test,
     et c est exactement le point. */
  it.each([
    ["un nom", { nom: "Piano" }],
    ["des notes", { notes: "commencer doucement" }],
    ["une image", { image: "photo.png" }],
    ["une piece chiffree", { pieces: [{}] }],
    ["un membre de groupe", { membres: ["g1"] }],
  ])("retient sur %s", (_, saisie) => {
    expect(rienDeSaisi({ ...vide, ...saisie })).toBe(false);
  });

  /* DES BLANCS NE SONT PAS UNE SAISIE. */
  it("ne retient pas sur des espaces seuls", () => {
    expect(rienDeSaisi({ ...vide, nom: "   ", notes: "  " })).toBe(true);
  });
});
