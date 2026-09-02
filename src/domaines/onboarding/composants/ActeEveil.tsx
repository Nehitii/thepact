import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FenetreSysteme } from "@/domaines/onboarding/composants/FenetreSysteme";

interface Props {
  onAccepter: () => void;
  /** Le second refus est accepte : il renvoie a la deconnexion. */
  onRefuser: () => void;
}

/**
 * ACTE I — L EVEIL.
 *
 * Noir. Pas de titre, pas de bouton « Commencer », pas de logo qui
 * attend. Une fenetre systeme s ouvre seule et constate : porteur non
 * enregistre, aucun pacte actif.
 *
 * LE REFUS A UNE REPONSE, ET UNE SEULE FOIS. « Non » referme la
 * fenetre, puis elle se rouvre : « Reponse non enregistree. » La
 * blague pose le ton en deux secondes. Repetee, elle devient une porte
 * fermee — et une porte fermee n est plus une blague : le deuxieme
 * refus est accepte et renvoie a la deconnexion.
 */
export function ActeEveil({ onAccepter, onRefuser }: Props) {
  const { t } = useTranslation();
  const [refuse, setRefuse] = useState(false);

  const refuser = () => {
    if (refuse) return onRefuser();
    setRefuse(true);
  };

  return (
    <FenetreSysteme entete={t("onboarding.systeme")} ton={refuse ? "alerte" : "normal"}>
      {refuse ? (
        <p className="ob-ligne">{t("onboarding.eveil.refus")}</p>
      ) : (
        <>
          <p className="ob-ligne">{t("onboarding.eveil.porteur")}</p>
          <p className="ob-ligne">{t("onboarding.eveil.aucunPacte")}</p>
        </>
      )}

      <p className="ob-ligne">{t("onboarding.eveil.question")}</p>

      <div className="ob-gestes">
        <button type="button" className="ob-bouton" onClick={onAccepter}>
          {t("onboarding.eveil.oui")}
        </button>
        <button type="button" className="ob-bouton ob-bouton--sourd" onClick={refuser}>
          {t("onboarding.eveil.non")}
        </button>
      </div>
    </FenetreSysteme>
  );
}
