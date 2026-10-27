import type { Palier } from "./lectureDuTableau";
import type { Difficulte, ObjectifDuScenario } from "./scenarioDuTableau";

/* LA GEOMETRIE DU CADRAN.
 *
 * Un repere unique : le centre en (500, 500), les angles en degres,
 * zero en haut, dans le sens des aiguilles d une montre — celui d une
 * horloge, parce que deux des anneaux sont des horloges (la journee,
 * le delai du pacte).
 *
 * LES SECTEURS SUIVENT LE VOLUME, AVEC UN PLANCHER. Un palier prend
 * une part du cercle a proportion de ses etapes — le palier qui pese
 * soixante-deux etapes doit se voir plus que celui qui en pese quatre.
 * Mais sans plancher, un palier de quatre etapes tiendrait sur six
 * degres et ses trois objectifs s y chevaucheraient. Chacun recoit donc
 * vingt-quatre degres, et le reste se partage au volume. */

export const CENTRE = 500;
export const RAYONS = { paliers: 160, satellites: 196, delai: 270, journee: 340, rang: 402 } as const;

export interface Point { x: number; y: number }

export function polaire(angle: number, r: number): Point {
  const a = (angle * Math.PI) / 180;
  return { x: CENTRE + r * Math.sin(a), y: CENTRE - r * Math.cos(a) };
}

/** Un arc de cercle, de a0 a a1 degres, dans le sens des aiguilles. */
export function arc(r: number, a0: number, a1: number): string {
  const balayage = Math.max(0, Math.min(359.99, a1 - a0));
  const p0 = polaire(a0, r);
  const p1 = polaire(a0 + balayage, r);
  const grand = balayage > 180 ? 1 : 0;
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${grand} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

export interface Secteur {
  palier: Palier;
  debut: number;
  fin: number;
}

const ECART = 2;
const PLANCHER = 24;

export function secteursDesPaliers(paliers: readonly Palier[]): Secteur[] {
  const n = paliers.length;
  if (n === 0) return [];
  const libre = 360 - n * ECART - n * PLANCHER;
  const volume = paliers.reduce((s, p) => s + p.etapes, 0) || 1;
  let angle = ECART / 2;
  return paliers.map((palier) => {
    const largeur = PLANCHER + (libre * palier.etapes) / volume;
    const s = { palier, debut: angle, fin: angle + largeur };
    angle += largeur + ECART;
    return s;
  });
}

export interface Satellite {
  objectif: ObjectifDuScenario;
  angle: number;
  point: Point;
  rayon: number;
  teinte: string;
}

/** Chaque objectif sur son secteur, a intervalle egal. Le diametre suit
 *  la racine du nombre d etapes : c est l AIRE du point qui dit le poids. */
export function satellites(
  objectifs: readonly ObjectifDuScenario[],
  secteurs: readonly Secteur[],
): Satellite[] {
  const plusLourd = Math.max(1, ...objectifs.map((o) => o.etapes));
  return secteurs.flatMap((s) => {
    const du = objectifs.filter((o) => o.difficulte === (s.palier.cle as Difficulte));
    return du.map((objectif, i) => {
      const angle = s.debut + ((i + 0.5) * (s.fin - s.debut)) / du.length;
      const poids = objectif.habitude ? 0.35 : Math.sqrt(objectif.etapes / plusLourd);
      return {
        objectif,
        angle,
        point: polaire(angle, RAYONS.satellites),
        rayon: 6 + 9 * poids,
        teinte: s.palier.teinte,
      };
    });
  });
}

/** L angle d une date sur l anneau du delai : le pacte fait le tour. */
export function angleDuDelai(date: Date, debut: Date, fin: Date): number {
  const t = (date.getTime() - debut.getTime()) / (fin.getTime() - debut.getTime());
  return Math.max(0, Math.min(1, t)) * 360;
}

/** L angle d une heure sur l anneau de la journee. */
export function angleDeLHeure(heures: number, minutes: number): number {
  return ((heures * 60 + minutes) / 1440) * 360;
}
