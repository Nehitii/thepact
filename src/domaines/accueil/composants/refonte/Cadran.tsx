import { useMemo, useState } from "react";
import { PactVisual, RosaceDuPacte } from "@/domaines/objectifs";
import { MISSION, NOMS_DES_PALIERS, PACTE } from "@/domaines/accueil/logique/scenarioDuTableau";
import { heure, nombre } from "@/domaines/accueil/logique/lectureDuTableau";
import { satellites, secteursDesPaliers } from "@/domaines/accueil/logique/cadranDuPacte";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import { selonTheme } from "@/socle/outils/encrePapier";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";
import { Chiffre } from "@/domaines/accueil/composants/refonte/Chiffre";
import { AnneauxDuCadran } from "@/domaines/accueil/composants/refonte/AnneauxDuCadran";
import { PanneauDuCadran } from "@/domaines/accueil/composants/refonte/PanneauDuCadran";
import "@/domaines/accueil/composants/refonte/cadran.css";

/* LE CADRAN DU PACTE.
 *
 * THESE. Tout l etat du pacte tient dans un seul instrument, et le
 * sceau en est le coeur. On ne lit plus quatre panneaux qui parlent
 * chacun de leur cote : on lit un objet, du centre vers le bord — ce
 * que je fais, ce que j ai, combien de temps il reste, ou en est le
 * jour.
 *
 * LES ANNEAUX SE REPONDENT. Choisir un objectif l eclaire sur trois
 * anneaux a la fois : son satellite, le secteur de son palier, et son
 * echeance sur le delai du pacte, reliee a lui d un trait. C est le
 * geste qui n existe pas dans des panneaux separes.
 *
 * UN INSTRUMENT SE LIT AVEC SA LEGENDE. Le panneau de droite dit ce
 * que chaque anneau mesure ; les satellites sont de vrais boutons, que
 * le clavier parcourt et qu un lecteur d ecran nomme. */

export function Cadran(d: DonneesDuTableau) {
  const { maintenant, lecture, objectifs, journee, bonds } = d;
  const [choix, setChoix] = useState(MISSION.objectifId);
  const sombre = useThemeSombre();
  const secteurs = useMemo(
    () => secteursDesPaliers(lecture.paliers.map((p) => ({ ...p, teinte: selonTheme(p.teinte, sombre) }))),
    [lecture.paliers, sombre],
  );
  const sats = useMemo(() => satellites(objectifs, secteurs), [objectifs, secteurs]);
  const choisi = sats.find((s) => s.objectif.id === choix) ?? sats[0];

  return (
    <div className="ca">
      <header className="ca-barre">
        <div className="ca-nom">
          <h1>{PACTE.nom}</h1>
          <p>{PACTE.mantra}</p>
        </div>
        <p className="ca-releve">
          <span>Jour <b>{nombre(lecture.jour)}</b>/{nombre(lecture.jours)}</span>
          <span><b><Chiffre valeur={bonds} /></b> bonds</span>
          <span><b>{heure(maintenant)}</b></span>
        </p>
      </header>

      <div className="ca-corps">
        <figure className="ca-instrument" aria-label={`Cadran du pacte ${PACTE.nom}`}>
          <AnneauxDuCadran maintenant={maintenant} secteurs={secteurs} sats={sats} choisi={choisi} journee={journee} />

          <div className="ca-coeur">
            <RosaceDuPacte
              className="ca-sceau"
              nom={PACTE.nom}
              valeurs={PACTE.valeurs}
              version={PACTE.version}
              progression={lecture.objectifs.pct / 100}
              elan={0.6}
              alt={`Sceau de ${PACTE.nom}`}
            />
            <div className="ca-symbole">
              <PactVisual symbol={PACTE.symbole} size="sm" progress={lecture.objectifs.pct} elan={0.6} />
            </div>
          </div>

          {sats.map((s) => {
            const o = s.objectif;
            const avancement = o.habitude
              ? `${o.habitude.coches} jours sur ${o.habitude.jours}`
              : `${o.faites} étapes sur ${o.etapes}`;
            return (
              <button
                key={o.id}
                type="button"
                className="ca-sat-bouton"
                aria-pressed={s === choisi}
                aria-label={`${o.nom} — ${NOMS_DES_PALIERS[o.difficulte]}, ${avancement}`}
                title={o.nom}
                style={{
                  left: `${s.point.x / 10}%`,
                  top: `${s.point.y / 10}%`,
                  ["--taille" as string]: `${((s.rayon * 2 + 14) / 1000) * 100}%`,
                }}
                onClick={() => setChoix(o.id)}
                onMouseEnter={() => setChoix(o.id)}
                onFocus={() => setChoix(o.id)}
              />
            );
          })}
        </figure>

        <PanneauDuCadran {...d} choisi={choisi} />
      </div>
    </div>
  );
}
