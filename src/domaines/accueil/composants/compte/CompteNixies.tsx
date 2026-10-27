import { useCompteARebours } from "@/domaines/accueil/hooks/useCompteARebours";
import type { ProprietesDuCompte } from "@/domaines/accueil/types";
import {
  dateCourte, dernierJour, joursAvantLeDebut, motDeLEtat, phraseDuCompte, pourcentEcoule, premierJour,
} from "@/domaines/accueil/composants/compte/lecture";
import "@/domaines/accueil/composants/compte/compte-nixies.css";

/* PROPOSITION B — LES NIXIES ET LE GALVANOMETRE.
 *
 * La langue de l atelier de nuit, juste au-dessus : un boitier
 * d instrument de bakelite et de laiton. A gauche, les jours restants
 * dans de grands tubes nixie — le chiffre allume devant les autres,
 * qu on devine eteints derriere la grille. Au milieu, un galvanometre :
 * son aiguille dit la part ecoulee, et le dernier quart de son cadran
 * est rouge. A droite, le voyant de l etat et les deux bornes, gravees.
 *
 * Les deux derniers jours, les tubes passent aux heures, puis aux
 * minutes. Au terme, ils s eteignent, l aiguille bute, le voyant passe
 * au vert : « Terme atteint ». */

/* L aiguille balaie quatre-vingt-seize degres, de -48 a +48. */
const angleDe = (part: number) => -48 + part * 96;

function Cadran({ part }: { part: number }) {
  const point = (angle: number, r: number) => {
    const a = (angle * Math.PI) / 180;
    return `${(60 + r * Math.sin(a)).toFixed(2)} ${(68 - r * Math.cos(a)).toFixed(2)}`;
  };
  return (
    <svg className="cn-cadran" viewBox="0 0 120 76" aria-hidden="true">
      <path className="cn-zone" d={`M${point(24, 50)} A50 50 0 0 1 ${point(48, 50)}`} />
      {Array.from({ length: 21 }, (_, i) => {
        const a = angleDe(i / 20);
        return <path key={i} className={i % 5 ? "cn-trait" : "cn-trait cn-trait--fort"} d={`M${point(a, i % 5 ? 46 : 43)} L${point(a, 52)}`} />;
      })}
      {[0, 50, 100].map((v) => {
        const [x, y] = point(angleDe(v / 100), 35).split(" ");
        return <text key={v} className="cn-graduation" x={x} y={y}>{v}</text>;
      })}
      <text className="cn-marque" x="60" y="50">% écoulé</text>
      {/* Une transformation CSS, pas l attribut : seule la premiere se
          laisse animer, et l aiguille d un galvanometre ne saute pas. */}
      <g style={{ transform: `rotate(${angleDe(part)}deg)`, transformOrigin: "60px 68px" }}>
        <path className="cn-aiguille" d="M60 70 L60 20" />
      </g>
      <circle className="cn-pivot" cx="60" cy="68" r="4" />
    </svg>
  );
}

export function CompteNixies(p: ProprietesDuCompte) {
  const { lecture: l } = useCompteARebours(p);
  if (!l) return null;
  const aVenir = l.etat === "a-venir";
  const termine = l.etat === "termine";
  const valeur = termine ? 0 : aVenir ? joursAvantLeDebut(l) : l.gros.valeur;
  const chiffres = String(valeur).padStart(l.gros.unite === "jours" || aVenir ? 3 : 2, "0");
  const unite = aVenir ? "jours avant l’ouverture" : termine ? "terme atteint" : l.gros.mot;

  return (
    <section className={`cn ${p.className ?? ""}`} data-etat={l.etat} role="group" aria-label={phraseDuCompte(l)}>
      <div className="cn-boitier">
        <div className="cn-compteur" aria-hidden="true">
          <span className="cn-tubes">
            {[...chiffres].map((c, i) => (
              <span key={i} className="cn-tube"><span className="cn-grille" /><b>{c}</b></span>
            ))}
          </span>
          <span className="cn-laiton">{unite}</span>
        </div>

        <div className="cn-galva" aria-hidden="true">
          <Cadran part={l.part} />
          <span className="cn-laiton cn-laiton--petit">{pourcentEcoule(l)} %</span>
        </div>

        <div className="cn-cote">
          <span className="cn-etat"><i className="cn-voyant" />{motDeLEtat(l.etat)}</span>
          <dl className="cn-bornes">
            <div><dt>Début</dt><dd>{dateCourte(premierJour(l))}</dd></div>
            <div><dt>Terme</dt><dd>{dateCourte(dernierJour(l))}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
