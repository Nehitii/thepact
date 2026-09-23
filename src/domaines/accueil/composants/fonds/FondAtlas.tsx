import { useCallback, useEffect, useRef } from "react";
import { useRenduDuFond, type Moteur } from "@/domaines/accueil/hooks/useRenduDuFond";
import { aleatoire } from "@/domaines/accueil/composants/fonds/gl";
import {
  aretesAllumees, aretesDuSceau, dessinerLeSceau, rgba, sommetsDuSceau,
} from "@/domaines/accueil/composants/fonds/dessinDuSceau";
import type { ProprietesDuFond, SceauDuFond } from "@/domaines/accueil/composants/fonds/types";

/* L ATLAS.
 *
 * Une carte polaire, le pole place juste hors de l ecran, en haut a
 * droite : les cercles de declinaison balaient la page en arcs, les
 * lignes d ascension droite en rayonnent. La projection est
 * stereographique — celle des planispheres — : un cercle du ciel reste
 * un cercle sur la carte, et une grille ne se deforme pas en lisant.
 *
 * DEUX ENCRES, UN DESSIN. La nuit, de la lumiere froide sur du noir ;
 * le jour, de l encre sur papier, dans l esprit du theme clair
 * « Le Plan » : le halo devient du poids, pas un voile gris.
 *
 * Le ciel tourne autour du pole, d un tour en trente-cinq minutes. A
 * douze images par seconde, un trait bouge de moins d un pixel entre
 * deux images : l oeil voit un mouvement continu, la batterie ne paie
 * presque rien. */

interface Astre {
  alpha: number;
  delta: number;
  magnitude: number;
  code: string;
}

const RAD = Math.PI / 180;

function catalogue(): Astre[] {
  const hasard = aleatoire(1142);
  return Array.from({ length: 2400 }, () => ({
    alpha: hasard() * Math.PI * 2,
    delta: Math.asin(hasard() * 1.55 - 0.55),
    magnitude: 1 + 5.6 * Math.pow(hasard(), 0.55),
    code: `OW ${1000 + Math.floor(hasard() * 8999)}`,
  }));
}

export function FondAtlas({
  teinte, intensite, mouvement, cadence, surMesure, ordre, pas, valeurs, progression, jour,
}: ProprietesDuFond & SceauDuFond & { jour: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reglages = useRef({ teinte, intensite, ordre, pas, valeurs, progression, jour });
  reglages.current = { teinte, intensite, ordre, pas, valeurs, progression, jour };

  const fabriquer = useCallback((canvas: HTMLCanvasElement): Moteur | null => {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return null;
    const astres = catalogue().sort((a, b) => a.magnitude - b.magnitude);
    let l = 1;
    let h = 1;
    let k = 1;

    return {
      redimensionner: (L, H, K) => { l = L; h = H; k = K; },
      dessiner: (e) => {
        const r = reglages.current;
        const papier = r.jour;
        const encre = papier ? "#16202C" : "#82C3F0";
        const force = 0.45 + 0.55 * r.intensite;
        ctx.fillStyle = papier ? "#EAE6DC" : "#02050B";
        ctx.fillRect(0, 0, l, h);

        const pole = { x: l * 1.02, y: -h * 0.1 - e.defilement * e.echelle * 0.04 };
        const s = Math.hypot(0.52 * l, 0.6 * h) / Math.tan(35 * RAD);
        const rho = (delta: number) => s * Math.tan((Math.PI / 2 - delta) / 2);
        const tour = e.t * 0.003;
        const vers = (alpha: number, delta: number) => {
          const phi = alpha + tour;
          const d = rho(delta);
          return { x: pole.x + d * Math.cos(phi), y: pole.y + d * Math.sin(phi) };
        };

        ctx.lineWidth = 0.8 * k;
        ctx.strokeStyle = rgba(encre, (papier ? 0.24 : 0.15) * force);
        for (let d = 80; d >= -40; d -= 10) {
          ctx.beginPath(); ctx.arc(pole.x, pole.y, rho(d * RAD), 0, Math.PI * 2); ctx.stroke();
        }
        for (let heure = 0; heure < 24; heure++) {
          const a = vers(heure * 15 * RAD, 88 * RAD);
          const b = vers(heure * 15 * RAD, -45 * RAD);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }

        ctx.save();
        ctx.setLineDash([5 * k, 7 * k]);
        ctx.strokeStyle = rgba(r.teinte, (papier ? 0.55 : 0.4) * force);
        ctx.beginPath();
        for (let a = 0; a <= 360; a += 3) {
          const p = vers(a * RAD, 23.44 * RAD * Math.sin(a * RAD));
          if (a === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();

        ctx.font = `500 ${9 * k}px Orbitron, Rajdhani, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = rgba(encre, (papier ? 0.62 : 0.45) * force);
        for (let heure = 0; heure < 24; heure++) {
          const p = vers(heure * 15 * RAD, 14 * RAD);
          if (p.x > -20 && p.x < l + 20 && p.y > -20 && p.y < h + 20) ctx.fillText(`${heure}h`, p.x, p.y);
        }
        for (let d = 70; d >= -30; d -= 10) {
          const p = vers(8.4 * 15 * RAD, d * RAD);
          if (p.x > 0 && p.x < l && p.y > 0 && p.y < h) ctx.fillText(`${d > 0 ? "+" : ""}${d}°`, p.x, p.y - 8 * k);
        }

        let etiquettes = 0;
        ctx.font = `400 ${8.5 * k}px "JetBrains Mono", monospace`;
        ctx.textAlign = "left";
        for (const astre of astres) {
          const p = vers(astre.alpha, astre.delta);
          if (p.x < -8 || p.x > l + 8 || p.y < -8 || p.y > h + 8) continue;
          const rayon = Math.max(0.45, (6.4 - astre.magnitude) * 0.5) * k;
          const lumiere = Math.min(1, (6.8 - astre.magnitude) / 4.5);
          ctx.fillStyle = papier ? rgba("#16202C", 0.35 + 0.6 * lumiere) : rgba("#DCEBFF", (0.25 + 0.7 * lumiere) * force);
          ctx.beginPath(); ctx.arc(p.x, p.y, rayon, 0, Math.PI * 2); ctx.fill();
          if (astre.magnitude < 2.1 && etiquettes < 26) {
            etiquettes += 1;
            ctx.fillStyle = rgba(encre, (papier ? 0.55 : 0.42) * force);
            ctx.fillText(astre.code, p.x + rayon + 4 * k, p.y - rayon - 3 * k);
          }
        }

        /* Le sceau se tient dans la marge gauche, la ou l accueil laisse
           voir le fond — pas a une coordonnee du ciel, qui le ferait sortir
           de l ecran selon sa taille. Il tourne avec la carte. */
        const rayon = Math.min(l, h) * 0.12;
        const marge = (l - 1024 * k) / 2;
        const centre = l >= h
          ? { x: Math.max(rayon * 1.5, marge / 2), y: h * 0.64 }
          : { x: l * 0.5, y: h * 0.7 };
        ctx.save();
        ctx.setLineDash([2 * k, 4 * k]);
        ctx.strokeStyle = rgba(encre, (papier ? 0.4 : 0.28) * force);
        ctx.lineWidth = 0.8 * k;
        ctx.beginPath(); ctx.arc(centre.x, centre.y, rayon * 1.45, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        const sommets = sommetsDuSceau(r.ordre, centre, rayon, tour + 0.2);
        const teinteDeGravure = papier ? melanger(r.teinte, "#16202C", 0.35) : r.teinte;
        dessinerLeSceau(ctx, sommets, aretesDuSceau(r.ordre, r.pas), aretesAllumees(r.ordre, r.progression),
          r.valeurs, centre, { teinte: teinteDeGravure, force, encre: papier, echelle: k, revele: 1, temps: e.t });

        if (!papier) {
          const v = ctx.createRadialGradient(l / 2, h / 2, Math.min(l, h) * 0.4, l / 2, h / 2, Math.hypot(l, h) * 0.6);
          v.addColorStop(0, "rgba(0,0,0,0)");
          v.addColorStop(1, "rgba(0,0,0,0.5)");
          ctx.fillStyle = v;
          ctx.fillRect(0, 0, l, h);
        }
      },
      liberer: () => {},
    };
  }, []);

  const { redessiner } = useRenduDuFond(ref, fabriquer, { echelle: 1, cadence, mouvement, surMesure });
  useEffect(() => {
    redessiner();
  }, [teinte, intensite, ordre, pas, valeurs, progression, jour, redessiner]);

  return <canvas ref={ref} className="fond-vivant" aria-hidden="true" />;
}

/** Une teinte assombrie vers l encre, pour qu elle se lise sur du papier. */
function melanger(a: string, b: string, part: number): string {
  const lire = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.replace("#", "").slice(i - 1, i + 1), 16));
  const [x, y] = [lire(a), lire(b)];
  return `#${x.map((c, i) => Math.round(c + (y[i] - c) * part).toString(16).padStart(2, "0")).join("")}`;
}
