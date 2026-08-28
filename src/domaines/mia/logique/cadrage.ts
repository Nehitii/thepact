import type { ExpressionMia } from "@/domaines/mia/logique/visages";

/**
 * Le cadrage du visage de M.I.A.
 *
 * ═══════════════════════════════════════════════════════════════
 * CES DIX-HUIT NOMBRES SONT RÉGLÉS À L'ŒIL, ET C'EST VOULU.
 *
 * Les vignettes sont des bustes. En montrer un entier dans un rond de
 * 30 px, c'est dépenser les trois quarts de la surface en épaules et en
 * manteau : le visage y tombe à une vingtaine de pixels, et la colère
 * ressemble au calme.
 *
 * Un cadrage unique ne suffit pas non plus. Mesuré sur les dix-huit
 * planches : le centre vertical du visage est stable (29–32 % de la
 * hauteur), mais le centre horizontal balaie vingt-trois points — de
 * 43 % pour `reflexion`, tête penchée, à 66 % pour `colere`. Un réglage
 * commun coupe toujours quelqu'un.
 *
 * DEUX DÉTECTIONS AUTOMATIQUES ONT ÉCHOUÉ AVANT CETTE TABLE. La première
 * prenait les mains pour le visage — un poing levé, une main au menton
 * sont de la peau eux aussi. La seconde, par régions connexes, ne
 * trouvait plus qu'une joue : les cheveux, les yeux et l'éclairage bleu
 * fragmentent la peau en morceaux. On règle donc ce qui se juge à l'œil
 * en le regardant, une planche-contact à la fois.
 *
 * `z` est le facteur d'agrandissement, `x` et `y` le point de la vignette
 * qui vient au centre du cadre. Le zoom est normalisé sur la largeur du
 * visage : sans ça elle avance et recule à chaque changement d'humeur.
 * ═══════════════════════════════════════════════════════════════
 */
export interface CadreVisage {
  /** Agrandissement de la vignette, 1 = elle remplit le cadre. */
  z: number;
  /** Le point qui vient au centre, en fraction de la vignette. */
  x: number;
  y: number;
}

const CADRES: Record<ExpressionMia, CadreVisage> = {
  abattue: { z: 1.458, x: 0.516, y: 0.35 },
  calme: { z: 1.479, x: 0.566, y: 0.319 },
  colere: { z: 1.426, x: 0.524, y: 0.332 },
  complice: { z: 1.264, x: 0.462, y: 0.366 },
  contente: { z: 1.349, x: 0.503, y: 0.315 },
  contrariee: { z: 1.416, x: 0.587, y: 0.316 },
  eteinte: { z: 1.396, x: 0.508, y: 0.365 },
  genee: { z: 1.34, x: 0.455, y: 0.4 },
  joie: { z: 1.288, x: 0.484, y: 0.321 },
  lasse: { z: 1.377, x: 0.466, y: 0.315 },
  menacante: { z: 1.396, x: 0.487, y: 0.376 },
  neutre: { z: 1.368, x: 0.498, y: 0.319 },
  peine: { z: 1.507, x: 0.487, y: 0.331 },
  reflexion: { z: 1.349, x: 0.365, y: 0.327 },
  severe: { z: 1.447, x: 0.527, y: 0.314 },
  soupir: { z: 1.396, x: 0.466, y: 0.325 },
  surprise: { z: 1.536, x: 0.529, y: 0.313 },
  "triste-sourire": { z: 1.513, x: 0.642, y: 0.335 },
};

/** Les propriétés CSS qui posent la vignette dans un cadre carré. */
export function cadrerLeVisage(expression: ExpressionMia) {
  const c = CADRES[expression] ?? CADRES.neutre;
  return {
    width: `${(c.z * 100).toFixed(1)}%`,
    left: `${(50 - c.x * c.z * 100).toFixed(1)}%`,
    top: `${(50 - c.y * c.z * 100).toFixed(1)}%`,
  };
}
