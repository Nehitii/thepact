import { useId } from "react";
import { useJourneeDesOrdres } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import type { ProprietesDesOrdres } from "@/domaines/accueil/types";
import { Bascule, Carte, Tambours } from "@/domaines/accueil/composants/ordres/pointeuse/communs";
import { surTrois } from "@/domaines/accueil/composants/ordres/pointeuse/lecture";
import "@/domaines/accueil/composants/ordres/pointeuse/horodateur.css";

const DOUZE_HEURES = 12 * 3_600_000;

/* VARIANTE B1 — L HORODATEUR.
 *
 * Il manquait a la pointeuse… la pointeuse. La voici, a gauche du
 * casier : un boitier emaille, un cadran a aiguilles, un compteur, une
 * fente. Le cadran donne l heure A LA MONTRE DU LECTEUR, et marque d un
 * triangle rouge l heure ou les ordres tombent ; quand elle est a moins
 * de douze heures, un secteur rouge couvre le temps qui reste — on le
 * voit fondre sans lire un chiffre.
 *
 * Pointer, c est mettre la carte dans la machine : la carte descend et
 * remonte, la lampe de la fente s allume, le boitier accuse le coup —
 * et la carte revient tamponnee. */

const point = (angle: number, rayon: number) => {
  const a = (angle * Math.PI) / 180;
  return `${(60 + rayon * Math.sin(a)).toFixed(2)} ${(60 - rayon * Math.cos(a)).toFixed(2)}`;
};

function Cadran({ maintenant, reste }: { maintenant: number; reste: number }) {
  const d = new Date(maintenant);
  const f = new Date(maintenant + reste);
  const aHeure = ((d.getHours() % 12) + d.getMinutes() / 60) * 30;
  const aMinute = d.getMinutes() * 6;
  const aFin = ((f.getHours() % 12) + f.getMinutes() / 60) * 30;
  const balayage = (((aFin - aHeure) % 360) + 360) % 360;
  const secteur = reste > 0 && reste <= DOUZE_HEURES
    ? `M60 60 L${point(aHeure, 51)} A51 51 0 ${balayage > 180 ? 1 : 0} 1 ${point(aFin, 51)} Z`
    : null;
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fin = f.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return (
    <span className="ph-lunette">
      <svg className="ph-cadran" viewBox="0 0 120 120" role="img" aria-label={`Il est ${heure} ; les ordres tombent à ${fin}`}>
        {secteur && <path className="ph-secteur" d={secteur} />}
        {Array.from({ length: 60 }, (_, i) => (
          <path key={i} className={i % 5 ? "ph-trait" : "ph-trait ph-trait--heure"}
            d={`M${point(i * 6, i % 5 ? 52 : 49)} L${point(i * 6, 55)}`} />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const [x, y] = point((i + 1) * 30, 42).split(" ");
          return <text key={i} className="ph-chiffre" x={x} y={y}>{i + 1}</text>;
        })}
        <text className="ph-marque" x="60" y="36">Horodateur</text>
        <path className="ph-repere" d={`M${point(aFin, 46)} L${point(aFin - 4.5, 56)} L${point(aFin + 4.5, 56)} Z`} />
        <g transform={`rotate(${aHeure} 60 60)`}><path className="ph-aiguille ph-aiguille--heure" d="M60 67 L60 33" /></g>
        <g transform={`rotate(${aMinute} 60 60)`}><path className="ph-aiguille" d="M60 69 L60 17" /></g>
        <circle className="ph-axe" cx="60" cy="60" r="3.2" />
      </svg>
    </span>
  );
}

export function PointeuseHorodateur(p: ProprietesDesOrdres) {
  const { journee: j, lignes, cloture, maintenant } = useJourneeDesOrdres(p);
  const corps = useId();
  const close = j.etat === "close";
  const clac = lignes.some((o) => o.enReclamation);

  return (
    <section
      className={`ph ${p.className ?? ""}`}
      aria-label="Ordres du jour"
      data-etat={j.etat}
      data-replie={p.replie || undefined}
    >
      <div className="ph-cadre pt-acier">
        <div className="ph-machine" data-clac={clac || undefined}>
          <Cadran maintenant={maintenant} reste={close ? 0 : cloture.ms} />
          <span className="ph-reste">
            {close ? "Journée close" : `Clôture ${cloture.heureLocale} · reste ${cloture.texte}`}
          </span>
          {lignes.length > 0 && (
            <span className="ph-compteur" aria-label={`Prime : ${j.primeAcquise} sur ${j.primeTotale} bonds`}>
              <small>Prime</small>
              <Tambours texte={`${surTrois(j.primeAcquise)}/${surTrois(j.primeTotale)}`} />
              <small>B</small>
            </span>
          )}
          <span className="ph-fente" aria-hidden="true">
            <span><i className="ph-lampe" data-allumee={clac || undefined} /> Insérer la carte</span>
            <i className="ph-fente-trou" />
          </span>
        </div>

        <div className="ph-droite">
          <header className="ph-tete">
            <span className="pt-plaque">Ordres du jour</span>
            <Bascule replie={p.replie} onBasculer={p.onBasculerRepli} controle={corps} />
          </header>
          <div className="ph-casier" id={corps}>
            {p.chargement ? (
              <p className="ph-mot" data-attente="">Les cartes arrivent…</p>
            ) : lignes.length === 0 ? (
              <p className="ph-mot">Aucune carte aujourd’hui. Ouvre une mission et les ordres suivront.</p>
            ) : (
              lignes.map((o, i) => <Carte key={o.id} o={o} n={i + 1} onReclamer={p.onReclamer} />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
