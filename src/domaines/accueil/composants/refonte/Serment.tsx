import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { RosaceDuPacte } from "@/domaines/objectifs";
import { MISSION, PACTE, RANG } from "@/domaines/accueil/logique/scenarioDuTableau";
import { dateLongue, heure, nombre, resteAvant } from "@/domaines/accueil/logique/lectureDuTableau";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";
import { Chiffre } from "@/domaines/accueil/composants/refonte/Chiffre";
import { ClausesDuSerment } from "@/domaines/accueil/composants/refonte/ClausesDuSerment";
import "@/domaines/accueil/composants/refonte/serment.css";

/* LE SERMENT VIVANT.
 *
 * THESE. Le tableau de bord se lit comme le pacte qu on a jure : des
 * articles, dans l ordre ou on les a signes, dont les chiffres sont
 * vivants. On ne consulte pas des panneaux — on relit son engagement,
 * et l engagement dit ou l on en est.
 *
 * LE DOCUMENT A SES MARGES. A gauche, le numero de l article ; a
 * droite, ce que le systeme releve en regard — un ecart, un palier
 * trop lourd. Les notes restent en face de ce qu elles commentent,
 * parce que chaque article est une rangee de la meme grille.
 *
 * LES CHIFFRES SE COMPTENT A L OUVERTURE, une fois : le document
 * s anime au moment ou on le relit, puis se tient tranquille. Tenir un
 * ordre le tamponne ; ce geste-la est le seul qui revienne. */

const Nombre = ({ v }: { v: number }) => (
  <b className="se-vif"><Chiffre valeur={v} depart={0} duree={1100} /></b>
);

export function Serment(d: DonneesDuTableau) {
  const { maintenant, lecture, ordres, reclamer, journee, bonds } = d;
  const dejaTenus = useRef(new Set(ordres.filter((o) => o.reclame).map((o) => o.id)));
  const [lu] = useState(maintenant);
  const tenus = ordres.filter((o) => o.reclame).length;
  const journal = journee.find((e) => e.genre === "journal");
  const plusLourd = lecture.palierLePlusLourd;

  return (
    <div className="se">
      <article className="se-feuille" aria-label={`Pacte ${PACTE.nom}`}>
        <header className="se-rangee se-tete">
          <div className="se-marge">
            <RosaceDuPacte className="se-sceau" nom={PACTE.nom} valeurs={PACTE.valeurs} version={PACTE.version}
              progression={lecture.objectifs.pct / 100} alt={`Sceau de ${PACTE.nom}`} />
          </div>
          <div className="se-texte">
            <h1>Pacte « {PACTE.nom} »</h1>
            <p className="se-sous-titre">
              Juré le {dateLongue(PACTE.debut, maintenant)}. Relu le {dateLongue(lu, lu)}, à {heure(lu)}.
            </p>
            <p className="se-mantra">{PACTE.mantra}</p>
          </div>
          <p className="se-note">Scellé sous l’alphabet de la version {PACTE.version}. Même nom, mêmes valeurs : même sceau, pour toujours.</p>
        </header>

        <section className="se-rangee">
          <p className="se-marge se-num" aria-hidden="true">·</p>
          <div className="se-texte">
            <p>
              Je tiens ce pacte selon trois valeurs, dans cet ordre :{" "}
              {PACTE.valeurs.map((v, i) => (
                <span key={v}>
                  <span className="se-valeur"><i>{i + 1}</i>{v}</span>
                  {i < PACTE.valeurs.length - 1 ? (i === PACTE.valeurs.length - 2 ? " et " : ", ") : "."}
                </span>
              ))}
            </p>
          </div>
          <p className="se-note">Leur rang place les médaillons du sceau.</p>
        </section>

        <section className="se-rangee" aria-labelledby="se-art-1">
          <p className="se-marge se-num" aria-hidden="true">I</p>
          <div className="se-texte">
            <h2 id="se-art-1">Du délai</h2>
            <p>
              Ce pacte court jusqu’au <b>{dateLongue(PACTE.fin, maintenant)}</b>. Il en reste <Nombre v={lecture.restants} /> jours
              sur {nombre(lecture.jours)} : <Nombre v={Math.round(lecture.pctTemps)} /> % du temps est derrière moi.
            </p>
            <div className="se-regle" aria-hidden="true">
              <i style={{ width: `${lecture.pctTemps}%` }} />
              <span className="se-regle-ici" style={{ left: `${lecture.pctTemps}%` }}>jour {nombre(lecture.jour)}</span>
            </div>
          </div>
          <p className="se-note" data-ton={lecture.ecart < 0 ? "retard" : "avance"}>
            Écart relevé : {Math.round(lecture.objectifs.pct)} % des objectifs tenus pour {Math.round(lecture.pctTemps)} % du temps,
            soit {Math.abs(lecture.ecart)} points {lecture.ecart < 0 ? "de retard" : "d’avance"}.
          </p>
        </section>

        <section className="se-rangee" aria-labelledby="se-art-2">
          <p className="se-marge se-num" aria-hidden="true">II</p>
          <div className="se-texte">
            <h2 id="se-art-2">Des objectifs</h2>
            <p>
              Je me suis donné <Nombre v={lecture.objectifs.total} /> objectifs. J’en tiens <Nombre v={lecture.objectifs.tenus} />,{" "}
              <Nombre v={lecture.objectifs.ouverts} /> sont ouverts et <Nombre v={lecture.objectifs.enAttente} /> attendent.
              J’ai franchi <Nombre v={lecture.etapes.faites} /> étapes sur {nombre(lecture.etapes.total)}.
            </p>
            <ClausesDuSerment {...d} />
          </div>
          <p className="se-note">
            {plusLourd && <>Le palier {plusLourd.nom} porte {plusLourd.etapes - plusLourd.faites} étapes restantes : le plus lourd. </>}
            Les clauses en focus passent en tête.
          </p>
        </section>

        <section className="se-rangee" aria-labelledby="se-art-3">
          <p className="se-marge se-num" aria-hidden="true">III</p>
          <div className="se-texte">
            <h2 id="se-art-3">D’aujourd’hui</h2>
            <p>
              Trois ordres courent jusqu’à <b>2 h</b>. J’en ai tenu <b className="se-vif"><Chiffre valeur={tenus} /></b>.
            </p>
            <ol className="se-ordres">
              {ordres.map((o) => {
                const pret = o.progres >= o.cible && !o.reclame;
                return (
                  <li key={o.id} data-etat={o.reclame ? "tenu" : pret ? "pret" : "en-cours"}>
                    <span className="se-case" aria-hidden="true" />
                    <span className="se-ordre">
                      {o.titre} <em>{o.reclame ? "" : `${o.progres} sur ${o.cible} · `}{o.prime} bonds</em>
                    </span>
                    {pret && (
                      <button type="button" className="se-tamponner" onClick={() => reclamer(o.id)}>
                        Réclamer {o.prime} bonds
                      </button>
                    )}
                    {o.reclame && (
                      <motion.span className="se-tampon" aria-label="tenu"
                        initial={dejaTenus.current.has(o.id) ? false : { scale: 1.7, opacity: 0, rotate: -18 }}
                        animate={{ scale: 1, opacity: 1, rotate: -8 }}
                        transition={{ type: "spring", stiffness: 520, damping: 22 }}>
                        Tenu
                      </motion.span>
                    )}
                  </li>
                );
              })}
            </ol>
            <p>
              Une mission est engagée : <b>{MISSION.titre.toLowerCase()}</b>, pour « {MISSION.objectif} ». Il reste{" "}
              <b className="se-vif">{resteAvant(MISSION.echeance, maintenant)}</b>, jusqu’au {dateLongue(MISSION.echeance, maintenant)} à{" "}
              {heure(MISSION.echeance)}.
            </p>
          </div>
          <p className="se-note">
            {journal ? `Journal écrit à ${journal.heure.replace(":", " h ")}. ` : ""}
            {journee.length} gestes posés depuis ce matin.
          </p>
        </section>

        <section className="se-rangee" aria-labelledby="se-art-4">
          <p className="se-marge se-num" aria-hidden="true">IV</p>
          <div className="se-texte">
            <h2 id="se-art-4">Du rang</h2>
            <p>
              Je suis <b>{RANG.nom}</b>, niveau <Nombre v={RANG.niveau} />. Il me manque <Nombre v={RANG.cible - RANG.xp} /> points
              pour devenir <b>{RANG.suivant}</b>.
            </p>
            <div className="se-regle se-regle-rang" aria-hidden="true"><i style={{ width: `${(RANG.xp / RANG.cible) * 100}%` }} /></div>
          </div>
          <p className="se-note">Le rang suit l’expérience gagnée, pas seulement les objectifs tenus.</p>
        </section>

        <footer className="se-rangee se-seing">
          <div className="se-marge" />
          <div className="se-texte">
            <p>Relu et tenu, le {dateLongue(lu, lu)}.</p>
            <p className="se-paraphe">{PACTE.nom}</p>
          </div>
          <p className="se-note">Solde : <b className="se-vif"><Chiffre valeur={bonds} /></b> bonds.</p>
        </footer>
      </article>
    </div>
  );
}
