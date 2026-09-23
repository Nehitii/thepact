import { Fragment } from "react";
import { LIGNES, type Ligne } from "@/domaines/accueil/logique/scenarioEtendu";
import { OBJECTIFS, NOMS_DES_PALIERS } from "@/domaines/accueil/logique/scenarioDuTableau";
import {
  HAUTEUR, LARGEUR, MERIDIEN, TRACES, ZONES, placerLesStations, pointDuTrace, troncon,
} from "@/domaines/accueil/logique/planDuReseau";

/* LE PLAN : trois zones, dix lignes, un meridien.
 *
 * Les zones sont les trois valeurs du pacte, comme les zones tarifaires
 * d un vrai reseau : chaque ligne roule dans la zone de la valeur
 * qu elle sert. Le meridien d aujourd hui les traverse toutes, et
 * chaque train y est a quai.
 *
 * UNE LIGNE CHOISIE SE LIT EN ENTIER. Les autres s effacent, et ses
 * stations prennent leurs noms, penches a 40 degres comme sur un plan
 * de metro. Par defaut, rien n est eteint : le plan se lit d abord en
 * entier, et le survol isole une ligne. */

interface Props {
  choisie: string;
  choisir: (objectif: string) => void;
  garder: (objectif: string) => void;
  relacher: () => void;
  jour: string;
}

function Terminus({ l, dernier }: { l: Ligne; dernier: { x: number; y: number } }) {
  const o = OBJECTIFS.find((x) => x.id === l.objectif);
  const x = dernier.x + 16;
  return (
    <g className="rs-terminus">
      <circle cx={x + 14} cy={dernier.y} r={14} fill={l.couleur} />
      <text x={x + 14} y={dernier.y + 0.5} className="rs-numero">{l.numero}</text>
      <text x={x + 36} y={dernier.y - 4} className="rs-terminus-nom">{o?.nom ?? l.objectif}</text>
      <text x={x + 36} y={dernier.y + 14} className="rs-terminus-palier">
        {l.projet ? "Ligne en projet" : l.boucle ? "Ligne en boucle" : NOMS_DES_PALIERS[o?.difficulte ?? "easy"]}
      </text>
    </g>
  );
}

function LigneDuPlan({ l, choisie, choisir, garder }: {
  l: Ligne; choisie: boolean; choisir: (o: string) => void; garder: (o: string) => void;
}) {
  const t = TRACES[l.objectif];
  const stations = placerLesStations(l);
  const dernier = stations[stations.length - 1].point;
  const o = OBJECTIFS.find((x) => x.id === l.objectif);
  return (
    <g
      className="rs-ligne"
      data-choisie={choisie ? "" : undefined}
      data-projet={l.projet ? "" : undefined}
      style={{ ["--l" as string]: l.couleur }}
      tabIndex={0}
      role="button"
      aria-pressed={choisie}
      aria-label={`Ligne ${l.numero} : ${o?.nom ?? l.objectif}`}
      onMouseEnter={() => choisir(l.objectif)}
      onFocus={() => choisir(l.objectif)}
      onClick={() => garder(l.objectif)}
    >
      {stations.slice(1).map((st, i) => {
        const avant = stations[i];
        const express = !!(avant.saut || st.saut);
        const fait = st.s <= 0 && !l.projet;
        return (
          <path key={st.index} d={troncon(t, avant.s, st.s)}
            className={`rs-troncon${fait ? " rs-fait" : ""}${express ? " rs-express" : ""}`} />
        );
      })}
      <path d={troncon(t, stations[0].s, stations[stations.length - 1].s)} className="rs-prise" />

      {stations.map((st) => (
        <Fragment key={st.index}>
          {st.saut ? (
            <text x={st.point.x} y={st.point.y - 12} className="rs-saut">+{st.saut}</text>
          ) : st.courante ? (
            <>
              <circle cx={st.point.x} cy={st.point.y} r={15} className="rs-halo" />
              <circle cx={st.point.x} cy={st.point.y} r={9} className="rs-courante" />
            </>
          ) : (
            <circle cx={st.point.x} cy={st.point.y} r={st.faite ? 5 : 6.5}
              className={st.faite ? "rs-station rs-station-faite" : "rs-station"} />
          )}
          {choisie && !st.saut && st.index < stations.length - 1 && (
            <text x={st.point.x + 6} y={st.point.y - 14} className="rs-nom-station"
              data-courante={st.courante ? "" : undefined}
              transform={`rotate(-40 ${st.point.x + 6} ${st.point.y - 14})`}>
              {st.titre}
            </text>
          )}
        </Fragment>
      ))}

      {!l.projet && (() => {
        const p = pointDuTrace(t, -26);
        return <rect x={p.x - 13} y={p.y - 5.5} width={26} height={11} rx={5.5} className="rs-train" />;
      })()}

      <Terminus l={l} dernier={dernier} />
    </g>
  );
}

export function PlanDuReseau({ choisie, choisir, garder, relacher, jour }: Props) {
  const ordre = [...LIGNES].sort((a, b) => (a.objectif === choisie ? 1 : 0) - (b.objectif === choisie ? 1 : 0));
  return (
    <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} className="rs-plan" data-une-choisie={choisie ? "" : undefined}
      onMouseLeave={relacher}>
      <title>Plan du réseau du pacte</title>
      {ZONES.map((z) => (
        <g key={z.valeur} className="rs-zone">
          <rect x={16} y={z.y0} width={LARGEUR - 32} height={z.y1 - z.y0} rx={10} />
          <text x={34} y={z.y0 + 30} className="rs-zone-nom">Zone {z.numero}</text>
          <text x={34} y={z.y0 + 54} className="rs-zone-valeur">{z.valeur}</text>
        </g>
      ))}

      <line x1={MERIDIEN} y1={52} x2={MERIDIEN} y2={HAUTEUR - 26} className="rs-meridien" />
      <g className="rs-meridien-etiquette">
        <rect x={MERIDIEN - 118} y={16} width={236} height={30} rx={15} />
        <text x={MERIDIEN} y={31.5}>Aujourd’hui · {jour}</text>
      </g>

      {ordre.map((l) => (
        <LigneDuPlan key={l.objectif} l={l} choisie={l.objectif === choisie} choisir={choisir} garder={garder} />
      ))}

      <g className="rs-legende" transform="translate(40 700)">
        <rect x={-12} y={-24} width={300} height={140} rx={8} />
        <circle cx={6} cy={0} r={5} className="rs-station rs-station-faite" style={{ ["--l" as string]: "#8b9bff" }} />
        <text x={24} y={4}>Étape franchie</text>
        <circle cx={6} cy={26} r={9} className="rs-courante" style={{ ["--l" as string]: "#8b9bff" }} />
        <text x={24} y={30}>À quai aujourd’hui</text>
        <circle cx={6} cy={52} r={6.5} className="rs-station" />
        <text x={24} y={56}>Prochaines étapes</text>
        <line x1={-4} y1={78} x2={16} y2={78} className="rs-legende-express" />
        <text x={24} y={82}>Tronçon express, étapes cachées</text>
        <line x1={-4} y1={104} x2={16} y2={104} className="rs-legende-projet" />
        <text x={24} y={108}>Ligne en projet, pas encore ouverte</text>
      </g>
    </svg>
  );
}
