import type { CSSProperties } from "react";
import { useCompteARebours } from "@/domaines/accueil/hooks/useCompteARebours";
import type { ProprietesDuCompte } from "@/domaines/accueil/types";
import {
  dateCourte, dateLongue, dernierJour, joursAvantLeDebut, motDeLEtat, phraseDuCompte, premierJour,
} from "@/domaines/accueil/composants/compte/lecture";
import "@/domaines/accueil/composants/compte/compte-ruban.css";

/* PROPOSITION C — LE METRE RUBAN.
 *
 * La regle d avant disait le temps par une longueur ; celle-ci est un
 * vrai metre ruban, pose sur le beton de la rue, et c est LA LONGUEUR
 * QUI RESTE qui est tiree. Le boitier est cale sur le terme, a droite ;
 * le ruban en sort jusqu au crochet, accroche a aujourd hui. Chaque
 * jour le crochet avance et le ruban rentre : le jaune qu on voit,
 * c est ce qu il reste a tenir.
 *
 * COMME SUR UN VRAI METRE, LA GRADUATION PART DU CROCHET : trente,
 * soixante, quatre-vingt-dix jours d ici. L echelle est celle du pacte
 * entier — le ruban qui rentre garde ses chiffres a leur place. Le
 * dernier quart du pacte est imprime en rouge : on le voit venir, et
 * dans la derniere ligne droite il n y a plus que lui. La fenetre du
 * boitier donne la longueur entiere.
 *
 * Derriere le crochet, un trait de craie sur le beton : le chemin fait
 * depuis la croix du premier jour. Au terme, le ruban est rentre, le
 * crochet bute contre le boitier, la craie va d un bout a l autre. */

const JOUR = 86_400_000;
/** Les pas de la graduation, en jours. */
const PAS = [7, 14, 30, 60, 90, 180, 360];
/** Le rouge commence ou commence l etat critique : au dernier quart. */
const DEBUT_DU_ROUGE = 0.75;

interface Trait {
  jour: number;
  fort: boolean;
  /** Un chiffre sur deux s efface quand le ruban est etroit. */
  impair: boolean;
}

/* Un chiffre tous les « pas », assez larges pour qu il n y en ait pas
   plus de treize sur tout le pacte ; un trait tous les tiers de pas —
   tous les jours, sur un pacte court. */
function graduation(longueur: number, joursTotal: number): Trait[] {
  if (joursTotal <= 0 || longueur < 1) return [];
  const pas = PAS.find((p) => joursTotal / p <= 13) ?? 360;
  const sous = pas % 30 === 0 ? pas / 3 : pas / 7;
  const traits: Trait[] = [];
  for (let jour = sous; jour < longueur; jour += sous) {
    const rang = jour / pas;
    /* Un chiffre trop pres de la bouche y entrerait a moitie : le trait
       reste, le chiffre se tait. */
    const fort = Number.isInteger(rang) && longueur - jour > pas * 0.75;
    traits.push({ jour, fort, impair: fort && rang % 2 === 1 });
  }
  return traits;
}

/** « 1 minute », « 0 jour », « 36 heures ». */
const accorde = (n: number, unite: string) => (n >= 2 ? unite : unite.replace(/s$/, ""));

export function CompteRuban(p: ProprietesDuCompte) {
  const { lecture: l } = useCompteARebours(p);
  if (!l) return null;
  const aVenir = l.etat === "a-venir";
  const termine = l.etat === "termine";
  /* Avant l ouverture, le ruban est deroule sur tout le pacte ; ensuite
     il mesure ce qui reste. */
  const longueur = Math.min(l.resteMs, l.fin - l.debut) / JOUR;
  const traits = graduation(longueur, l.joursTotal);
  const rouge = l.part >= DEBUT_DU_ROUGE ? 0 : (DEBUT_DU_ROUGE - l.part) / (1 - l.part);
  const fenetre = aVenir
    ? { haut: "Durée", valeur: l.joursTotal, unite: "jours" }
    : { haut: "Reste", valeur: termine ? 0 : l.gros.valeur, unite: termine ? "jours" : l.gros.unite };
  const [drapeau, sousDrapeau] = aVenir
    ? ["Ouverture", `dans ${joursAvantLeDebut(l)} j`]
    : termine
      ? ["Au bout", `${l.joursTotal} jours`]
      : ["Aujourd’hui", `jour ${l.joursEcoules + 1}`];

  return (
    <section
      className={`cr ${p.className ?? ""}`}
      data-etat={l.etat}
      role="group"
      aria-label={phraseDuCompte(l)}
      style={{ "--cr-part": l.part, "--cr-rouge": rouge } as CSSProperties}
    >
      <div className="cr-sol" aria-hidden="true">
        <div className="cr-piste">
          <span className="cr-cordeau" />
          <span className="cr-croix"><b />{dateLongue(premierJour(l))}</span>
          {!termine && (
            <div className="cr-ruban">
              {traits.map((t) => (
                <i
                  key={t.jour}
                  className="cr-trait"
                  data-fort={t.fort || undefined}
                  data-impair={t.impair || undefined}
                  style={{ left: `${(t.jour / longueur) * 100}%` }}
                >
                  {t.fort && <span>{t.jour}</span>}
                </i>
              ))}
            </div>
          )}
          <span className="cr-crochet" />
          <span className="cr-drapeau" data-cote={l.part < 0.5 ? "droite" : "gauche"}>
            <em>{drapeau}</em>{sousDrapeau}
          </span>
        </div>

        <div className="cr-boitier">
          <span className="cr-bouton" />
          <span className="cr-fenetre">
            <small>{fenetre.haut}</small>
            <b>{fenetre.valeur.toLocaleString("fr-FR")}</b>
            <small>{accorde(fenetre.valeur, fenetre.unite)}</small>
          </span>
          <span className="cr-gravure">
            <em>{motDeLEtat(l.etat)}</em>
            {termine ? "le" : "Terme"} {dateCourte(dernierJour(l))}
          </span>
          <span className="cr-pince" />
        </div>
      </div>
    </section>
  );
}
