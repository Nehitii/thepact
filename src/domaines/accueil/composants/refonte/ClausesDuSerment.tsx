import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NOMS_DES_PALIERS, TEINTES_DES_PALIERS, type ObjectifDuScenario } from "@/domaines/accueil/logique/scenarioDuTableau";
import { dateLongue, lireDate } from "@/domaines/accueil/logique/lectureDuTableau";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import { selonTheme } from "@/socle/outils/encrePapier";

/* LES CLAUSES DE L ARTICLE II : un objectif, une phrase.
 *
 * Une clause dit ce qu un panneau dirait en quatre cases — le nom,
 * l avancement, la suite, l echeance — mais dans l ordre ou on les
 * pense : ce que je poursuis, ou j en suis, ce que je fais ensuite,
 * avant quand. Les objectifs en focus sont lus d office ; les autres se
 * deplient, par groupe, sans quitter l article. */

function Clause({ o, n, maintenant, animee = false, i = 0, sombre }: {
  o: ObjectifDuScenario; n: number; maintenant: Date; animee?: boolean; i?: number; sombre: boolean;
}) {
  const part = o.habitude ? o.habitude.coches / o.habitude.jours : o.faites / Math.max(1, o.etapes);
  const avance = o.habitude
    ? `${o.habitude.coches} jours sur ${o.habitude.jours}`
    : o.statut === "fully_completed"
      ? "tenu"
      : `${o.faites} étape${o.faites > 1 ? "s" : ""} sur ${o.etapes}`;
  return (
    <motion.li className="se-clause" data-statut={o.statut} style={{ ["--p" as string]: selonTheme(TEINTES_DES_PALIERS[o.difficulte], sombre) }}
      initial={animee ? { opacity: 0, y: -6 } : false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.24, delay: animee ? i * 0.03 : 0 }}>
      <span className="se-par">§ {n}</span>
      <div>
        <p>
          <b>{o.nom}</b> <span className="se-palier">{NOMS_DES_PALIERS[o.difficulte]}</span> — {avance}.
          {o.prochaine && o.statut !== "fully_completed" && <> Ensuite : {o.prochaine.titre}.</>}
          {o.echeance && o.statut !== "fully_completed" && (
            <> Avant le {dateLongue(lireDate(o.echeance), maintenant)}.</>
          )}
        </p>
        {o.statut !== "fully_completed" && (
          <span className="se-avance" aria-hidden="true"><i style={{ width: `${part * 100}%` }} /></span>
        )}
      </div>
    </motion.li>
  );
}

export function ClausesDuSerment({ objectifs, maintenant }: DonneesDuTableau) {
  const [deplie, setDeplie] = useState(false);
  const sombre = useThemeSombre();
  const focus = objectifs.filter((o) => o.focus && o.statut !== "fully_completed");
  const suite = [
    ...objectifs.filter((o) => !o.focus && o.statut === "in_progress"),
    ...objectifs.filter((o) => o.statut === "not_started"),
    ...objectifs.filter((o) => o.statut === "fully_completed"),
  ];

  return (
    <>
      <ol className="se-clauses">
        {focus.map((o, i) => <Clause key={o.id} o={o} n={i + 1} maintenant={maintenant} sombre={sombre} />)}
        <AnimatePresence initial={false}>
          {deplie && suite.map((o, i) => (
            <Clause key={o.id} o={o} n={focus.length + i + 1} maintenant={maintenant} animee i={i} sombre={sombre} />
          ))}
        </AnimatePresence>
      </ol>
      <button type="button" className="se-deplier" aria-expanded={deplie} onClick={() => setDeplie((v) => !v)}>
        {deplie ? "Replier les clauses" : `Lire les ${suite.length} autres clauses`}
      </button>
    </>
  );
}
