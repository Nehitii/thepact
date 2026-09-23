import { useCallback, useEffect, useRef } from "react";
import { useRenduDuFond, type Moteur } from "@/socle/ds/fonds/useRenduDuFond";
import { composantes } from "@/socle/ds/fonds/catalogue";
import { SpaceBackdrop } from "@/socle/ds/SpaceBackdrop";
import {
  aleatoire, carteGraphique, contexte, liberer, programme, SOMMETS_PLEIN_ECRAN, trianglePleinEcran, uniformes,
} from "@/socle/ds/fonds/gl";
import { FOND_DERIVE, FRAGMENTS_DERIVE, SOMMETS_DERIVE } from "@/socle/ds/fonds/glsl/derive";
import type { ProprietesDuFond } from "@/socle/ds/fonds/types";

/* LA DERIVE.
 *
 * Deux programmes par image : le fond, un triangle plein ecran, puis
 * six mille traits additionnes par-dessus.
 *
 * LA VITESSE SUIT LE DEFILEMENT PAR UN RESSORT. Elle ne saute pas a la
 * vitesse cible : elle s en rapproche de 8 % par image. Un coup de
 * molette rapide lance le champ, et il ralentit de lui-meme quand la
 * page s arrete — l inertie d un vaisseau, pas celle d un curseur. */

const ETOILES = 6_000;
const CROISIERE = 0.028;

function etoilesEnVol(): Float32Array {
  const hasard = aleatoire(17);
  const s = new Float32Array(ETOILES * 2 * 4);
  let k = 0;
  for (let i = 0; i < ETOILES; i++) {
    const x = (hasard() * 2 - 1) * 2;
    const y = (hasard() * 2 - 1) * 1.25;
    const z = hasard();
    for (const bout of [0, 1]) {
      s[k++] = x;
      s[k++] = y;
      s[k++] = z;
      s[k++] = bout;
    }
  }
  return s;
}

export function FondDerive({ teinte, intensite, mouvement, cadence, surMesure, surCarte }: ProprietesDuFond) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reglages = useRef({ teinte: composantes(teinte), intensite });
  reglages.current = { teinte: composantes(teinte), intensite };
  const annonce = useRef(surCarte);
  annonce.current = surCarte;

  const fabriquer = useCallback((canvas: HTMLCanvasElement): Moteur | null => {
    const gl = contexte(canvas);
    if (!gl) return null;

    const fond = programme(gl, SOMMETS_PLEIN_ECRAN, FOND_DERIVE);
    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aFond = gl.getAttribLocation(fond, "a_position");
    const uFond = uniformes(gl, fond, ["resolution", "temps", "teinte", "intensite"] as const);

    const traits = programme(gl, SOMMETS_DERIVE, FRAGMENTS_DERIVE);
    const etoiles = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, etoiles);
    gl.bufferData(gl.ARRAY_BUFFER, etoilesEnVol(), gl.STATIC_DRAW);
    const aEtoile = gl.getAttribLocation(traits, "a_etoile");
    const uTraits = uniformes(gl, traits, ["resolution", "distance", "trainee", "teinte", "intensite", "souris"] as const);
    annonce.current?.(carteGraphique(gl));

    let distance = 0;
    let vitesse = CROISIERE;
    let dernier = -1;

    return {
      redimensionner: (l, h) => gl.viewport(0, 0, l, h),
      dessiner: (e) => {
        const dt = dernier < 0 ? 0 : Math.min(0.1, Math.max(0, e.t - dernier));
        dernier = e.t;
        const elan = Math.min(1.4, Math.abs(e.vitesse) / 1800);
        vitesse += (CROISIERE + elan * 0.5 - vitesse) * 0.08;
        distance = (distance + dt * vitesse) % 1000;
        const trainee = 0.0045 + Math.max(0, vitesse - CROISIERE) * 0.12;
        const [r, v, b] = reglages.current.teinte;

        gl.disable(gl.BLEND);
        gl.useProgram(fond);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
        gl.enableVertexAttribArray(aFond);
        gl.vertexAttribPointer(aFond, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(uFond.resolution, e.largeur, e.hauteur);
        gl.uniform1f(uFond.temps, e.t);
        gl.uniform3f(uFond.teinte, r, v, b);
        gl.uniform1f(uFond.intensite, reglages.current.intensite);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disableVertexAttribArray(aFond);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(traits);
        gl.bindBuffer(gl.ARRAY_BUFFER, etoiles);
        gl.enableVertexAttribArray(aEtoile);
        gl.vertexAttribPointer(aEtoile, 4, gl.FLOAT, false, 0, 0);
        gl.uniform2f(uTraits.resolution, e.largeur, e.hauteur);
        gl.uniform1f(uTraits.distance, distance);
        gl.uniform1f(uTraits.trainee, trainee);
        gl.uniform3f(uTraits.teinte, r, v, b);
        gl.uniform1f(uTraits.intensite, reglages.current.intensite);
        gl.uniform2f(uTraits.souris, e.souris[0], e.souris[1]);
        gl.drawArrays(gl.LINES, 0, ETOILES * 2);
        gl.disableVertexAttribArray(aEtoile);
      },
      liberer: () => liberer(gl),
    };
  }, []);

  const { redessiner, indisponible } = useRenduDuFond(ref, fabriquer, { echelle: 1, cadence, mouvement, surMesure });
  useEffect(() => {
    redessiner();
  }, [teinte, intensite, redessiner]);

  if (indisponible) return <SpaceBackdrop />;
  return <canvas ref={ref} className="fond-vivant" aria-hidden="true" />;
}
