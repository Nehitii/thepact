import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGesteDeSignature, type FormeDuGeste } from "@/domaines/onboarding/hooks/useGesteDeSignature";

interface Props {
  actif: boolean;
  onSigne: () => void;
  sansAnimation?: boolean;
  /* Le banc d essai force le geste sans changer d appareil. */
  formeForcee?: FormeDuGeste;
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
export function Signature({ actif, onSigne, sansAnimation, formeForcee }: Props) {
  const { t } = useTranslation();
  const cadre = useRef<HTMLButtonElement>(null);
  const { forme, avancement, commencer, arreter, tracer } = useGesteDeSignature({
    actif, onSigne, sansAnimation, formeForcee,
  });

  /* Le trace se mesure DANS le cadre : les coordonnees de l evenement
     sont celles de l ecran, et le seuil est relatif a la zone. */
  const suivre = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = cadre.current?.getBoundingClientRect();
    if (!r) return;
    tracer({ x: e.clientX - r.left, y: e.clientY - r.top }, r.width, r.height);
  };

  return (
    <button
      ref={cadre}
      type="button"
      className="ob-signature"
      data-signature=""
      data-forme={forme}
      disabled={!actif}
      onPointerDown={commencer}
      onPointerMove={forme === "trace" ? suivre : undefined}
      onPointerUp={arreter}
      onPointerLeave={arreter}
      onPointerCancel={arreter}
      aria-label={t(`onboarding.signature.${forme}`)}
    >
      {/* Une echelle, pas une largeur : « width » demande une mise en
          page a chaque image, sur l element qu on fixe le plus du rite. */}
      <i
        className="ob-signature-jauge"
        style={{ transform: `scaleX(${avancement})` }}
        aria-hidden="true"
      />
      <span>{t(`onboarding.signature.${forme}`)}</span>
    </button>
  );
}
