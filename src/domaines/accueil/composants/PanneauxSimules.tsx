/* LES PANNEAUX DU BANC.
 *
 * Ils ne font rien : ils cachent. L accueil pose sur le fond des
 * panneaux OPAQUES, aux couleurs `--nexus-*`, sur une colonne de
 * 1 024 px, separes de 0,5 rem dans un groupe et de 2,5 rem entre
 * groupes. Un fond se juge a ce qu il laisse voir entre eux : ces
 * panneaux reprennent donc exactement ces couleurs, ces bords et ces
 * espacements — et un contenu plausible, pour que l oeil ait quelque
 * chose a lire devant le fond.
 *
 * SAUF LE TEMPS « AGIR », qui est le vrai depuis le 23/09 : la rue
 * d enseignes et l atelier de nuit des ordres du jour. Leur mur de
 * beton est opaque comme celui de l enseigne, et c est lui que le fond
 * borde. Les ordres sont ceux d une journee feinte ; aucun appui ne
 * mene nulle part. */

import { AccesRue } from "@/domaines/accueil/composants/acces/AccesRue";
import { PointeuseNuit } from "@/domaines/accueil/composants/ordres/pointeuse/PointeuseNuit";
import { scenarioDe } from "@/domaines/accueil/logique/scenariosDesOrdres";

const MODULES_ACHETES = { "todo-list": true, journal: true, "track-health": true };
const ORDRES = scenarioDe("a-prendre").ordres;
const nullePart = () => {};

const ETAT = [
  { libelle: "Fin du pacte", valeur: "214 j" },
  { libelle: "Missions en cours", valeur: "2" },
  { libelle: "Série", valeur: "12 j" },
];

export function PanneauxSimules() {
  return (
    <>
      <section className="banc-fond-groupe banc-fond-groupe--pile" aria-label="Agir">
        <AccesRue ownedModules={MODULES_ACHETES} onNaviguer={nullePart} />
        <PointeuseNuit ordres={ORDRES} onReclamer={nullePart} replie={false} onBasculerRepli={nullePart} />
      </section>

      <section className="banc-fond-groupe banc-fond-groupe--trois" aria-label="État">
        {ETAT.map((e) => (
          <div key={e.libelle} className="banc-fond-panneau">
            <span className="banc-fond-libelle">{e.libelle}</span>
            <strong className="banc-fond-valeur">{e.valeur}</strong>
          </div>
        ))}
      </section>

      <section className="banc-fond-groupe" aria-label="Explorer">
        <div className="banc-fond-panneau banc-fond-panneau--haut">
          <span className="banc-fond-libelle">Surveillance</span>
          <div className="banc-fond-barres" aria-hidden="true">
            {[72, 48, 91, 33, 64, 80, 56].map((v, i) => <span key={i} style={{ height: `${v}%` }} />)}
          </div>
        </div>
      </section>
    </>
  );
}
