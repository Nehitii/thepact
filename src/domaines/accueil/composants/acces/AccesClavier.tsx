import type { CSSProperties } from "react";
import { useAccesRapides } from "@/domaines/accueil/hooks/useAccesRapides";
import type { ProprietesAccesRapide } from "@/domaines/accueil/types";
import { PictogrammeDAcces } from "@/domaines/accueil/composants/acces/PictogrammeDAcces";
import "@/domaines/accueil/composants/acces/acces-clavier.css";

/* PROPOSITION C — LE CLAVIER.
 *
 * Un pave de commande de regie : six touches mecaniques dans un
 * chassis d aluminium, chacune coiffee d un petit ecran qui affiche
 * son pictogramme et son nom. La touche a une course : elle s enfonce
 * sous le doigt et remonte.
 *
 * L ECRAN DIT L ETAT.
 *   Un module qui n est pas achete : l ecran montre un cadenas et
 *   « Boutique ».
 *   Le tirage pendant une mission : « En cours », pictogramme eteint.
 *   Le tirage ouvert sur la page : l ecran s inverse — fond de couleur,
 *   dessin noir — comme une touche verrouillee en position. */

function Cadenas() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  );
}

export function AccesClavier(p: ProprietesAccesRapide) {
  const acces = useAccesRapides(p);
  return (
    <section className={`ac-clavier ${p.className ?? ""}`} aria-label="Accès rapide">
      <div className="ac-grille">
        {acces.map((a) => (
          <button
            key={a.id}
            type="button"
            className="ac-touche"
            data-verrouille={a.verrouille || undefined}
            data-indisponible={a.indisponible || undefined}
            data-ouvert={a.ouvert || undefined}
            style={{ "--ac-c": a.couleur } as CSSProperties}
            onClick={a.activer}
            disabled={a.indisponible || undefined}
            aria-pressed={a.id === "tirage" && !a.indisponible ? a.ouvert : undefined}
            title={a.titre}
          >
            <span className="ac-ecran">
              {a.verrouille ? <Cadenas /> : <PictogrammeDAcces id={a.id} taille={30} epaisseur={1.6} />}
              <span className="ac-nom">{a.libelle}</span>
              {a.verrouille && <span className="ac-etat">Boutique</span>}
              {a.indisponible && <span className="ac-etat">En cours</span>}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
