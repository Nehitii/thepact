import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ObjetMinimal { id: string; name: string }

interface Props {
  precedent: ObjetMinimal | null;
  suivant: ObjetMinimal | null;
  rang: number;
  total: number;
  onPrecedent: () => void;
  onSuivant: () => void;
}

/**
 * LES DEUX VOISINS, NOMMES.
 *
 * Une fleche nue ne dit pas ou elle mene, donc on ne la suit pas : il
 * faut cliquer pour savoir, et decouvrir apres coup que ce n etait pas
 * la. Chaque bouton porte donc le NOM de l objectif qu il ouvre.
 *
 * Le rang au milieu — « 3 / 14 » — repond a la question qui vient
 * ensuite : combien il en reste. Sans lui, on ne sait pas si l on
 * parcourt trois fiches ou quarante.
 *
 * Aux extremites le bouton reste, desactive. Le faire disparaitre
 * decalerait le rang d un cote a l autre a chaque changement de fiche,
 * et l on perdrait le repere qu il est cense donner.
 */
export function DossierNavigation({ precedent, suivant, rang, total, onPrecedent, onSuivant }: Props) {
  const { t } = useTranslation();

  /* Une sequence d un seul objectif n a pas de voisins : la barre
     n aurait alors que du vide a montrer. */
  if (total <= 1) return null;

  return (
    <nav className="gd-nav" aria-label={t("goals.detail.navigation", "Naviguer entre les objectifs")}>
      <button
        type="button"
        className="gd-nav-cote"
        data-sens="avant"
        onClick={onPrecedent}
        disabled={!precedent}
        aria-label={precedent
          ? t("goals.detail.goPrevious", { nom: precedent.name, defaultValue: `Précédent : ${precedent.name}` })
          : t("goals.detail.noPrevious", "Aucun objectif avant celui-ci")}
      >
        <ChevronLeft aria-hidden="true" />
        <span>
          <u>{t("goals.detail.previous", "Précédent")}</u>
          <b>{precedent?.name ?? "—"}</b>
        </span>
      </button>

      <span className="gd-nav-rang" aria-live="polite">
        {rang > 0 ? `${rang} / ${total}` : `— / ${total}`}
      </span>

      <button
        type="button"
        className="gd-nav-cote"
        data-sens="apres"
        onClick={onSuivant}
        disabled={!suivant}
        aria-label={suivant
          ? t("goals.detail.goNext", { nom: suivant.name, defaultValue: `Suivant : ${suivant.name}` })
          : t("goals.detail.noNext", "Aucun objectif après celui-ci")}
      >
        <span>
          <u>{t("goals.detail.next", "Suivant")}</u>
          <b>{suivant?.name ?? "—"}</b>
        </span>
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
