import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReseauMia, VisageMia } from "@/domaines/mia";
import { GABARITS } from "@/domaines/onboarding/logique/gabarits";
import {
  DERNIERE, REPLIQUES, aFiniDeParler, expressionAu, repliquesDites, visageVisible,
} from "@/domaines/onboarding/logique/repliques";
import type { EtatDuRite } from "@/domaines/onboarding/logique/rite";

interface Props {
  etat: EtatDuRite;
  modifier: (champ: Partial<EtatDuRite> | ((e: EtatDuRite) => Partial<EtatDuRite>)) => void;
  /** Sans animation, tout se dit d un coup — voir « prefers-reduced-motion ». */
  sansAttente?: boolean;
}

/**
 * ACTE IV — LA RENCONTRE.
 *
 * Elle n arrive pas avec le pacte : elle arrive dans le noir qui suit.
 * D abord son anneau seul, sans visage ; puis les bulles, une a la
 * fois, A SON RYTHME — pas au clic du porteur, sauf pour accelerer.
 *
 * LES BULLES SONT LOCALES AU RITE, et c est un choix. « Bulle », dans
 * le domaine M.I.A., porte des actes, des sources et du markdown : la
 * faire venir ici demanderait d ouvrir sa porte sur des types de
 * console de conversation, pour rendre dix lignes de dialogue qui n en
 * ont aucun. Le visage et l anneau, eux, viennent bien de chez elle.
 *
 * SA DERNIERE REPLIQUE OUVRE LES GABARITS. Ce n est plus une etape de
 * formulaire, c est SA PREMIERE REQUETE — et la relation commence par
 * une demande, ce qui est exactement ce qu elle sera ensuite.
 */
export function LaRencontre({ etat, modifier, sansAttente = false }: Props) {
  const { t } = useTranslation();
  const [rang, setRang] = useState(sansAttente ? DERNIERE : -1);

  useEffect(() => {
    if (sansAttente || rang >= DERNIERE) return;
    const suivante = REPLIQUES[rang + 1];
    const minuteur = window.setTimeout(() => setRang((r) => r + 1), suivante.attente);
    return () => window.clearTimeout(minuteur);
  }, [rang, sansAttente]);

  /* Le clic n avance pas d une bulle : il les dit toutes. Accelerer
     n est pas piloter — elle garde son rythme ou on la coupe. */
  const tout = () => setRang(DERNIERE);

  const dites = repliquesDites(rang);
  const surMesure = etat.objectif && "surMesure" in etat.objectif;

  return (
    <div className="ob-mia" onClick={aFiniDeParler(rang) ? undefined : tout}>
      {visageVisible(rang)
        ? <VisageMia expression={expressionAu(rang)} taille={96} cadre="visage" />
        : <ReseauMia etat="reponse" taille={72} />}

      <div className="ob-mia-bulles" aria-live="polite">
        {dites.map((r) => (
          <p key={r.cle} className="ob-ligne ob-ligne--sourde">
            {t(`onboarding.mia.${r.cle}`)}
          </p>
        ))}
      </div>

      {aFiniDeParler(rang) && (
        <div className="ob-gabarits" role="group" aria-label={t("onboarding.objectif.entete")}>
          {GABARITS.map((g) => (
            <button
              key={g.id} type="button" className="ob-gabarit"
              aria-pressed={!!etat.objectif && "gabarit" in etat.objectif && etat.objectif.gabarit === g.id}
              onClick={() => modifier({ objectif: { gabarit: g.id } })}
            >
              <b>{t(`onboarding.gabarits.${g.id}.nom`)}</b>
              <small>{t(`onboarding.gabarits.${g.id}.description`)}</small>
            </button>
          ))}

          <button
            type="button" className="ob-gabarit"
            aria-pressed={!!surMesure}
            onClick={() => modifier({ objectif: { surMesure: "" } })}
          >
            <b>{t("onboarding.objectif.leTien")}</b>
            <small>{t("onboarding.objectif.leTienAide")}</small>
          </button>

          {surMesure && (
            <input
              className="ob-champ"
              value={(etat.objectif as { surMesure: string }).surMesure}
              onChange={(e) => modifier({ objectif: { surMesure: e.target.value } })}
              placeholder={t("onboarding.objectif.exemple")}
              aria-label={t("onboarding.objectif.leTien")}
              autoFocus
            />
          )}
        </div>
      )}
    </div>
  );
}
