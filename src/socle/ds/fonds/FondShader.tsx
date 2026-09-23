import { useCallback, useEffect, useRef } from "react";
import { useRenduDuFond, type Moteur } from "@/socle/ds/fonds/useRenduDuFond";
import { composantes } from "@/socle/ds/fonds/catalogue";
import { SpaceBackdrop } from "@/socle/ds/SpaceBackdrop";
import {
  carteGraphique, contexte, liberer, programme, SOMMETS_PLEIN_ECRAN, trianglePleinEcran, uniformes,
} from "@/socle/ds/fonds/gl";
import { NEBULEUSE } from "@/socle/ds/fonds/glsl/nebuleuse";
import { HORIZON } from "@/socle/ds/fonds/glsl/horizon";
import { AURORE } from "@/socle/ds/fonds/glsl/aurore";
import { ORBITE } from "@/socle/ds/fonds/glsl/orbite";
import type { ProprietesDuFond } from "@/socle/ds/fonds/types";

/* UN FOND EN UN SEUL SHADER.
 *
 * Quatre propositions — nebuleuse, horizon, aurore, orbite — ne sont
 * qu un fragment shader sur un triangle qui couvre l ecran. Elles
 * partagent donc tout le reste : le contexte, les uniformes, la boucle.
 *
 * SI WEBGL MANQUE, le fond CSS actuel prend la place. Personne ne doit
 * voir un rectangle noir parce que son navigateur a refuse un
 * contexte graphique. */

const NOMS = ["resolution", "temps", "teinte", "intensite", "souris", "defilement", "vitesse"] as const;

function FondShader({
  fragment, echelle, teinte, intensite, mouvement, cadence, surMesure, surCarte,
}: ProprietesDuFond & { fragment: string; echelle: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reglages = useRef({ teinte: composantes(teinte), intensite });
  reglages.current = { teinte: composantes(teinte), intensite };
  const annonce = useRef(surCarte);
  annonce.current = surCarte;

  const fabriquer = useCallback((canvas: HTMLCanvasElement): Moteur | null => {
    const gl = contexte(canvas);
    if (!gl) return null;
    const p = programme(gl, SOMMETS_PLEIN_ECRAN, fragment);
    gl.useProgram(p);
    trianglePleinEcran(gl, p);
    const u = uniformes(gl, p, NOMS);
    annonce.current?.(carteGraphique(gl));
    return {
      redimensionner: (l, h) => gl.viewport(0, 0, l, h),
      dessiner: (e) => {
        const [r, v, b] = reglages.current.teinte;
        gl.uniform2f(u.resolution, e.largeur, e.hauteur);
        gl.uniform1f(u.temps, e.t);
        gl.uniform3f(u.teinte, r, v, b);
        gl.uniform1f(u.intensite, reglages.current.intensite);
        gl.uniform2f(u.souris, e.souris[0], e.souris[1]);
        gl.uniform1f(u.defilement, e.defilement * e.echelle);
        gl.uniform1f(u.vitesse, e.vitesse);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      liberer: () => liberer(gl),
    };
  }, [fragment]);

  const { redessiner, indisponible } = useRenduDuFond(ref, fabriquer, { echelle, cadence, mouvement, surMesure });
  useEffect(() => {
    redessiner();
  }, [teinte, intensite, redessiner]);

  if (indisponible) return <SpaceBackdrop />;
  return <canvas ref={ref} className="fond-vivant" aria-hidden="true" />;
}

/* L echelle du tampon suit la nature du rendu : un nuage ou une aurore
   sont flous par nature et se calculent a demi-resolution ; le disque
   du trou noir et le limbe de la planete ont des bords nets, et
   demandent plus. */
export const FondNebuleuse = (p: ProprietesDuFond) => <FondShader {...p} fragment={NEBULEUSE} echelle={0.5} />;
export const FondHorizon = (p: ProprietesDuFond) => <FondShader {...p} fragment={HORIZON} echelle={0.75} />;
export const FondAurore = (p: ProprietesDuFond) => <FondShader {...p} fragment={AURORE} echelle={0.5} />;
export const FondOrbite = (p: ProprietesDuFond) => <FondShader {...p} fragment={ORBITE} echelle={0.75} />;
