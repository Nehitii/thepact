import type { CSSProperties } from "react";
import { useAccesRapides } from "@/domaines/accueil/hooks/useAccesRapides";
import type { ProprietesAccesRapide } from "@/domaines/accueil/types";
import { PictogrammeDAcces } from "@/domaines/accueil/composants/acces/PictogrammeDAcces";
import "@/domaines/accueil/composants/acces/acces-pupitre.css";

/* PROPOSITION B — LE PUPITRE.
 *
 * La console d une machine : une platine d acier brosse, et six
 * boutons-poussoirs lumineux, chacun dans sa lunette chromee, sa
 * plaque gravee dessous. C est la langue du cordon de l enseigne —
 * l acier, le chrome, les voyants — etendue a toute la rangee.
 *
 * TROIS FORMES POUR TROIS GESTES. Rond pour aller quelque part ;
 * carre pour la revue, qui ouvre un bilan ; le tirage est un gros
 * bouton champignon, celui qu on frappe du plat de la main. Chaque
 * verre porte son pictogramme imprime en noir, comme les voyants
 * d armoire : on reconnait le bouton sans lire la plaque.
 *
 * LES ETATS SONT CEUX D UNE MACHINE.
 *   Un module qui n est pas achete est un bouton A CLE : une serrure a
 *   la place du verre, qui mene a la boutique.
 *   Le tirage, quand une mission est en cours, est sous son CAPOT DE
 *   SECURITE — transparent, rabattu : on le voit, on ne peut pas
 *   appuyer. Ouvert sur la page, son verre reste allume. */

export function AccesPupitre(p: ProprietesAccesRapide) {
  const acces = useAccesRapides(p);
  return (
    <section className={`ap-pupitre ${p.className ?? ""}`} aria-label="Accès rapide">
      <div className="ap-grille">
        {acces.map((a) => (
          <button
            key={a.id}
            type="button"
            className="ap-poste"
            data-forme={a.id === "tirage" ? "champignon" : a.id === "revue" ? "carre" : "rond"}
            data-verrouille={a.verrouille || undefined}
            data-indisponible={a.indisponible || undefined}
            data-ouvert={a.ouvert || undefined}
            style={{ "--ap-c": a.couleur } as CSSProperties}
            onClick={a.activer}
            disabled={a.indisponible || undefined}
            aria-pressed={a.id === "tirage" && !a.indisponible ? a.ouvert : undefined}
            title={a.titre}
          >
            <span className="ap-lunette" aria-hidden="true">
              <span className="ap-verre">
                {!a.verrouille && <PictogrammeDAcces id={a.id} taille={a.id === "tirage" ? 24 : 20} epaisseur={2.2} />}
              </span>
              {a.indisponible && <span className="ap-capot" />}
            </span>
            <span className="ap-plaque">
              {a.libelle}
              {a.verrouille && <small>Boutique</small>}
              {a.indisponible && <small>Mission en cours</small>}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
