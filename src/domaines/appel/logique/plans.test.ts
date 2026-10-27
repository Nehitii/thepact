import { describe, expect, it } from "vitest";
import { INCLINAISONS_BASE, NB_ANNEAUX } from "./coeur";
import { recitNeuf, type EtatDuRecit } from "./coeurRecit";
import { NOEUDS_BASE } from "./espace";
import {
  COUP_INCLINAISON, DERIVE_PAR_ANNEAU, INCLINAISON_MAX, PATIENCE_DU_VERROU, VIRAGE_DES_NOEUDS,
  aCoupDuVerrou, avancerLeVerrou, avancerLesPlans, plansNeufs, verrouNeuf, type EtatDesPlans,
} from "./plans";

const DT = 1 / 60;
const recit = (sur: Partial<EtatDuRecit> = {}): EtatDuRecit => ({ ...recitNeuf(), ...sur });

/* Fait tourner les ressorts `secondes` durant, et rend la trace de
   l inclinaison de chaque anneau. */
function faireTourner(plans: EtatDesPlans, secondes: number, r: EtatDuRecit, noeuds = [...NOEUDS_BASE]) {
  const traces: number[][] = Array.from({ length: NB_ANNEAUX }, () => []);
  for (let i = 0; i < Math.round(secondes / DT); i++) {
    avancerLesPlans(plans, DT, 0.3, r, noeuds);
    for (let k = 0; k < NB_ANNEAUX; k++) traces[k].push(plans.incl[k]);
  }
  return traces;
}

describe("les plans des anneaux", () => {
  it("restent a leur base tant que rien n est aligne", () => {
    const plans = plansNeufs();
    faireTourner(plans, 3, recit());
    for (let i = 0; i < NB_ANNEAUX; i++) {
      expect(plans.incl[i]).toBeCloseTo(INCLINAISONS_BASE[i], 10);
      expect(plans.noeud[i]).toBeCloseTo(NOEUDS_BASE[i], 10);
    }
  });

  /* LE PLAN PIVOTE AU LIEU D ETRE ECRASE : l inclinaison va vers 0,42,
     et le noeud vire — chaque anneau de son cote. */
  it("pivotent vers l alignement, inclinaison et noeud", () => {
    const plans = plansNeufs();
    plans.dernierSeuil = 0;
    faireTourner(plans, 6, recit({ seuilAtteint: 0, alignement: 1 }));
    for (let i = 0; i < NB_ANNEAUX; i++) {
      expect(plans.incl[i]).toBeCloseTo(0.42, 4);
      expect(plans.noeud[i]).toBeCloseTo(NOEUDS_BASE[i] + VIRAGE_DES_NOEUDS[i], 4);
    }
  });

  /* L ELAN : un ressort sous-amorti depasse sa cible et revient. C est ce
     qui donne une masse plutot qu une consigne. */
  it("depassent leur cible avant de s y poser", () => {
    const plans = plansNeufs();
    plans.dernierSeuil = 0;
    const traces = faireTourner(plans, 4, recit({ seuilAtteint: 0, alignement: 1 }));
    const depasse = traces[3].some((v) => v < 0.42 - 0.01);
    expect(INCLINAISONS_BASE[3]).toBeGreaterThan(0.42);
    expect(depasse).toBe(true);
  });

  /* LES CINQ NE PARTENT PAS ENSEMBLE : l anneau exterieur suit avec un
     retard, et un plan qui arrive apres les autres se lit comme un
     mecanisme, pas comme une piece. */
  it("etagent leur depart de l interieur vers l exterieur", () => {
    const plans = plansNeufs();
    plans.dernierSeuil = 0;
    avancerLesPlans(plans, DT, 0.3, recit({ seuilAtteint: 0, alignement: 0.6 }), [...NOEUDS_BASE]);
    for (let i = 1; i < NB_ANNEAUX; i++) expect(plans.avance[i]).toBeLessThan(plans.avance[i - 1]);
  });

  /* LE COUP SE DONNE AU FRANCHISSEMENT, UNE FOIS : plein au deuxieme
     seuil, un cinquieme de moins aux autres. */
  it("frappent au franchissement d un seuil, et une seule fois", () => {
    const plein = plansNeufs();
    plein.dernierSeuil = 0;
    avancerLesPlans(plein, 1e-9, 0, recit({ seuilAtteint: 1 }), [...NOEUDS_BASE]);
    expect(plein.vIncl[0]).toBeCloseTo(COUP_INCLINAISON[0], 6);

    const faible = plansNeufs();
    avancerLesPlans(faible, 1e-9, 0, recit({ seuilAtteint: 0 }), [...NOEUDS_BASE]);
    expect(faible.vIncl[0]).toBeCloseTo(COUP_INCLINAISON[0] * 0.18, 6);

    const vitesse = plein.vIncl[0];
    avancerLesPlans(plein, 1e-9, 0, recit({ seuilAtteint: 1 }), [...NOEUDS_BASE]);
    expect(plein.vIncl[0]).toBeCloseTo(vitesse, 6);
  });

  it("ne passent jamais le plan de face", () => {
    const plans = plansNeufs();
    plans.vIncl = plans.vIncl.map(() => 400);
    avancerLesPlans(plans, DT, 1, recit({ seuilAtteint: 3, alignement: 1 }), [...NOEUDS_BASE]);
    for (const v of plans.incl) expect(Math.abs(v)).toBeLessThanOrEqual(INCLINAISON_MAX);
  });

  /* LA DERIVE S AJOUTE APRES LE RESSORT : le noeud peint est celui du
     ressort plus la derive, anneau par anneau. */
  it("font deriver les noeuds peints, dans les deux sens", () => {
    const plans = plansNeufs();
    const noeuds = [...NOEUDS_BASE];
    faireTourner(plans, 2, recit(), noeuds);
    expect(plans.derive).toBeGreaterThan(0);
    for (let i = 0; i < NB_ANNEAUX; i++) {
      expect(noeuds[i]).toBeCloseTo(plans.noeud[i] + plans.derive * DERIVE_PAR_ANNEAU[i], 12);
    }
    expect(Math.sign(noeuds[0] - NOEUDS_BASE[0])).toBe(-Math.sign(noeuds[1] - NOEUDS_BASE[1]));
  });
});

describe("le verrou de l alignement", () => {
  function aligner(secondes: number) {
    const plans = plansNeufs();
    const verrou = verrouNeuf();
    plans.dernierSeuil = 0;
    const r = recit({ seuilAtteint: 0, alignement: 1 });
    let maintenant = 0;
    for (let i = 0; i < Math.round(secondes / DT); i++) {
      maintenant += DT * 1000;
      avancerLesPlans(plans, DT, 0.3, r, [...NOEUDS_BASE]);
      avancerLeVerrou(verrou, plans, r.alignement, maintenant);
    }
    return verrou;
  }

  /* UN CLIQUET PAR DENT, PUIS LE CLAC : chaque anneau frappe a son
     arrivee, et le dernier arrive fait sonner les cinq. */
  it("fait claquer le verrou quand le dernier anneau arrive", () => {
    const verrou = aligner(4);
    expect(verrou.arrive.every(Boolean)).toBe(true);
    for (const t of verrou.cliquets) expect(t).toBeGreaterThan(0);
    expect(verrou.clac).toBe(Math.max(...verrou.cliquets));
  });

  it("ne claque pas avant que tous soient arrives", () => {
    const verrou = aligner(0.4);
    expect(verrou.arrive.every(Boolean)).toBe(false);
    expect(verrou.clac).toBe(-1);
  });

  /* LE FILET : un ressort qui tourne autour de sa cible sans y entrer a
     touche au bout de neuf dixiemes de seconde. */
  it("finit par claquer meme si un ressort ne se pose pas", () => {
    const plans = plansNeufs();
    const verrou = verrouNeuf();
    plans.avance.fill(1);
    plans.incl.fill(5);
    avancerLeVerrou(verrou, plans, 1, 1000);
    expect(verrou.clac).toBe(-1);
    avancerLeVerrou(verrou, plans, 1, 1000 + PATIENCE_DU_VERROU + 1);
    expect(verrou.clac).toBe(1000 + PATIENCE_DU_VERROU + 1);
  });

  it("se rearme quand l alignement retombe", () => {
    const verrou = aligner(4);
    avancerLeVerrou(verrou, plansNeufs(), 0, 9000);
    expect(verrou).toEqual(verrouNeuf());
  });

  /* LE CLAC A UNE MASSE : un a-coup vers le bas, qui retombe en un
     cinquieme de seconde — et rien en mouvement reduit. */
  it("cogne vers le bas au clac, un cinquieme de seconde", () => {
    const verrou = verrouNeuf();
    expect(aCoupDuVerrou(verrou, 500, false)).toBe(0);
    verrou.clac = 1000;
    expect(aCoupDuVerrou(verrou, 1000, false)).toBe(3.2);
    expect(aCoupDuVerrou(verrou, 1100, false)).toBeCloseTo(0.2, 12);
    expect(aCoupDuVerrou(verrou, 1200, false)).toBe(0);
    expect(aCoupDuVerrou(verrou, 1000, true)).toBe(0);
  });
});
