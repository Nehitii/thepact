import type { EtatDuCompte } from "@/domaines/accueil/logique/compteARebours";
import { useCompteARebours } from "@/domaines/accueil/hooks/useCompteARebours";
import type { ProprietesDuCompte } from "@/domaines/accueil/types";
import {
  dateLongue, dernierJour, joursAvantLeDebut, phraseDuCompte, pourcentEcoule, premierJour,
} from "@/domaines/accueil/composants/compte/lecture";
import "@/domaines/accueil/composants/compte/compte-chantier.css";

/* PROPOSITION A — LE PANNEAU DE CHANTIER.
 *
 * Le pacte est un chantier — le bandeau de l enseigne le dit deja :
 * « 2 chantiers ouverts ». Sous la rue, son panneau : un panneau a
 * messages variables, diodes orange sur fond noir, celles du bandeau de
 * l enseigne, entre deux bandes de hachures. Il dit ce que disent ces
 * panneaux au bord des routes : « Fin des travaux dans 214 jours », et
 * l avancement en segments.
 *
 * Dessous, la plaque d information du chantier : ouverture, livraison
 * prevue, duree. Les dates y sont en toutes lettres — la regle d avant
 * les abregeait.
 *
 * L ETAT SE VOIT AU GYROPHARE. Eteint tant que tout va ; allume,
 * immobile, a l attention ; il tourne dans la derniere ligne droite.
 * Au terme, le panneau dit « Fin des travaux — terme atteint » : il
 * constate la date, il ne juge pas le pacte. */

const MESSAGES: Readonly<Record<EtatDuCompte, string>> = {
  "a-venir": "Ouverture du chantier dans",
  nominal: "Fin des travaux dans",
  attention: "Fin des travaux dans",
  critique: "Dernière ligne droite",
  termine: "Fin des travaux",
};

const SEGMENTS = 24;

export function CompteChantier(p: ProprietesDuCompte) {
  const { lecture: l } = useCompteARebours(p);
  if (!l) return null;
  const aVenir = l.etat === "a-venir";
  /* Par defaut, comme le pourcentage : le dernier segment s allume au terme. */
  const allumes = Math.floor(l.part * SEGMENTS);

  return (
    <section className={`cc ${p.className ?? ""}`} data-etat={l.etat} role="group" aria-label={phraseDuCompte(l)}>
      <div className="cc-caisson">
        <span className="cc-hachures" aria-hidden="true" />
        <div className="cc-ecran" aria-hidden="true">
          <span className="cc-diodes cc-ligne">{MESSAGES[l.etat]}</span>
          <span className="cc-diodes cc-gros">
            {l.etat === "termine" ? (
              "Terme atteint"
            ) : (
              <>
                <b>{(aVenir ? joursAvantLeDebut(l) : l.gros.valeur).toLocaleString("fr-FR")}</b>
                {" "}{aVenir ? "jours" : l.gros.unite}
              </>
            )}
          </span>
          <span className="cc-avancement">
            <span className="cc-diodes">Avancement {pourcentEcoule(l)} %</span>
            <span className="cc-segments">
              {Array.from({ length: SEGMENTS }, (_, i) => <i key={i} data-allume={i < allumes || undefined} />)}
            </span>
          </span>
        </div>
        <span className="cc-hachures" aria-hidden="true" />
        <span className="cc-gyrophare" aria-hidden="true"><i /></span>
      </div>
      <dl className="cc-plaque">
        <div><dt>Ouverture du chantier</dt><dd>{dateLongue(premierJour(l))}</dd></div>
        <div><dt>Livraison prévue</dt><dd>{dateLongue(dernierJour(l))}</dd></div>
        <div><dt>Durée</dt><dd>{l.joursTotal.toLocaleString("fr-FR")} jours</dd></div>
      </dl>
    </section>
  );
}
