import { useId, type CSSProperties } from "react";
import { useCompteARebours } from "@/domaines/accueil/hooks/useCompteARebours";
import type { ProprietesDuCompte } from "@/domaines/accueil/types";
import {
  dateLongue, dernierJour, joursAvantLeDebut, motDeLEtat, phraseDuCompte, premierJour,
} from "@/domaines/accueil/composants/compte/lecture";
import "@/domaines/accueil/composants/compte/compte-meche.css";

/* PROPOSITION D — LA MECHE.
 *
 * Un compte a rebours, au fond, c est une meche. Celle-ci court sur le
 * sol de la rue, la nuit, du premier jour jusqu au mortier du bouquet
 * final, plante au terme. Elle brule depuis l ouverture : derriere
 * l etincelle, de la cendre ; devant, la meche verte, ce qui reste. Le
 * gros chiffre suit l etincelle, eclaire par elle.
 *
 * Avant l ouverture, la meche n est pas allumee : une allumette attend
 * au bout. Au terme, la meche est consumee et le bouquet part — le
 * panneau constate la date, il ne juge pas le pacte. */

/** La largeur du dessin de la meche, dans son repere. */
const LARGEUR = 1000;
/** Le haut du dessin de la meche dans la piste, en pixels ; une unite du repere vaut un pixel en hauteur. */
const HAUT_DU_CORDON = 96;

/** La meche ondule un peu sur le sol : sa hauteur a l abscisse x. */
const ondulation = (x: number) => 22 + 3.2 * Math.sin(x * 0.0105 + 0.6) + 1.6 * Math.sin(x * 0.031 + 1.9);

function trace(de: number, a: number): string {
  const points: string[] = [];
  for (let x = de; x < a; x += 12) points.push(`${x.toFixed(1)},${ondulation(x).toFixed(2)}`);
  points.push(`${a.toFixed(1)},${ondulation(a).toFixed(2)}`);
  return points.join(" ");
}

/* Les escarbilles : un angle, un retard, une portee. Fixes — le rendu
   reste pur, et l etincelle la meme d une image a l autre. */
const ESCARBILLES: readonly (readonly [number, number, number])[] = [
  [-62, 0, 34], [-35, 120, 48], [-12, 260, 58], [8, 60, 44], [24, 340, 52], [41, 180, 40],
  [58, 420, 30], [-48, 300, 38], [-22, 480, 50], [70, 220, 26], [-78, 380, 22], [15, 540, 36],
];
const RAYONS = 18;

export function CompteMeche(p: ProprietesDuCompte) {
  const { lecture: l } = useCompteARebours(p);
  const braise = `cm-braise-${useId().replace(/:/g, "")}`;
  if (!l) return null;
  const aVenir = l.etat === "a-venir";
  const termine = l.etat === "termine";
  const xs = l.part * LARGEUR;

  return (
    <section
      className={`cm ${p.className ?? ""}`}
      data-etat={l.etat}
      role="group"
      aria-label={phraseDuCompte(l)}
      style={{ "--cm-part": l.part } as CSSProperties}
    >
      <div className="cm-nuit" aria-hidden="true">
        <div className="cm-piste">
          <svg className="cm-cordon" viewBox={`0 0 ${LARGEUR} 40`} preserveAspectRatio="none">
            <defs>
              <linearGradient id={braise} gradientUnits="userSpaceOnUse" x1={xs - 70} x2={xs} y1="0" y2="0">
                <stop offset="0" stopColor="#ff6a14" stopOpacity="0" />
                <stop offset="0.7" stopColor="#ff8a2a" stopOpacity="0.85" />
                <stop offset="1" stopColor="#ffe2b0" />
              </linearGradient>
            </defs>
            {xs > 0 && (
              <>
                <polyline className="cm-cendre" points={trace(0, xs)} />
                <polyline className="cm-cendre-grain" points={trace(0, xs)} />
                {!termine && <polyline className="cm-braise" stroke={`url(#${braise})`} points={trace(Math.max(0, xs - 70), xs)} />}
              </>
            )}
            {!termine && (
              <>
                <polyline className="cm-visco" points={trace(xs, LARGEUR)} />
                <polyline className="cm-visco-torsade" points={trace(xs, LARGEUR)} />
                <polyline className="cm-visco-reflet" points={trace(xs, LARGEUR)} />
              </>
            )}
          </svg>

          {aVenir ? (
            <span className="cm-allumette" />
          ) : !termine && (
            <span className="cm-etincelle" style={{ left: `${l.part * 100}%`, top: `${HAUT_DU_CORDON + ondulation(xs)}px` }}>
              <i className="cm-lueur" />
              {ESCARBILLES.map(([angle, retard, portee], i) => (
                <i
                  key={i}
                  className="cm-escarbille"
                  style={{ "--a": `${angle}deg`, "--r": `${retard}ms`, "--p": `${portee}px` } as CSSProperties}
                />
              ))}
              <i className="cm-coeur" />
            </span>
          )}

          <span className="cm-chiffre" data-cote={l.part < 0.5 ? "droite" : "gauche"}>
            {termine ? (
              <>
                <b className="cm-chiffre--mot">Terme atteint</b>
                <span>{l.joursTotal.toLocaleString("fr-FR")} jours de mèche</span>
              </>
            ) : (
              <>
                <b>{(aVenir ? joursAvantLeDebut(l) : l.gros.valeur).toLocaleString("fr-FR")}</b>
                <span>{aVenir ? "jours avant l’allumage" : l.gros.mot}</span>
                <em>{motDeLEtat(l.etat)}</em>
              </>
            )}
          </span>

          <span className="cm-borne cm-borne--debut">{dateLongue(premierJour(l))}</span>
        </div>

        <div className="cm-mortier">
          {termine && (
            <span className="cm-bouquet">
              {Array.from({ length: RAYONS }, (_, i) => (
                <i key={i} style={{ "--a": `${(360 / RAYONS) * i}deg` } as CSSProperties} />
              ))}
            </span>
          )}
          <span className="cm-tube"><span className="cm-etiquette">Bouquet final</span></span>
          <span className="cm-borne cm-borne--fin">{dateLongue(dernierJour(l))}</span>
        </div>
      </div>
    </section>
  );
}
