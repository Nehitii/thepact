import { useCallback, useEffect, useRef } from "react";
import { useRenduDuFond, type Moteur } from "@/socle/ds/fonds/useRenduDuFond";
import { aleatoire } from "@/socle/ds/fonds/gl";
import {
  aretesAllumees, aretesDuSceau, dessinerLeSceau, rgba, sommetsDuSceau,
} from "@/socle/ds/fonds/dessinDuSceau";
import type { ProprietesDuFond, SceauDuFond } from "@/socle/ds/fonds/types";

/* LA CONSTELLATION.
 *
 * Le ciel est peint UNE fois, a chaque redimensionnement, sur un canvas
 * hors ecran : une lueur diffuse le long d une diagonale, puis jusqu a
 * quatre mille deux cents etoiles, dont presque la moitie s y masse — une voie
 * lactee, sans quoi un champ uniforme n a ni haut ni bas. L eclat suit
 * une loi tres raide, comme dans le vrai ciel : une poussiere d etoiles
 * pales, quelques-unes vives, et une poignee seulement ont un halo. Des
 * halos partout feraient des bulles. A chaque image, on ne fait que le
 * recopier, decale pour la parallaxe, et tracer le sceau par-dessus.
 *
 * LE SCEAU apparait trace a la main, arete apres arete, en deux
 * secondes et demie. Il tourne d un tour toutes les dix-sept minutes :
 * assez pour vivre, pas assez pour se voir bouger. */

export function FondConstellation({
  teinte, intensite, mouvement, cadence, surMesure, ordre, pas, medaillons, progression,
}: ProprietesDuFond & SceauDuFond) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reglages = useRef({ teinte, intensite, ordre, pas, medaillons, progression, mouvement });
  reglages.current = { teinte, intensite, ordre, pas, medaillons, progression, mouvement };

  const fabriquer = useCallback((canvas: HTMLCanvasElement): Moteur | null => {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return null;
    let ciel: HTMLCanvasElement | null = null;
    let l = 1;
    let h = 1;
    let k = 1;
    let debut = 0;
    let ordreDuTrace = -1;

    const peindreLeCiel = () => {
      const c = document.createElement("canvas");
      c.width = l;
      c.height = Math.round(h * 1.15);
      const g = c.getContext("2d");
      if (!g) return;
      g.fillStyle = "#010208";
      g.fillRect(0, 0, c.width, c.height);
      const hasard = aleatoire(4242);
      const bande = (u: number) => c.height * 0.9 - u * c.height * 0.75;
      for (let i = 0; i < 90; i++) {
        const u = hasard();
        const x = u * c.width;
        const y = bande(u) + (hasard() + hasard() - 1) * 0.08 * c.height;
        const rayon = (0.06 + hasard() * 0.14) * c.height;
        const nuage = g.createRadialGradient(x, y, 0, x, y, rayon);
        nuage.addColorStop(0, rgba("#AAB9E6", 0.018 + hasard() * 0.02));
        nuage.addColorStop(1, rgba("#AAB9E6", 0));
        g.fillStyle = nuage;
        g.fillRect(x - rayon, y - rayon, rayon * 2, rayon * 2);
      }
      /* LA DENSITE, PAS LE NOMBRE. 4 200 etoiles sur un ecran de
         1 600 × 900 ; un cadre d apercu en recoit autant par pixel,
         pas autant en tout — sinon le meme ciel y devient un amas. */
      const surface = (c.width * c.height) / (k * k);
      const combien = Math.round(Math.min(4200, Math.max(700, 4200 * surface / (1600 * 900 * 1.15))));
      for (let i = 0; i < combien; i++) {
        let x = hasard() * c.width;
        let y = hasard() * c.height;
        if (hasard() < 0.45) {
          const u = hasard();
          const ecart = (hasard() + hasard() + hasard() - 1.5) * 0.12 * c.height;
          x = u * c.width;
          y = bande(u) + ecart;
        }
        const eclat = Math.pow(hasard(), 4);
        const rayon = (0.3 + eclat * 1.2) * k;
        const temperature = hasard();
        const couleur = temperature < 0.3 ? "#C8D7FF" : temperature < 0.85 ? "#FFFFFF" : "#FFDCAA";
        if (eclat > 0.8) {
          const halo = g.createRadialGradient(x, y, 0, x, y, rayon * 5);
          halo.addColorStop(0, rgba(couleur, 0.14));
          halo.addColorStop(1, rgba(couleur, 0));
          g.fillStyle = halo;
          g.beginPath(); g.arc(x, y, rayon * 5, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = rgba(couleur, 0.18 + eclat * 0.8);
        g.beginPath(); g.arc(x, y, rayon, 0, Math.PI * 2); g.fill();
      }
      ciel = c;
    };

    return {
      redimensionner: (L, H, K) => {
        l = L; h = H; k = K;
        peindreLeCiel();
      },
      dessiner: (e) => {
        const r = reglages.current;
        if (!ciel) return;
        const course = Math.max(1, ciel.height - h);
        ctx.drawImage(ciel, 0, -Math.min(course, e.defilement * e.echelle * 0.05));

        const force = 0.4 + 0.6 * r.intensite;
        const paysage = l >= h;
        const centre = { x: paysage ? l * 0.77 : l * 0.5, y: paysage ? h * 0.34 : h * 0.2 };
        const rayon = Math.min(l, h) * (paysage ? 0.2 : 0.16);

        /* SANS SCEAU, PAS DE CADRAN. Le pacte arrive apres le fond : le
           ciel se peint d abord, seul, et le sceau se trace quand ses
           donnees sont la — depuis le debut, pas deja fini. */
        if (r.ordre !== ordreDuTrace) {
          ordreDuTrace = r.ordre;
          debut = e.t;
        }
        if (r.ordre >= 3) {
          const lueur = ctx.createRadialGradient(centre.x, centre.y, 0, centre.x, centre.y, rayon * 2.3);
          lueur.addColorStop(0, rgba(r.teinte, 0.11 * force));
          lueur.addColorStop(1, rgba(r.teinte, 0));
          ctx.fillStyle = lueur;
          ctx.fillRect(centre.x - rayon * 2.3, centre.y - rayon * 2.3, rayon * 4.6, rayon * 4.6);

          // Le cadran : la rosace du pacte, en graduations.
          ctx.strokeStyle = rgba(r.teinte, 0.18 * force);
          ctx.lineWidth = k;
          ctx.beginPath(); ctx.arc(centre.x, centre.y, rayon * 1.34, 0, Math.PI * 2); ctx.stroke();
          for (let i = 0; i < 72; i++) {
            const a = (i / 72) * Math.PI * 2 + e.t * 0.002;
            const long = i % 6 === 0 ? 9 : 4;
            const r1 = rayon * 1.34;
            ctx.beginPath();
            ctx.moveTo(centre.x + Math.cos(a) * r1, centre.y + Math.sin(a) * r1);
            ctx.lineTo(centre.x + Math.cos(a) * (r1 - long * k), centre.y + Math.sin(a) * (r1 - long * k));
            ctx.stroke();
          }

          const revele = r.mouvement ? Math.min(1, (e.t - debut) / 2.5) : 1;
          const sommets = sommetsDuSceau(r.ordre, centre, rayon, e.t * 0.006);
          dessinerLeSceau(ctx, sommets, aretesDuSceau(r.ordre, r.pas), aretesAllumees(r.ordre, r.progression), r.medaillons, centre, {
            teinte: r.teinte, force, echelle: k, revele, temps: e.t,
          });

          ctx.font = `500 ${10 * k}px "JetBrains Mono", monospace`;
          ctx.textAlign = "center";
          ctx.fillStyle = rgba(r.teinte, 0.6 * force);
          ctx.fillText(`${Math.round(r.progression * 100)} %`, centre.x, centre.y + rayon * 1.34 + 18 * k);
        }

        const vignette = ctx.createRadialGradient(l / 2, h / 2, Math.min(l, h) * 0.45, l / 2, h / 2, Math.hypot(l, h) * 0.62);
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(0,0,0,0.55)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, l, h);
      },
      liberer: () => {
        ciel = null;
      },
    };
  }, []);

  const { redessiner } = useRenduDuFond(ref, fabriquer, { echelle: 0.8, cadence, mouvement, surMesure });
  useEffect(() => {
    redessiner();
  }, [teinte, intensite, ordre, pas, medaillons, progression, redessiner]);

  return <canvas ref={ref} className="fond-vivant" aria-hidden="true" />;
}
