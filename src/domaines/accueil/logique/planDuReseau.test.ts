import { describe, expect, it } from "vitest";
import { MERIDIEN, PAS, TRACES, placerLesStations, pointDuTrace, troncon } from "./planDuReseau";
import { LIGNES, VALEUR_DE_L_OBJECTIF, etapesRestantes, stationCourante } from "./scenarioEtendu";
import { OBJECTIFS } from "./scenarioDuTableau";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Le plan du réseau promet deux choses qu'un dessin peut trahir sans
   rien casser : tous les trains sont à quai sur le méridien du jour,
   et les lignes ne connaissent que l'horizontale et la diagonale à
   quarante-cinq degrés. Un coude à 38 degrés, un train posé une
   station trop tôt, et le plan ment en restant joli.
   ═══════════════════════════════════════════════════════════════ */

describe("le méridien", () => {
  it("porte la station courante de chaque ligne ouverte", () => {
    for (const l of LIGNES.filter((x) => !x.projet)) {
      const courante = placerLesStations(l).filter((s) => s.courante);
      expect(courante, l.objectif).toHaveLength(1);
      expect(courante[0].point.x, l.objectif).toBeCloseTo(MERIDIEN);
    }
  });

  it("laisse les étapes franchies à gauche, et celles qui viennent à droite", () => {
    for (const l of LIGNES) {
      for (const s of placerLesStations(l)) {
        if (s.faite) expect(s.s, `${l.objectif} · ${s.titre}`).toBeLessThan(0);
        else expect(s.s, `${l.objectif} · ${s.titre}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("ne met aucun train sur une ligne en projet", () => {
    for (const l of LIGNES.filter((x) => x.projet)) {
      expect(placerLesStations(l).some((s) => s.courante), l.objectif).toBe(false);
    }
  });
});

describe("la grammaire du métro", () => {
  it("n'emploie que l'horizontale et la diagonale à 45 degrés", () => {
    for (const [objectif, t] of Object.entries(TRACES)) {
      if (t.boucle) continue;
      /* Un échantillon qui enjambe un coude n'est ni plat ni à 45 degrés :
         il y en a au plus un par coude, soit quatre. Une diagonale à
         38 degrés en produirait des dizaines. */
      let horsGrammaire = 0;
      for (let s = -600; s < 600; s += 3) {
        const a = pointDuTrace(t, s);
        const b = pointDuTrace(t, s + 3);
        const dx = Math.abs(b.x - a.x);
        const dy = Math.abs(b.y - a.y);
        if (dy > 1e-6 && Math.abs(dx - dy) > 1e-6) horsGrammaire += 1;
      }
      expect(horsGrammaire, objectif).toBeLessThanOrEqual(4);
    }
  });

  it("pose ses coudes dans le chemin, pour que la ligne les suive", () => {
    const t = TRACES.semi;
    const d = troncon(t, -400, 400);
    expect(d.split(/[ML]/).filter(Boolean).length).toBe(7);
  });

  it("espace les stations d'un pas", () => {
    const [a, b] = placerLesStations(LIGNES.find((l) => l.objectif === "atelier")!);
    expect(b.s - a.s).toBe(PAS);
  });

  it("referme une ligne en boucle sur son départ", () => {
    const t = TRACES.mediter;
    const r = t.boucle!.rayon;
    const haut = pointDuTrace(t, 0);
    const bas = pointDuTrace(t, Math.PI * r);
    expect(haut.x).toBeCloseTo(MERIDIEN);
    expect(bas.y - haut.y).toBeCloseTo(2 * r);
  });
});

describe("le scénario étendu", () => {
  it("rattache chaque objectif à l'une des trois valeurs", () => {
    for (const o of OBJECTIFS) expect(VALEUR_DE_L_OBJECTIF[o.id], o.id).toBeDefined();
  });

  it("donne une ligne à chaque objectif qui n'est pas tenu", () => {
    const ouverts = OBJECTIFS.filter((o) => o.statut !== "fully_completed").map((o) => o.id).sort();
    expect(LIGNES.map((l) => l.objectif).sort()).toEqual(ouverts);
  });

  it("met le train à la première étape qui n'est pas faite", () => {
    const semi = LIGNES.find((l) => l.objectif === "semi")!;
    expect(semi.stations[stationCourante(semi)].titre).toBe("15 km sans marcher");
  });

  it("compte les étapes qui restent, habitudes à part", () => {
    expect(etapesRestantes(OBJECTIFS)).toBe(151);
  });
});
