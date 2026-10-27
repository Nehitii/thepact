import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/socle/contextes/AuthContext";
import { LeRite } from "@/domaines/onboarding/composants/LeRite";
import { usePacteJure } from "@/domaines/onboarding/hooks/usePacteJure";
import { useSceller } from "@/domaines/onboarding/hooks/useSceller";
import type { EtatDuRite } from "@/domaines/onboarding/logique/rite";
import "@/domaines/onboarding/onboarding.css";

/**
 * LE RITE DU PACTE.
 *
 * L ancienne page etait six etapes numerotees et un formulaire bien
 * habille : elle prononcait « pacte » sept fois sans jamais le tenir —
 * on ne signait rien, on validait. Celle-ci ne fait plus que BRANCHER :
 * le rite vit dans « composants/LeRite », les ecritures dans
 * « hooks/useSceller », et l ordre des ecrans dans « logique/rite ».
 *
 * Ce partage n est pas de la symetrie : c est ce qui permet au BANC
 * D ESSAI de monter le meme rite avec un scellement qui n ecrit rien.
 *
 * LE RITE EST MUET. Aucun son, nulle part — exclusion de conception,
 * pas oubli.
 */
export default function Onboarding() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sceller, enCours } = useSceller();

  /* Le second passage n est jamais le premier : il garde la forge et
     la signature, saute l eveil et la rencontre. */
  const abrege = useMemo(
    () => new URLSearchParams(window.location.search).has("abrege"),
    [],
  );

  /* IL PART DE CE QUI A DEJA ETE JURE. « LeRite » ne lit son etat
     initial qu au montage : le monter avant que le pacte soit charge
     ferait redeclarer tout a l aveugle, et « useSceller » ecraserait le
     pacte par ce qui vient d etre retape. On attend. */
  const { etat, pret } = usePacteJure(abrege);

  const onSceller = useCallback(
    async (etat: EtatDuRite) => {
      const fait = await sceller(etat);
      if (fait) {
        toast.success(t("onboarding.welcomeToast"), { description: t("onboarding.pactSealed") });
        navigate("/");
      }
      return fait;
    },
    [sceller, t, navigate],
  );

  if (!pret) return <div className="ob ob--attente" />;

  return (
    <LeRite
      abrege={abrege}
      onSceller={onSceller}
      pretAEcrire={!!user && !enCours}
      onQuitter={() => navigate("/auth")}
      etatInitial={etat}
    />
  );
}
