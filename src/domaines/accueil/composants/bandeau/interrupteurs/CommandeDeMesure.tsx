import type { ReactNode } from "react";
import type { IdInterrupteur } from "@/domaines/accueil/logique/interrupteurs";
import type { Lecture } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/interrupteurs/levier.css";
import "@/domaines/accueil/composants/bandeau/interrupteurs/bascule.css";
import "@/domaines/accueil/composants/bandeau/interrupteurs/rotatif.css";
import "@/domaines/accueil/composants/bandeau/interrupteurs/cle.css";
import "@/domaines/accueil/composants/bandeau/interrupteurs/touches.css";
import "@/domaines/accueil/composants/bandeau/interrupteurs/glissiere.css";
import "@/domaines/accueil/composants/bandeau/interrupteurs/cordon.css";

/* LA COMMANDE DE MESURE, DANS LE MODELE CHOISI.
 *
 * Sept objets pour un seul geste. Ils ne portent aucun etat : la
 * position vient de « objectifs », et c est le conteneur (voir
 * « InterrupteurDeMesure ») qui pose « data-mesure » et « data-tour »
 * sur lequel chaque feuille accroche ses mouvements.
 *
 * DEUX FAMILLES DE GESTES.
 *   Ceux qui BASCULENT — levier, bascule, bouton rotatif, cle,
 *   glissiere : un seul bouton, chaque appui change de mesure.
 *   Ceux qui DESIGNENT — touches de poste, prises du cordon : un
 *   bouton par mesure, et appuyer sur celle qui est deja choisie ne
 *   fait rien, comme sur l objet. Ils disent leur etat par
 *   « aria-pressed ». */

interface Props {
  modele: IdInterrupteur;
  objectifs: boolean;
  onChanger?: () => void;
  lecture: Lecture;
}

/* Les deux etiquettes en tube, pour les commandes qui en ont. */
function Positions({ objectifs }: { objectifs: boolean }) {
  return (
    <span className="en-positions" aria-hidden="true">
      <span className="en-position" data-actif={objectifs || undefined}>
        Objectifs atteints
      </span>
      <span className="en-position" data-actif={!objectifs || undefined}>
        Étapes franchies
      </span>
    </span>
  );
}

/* Le bouton unique des commandes qui basculent. Sans « onChanger », la
   commande se montre sans repondre — c est la page qui decide. */
function Bascule({
  modele, lecture, onChanger, children,
}: {
  modele: IdInterrupteur;
  lecture: Lecture;
  onChanger?: () => void;
  children: ReactNode;
}) {
  const classe = `en-commande en-commande--${modele}`;
  if (!onChanger) return <span className={classe}>{children}</span>;
  return (
    <button type="button" className={classe} onClick={onChanger} title={lecture.basculeLue} aria-label={lecture.basculeLue}>
      {children}
    </button>
  );
}

/* Un bouton par mesure : il ne repond que s il n est pas deja choisi. */
function Designateur({
  actif, onChanger, className, children,
}: {
  actif: boolean;
  onChanger?: () => void;
  className: string;
  children: ReactNode;
}) {
  if (!onChanger) return <span className={className} data-actif={actif || undefined}>{children}</span>;
  return (
    <button
      type="button"
      className={className}
      data-actif={actif || undefined}
      aria-pressed={actif}
      onClick={actif ? undefined : onChanger}
    >
      {children}
    </button>
  );
}

export function CommandeDeMesure({ modele, objectifs, onChanger, lecture }: Props) {
  const commune = { modele, lecture, onChanger };

  switch (modele) {
    case "bascule":
      return (
        <Bascule {...commune}>
          <span className="bas-cadre" aria-hidden="true">
            <span className="bas-palette">
              <span className="bas-moitie bas-moitie--haut"><i className="bas-fenetre" /></span>
              <span className="bas-moitie bas-moitie--bas"><i className="bas-fenetre" /></span>
            </span>
          </span>
          <Positions objectifs={objectifs} />
        </Bascule>
      );

    case "rotatif":
      return (
        <Bascule {...commune}>
          <span className="rot-platine" aria-hidden="true">
            <span className="rot-bouton"><i className="rot-index" /></span>
          </span>
          <Positions objectifs={objectifs} />
        </Bascule>
      );

    case "cle":
      return (
        <Bascule {...commune}>
          <span className="cle-barillet" aria-hidden="true"><span className="cle-cle" /></span>
          <Positions objectifs={objectifs} />
        </Bascule>
      );

    case "glissiere":
      return (
        <Bascule {...commune}>
          <span className="en-position" data-actif={objectifs || undefined} aria-hidden="true">Objectifs</span>
          <span className="gli-fente" aria-hidden="true"><span className="gli-curseur" /></span>
          <span className="en-position" data-actif={!objectifs || undefined} aria-hidden="true">Étapes</span>
        </Bascule>
      );

    case "touches":
      return (
        <span className="en-commande en-commande--touches" role="group" aria-label="Mesure de l’avancement">
          <Designateur actif={objectifs} onChanger={onChanger} className="tou-touche">
            <i className="tou-voyant" aria-hidden="true" />Objectifs
          </Designateur>
          <Designateur actif={!objectifs} onChanger={onChanger} className="tou-touche">
            <i className="tou-voyant" aria-hidden="true" />Étapes
          </Designateur>
        </span>
      );

    case "cordon":
      return (
        <span className="en-commande en-commande--cordon" role="group" aria-label="Mesure de l’avancement">
          <span className="cor-panneau">
            <Designateur actif={objectifs} onChanger={onChanger} className="cor-prise cor-prise--objectifs">
              <span className="en-position" data-actif={objectifs || undefined}>Objectifs</span>
              <i className="cor-trou" aria-hidden="true" />
            </Designateur>
            <Designateur actif={!objectifs} onChanger={onChanger} className="cor-prise cor-prise--etapes">
              <span className="en-position" data-actif={!objectifs || undefined}>Étapes</span>
              <i className="cor-trou" aria-hidden="true" />
            </Designateur>
            <svg className="cor-cable" viewBox="0 0 184 100" aria-hidden="true">
              <path className="cor-cable-gaine" />
              <path className="cor-cable-reflet" />
            </svg>
            <span className="cor-fiche" aria-hidden="true" />
          </span>
        </span>
      );

    default:
      return (
        <Bascule {...commune}>
          <span className="lev-platine" aria-hidden="true">
            <i className="lev-vis" />
            <i className="lev-vis" />
            <span className="lev-manette" />
            <span className="lev-bague" />
          </span>
          <Positions objectifs={objectifs} />
        </Bascule>
      );
  }
}
