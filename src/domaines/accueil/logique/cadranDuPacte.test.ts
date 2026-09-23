import { describe, expect, it } from "vitest";
import {
  angleDeLHeure, angleDuDelai, arc, polaire, satellites, secteursDesPaliers, CENTRE,
} from "./cadranDuPacte";
import { lireLeTableau } from "./lectureDuTableau";
import { MAINTENANT, OBJECTIFS, PACTE } from "./scenarioDuTableau";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   La géométrie du cadran se trompe sans rien casser : un secteur qui
   déborde sur son voisin, un objectif posé hors de son palier, un arc
   de plus d'un demi-tour tracé par le petit côté. Le dessin reste
   joli, et il ment.
   ═══════════════════════════════════════════════════════════════ */

const { paliers } = lireLeTableau(OBJECTIFS, PACTE, MAINTENANT);
const secteurs = secteursDesPaliers(paliers);

describe("les secteurs des paliers", () => {
  it("font le tour, écarts compris, sans se chevaucher", () => {
    const largeurs = secteurs.reduce((s, x) => s + (x.fin - x.debut), 0);
    expect(largeurs + secteurs.length * 2).toBeCloseTo(360, 6);
    secteurs.slice(1).forEach((s, i) => expect(s.debut).toBeGreaterThan(secteurs[i].fin));
  });

  it("donne à chaque palier au moins vingt-quatre degrés", () => {
    secteurs.forEach((s) => expect(s.fin - s.debut).toBeGreaterThanOrEqual(24));
  });

  it("donne plus de place au palier qui pèse plus", () => {
    const largeur = (cle: string) => secteurs.find((s) => s.palier.cle === cle)!;
    const lourd = largeur("custom");
    const leger = largeur("easy");
    expect(lourd.fin - lourd.debut).toBeGreaterThan(leger.fin - leger.debut);
  });
});

describe("les satellites", () => {
  const sats = satellites(OBJECTIFS, secteurs);

  it("placent chaque objectif, une fois", () => {
    expect(sats).toHaveLength(OBJECTIFS.length);
    expect(new Set(sats.map((s) => s.objectif.id)).size).toBe(OBJECTIFS.length);
  });

  it("posent chaque objectif dans le secteur de son palier", () => {
    for (const s of sats) {
      const secteur = secteurs.find((x) => x.palier.cle === s.objectif.difficulte)!;
      expect(s.angle).toBeGreaterThan(secteur.debut);
      expect(s.angle).toBeLessThan(secteur.fin);
    }
  });
});

describe("le repère", () => {
  it("met zéro en haut et tourne comme une horloge", () => {
    expect(polaire(0, 100)).toEqual({ x: CENTRE, y: CENTRE - 100 });
    const droite = polaire(90, 100);
    expect(droite.x).toBeCloseTo(CENTRE + 100);
    expect(droite.y).toBeCloseTo(CENTRE);
  });

  it("trace un arc de plus d'un demi-tour par le grand côté", () => {
    expect(arc(100, 0, 270)).toMatch(/ A 100 100 0 1 1 /);
    expect(arc(100, 0, 90)).toMatch(/ A 100 100 0 0 1 /);
  });

  it("borne le délai au pacte et la journée à vingt-quatre heures", () => {
    expect(angleDuDelai(new Date(2020, 0, 1), PACTE.debut, PACTE.fin)).toBe(0);
    expect(angleDuDelai(new Date(2035, 0, 1), PACTE.debut, PACTE.fin)).toBe(360);
    expect(angleDeLHeure(12, 0)).toBe(180);
    expect(angleDeLHeure(19, 42)).toBeCloseTo(295.5);
  });
});
