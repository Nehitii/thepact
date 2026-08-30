import { describe, expect, it } from "vitest";
import {
  FOND_MAX, INCLINAISONS_BASE, NB_ANNEAUX, SEPARATION_MINIMALE, SEUILS, TAU,
  avancementDuSouffle, cadenceDesArcs, cadenceDesFilaments, cadenceDesOndes, clamp01,
  contractionDuCoeur, deplacementParGravite, geometrieDUnAnneau, intensiteDuFond, lerp,
  lobesDuCoeur, rayonDuCoeur, rayonDuSouffle, separationDesLobes, souffleDuCoeur,
  transformationDePhase, tremblement, vitesseDUnAnneau, type EtatDesAnneaux,
} from "./coeur";

describe("ce que la phase fait a l echelle", () => {
  it("laisse tout entier tant qu on tient", () => {
    for (const ph of ["attente", "montee", "critique"] as const) {
      expect(transformationDePhase(ph, 3, 0, false)).toEqual({ echelle: 1, eclat: 1, calme: 0, naissance: 1 });
    }
  });

  it("porte l eclair du seuil dans l eclat", () => {
    expect(transformationDePhase("montee", 0, 1, false).eclat).toBe(2.4);
    expect(transformationDePhase("montee", 0, 0.5, false).eclat).toBe(1.7);
  });

  it("ecrase presque tout a l implosion, en une demi-seconde", () => {
    expect(transformationDePhase("implosion", 0, 0, false)).toEqual({ echelle: 1, eclat: 1, calme: 0, naissance: 1 });
    expect(transformationDePhase("implosion", 0.25, 0, false).echelle).toBeCloseTo(0.515, 10);
    expect(transformationDePhase("implosion", 0.5, 0, false).echelle).toBeCloseTo(0.03, 10);
    /* Au-dela d une demi-seconde, plus rien ne bouge. */
    expect(transformationDePhase("implosion", 5, 0, false).echelle).toBeCloseTo(0.03, 10);
  });

  /* L ECLAIR DU SEUIL DISPARAIT DES L IMPLOSION : les deux phases qui
     ecrasent l eclat ne l additionnent pas, elles le remplacent. Sans
     cela, un seuil franchi juste avant l effondrement ajouterait un
     flash a un flash. */
  it("oublie l eclair du seuil des que l effondrement commence", () => {
    expect(transformationDePhase("implosion", 0.5, 1, false).eclat).toBe(4);
    expect(transformationDePhase("singularite", 0, 1, false).eclat).toBe(4);
  });

  it("reduit la singularite a un point", () => {
    expect(transformationDePhase("singularite", 0, 0, false)).toEqual({ echelle: 0.03, eclat: 4, calme: 0, naissance: 1 });
  });

  it("efface le coeur pendant le souffle et la revelation", () => {
    expect(transformationDePhase("explosion", 0.2, 0, false).echelle).toBe(0);
    expect(transformationDePhase("revelation", 9, 0, false).echelle).toBe(0);
  });

  /* L ASTRE D APRES SE LEVE, IL NE SURGIT PAS : une cubique sur 1,1
     seconde. Sans l option, il n y a pas d astre du tout. */
  it("fait lever l astre d apres, en une seconde et un dixieme", () => {
    expect(transformationDePhase("verrouille", 0, 0, true))
      .toEqual({ echelle: 0, eclat: 0, calme: 1, naissance: 0 });
    const milieu = transformationDePhase("verrouille", 0.55, 0, true);
    expect(milieu.naissance).toBeCloseTo(0.875, 10);
    const fin = transformationDePhase("verrouille", 1.1, 0, true);
    expect(fin).toEqual({ echelle: 0.42, eclat: 0.55, calme: 1, naissance: 1 });
    expect(transformationDePhase("verrouille", 30, 0, true).naissance).toBe(1);
  });

  it("ne laisse rien quand l astre d apres est coupe", () => {
    expect(transformationDePhase("verrouille", 5, 0, false))
      .toEqual({ echelle: 0, eclat: 1, calme: 0, naissance: 1 });
  });
});

describe("le fond, et la borne qui l empeche de tout blanchir", () => {
  it("monte avec l avancement", () => {
    expect(intensiteDuFond(0, 0, 0, 1)).toBeCloseTo(0.1, 10);
    expect(intensiteDuFond(1, 0, 0, 1)).toBeCloseTo(0.4, 10);
  });

  /* LA BORNE NE SERT QUE PENDANT UN ECLAIR. Sans eclair, la formule
     plafonne d elle-meme a 0,4 pile en fin de course : la borne ne
     mord jamais. Avec l eclair au maximum, elle mord des 65,4 % —
     et le maximum qu elle retient vaut 0,54, pas 0,4. */
  it("ne mord jamais sans eclair", () => {
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      expect(intensiteDuFond(p, 0, 0, 1)).toBeCloseTo(0.10 + p * 0.3, 12);
    }
  });

  it("mord des deux tiers de la course quand l eclair est plein", () => {
    const seuil = FOND_MAX / 1.35;
    const juste = (seuil - 0.10) / 0.3;
    expect(juste).toBeCloseTo(0.6543209876, 9);
    expect(intensiteDuFond(juste - 0.01, 1, 0, 1)).toBeLessThan(FOND_MAX);
    expect(intensiteDuFond(juste + 0.01, 1, 0, 1)).toBe(FOND_MAX);
    expect((0.10 + 1 * 0.3) * (1 + 1 * 0.35)).toBeCloseTo(0.54, 10);
  });

  /* L ASTRE D APRES A SON PROPRE FOND, QUI IGNORE TOUT LE RESTE. */
  it("suit la naissance de l astre quand le calme est venu", () => {
    expect(intensiteDuFond(1, 1, 1, 0)).toBe(0);
    expect(intensiteDuFond(1, 1, 1, 0.5)).toBe(0.06);
    expect(intensiteDuFond(0, 0, 1, 1)).toBe(0.12);
  });
});

describe("la grille courbee", () => {
  const cx = 200, cy = 300, base = 64;

  it("ne bouge pas le point du centre", () => {
    expect(deplacementParGravite(cx, cy, cx, cy, base, 1)).toEqual([cx, cy]);
  });

  it("tire les points vers le centre", () => {
    const [x] = deplacementParGravite(cx + 400, cy, cx, cy, base, 0.5);
    expect(x).toBeLessThan(cx + 400);
    expect(x).toBeGreaterThan(cx);
  });

  /* PASSE UNE CERTAINE PROXIMITE, LA GRILLE SE RETOURNE : le
   * deplacement depasse la distance, et le point ressort de l autre
   * cote. Le rayon exact vaut `base x racine(2,6 p)` — a p = 1 et une
   * base de 64, cela fait 103,2 pixels. C est le pli visible au milieu
   * de l image, et c est la formule, pas un reglage. */
  it("retourne la grille en deca d un rayon que l on sait calculer", () => {
    const rayon = base * Math.sqrt(2.6 * 1);
    expect(rayon).toBeCloseTo(103.197, 3);
    const [dedans] = deplacementParGravite(cx + rayon - 5, cy, cx, cy, base, 1);
    expect(dedans).toBeLessThan(cx);
    const [dehors] = deplacementParGravite(cx + rayon + 5, cy, cx, cy, base, 1);
    expect(dehors).toBeGreaterThan(cx);
  });

  it("courbe d autant moins que l avancement est faible", () => {
    const loin = cx + 150;
    const [a] = deplacementParGravite(loin, cy, cx, cy, base, 0);
    const [b] = deplacementParGravite(loin, cy, cx, cy, base, 1);
    expect(loin - a).toBeLessThan(loin - b);
  });
});

describe("les anneaux", () => {
  const etat = (p: number, sur: Partial<EtatDesAnneaux> = {}): EtatDesAnneaux => ({
    p, base: 64, echelle: 1, eclat: 1, impulsion: 0, purge: 0,
    ecarts: Array.from({ length: NB_ANNEAUX }, () => 0),
    excentrique: 0, inclinaisons: [...INCLINAISONS_BASE],
    angles: [0, 1, 2, 3, 4], cx: 0, cy: 0, ...sur,
  });

  it("ecarte les anneaux les uns des autres", () => {
    const rayons = Array.from({ length: NB_ANNEAUX }, (_, i) => geometrieDUnAnneau(i, etat(0.5)).rx);
    for (let i = 1; i < rayons.length; i++) expect(rayons[i]).toBeGreaterThan(rayons[i - 1]);
  });

  it("aplatit chaque anneau selon son inclinaison", () => {
    for (let i = 0; i < NB_ANNEAUX; i++) {
      const a = geometrieDUnAnneau(i, etat(0.5));
      expect(a.ry).toBeCloseTo(a.rx * INCLINAISONS_BASE[i], 12);
    }
  });

  /* NI `rx` NI `alpha` NE PEUVENT DEVENIR NEGATIFS, ET LE
   * `Math.max(0, ...)` DU TRACE EST DONC DOMINE — par une propriete
   * etablie ailleurs : l avancement est borne a un avant d entrer ici.
   * Le facteur de retrait vaut encore 0,79 a p = 1 ; il ne passe sous
   * zero qu a p = 1,5643, ce que `clamp01` interdit. */
  it("garde des rayons positifs sur tout l avancement possible", () => {
    for (let i = 0; i <= 1000; i++) {
      for (let k = 0; k < NB_ANNEAUX; k++) {
        const a = geometrieDUnAnneau(k, etat(clamp01(i / 1000), { ecarts: [0.85, 0.85, 0.85, 0.85, 0.85], purge: 1, impulsion: 1 }));
        expect(a.rx).toBeGreaterThanOrEqual(0);
        expect(a.alpha).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("passe sous zero des qu on retire la borne d avancement", () => {
    const bascule = 0.85 + 1 / 1.4;
    expect(bascule).toBeCloseTo(1.5642857143, 9);
    expect(geometrieDUnAnneau(0, etat(bascule - 0.01)).rx).toBeGreaterThan(0);
    expect(geometrieDUnAnneau(0, etat(bascule + 0.01)).rx).toBeLessThan(0);
  });

  /* LES ANNEAUX S EFFACENT VERS L EXTERIEUR : chaque anneau plus loin
     est un dixieme moins opaque que le precedent. Sans cela, les cinq
     se lisent comme une cible et non comme une profondeur. */
  it("pâlit anneau apres anneau", () => {
    const alphas = Array.from({ length: NB_ANNEAUX }, (_, i) => geometrieDUnAnneau(i, etat(0.5)).alpha);
    for (let i = 1; i < alphas.length; i++) expect(alphas[i]).toBeLessThan(alphas[i - 1]);
    expect(alphas[4] / alphas[0]).toBeCloseTo(0.6, 10);
  });

  it("efface un anneau que la rupture a disperse", () => {
    const disperse = geometrieDUnAnneau(0, etat(1, { ecarts: [1, 0, 0, 0, 0] }));
    expect(disperse.alpha).toBe(0);
    expect(disperse.rx).toBeGreaterThan(geometrieDUnAnneau(0, etat(1)).rx);
  });

  it("decentre les orbites au troisieme seuil, et pas avant", () => {
    expect(geometrieDUnAnneau(0, etat(1)).ex).toBe(0);
    expect(geometrieDUnAnneau(0, etat(1, { excentrique: 1 })).ex).not.toBe(0);
  });

  /* LA VITESSE EST QUADRATIQUE : elle reste basse longtemps, puis
     s emballe. A mi-course l anneau ne tourne qu a 23 % de sa vitesse
     finale — la moitie du temps ne donne pas la moitie du mouvement. */
  it("s emballe tard", () => {
    const v = (p: number) => vitesseDUnAnneau(0, p, 1);
    expect(v(0)).toBeCloseTo(0.12, 10);
    expect(v(1)).toBeCloseTo(7.12, 10);
    expect(v(0.5) / v(1)).toBeCloseTo(0.2308, 4);
  });

  /* CHAQUE ANNEAU PLUS LOIN TOURNE PLUS VITE — de 13 % par rang. Des
     vitesses egales feraient cinq cercles solidaires, donc un seul
     objet ; c est l ecart qui donne l impression de volume. */
  it("fait tourner les anneaux exterieurs plus vite", () => {
    const v = Array.from({ length: NB_ANNEAUX }, (_, i) => vitesseDUnAnneau(i, 0.7, 1));
    for (let i = 1; i < v.length; i++) expect(v[i]).toBeGreaterThan(v[i - 1]);
    expect(v[4] / v[0]).toBeCloseTo(1.52, 10);
  });

  it("fait tourner un anneau sur deux a l envers", () => {
    expect(vitesseDUnAnneau(1, 1, -1)).toBeLessThan(0);
    expect(vitesseDUnAnneau(0, 1, 1)).toBeGreaterThan(0);
  });
});

describe("le coeur", () => {
  /* LA CONTRACTION REBONDIT : le creux n est pas a l appui maximal
     mais juste apres, quand l impulsion redescend a 0,7. C est ce qui
     donne le coup sec plutot qu un enfoncement. */
  it("creuse au plus fort juste apres l appui, pas pendant", () => {
    expect(contractionDuCoeur(0.7)).toBeCloseTo(0.846, 10);
    expect(contractionDuCoeur(1)).toBeCloseTo(0.93, 10);
    expect(contractionDuCoeur(0.7)).toBeLessThan(contractionDuCoeur(1));
    expect(contractionDuCoeur(0)).toBe(1);
  });

  /* L AMPLITUDE EST PRISE AU SOMMET EXACT DU SINUS, pas par
     echantillonnage : un balayage rate le sommet de peu et laisse
     passer une amplitude figee — c est exactement la mutation qui a
     survecu au premier balayage. */
  it("bat plus fort a mesure qu on avance", () => {
    const sommet = (p: number) => {
      const omega = 2 + p * 14;
      return souffleDuCoeur((1000 * Math.PI) / (2 * omega), p, false);
    };
    expect(sommet(0)).toBeCloseTo(1.02, 12);
    expect(sommet(0.5)).toBeCloseTo(1.055, 12);
    expect(sommet(1)).toBeCloseTo(1.09, 12);
  });

  /* ET IL BAT PLUS VITE : la periode passe de trois secondes a moins
     de quatre dixiemes. */
  it("bat plus vite a mesure qu on avance", () => {
    const periode = (p: number) => (2 * Math.PI * 1000) / (2 + p * 14);
    expect(periode(0)).toBeCloseTo(3141.59, 2);
    expect(periode(1)).toBeCloseTo(392.7, 1);
    for (const p of [0, 0.3, 1]) {
      expect(souffleDuCoeur(periode(p), p, false)).toBeCloseTo(1, 10);
    }
  });

  it("ne bat plus du tout quand la main s est retiree", () => {
    for (const t of [0, 137, 4021]) expect(souffleDuCoeur(t, 1, true)).toBe(1);
  });

  it("retrecit l astre calme d un cinquieme", () => {
    expect(rayonDuCoeur(64, 1, 1, 0, 1, 1)).toBe(rayonDuCoeur(64, 1, 1, 0, 1, 0) * 0.8);
  });

  /* LE DEDOUBLEMENT S OUVRE ET SE REFERME : un sinus, donc nul aux
     deux bouts. Sous un demi-pixel on repasse a un seul lobe — sans
     quoi deux cercles superposes doubleraient l eclat du centre. */
  it("se dedouble au milieu de la scission, et pas aux bouts", () => {
    expect(separationDesLobes(0, 64, 1)).toBe(0);
    expect(separationDesLobes(1, 64, 1)).toBeCloseTo(0, 12);
    expect(separationDesLobes(0.5, 64, 1)).toBeCloseTo(14.08, 10);
  });

  it("revient a un seul lobe sous un demi-pixel", () => {
    expect(SEPARATION_MINIMALE).toBe(0.5);
    expect(lobesDuCoeur(10, 20, 0.5)).toEqual([[10, 20]]);
    expect(lobesDuCoeur(10, 20, 0.51)).toEqual([[9.49, 20], [10.51, 20]]);
  });

  it("ne tremble qu au-dela de la moitie de la course", () => {
    expect(tremblement(0.55, false, 0)).toBe(0);
    expect(tremblement(0.55, false, 1)).toBe(0);
    expect(tremblement(1, false, 0)).toBeCloseTo(11.7, 10);
    expect(tremblement(1, false, 1)).toBeCloseTo(23.4, 10);
    expect(tremblement(1, true, 1)).toBe(0);
  });
});

describe("les cadences et le souffle", () => {
  it("resserrent les emissions a mesure qu on avance", () => {
    expect(cadenceDesOndes(0)).toBe(1500);
    expect(cadenceDesOndes(1)).toBe(170);
    expect(cadenceDesFilaments(0)).toBe(420);
    expect(cadenceDesFilaments(1)).toBe(40);
    expect(cadenceDesArcs(0)).toBe(900);
    expect(cadenceDesArcs(1)).toBe(70);
    for (const f of [cadenceDesOndes, cadenceDesFilaments, cadenceDesArcs]) {
      expect(f(0.5)).toBe(lerp(f(0), f(1), 0.5));
    }
  });

  /* LE SOUFFLE DURE PLUS LONGTEMPS QUAND ON NE BOUGE PAS, ET IL EST
     ALORS LINEAIRE : la meme onde, sans l a-coup. */
  it("part vite en mouvement et regulier a l arret", () => {
    expect(avancementDuSouffle(0.55, false)).toBe(1);
    expect(avancementDuSouffle(0.55, true)).toBeCloseTo(0.6111, 4);
    expect(avancementDuSouffle(9, true)).toBe(1);
    expect(rayonDuSouffle(0.25, 900, false)).toBeGreaterThan(rayonDuSouffle(0.25, 900, true));
    expect(rayonDuSouffle(1, 900, false)).toBe(900);
    expect(rayonDuSouffle(1, 900, true)).toBe(900);
  });
});

describe("les constantes qui tiennent le dessin", () => {
  it("posent quatre seuils, cinq anneaux, un tour complet", () => {
    expect(SEUILS).toEqual([0.25, 0.5, 0.75, 0.9]);
    expect(NB_ANNEAUX).toBe(5);
    expect(INCLINAISONS_BASE).toHaveLength(NB_ANNEAUX);
    expect(TAU).toBe(Math.PI * 2);
  });

  /* LES SEUILS SONT RANGES, ET LE RECIT EN DEPEND : il descend depuis
     le dernier et s arrete au premier franchi. Un tableau desordonne
     ferait sauter des paliers. */
  it("rangent les seuils dans l ordre", () => {
    for (let i = 1; i < SEUILS.length; i++) expect(SEUILS[i]).toBeGreaterThan(SEUILS[i - 1]);
  });
});
