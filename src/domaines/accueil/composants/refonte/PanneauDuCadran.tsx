import { Check, Circle, Sparkles } from "lucide-react";
import { MISSION, NOMS_DES_PALIERS, PACTE, RANG } from "@/domaines/accueil/logique/scenarioDuTableau";
import { dans, dateLongue, lireDate, resteAvant } from "@/domaines/accueil/logique/lectureDuTableau";
import type { Satellite } from "@/domaines/accueil/logique/cadranDuPacte";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";

/* LE PANNEAU DU CADRAN : ce qu on fait, ce qu on regarde, comment lire.
 *
 * L instrument montre tout ; il ne dit rien a voix haute. Le panneau
 * porte les trois choses qu un cercle ne peut pas porter : l action
 * (la mission, les ordres), le detail de l objectif choisi, et la
 * legende — sans elle, cinq anneaux sont un joli dessin. */

const LEGENDE = [
  { anneau: 0, nom: "Paliers", texte: "Les étapes franchies, un secteur par difficulté, à la taille de son volume." },
  { anneau: 1, nom: "Objectifs", texte: "Plein : tenu. Cerclé : en cours, l’arc dit la part faite. Pointillé : pas ouvert. Losange : une habitude." },
  { anneau: 2, nom: "Délai", texte: `Le pacte fait le tour, depuis le haut. La part pleine est derrière toi.` },
  { anneau: 3, nom: "Journée", texte: "Minuit en haut. L’aiguille est l’heure qu’il est, les points ce que tu as fait." },
  { anneau: 4, nom: "Rang", texte: `Le bord : la part du chemin vers ${RANG.suivant}.` },
];

function Glyphe({ anneau }: { anneau: number }) {
  return (
    <svg viewBox="0 0 24 24" className="ca-glyphe" aria-hidden="true">
      {[3, 5.5, 8, 10, 11.5].map((r, i) => (
        <circle key={r} cx="12" cy="12" r={r} data-actif={i === anneau ? "" : undefined} />
      ))}
    </svg>
  );
}

export function PanneauDuCadran({
  maintenant, ordres, reclamer, choisi,
}: DonneesDuTableau & { choisi: Satellite | undefined }) {
  const o = choisi?.objectif;
  const echeance = o?.echeance ? lireDate(o.echeance) : null;
  const part = o ? (o.habitude ? o.habitude.coches / o.habitude.jours : o.faites / Math.max(1, o.etapes)) : 0;

  return (
    <aside className="ca-panneau">
      <section className="ca-bloc" aria-label="Maintenant">
        <h2>Maintenant</h2>
        <div className="ca-mission">
          <p className="ca-mission-titre">{MISSION.titre}</p>
          <p className="ca-mission-detail">
            {MISSION.objectif} · reste <b>{resteAvant(MISSION.echeance, maintenant)}</b>
          </p>
        </div>
        <ul className="ca-ordres">
          {ordres.map((or) => {
            const pret = or.progres >= or.cible && !or.reclame;
            return (
              <li key={or.id} data-etat={or.reclame ? "tenu" : pret ? "pret" : "en-cours"}>
                <span className="ca-marque" aria-hidden="true">
                  {or.reclame ? <Check /> : pret ? <Sparkles /> : <Circle />}
                </span>
                <span className="ca-ordre-titre">{or.titre}</span>
                {pret ? (
                  <button type="button" className="ca-reclamer" onClick={() => reclamer(or.id)}>
                    Réclamer <b>+{or.prime}</b>
                  </button>
                ) : (
                  <span className="ca-ordre-etat">{or.reclame ? "tenu" : `${or.progres}/${or.cible}`}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {o && choisi && (
        <section className="ca-bloc ca-objectif" style={{ ["--p" as string]: choisi.teinte }} aria-live="polite">
          <h2>{o.nom}</h2>
          <p className="ca-meta">
            <span className="ca-pastille">{NOMS_DES_PALIERS[o.difficulte]}</span>
            {o.statut === "fully_completed" ? "tenu" : o.statut === "not_started" ? "pas encore ouvert" : "en cours"}
            {o.focus && " · en focus"}
          </p>
          <div className="ca-avance">
            <span className="ca-avance-piste"><i style={{ width: `${part * 100}%` }} /></span>
            <span className="ca-avance-compte">
              {o.habitude ? `${o.habitude.coches}/${o.habitude.jours} jours` : `${o.faites}/${o.etapes} étapes`}
            </span>
          </div>
          {o.prochaine && o.statut !== "fully_completed" && (
            <p className="ca-ligne">Ensuite : <b>{o.prochaine.titre}</b></p>
          )}
          {echeance && (
            <p className="ca-ligne">
              Échéance : <b>{dateLongue(echeance, maintenant)}</b>, dans {dans(echeance, maintenant)}
            </p>
          )}
        </section>
      )}

      <section className="ca-bloc ca-legende" aria-label="Lire le cadran">
        <h2>Lire le cadran</h2>
        <dl>
          {LEGENDE.map((l) => (
            <div key={l.nom}>
              <dt><Glyphe anneau={l.anneau} />{l.nom}</dt>
              <dd>{l.texte}</dd>
            </div>
          ))}
        </dl>
        <p className="ca-pied">Au cœur, le sceau d’{PACTE.nom} : son anneau porte les objectifs tenus.</p>
      </section>
    </aside>
  );
}
