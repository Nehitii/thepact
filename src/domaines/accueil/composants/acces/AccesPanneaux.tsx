import type { CSSProperties } from "react";
import { useAccesRapides } from "@/domaines/accueil/hooks/useAccesRapides";
import type { ProprietesAccesRapide } from "@/domaines/accueil/types";
import { PictogrammeDAcces } from "@/domaines/accueil/composants/acces/PictogrammeDAcces";
import "@/domaines/accueil/composants/acces/acces-panneaux.css";

/* PROPOSITION D — LES PANNEAUX.
 *
 * La signaletique d une station, la nuit : des panneaux retroeclaires,
 * un disque de couleur par destination comme les pastilles des lignes,
 * le nom en blanc, une ligne de precision dessous, et la fleche. C est
 * la plus sobre des quatre, et la seule qui dit en toutes lettres ce
 * que fait chaque acces — « Écrire la journée », « Laisser le sort
 * choisir ».
 *
 * LA PRECISION DIT L ETAT : « À débloquer — boutique » pour un module
 * qui n est pas achete, « Mission en cours » pour le tirage deja pris,
 * « Ouvert — cliquer pour fermer » quand il l est sur la page. Le
 * disque perd sa couleur quand la porte est fermee. */

function Fleche() {
  return (
    <svg className="apn-fleche" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

export function AccesPanneaux(p: ProprietesAccesRapide) {
  const acces = useAccesRapides(p);
  return (
    <section className={`apn ${p.className ?? ""}`} aria-label="Accès rapide">
      <div className="apn-grille">
        {acces.map((a) => {
          const precision = a.verrouille
            ? "À débloquer — boutique"
            : a.indisponible
              ? "Mission en cours"
              : a.ouvert
                ? "Ouvert — cliquer pour fermer"
                : a.geste;
          return (
            <button
              key={a.id}
              type="button"
              className="apn-panneau"
              data-ferme={a.verrouille || a.indisponible || undefined}
              data-ouvert={a.ouvert || undefined}
              style={{ "--apn-c": a.couleur } as CSSProperties}
              onClick={a.activer}
              disabled={a.indisponible || undefined}
              aria-pressed={a.id === "tirage" && !a.indisponible ? a.ouvert : undefined}
              title={a.titre}
            >
              <span className="apn-disque"><PictogrammeDAcces id={a.id} taille={21} epaisseur={2} /></span>
              <span className="apn-textes">
                <span className="apn-nom">{a.libelle}</span>
                <span className="apn-precision">{precision}</span>
              </span>
              <Fleche />
            </button>
          );
        })}
      </div>
    </section>
  );
}
