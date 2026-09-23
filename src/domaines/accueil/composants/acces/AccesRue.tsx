import type { CSSProperties } from "react";
import { useAccesRapides } from "@/domaines/accueil/hooks/useAccesRapides";
import type { ProprietesAccesRapide } from "@/domaines/accueil/types";
import { PictogrammeDAcces } from "@/domaines/accueil/composants/acces/PictogrammeDAcces";
import "@/domaines/accueil/composants/acces/acces-rue.css";

/* PROPOSITION A — LA RUE.
 *
 * Sous l enseigne du pacte, la suite de la rue : six petites
 * enseignes, une par acces, chacune dans son tube. La croix verte des
 * pharmacies pour la sante, un de pour le tirage, un livre ouvert pour
 * le journal. C est le meme mur de beton que l enseigne : les deux
 * composants se lisent comme une seule facade.
 *
 * LES ETATS SONT CEUX D UNE RUE LA NUIT.
 *   Un module qui n est pas achete est une enseigne ETEINTE — du verre
 *   gris, sans courant — avec une plaque « Boutique ».
 *   Le tirage, quand une mission est deja en cours, porte la plaque des
 *   hotels pleins : « Complet ». Ouvert sur la page, « Ouvert ».
 *
 * A l ouverture, les enseignes s allument l une apres l autre, apres
 * celle du pacte. */

export function AccesRue(p: ProprietesAccesRapide) {
  const acces = useAccesRapides(p);
  return (
    <section className={`ar-rue ${p.className ?? ""}`} aria-label="Accès rapide">
      <div className="ar-grille">
        {acces.map((a, i) => (
          <button
            key={a.id}
            type="button"
            className="ar-enseigne"
            data-acces={a.id}
            data-eteinte={a.verrouille || a.indisponible || undefined}
            data-ouvert={a.ouvert || undefined}
            style={{ "--ar-c": a.couleur, "--k": i } as CSSProperties}
            onClick={a.activer}
            disabled={a.indisponible || undefined}
            aria-pressed={a.id === "tirage" && !a.indisponible ? a.ouvert : undefined}
            title={a.titre}
          >
            <PictogrammeDAcces id={a.id} taille={46} epaisseur={1.5} className="ar-tube" />
            <span className="ar-nom">{a.libelle}</span>
            {a.verrouille && <span className="ar-plaque">Boutique</span>}
            {a.indisponible && <span className="ar-plaque ar-plaque--complet">Complet</span>}
            {a.ouvert && <span className="ar-plaque ar-plaque--ouvert">Ouvert</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
