/* LES DEUX VUES DU PANNEAU DE SURVEILLANCE : le radar et le
 * diagnostic.
 *
 * Deux cent vingt lignes sorties de `MonitoringPanel.tsx`, qui en
 * faisait 485 et dont le panneau proprement dit n en fait que 121. Le
 * radar dessine les axes de difficulte, le diagnostic les lit.
 */

import { useId } from "react";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import { selonTheme } from "@/socle/outils/encrePapier";
import type { MonitoringData, Palier, FriseProjet } from "@/domaines/accueil/composants/MonitoringPanel";

export function RadarView({ axes, frise, critique, volumeTotal }: {
  axes: Palier[];
  frise: { total: number; ecoule: number; pct: number } | null;
  critique: Palier | null;
  volumeTotal: number;
}) {
  const sombre = useThemeSombre();
  /* Les degrades sont references par id : deux panneaux sur la meme
     page se voleraient leurs definitions. */
  const uid = useId().replace(/:/g, "");
  const C = 150, R = 100, n = axes.length;
  const pa = (a: number, r: number) => [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
  const pt = (i: number, r: number) => pa((Math.PI * 2 * i) / n - Math.PI / 2, r);
  const f1 = (v: number) => v.toFixed(1);

  if (!n) {
    return (
      <p className="ds-t-label font-mono flex-1 grid place-items-center" style={{ color: "var(--nexus-text-dimmer)" }}>
        Aucune étape enregistrée.
      </p>
    );
  }

  const teinte = (a: Palier) => selonTheme(a.couleur, sombre);
  const volMax = Math.max(...axes.map((a) => a.etapes));
  const faitesTotal = axes.reduce((s, a) => s + a.faites, 0);
  const sommets = axes.map((a, i) => pt(i, R * Math.max(0.04, a.pct / 100)));
  const rayonPoint = (a: Palier) => 1.8 + 5.2 * Math.sqrt(a.etapes / Math.max(1, volMax));

  /* Les graduations : une seule ellipse en pointilles plutot que
     soixante-douze traits. La periode du tiret fait le pas. */
  const GRAD = 2 * Math.PI * (R + 2.5);
  const GRAD_MAJ = 2 * Math.PI * (R + 4.5);

  /* Le balayage : soixante-quinze degres de traine derriere une arete
     vive, et un degrade en coordonnees utilisateur pour qu il tourne
     avec le secteur au lieu de rester colle a la boite. */
  const aVif = -Math.PI / 2;
  const aQueue = aVif - Math.PI / 2.4;
  const qVif = pa(aVif, R);
  const qQueue = pa(aQueue, R);

  const charge = [...axes].sort((a, b) => b.etapes - a.etapes);

  return (
    <>
      <div className="mon-duo flex-1 min-h-0">
        <svg
          className="mon-viseur"
          viewBox="-28 -8 356 316"
          role="img"
          aria-label={`Avancement par difficulté : ${axes.map((a) => `${a.nom} ${a.pct} % sur ${a.etapes} étapes`).join(", ")}`}
        >
          <defs>
            <radialGradient id={`mon-sol-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={sombre ? 0.13 : 0.1} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id={`mon-bal-${uid}`}
              gradientUnits="userSpaceOnUse"
              x1={f1(qQueue[0])} y1={f1(qQueue[1])} x2={f1(qVif[0])} y2={f1(qVif[1])}
            >
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={sombre ? 0.34 : 0.22} />
            </linearGradient>
          </defs>

          {/* Le sol du viseur : une lueur au centre, pas un aplat. */}
          <circle cx={C} cy={C} r={R + 4} fill={`url(#mon-sol-${uid})`} />

          {/* Anneaux de portee */}
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <circle key={k} className="mon-anneau" cx={C} cy={C} r={R * k} strokeDasharray={k === 1 ? undefined : "2 4"} />
          ))}
          <circle className="mon-grad" cx={C} cy={C} r={R + 2.5} strokeWidth={5}
                  strokeDasharray={`1 ${(GRAD / 72 - 1).toFixed(3)}`} />
          <circle className="mon-grad" cx={C} cy={C} r={R + 4.5} strokeWidth={9}
                  strokeDasharray={`1.6 ${(GRAD_MAJ / 12 - 1.6).toFixed(3)}`} />

          {/* Le balayage */}
          <g className="mon-bal">
            <path
              d={`M${C} ${C} L${f1(qQueue[0])} ${f1(qQueue[1])} A${R} ${R} 0 0 1 ${f1(qVif[0])} ${f1(qVif[1])} Z`}
              fill={`url(#mon-bal-${uid})`}
            />
            <line className="mon-bal-vif" x1={C} y1={C} x2={f1(qVif[0])} y2={f1(qVif[1])} />
          </g>

          {/* Une branche par palier, dans sa couleur */}
          {axes.map((a, i) => {
            const q = pt(i, R);
            return <line key={a.cle} className="mon-axe" x1={C} y1={C} x2={f1(q[0])} y2={f1(q[1])} stroke={teinte(a)} />;
          })}

          {/* Le polygone : un fond neutre, mais chaque arete part dans
              la couleur du palier qu elle quitte. Six couleurs etaient
              choisies pour ce panneau et une seule arrivait au dessin. */}
          <polygon className="mon-poly" points={sommets.map((q) => `${f1(q[0])},${f1(q[1])}`).join(" ")} />
          {sommets.map((q, i) => {
            const r = sommets[(i + 1) % sommets.length];
            return (
              <line key={axes[i].cle} className="mon-arete"
                    x1={f1(q[0])} y1={f1(q[1])} x2={f1(r[0])} y2={f1(r[1])} stroke={teinte(axes[i])} />
            );
          })}

          {/* Les points : le diametre dit le volume */}
          {axes.map((a, i) => {
            const q = sommets[i];
            const rp = rayonPoint(a);
            return (
              <g key={a.cle}>
                <circle className="mon-halo" cx={f1(q[0])} cy={f1(q[1])} r={f1(rp + 3)} fill={teinte(a)}
                        style={{ animationDelay: `${(i * 0.42).toFixed(2)}s` }} />
                <circle className="mon-pt" cx={f1(q[0])} cy={f1(q[1])} r={f1(rp)} fill={teinte(a)}>
                  <title>{`${a.nom} — ${a.faites}/${a.etapes} étapes (${a.pct} %)`}</title>
                </circle>
              </g>
            );
          })}

          {/* Etiquettes : nom du palier et pourcentage. */}
          {axes.map((a, i) => {
            const q = pt(i, R + 22);
            const ancre = Math.abs(q[0] - C) < 8 ? "middle" : q[0] > C ? "start" : "end";
            const dy = q[1] < C - 40 ? -4 : q[1] > C + 40 ? 12 : 0;
            return (
              <g key={a.cle}>
                <text className="mon-lab" x={f1(q[0])} y={f1(q[1] + dy)} textAnchor={ancre}>{a.nom}</text>
                <text className="mon-pct" x={f1(q[0])} y={f1(q[1] + dy + 11)} textAnchor={ancre} fill={teinte(a)}>
                  {a.pct}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* LA COLONNE DE CHARGE prend la place que le viseur ne peut
            pas occuper. La piste entiere vaut la part du palier dans le
            volume total ; la portion pleine, ce qui en est fait. Deux
            paliers a 80 % n ont donc pas la meme barre si l un pese
            trois fois l autre — c est exactement ce que le radar seul
            ne pouvait pas dire. */}
        <div className="mon-charge">
          <p className="mon-ctitre">Charge par palier · part des {volumeTotal} étapes</p>
          {charge.map((a) => (
            <div key={a.cle} className="mon-cl" style={{ ["--c" as string]: teinte(a) }}>
              <i>{a.nom}</i>
              <span className="mon-cpiste">
                <u style={{ width: `${((a.etapes / Math.max(1, volumeTotal)) * 100).toFixed(1)}%` }} />
                <b style={{ width: `${((a.faites / Math.max(1, volumeTotal)) * 100).toFixed(1)}%` }} />
              </span>
              <s>{a.faites}/{a.etapes}</s>
            </div>
          ))}
          <div className="mon-cpied">
            <span>Volume restant</span>
            <b>{volumeTotal - faitesTotal} étapes</b>
          </div>
        </div>
      </div>

      {critique && (
        <p className="mon-note">
          <b>{critique.nom}</b> porte {Math.round((critique.etapes / Math.max(1, volumeTotal)) * 100)} % du volume
          et n'est avancé qu'à {critique.pct} %.
          {frise && ` Jour ${frise.ecoule} / ${frise.total}.`}
        </p>
      )}
    </>
  );
}

export function DiagnosticView({ axes, frise, pctObjectifs, pctEtapes, pctHabitudes, ecart, critique, volumeTotal, data }: DiagnosticViewProps) {
  const rang = (p: number) => (p >= 70 ? "" : p >= 30 ? "warn" : "crit");
  const L = ({ t, v, c }: { t: string; v: string; c?: string }) => (
    <div className={`mon-dl ${c || ""}`}>
      <em>{t}</em>
      <span className="mon-pts" />
      <b>{v}</b>
    </div>
  );

  return (
    <div className="mon-crt flex-1 min-h-0">
      <div className="mon-diag">
        <p className="mon-dhead">&gt; ANALYSE DU CYCLE</p>
        {frise && <L t="TEMPS ÉCOULÉ" v={`${frise.pct.toFixed(1)} %`} />}
        <L t="OBJECTIFS FAITS" v={`${pctObjectifs.toFixed(1)} %`} c={rang(pctObjectifs)} />
        <L t="ÉTAPES VALIDÉES" v={`${pctEtapes.toFixed(1)} %`} c={rang(pctEtapes)} />
        <L t="HABITUDES" v={`${pctHabitudes.toFixed(1)} %`} c={rang(pctHabitudes)} />
        {ecart !== null && (
          <L t="ÉCART / TEMPS" v={`${ecart >= 0 ? "+" : "−"} ${Math.abs(ecart).toFixed(1)} pts`}
             c={ecart >= 0 ? "" : "crit"} />
        )}

        <div className="mon-dsep" />
        <p className="mon-dhead">&gt; CHARGE PAR PALIER</p>
        {axes.map((a) => (
          <L key={a.cle} t={a.nom} v={`${a.faites}/${a.etapes} · ${a.pct} %`} c={rang(a.pct)} />
        ))}

        <div className="mon-dsep" />
        <p className="mon-dhead">&gt; VOLUME</p>
        <L t="ÉTAPES TOTALES" v={`${data.totalStepsCompleted} / ${data.totalSteps}`} />
        {critique && (
          <L t={`${critique.nom} · ${Math.round((critique.etapes / Math.max(1, volumeTotal)) * 100)} % DU VOLUME`}
             v={`${critique.pct} %`} c="crit" />
        )}
        <p className="mon-dhead mt-2">&gt; FIN DE RAPPORT<span className="mon-curseur" /></p>
      </div>
    </div>
  );
}

export interface DiagnosticViewProps {
  axes: AxeDifficulte[];
  frise: FriseProjet | null;
  pctObjectifs: number;
  pctEtapes: number;
  pctHabitudes: number;
  ecart: number | null;
  critique: AxeDifficulte | null;
  volumeTotal: number;
  data: MonitoringData;
}

/** Un palier de difficulté, tel que le panneau le calcule au-dessus. */
export interface AxeDifficulte {
  cle: string;
  nom: string;
  couleur: string;
  pct: number;
  faites: number;
  etapes: number;
  objectifs: string;
}
