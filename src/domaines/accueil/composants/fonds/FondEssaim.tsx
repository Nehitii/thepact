import { useCallback, useEffect, useRef } from "react";
import { useRenduDuFond, type Moteur } from "@/domaines/accueil/hooks/useRenduDuFond";
import { composantes } from "@/domaines/accueil/logique/propositionsDeFond";
import { SpaceBackdrop } from "@/socle/ds/SpaceBackdrop";
import { aleatoire, carteGraphique, contexte, liberer, programme, uniformes } from "@/domaines/accueil/composants/fonds/gl";
import { FRAGMENTS_ESSAIM, SOMMETS_ESSAIM } from "@/domaines/accueil/composants/fonds/glsl/essaim";
import type { ProprietesDuFond } from "@/domaines/accueil/composants/fonds/types";

/* L ESSAIM.
 *
 * Les graines sont tirees une fois, avec une graine fixe : meme ciel a
 * chaque visite. Elles partent vers la carte graphique en un seul envoi
 * de 1 Mo, et plus rien ne passe ensuite que huit uniformes par image.
 *
 * Un bulbe de 18 % d etoiles tres concentrees fait le coeur — un
 * quatrieme « bras », que le shader repartit en ellipsoide au lieu de
 * l enrouler : suivant les bras jusqu au centre, il y tracait deux
 * trainees blanches. Les autres suivent trois bras, avec un ecart autour
 * du bras tire comme la moyenne de trois hasards — une cloche, donc des
 * bras nets au milieu et flous sur les bords, plutot qu un ruban a bords
 * francs. */

const GALAXIE = 60_000;
const CHAMP = 2_500;

function graines(): Float32Array {
  const hasard = aleatoire(20260923);
  const g = new Float32Array((GALAXIE + CHAMP) * 4);
  let k = 0;
  for (let i = 0; i < GALAXIE; i++) {
    const bulbe = hasard() < 0.18;
    const r = bulbe ? Math.pow(hasard(), 2.2) * 0.22 : 0.05 + Math.pow(hasard(), 1.4) * 0.95;
    const bras = bulbe ? 3 : Math.floor(hasard() * 3);
    const ecart = bulbe ? hasard() : (hasard() + hasard() + hasard()) / 3;
    g[k++] = r;
    g[k++] = hasard();
    g[k++] = bras + Math.min(0.999, ecart);
    g[k++] = Math.pow(hasard(), 2.5);
  }
  for (let i = 0; i < CHAMP; i++) {
    g[k++] = -1;
    g[k++] = hasard() * 2 - 1;
    g[k++] = hasard() * 2 - 1;
    g[k++] = Math.pow(hasard(), 3);
  }
  return g;
}

const NOMS = ["resolution", "temps", "teinte", "souris", "intensite", "defilement", "echelle"] as const;

export function FondEssaim({ teinte, intensite, mouvement, cadence, surMesure, surCarte }: ProprietesDuFond) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reglages = useRef({ teinte: composantes(teinte), intensite });
  reglages.current = { teinte: composantes(teinte), intensite };
  const annonce = useRef(surCarte);
  annonce.current = surCarte;

  const fabriquer = useCallback((canvas: HTMLCanvasElement): Moteur | null => {
    const gl = contexte(canvas);
    if (!gl) return null;
    const p = programme(gl, SOMMETS_ESSAIM, FRAGMENTS_ESSAIM);
    gl.useProgram(p);
    const tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(gl.ARRAY_BUFFER, graines(), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, "a_graine");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 4, gl.FLOAT, false, 0, 0);
    const u = uniformes(gl, p, NOMS);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0.004, 0.006, 0.018, 1);
    annonce.current?.(carteGraphique(gl));
    return {
      redimensionner: (l, h) => gl.viewport(0, 0, l, h),
      dessiner: (e) => {
        const [r, v, b] = reglages.current.teinte;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(u.resolution, e.largeur, e.hauteur);
        gl.uniform1f(u.temps, e.t);
        gl.uniform3f(u.teinte, r, v, b);
        gl.uniform2f(u.souris, e.souris[0], e.souris[1]);
        gl.uniform1f(u.intensite, reglages.current.intensite);
        gl.uniform1f(u.defilement, e.defilement * e.echelle);
        gl.uniform1f(u.echelle, e.echelle);
        gl.drawArrays(gl.POINTS, 0, GALAXIE + CHAMP);
      },
      liberer: () => liberer(gl),
    };
  }, []);

  // Des points nets demandent la pleine densite de l ecran.
  const { redessiner, indisponible } = useRenduDuFond(ref, fabriquer, { echelle: 1, cadence, mouvement, surMesure });
  useEffect(() => {
    redessiner();
  }, [teinte, intensite, redessiner]);

  if (indisponible) return <SpaceBackdrop />;
  return <canvas ref={ref} className="fond-vivant" aria-hidden="true" />;
}
