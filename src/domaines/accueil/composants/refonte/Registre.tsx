import { motion } from "framer-motion";
import { BookOpen, ClipboardCheck, Dices, HeartPulse, ListChecks, Plus } from "lucide-react";
import { RosaceDuPacte } from "@/domaines/objectifs";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import { selonTheme } from "@/socle/outils/encrePapier";
import { MISSION, PACTE, RANG } from "@/domaines/accueil/logique/scenarioDuTableau";
import {
  dans, dateCourte, dateLongue, heure, lireDate, nombre, resteAvant,
} from "@/domaines/accueil/logique/lectureDuTableau";
import { ICONE_DE_L_ECHEANCE, ICONE_DU_GENRE, type DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";
import { Chiffre } from "@/domaines/accueil/composants/refonte/Chiffre";
import { OrdresDuRegistre } from "@/domaines/accueil/composants/refonte/OrdresDuRegistre";
import "@/domaines/accueil/composants/refonte/registre.css";

/* LE REGISTRE DE BORD.
 *
 * THESE. Un seul axe de temps. Ce qui est fait monte au-dessus de la
 * ligne MAINTENANT, ce qui vient descend dessous : on lit sa journee
 * comme un journal de bord, et la question du matin — qu est-ce que je
 * fais — a sa reponse a l endroit exact ou le regard tombe.
 *
 * LA LIGNE EST LA JOURNEE. Elle traverse l axe ; sa part pleine est la
 * part du jour ecoulee. Pas de jauge a cote de l heure : l heure EST la
 * jauge.
 *
 * L ECHELLE SE CASSE, ET LE DIT. Une heure, une semaine, trois ans ne
 * tiennent pas sur la meme regle. L axe se rompt entre les horizons,
 * et la rupture porte la distance franchie. */

const ACCES = [
  { nom: "Objectif", touche: "F1", Icone: Plus },
  { nom: "Tâche", touche: "F2", Icone: ListChecks },
  { nom: "Journal", touche: "F3", Icone: BookOpen },
  { nom: "Santé", touche: "F4", Icone: HeartPulse },
  { nom: "Tirage", touche: "F7", Icone: Dices },
  { nom: "Revue", touche: "F6", Icone: ClipboardCheck },
];

const HORIZONS = [
  { cle: "soir", nom: "Ce soir", jusqua: 1 },
  { cle: "semaine", nom: "Cette semaine et la suivante", jusqua: 14 },
  { cle: "loin", nom: "Plus loin", jusqua: 400 },
  { cle: "pacte", nom: "L’horizon du pacte", jusqua: Infinity },
] as const;

/** La distance que franchit une rupture de l axe, dite comme on la dirait. */
function distance(de: string, a: string): string {
  const j = (lireDate(a).getTime() - lireDate(de).getTime()) / 86_400_000;
  if (j < 14) return `${Math.round(j)} jours plus tard`;
  if (j < 60) return `${Math.round(j / 7)} semaines plus tard`;
  if (j < 730) return `${Math.round(j / 30.4)} mois plus tard`;
  return `${Math.round(j / 365)} ans plus tard`;
}

export function Registre(d: DonneesDuTableau) {
  const { maintenant, lecture, journee, aVenir, bonds } = d;
  const sombre = useThemeSombre();
  const partDuJour = ((maintenant.getHours() * 60 + maintenant.getMinutes()) / 1440) * 100;
  const joursAvant = (iso: string) => (lireDate(iso).getTime() - maintenant.getTime()) / 86_400_000;
  const groupes = HORIZONS.map((h, i) => ({
    ...h,
    items: aVenir.filter((e) => {
      const j = joursAvant(e.date);
      return j >= (i === 0 ? -1 : HORIZONS[i - 1].jusqua) && j < h.jusqua;
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="rb">
      <header className="rb-bandeau">
        <RosaceDuPacte
          className="rb-sceau"
          nom={PACTE.nom}
          valeurs={PACTE.valeurs}
          version={PACTE.version}
          progression={lecture.objectifs.pct / 100}
          alt={`Sceau de ${PACTE.nom}`}
        />
        <div className="rb-titre">
          <h1>{PACTE.nom}</h1>
          <p>{PACTE.mantra}</p>
        </div>
        <p className="rb-lecture">
          Jour <b>{nombre(lecture.jour)}</b> sur {nombre(lecture.jours)}
          <span aria-hidden="true"> · </span>
          <b>{lecture.objectifs.tenus}</b> objectifs tenus sur {lecture.objectifs.total}
          <span aria-hidden="true"> · </span>
          rang <b>{RANG.nom}</b>
        </p>
        <p className="rb-bonds"><b><Chiffre valeur={bonds} /></b> bonds</p>
        <div className="rb-delai" role="progressbar" aria-label="Part du pacte écoulée"
          aria-valuenow={Math.round(lecture.pctTemps)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${lecture.pctTemps}%` }} />
        </div>
      </header>

      <div className="rb-corps">
        <main className="rb-axe" aria-label="Registre de la journée">
          <h2 className="rb-jour">Aujourd’hui, {dateLongue(maintenant, maintenant)}</h2>

          <ol className="rb-fait">
            {journee.map((e, i) => {
              const Icone = ICONE_DU_GENRE[e.genre];
              return (
                <motion.li key={`${e.heure}-${e.titre}`} className="rb-ligne" data-genre={e.genre}
                  layout initial={i >= 5 ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }}>
                  <time className="rb-heure">{e.heure}</time>
                  <span className="rb-point"><Icone aria-hidden="true" /></span>
                  <span className="rb-texte">
                    <b>{e.titre}</b>
                    {e.detail && (
                      e.genre === "ordre"
                        ? <motion.em layoutId={`prime-${e.ordre}`} className="rb-prime">{e.detail}</motion.em>
                        : <em>{e.detail}</em>
                    )}
                  </span>
                </motion.li>
              );
            })}
          </ol>

          <div className="rb-maintenant" style={{ ["--jour" as string]: `${partDuJour}%` }}>
            <time className="rb-heure-vive">{heure(maintenant)}</time>
            <span className="rb-mot">Maintenant</span>
            <span className="rb-ligne-du-jour" role="progressbar" aria-label="Journée écoulée"
              aria-valuenow={Math.round(partDuJour)} aria-valuemin={0} aria-valuemax={100}><i /></span>
          </div>

          <article className="rb-mission" aria-label="Mission en cours">
            <div>
              <h3>{MISSION.titre}</h3>
              <p>{MISSION.objectif} · étape 8 sur 12</p>
            </div>
            <p className="rb-mission-reste">
              <b>{resteAvant(MISSION.echeance, maintenant)}</b>
              <span>avant {dateLongue(MISSION.echeance, maintenant)}, {heure(MISSION.echeance)}</span>
            </p>
            <button type="button" className="rb-bouton">Valider l’étape</button>
          </article>

          {groupes.map((g, gi) => (
            <section key={g.cle} className="rb-horizon" data-horizon={g.cle}>
              {gi > 0 && g.cle !== "semaine" && (
                <p className="rb-rupture" aria-hidden="true">
                  {distance(groupes[gi - 1].items.at(-1)!.date, g.items[0].date)}
                </p>
              )}
              <h3>{g.nom}</h3>
              <ol>
                {g.items.map((e) => {
                  const Icone = ICONE_DE_L_ECHEANCE[e.genre];
                  const date = lireDate(e.date);
                  return (
                    <li key={e.date + e.titre} className="rb-ligne rb-a-venir" data-genre={e.genre}>
                      <time className="rb-heure" dateTime={e.date}>
                        {g.cle === "soir" ? heure(date) : dateCourte(date, maintenant)}
                      </time>
                      <span className="rb-point"><Icone aria-hidden="true" /></span>
                      <span className="rb-texte">
                        <b>{e.titre}</b>
                        {e.detail && <em>{e.detail}</em>}
                      </span>
                      <span className="rb-dans">dans {dans(date, maintenant)}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </main>

        <aside className="rb-rail">
          <OrdresDuRegistre {...d} />

          <nav className="rb-panneau rb-acces" aria-label="Accès rapides">
            <h2>Accès rapides</h2>
            <ul>
              {ACCES.map(({ nom, touche, Icone }) => (
                <li key={nom}>
                  <button type="button">
                    <Icone aria-hidden="true" />
                    <span>{nom}</span>
                    <kbd>{touche}</kbd>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <section className="rb-panneau rb-paliers" aria-label="Étapes par palier">
            <h2>Étapes par palier</h2>
            <ul>
              {lecture.paliers.map((p) => (
                <li key={p.cle} style={{ ["--p" as string]: selonTheme(p.teinte, sombre) }}>
                  <span className="rb-palier-nom">{p.nom}</span>
                  <span className="rb-palier-piste"><i style={{ width: `${(p.faites / p.etapes) * 100}%` }} /></span>
                  <span className="rb-palier-compte">{p.faites}/{p.etapes}</span>
                </li>
              ))}
            </ul>
            <p className="rb-note">
              {nombre(lecture.etapes.faites)} étapes sur {nombre(lecture.etapes.total)} — {Math.round(lecture.etapes.pct)} %
              pour {Math.round(lecture.pctTemps)} % du temps.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
