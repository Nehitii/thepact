import { useEffect, useRef, useState } from "react";
import { RosaceDuPacte } from "@/domaines/objectifs";
import { OBJECTIFS, PACTE } from "@/domaines/accueil/logique/scenarioDuTableau";
import { dateCourte, heure, nombre } from "@/domaines/accueil/logique/lectureDuTableau";
import { LIGNES, stationCourante } from "@/domaines/accueil/logique/scenarioEtendu";
import { LARGEUR, MERIDIEN } from "@/domaines/accueil/logique/planDuReseau";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";
import { Chiffre } from "@/domaines/accueil/composants/refonte/Chiffre";
import { PlanDuReseau } from "@/domaines/accueil/composants/refonte/PlanDuReseau";
import { TableauDesDeparts } from "@/domaines/accueil/composants/refonte/TableauDesDeparts";
import "@/domaines/accueil/composants/refonte/reseau.css";

/* ═══════════════════════════════════════════════════════════════
   LE PLAN DU RESEAU — le contrat de la direction.

   THESE. Le pacte est un reseau de transport : chaque objectif est
   une ligne, chaque etape une station, et tous les trains sont a quai
   au meridien d aujourd hui. Le schema le plus lisible jamais dessine
   par des hommes, applique a une vie. Il refuse la grille de panneaux
   sombres a filets neon.

   MONDE. Un plan de nuit imprime : fond d encre bleu nuit, lignes aux
   couleurs d un reseau, stations blanches cerclees, une grotesque
   suisse (Switzer) pour toute la signaletique. Les trois valeurs du
   pacte sont les zones tarifaires. Au quai, un tableau Solari a volets
   noirs et lettres ambre.

   RECIT. On voit d un coup ou en est chaque objectif — ou est son
   train, quelle station vient — et, au tableau, ce qui part ce soir
   et cette semaine. Survoler une ligne donne le nom de ses stations.

   PREMIER ECRAN. Le plan en affiche, sur toute la largeur, le
   meridien au milieu ; dessous, le tableau des departs a gauche et
   l index des lignes a droite. L action — valider un ordre — est dans
   la ligne du tableau.

   FORME. « Le plan du reseau », premier de la liste, choix propre
   (IMPECCABLE'S PICK) face au tirage 78d3a9c2.

   FIN. Unreviewed and undocumented is unfinished; this build ends
   with the finish review, the verdict, DESIGN.md, and every shipping
   raster carrying its provenance.
   ═══════════════════════════════════════════════════════════════ */

export function Reseau(d: DonneesDuTableau) {
  const { maintenant, lecture, bonds } = d;
  /* Rien d eteint par defaut : le plan se lit en entier. Le survol isole
     une ligne le temps qu on la regarde ; un clic dans l index la garde. */
  const [gardee, setGardee] = useState("");
  const [survolee, setSurvolee] = useState("");
  const choisie = survolee || gardee;

  /* Sur un ecran trop etroit, l affiche defile. Elle s ouvre alors sur le
     meridien d aujourd hui — la ou sont les trains — et non sur le bord
     gauche, ou il n y a que les noms des zones. */
  const affiche = useRef<HTMLElement>(null);
  useEffect(() => {
    const f = affiche.current;
    if (!f || f.scrollWidth <= f.clientWidth) return;
    f.scrollLeft = (MERIDIEN / LARGEUR) * f.scrollWidth - f.clientWidth / 2;
  }, []);
  const jour = dateCourte(maintenant, maintenant);

  return (
    <div className="rs">
      <header className="rs-tete">
        <div className="rs-regie">
          <span className="rs-rond" aria-hidden="true">
            <RosaceDuPacte className="rs-rond-sceau" nom={PACTE.nom} valeurs={PACTE.valeurs} version={PACTE.version}
              progression={lecture.objectifs.pct / 100} elan={0.3} />
          </span>
          <div>
            <h1>Réseau {PACTE.nom}</h1>
            <p>Plan du réseau · état au {jour}, {heure(maintenant).replace(":", " h ")}</p>
          </div>
        </div>
        <dl className="rs-releves">
          <div><dt>Jour</dt><dd>{nombre(lecture.jour)}<small>/{nombre(lecture.jours)}</small></dd></div>
          <div><dt>Lignes ouvertes</dt><dd>{lecture.objectifs.ouverts}</dd></div>
          <div><dt>Bonds</dt><dd><Chiffre valeur={bonds} /></dd></div>
        </dl>
      </header>

      <figure className="rs-affiche" ref={affiche}>
        <PlanDuReseau choisie={choisie} choisir={setSurvolee} garder={(o) => setGardee((g) => (g === o ? "" : o))}
          relacher={() => setSurvolee("")} jour={jour} />
      </figure>

      <div className="rs-bas">
        <TableauDesDeparts {...d} />
        <nav className="rs-index" aria-label="Index des lignes">
          <h2>Index des lignes</h2>
          <ul>
            {LIGNES.map((l) => {
              const o = OBJECTIFS.find((x) => x.id === l.objectif);
              const suivante = l.stations[stationCourante(l)];
              return (
                <li key={l.objectif}>
                  <button type="button" aria-pressed={gardee === l.objectif}
                    onClick={() => setGardee((g) => (g === l.objectif ? "" : l.objectif))}
                    onMouseEnter={() => setSurvolee(l.objectif)} onMouseLeave={() => setSurvolee("")}>
                    <span className="rs-puce" style={{ background: l.couleur }}>{l.numero}</span>
                    <span className="rs-index-nom">
                      {o?.nom}
                      <em>{l.projet ? "en projet — ouverture à venir" : `prochaine : ${suivante.titre}`}</em>
                    </span>
                    <span className="rs-index-compte">
                      {o?.habitude ? `${o.habitude.coches}/${o.habitude.jours}` : `${o?.faites}/${o?.etapes}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
