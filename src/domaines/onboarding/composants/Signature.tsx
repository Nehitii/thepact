import { useTranslation } from "react-i18next";
import { useGesteDeSignature } from "@/domaines/onboarding/hooks/useGesteDeSignature";

interface Props {
  actif: boolean;
  onSigne: () => void;
  sansAnimation?: boolean;
}

/**
 * LE GESTE QUI SIGNE.
 *
 * Un bouton qu on TIENT, pas qu on clique. Ce qu il demande depend de
 * l appareil — voir « useGesteDeSignature » —, et le libelle le dit :
 * on ne fait pas deviner un geste inhabituel.
 *
 * « touch-action: none » dans la feuille : sans lui, le doigt qui
 * maintient fait defiler la page et le geste se perd au premier
 * millimetre.
 */
export function Signature({ actif, onSigne, sansAnimation }: Props) {
  const { t } = useTranslation();
  const { forme, avancement, commencer, arreter } = useGesteDeSignature({
    actif, onSigne, sansAnimation,
  });

  return (
    <button
      type="button"
      className="ob-signature"
      data-signature=""
      disabled={!actif}
      onPointerDown={commencer}
      onPointerUp={arreter}
      onPointerLeave={arreter}
      onPointerCancel={arreter}
      aria-label={t(`onboarding.signature.${forme}`)}
    >
      <i
        className="ob-signature-jauge"
        style={{ width: `${Math.round(avancement * 100)}%` }}
        aria-hidden="true"
      />
      <span>{t(`onboarding.signature.${forme}`)}</span>
    </button>
  );
}
