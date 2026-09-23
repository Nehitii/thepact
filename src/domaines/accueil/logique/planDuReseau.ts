import type { Ligne, Valeur } from "./scenarioEtendu";
import { stationCourante } from "./scenarioEtendu";

/* LA GEOMETRIE DU PLAN DU RESEAU.
 *
 * LE MERIDIEN D AUJOURD HUI. Chaque ligne passe par une verticale
 * commune, et la station ou se trouve son train est posee dessus. Les
 * stations franchies s egrenent a gauche, a pas regulier, celles qui
 * viennent a droite. Le plan est un schema, pas une carte : un pas est
 * une station, pas une duree — c est ce qui permet d aligner tous les
 * trains sans mentir sur les dates, que le tableau des departs donne.
 *
 * LA GRAMMAIRE DU METRO : l horizontale et la diagonale a 45 degres,
 * rien d autre. Chaque ligne quitte le meridien a plat, puis bifurque
 * d un coude a 45 degres vers son origine (a gauche) et vers son
 * terminus (a droite) — c est ce qui eventaille les faisceaux et
 * separe les terminus pour leurs noms.
 *
 * UN TRONCON EXPRESS (« + 11 stations ») tient la place de deux pas :
 * il se dessine en pointille, et dit combien il en cache. */

export const LARGEUR = 1600;
export const HAUTEUR = 880;
export const MERIDIEN = 860;
export const PAS = 64;
const RAC2 = Math.SQRT2;

export interface Point { x: number; y: number }

/** Le trace d une ligne autour du meridien. */
export interface Trace {
  y: number;
  gauche: { plat: number; dy: number };
  droite: { plat: number; dy: number };
  boucle?: { rayon: number };
}

export const ZONES: readonly { valeur: Valeur; numero: number; y0: number; y1: number }[] = [
  { valeur: "Liberté", numero: 1, y0: 64, y1: 292 },
  { valeur: "Discipline", numero: 2, y0: 300, y1: 598 },
  { valeur: "Création", numero: 3, y0: 606, y1: 846 },
];

export const TRACES: Record<string, Trace> = {
  salariat: { y: 150, gauche: { plat: 96, dy: -44 }, droite: { plat: 150, dy: -52 } },
  epargne: { y: 178, gauche: { plat: 128, dy: 40 }, droite: { plat: 190, dy: 0 } },
  voyage: { y: 206, gauche: { plat: 0, dy: 0 }, droite: { plat: 110, dy: 50 } },
  semi: { y: 362, gauche: { plat: 150, dy: -40 }, droite: { plat: 170, dy: -46 } },
  japonais: { y: 390, gauche: { plat: 110, dy: 30 }, droite: { plat: 210, dy: 0 } },
  souder: { y: 418, gauche: { plat: 0, dy: 0 }, droite: { plat: 96, dy: 44 } },
  mediter: { y: 470, gauche: { plat: 0, dy: 0 }, droite: { plat: 0, dy: 0 }, boucle: { rayon: 58 } },
  roman: { y: 672, gauche: { plat: 90, dy: -40 }, droite: { plat: 130, dy: -48 } },
  atelier: { y: 700, gauche: { plat: 140, dy: 36 }, droite: { plat: 200, dy: 0 } },
  lire: { y: 728, gauche: { plat: 100, dy: 60 }, droite: { plat: 150, dy: 56 } },
};

/** Le point du trace a la distance s du meridien (s < 0 : a gauche). */
export function pointDuTrace(t: Trace, s: number): Point {
  if (t.boucle) {
    const r = t.boucle.rayon;
    const a = s / r;
    return { x: MERIDIEN + r * Math.sin(a), y: t.y + r - r * Math.cos(a) };
  }
  const cote = s >= 0 ? t.droite : t.gauche;
  const sens = s >= 0 ? 1 : -1;
  const d = Math.abs(s);
  const diag = Math.abs(cote.dy) * RAC2;
  if (d <= cote.plat) return { x: MERIDIEN + sens * d, y: t.y };
  if (d <= cote.plat + diag) {
    const u = (d - cote.plat) / RAC2;
    return { x: MERIDIEN + sens * (cote.plat + u), y: t.y + Math.sign(cote.dy) * u };
  }
  return { x: MERIDIEN + sens * (cote.plat + Math.abs(cote.dy) + (d - cote.plat - diag)), y: t.y + cote.dy };
}

/** Le chemin SVG entre deux distances, coudes compris. */
export function troncon(t: Trace, s0: number, s1: number): string {
  if (t.boucle) {
    const n = Math.max(2, Math.ceil(Math.abs(s1 - s0) / 6));
    return Array.from({ length: n + 1 }, (_, i) => pointDuTrace(t, s0 + ((s1 - s0) * i) / n))
      .map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  }
  const coudes = [
    -(t.gauche.plat + Math.abs(t.gauche.dy) * RAC2), -t.gauche.plat, 0,
    t.droite.plat, t.droite.plat + Math.abs(t.droite.dy) * RAC2,
  ].filter((c) => c > Math.min(s0, s1) && c < Math.max(s0, s1));
  const suite = [s0, ...(s0 < s1 ? coudes : coudes.reverse()), s1];
  return suite.map((s, i) => {
    const p = pointDuTrace(t, s);
    return `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");
}

export interface StationPlacee {
  index: number;
  s: number;
  point: Point;
  faite: boolean;
  courante: boolean;
  saut?: number;
  titre: string;
}

/** Chaque station a sa distance du meridien, la courante a zero. */
export function placerLesStations(l: Ligne): StationPlacee[] {
  const c = stationCourante(l);
  const t = TRACES[l.objectif];
  return l.stations.map((station, index) => {
    const s = (index - c) * PAS;
    return {
      index,
      s,
      point: pointDuTrace(t, s),
      faite: station.faite,
      courante: index === c && !l.projet,
      saut: station.saut,
      titre: station.titre,
    };
  });
}
