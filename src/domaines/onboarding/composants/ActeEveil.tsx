import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FenetreSysteme } from "@/domaines/onboarding/composants/FenetreSysteme";
import { TexteEcrit } from "@/domaines/onboarding/composants/TexteEcrit";

interface Props {
  onAccepter: () => void;
  /* Force le mode sobre. Sans lui, l eveil lisait la preference du
     SYSTEME et ignorait le reglage : le banc affichait « sobre » et
     la fenetre attendait quand meme sa seconde et demie. Un banc qui
     ment sur ce qu il montre ne sert a rien. */
  sansAnimation?: boolean;
  /** Le second refus est accepte : il renvoie a la deconnexion. */
  onRefuser: () => void;
}

/** Le vide avant que la fenetre s ouvre seule. */
const VIDE = 1500;
/** Le noir entre la fermeture et la reouverture, apres un refus. */
const NOIR = 1000;

/**
 * ACTE I — L EVEIL.
 *
 * Noir. Pas de titre, pas de bouton « Commencer », pas de logo qui
 * attend. Une fenetre systeme S OUVRE SEULE au bout d une seconde et
 * demie de vide, et constate : porteur non enregistre, aucun pacte
 * actif.
 *
 * LE REFUS A UNE REPONSE, ET UNE SEULE FOIS. « Non » referme la
 * fenetre, une seconde de noir, elle se rouvre : « Reponse non
 * enregistree. » La blague pose le ton en deux secondes. Repetee, elle
 * devient une porte fermee — et une porte fermee n est plus une
 * blague : le deuxieme refus est accepte et renvoie a la deconnexion.
 */
export function ActeEveil({ onAccepter, onRefuser, sansAnimation }: Props) {
  const { t } = useTranslation();
  const preference = useReducedMotion();
  const sobre = sansAnimation ?? !!preference;
  /* Sous mouvement reduit, la fenetre est la : elle ne se fait pas
     attendre, elle ne s ecrit pas. Le rite garde ses ecrans. */
  const [ouverte, setOuverte] = useState(!!sobre);
  const [refuse, setRefuse] = useState(false);

  useEffect(() => {
    if (ouverte) return;
    const m = window.setTimeout(() => setOuverte(true), VIDE);
    return () => window.clearTimeout(m);
  }, [ouverte]);

  const refuser = () => {
    if (refuse) return onRefuser();
    setRefuse(true);
    if (sobre) return;
    /* Elle se referme, puis se rouvre — c est la fermeture qui fait la
       blague, pas le texte. */
    setOuverte(false);
    window.setTimeout(() => setOuverte(true), NOIR);
  };

  return (
    <AnimatePresence mode="wait">
      {ouverte && (
        <motion.div
          key={refuse ? "refus" : "premiere"}
          initial={sobre ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={sobre ? undefined : { opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        >
          <FenetreSysteme entete={t("onboarding.systeme")} ton={refuse ? "alerte" : "normal"}>
            {refuse ? (
              <p className="ob-ligne"><TexteEcrit texte={t("onboarding.eveil.refus")} /></p>
            ) : (
              <>
                <p className="ob-ligne"><TexteEcrit texte={t("onboarding.eveil.porteur")} /></p>
                <p className="ob-ligne">
                  <TexteEcrit texte={t("onboarding.eveil.aucunPacte")} retard={900} />
                </p>
                {/* L ENJEU, EN UNE LIGNE. Le rite demandait six decisions
                    avant d avoir jamais dit a quoi sert un pacte. Le
                    systeme le constate, dans son registre : sans pacte,
                    rien ne s ecrit. C est tout ce qu on ajoute a l eveil. */}
                <p className="ob-ligne">
                  <TexteEcrit texte={t("onboarding.eveil.enjeu")} retard={1600} />
                </p>
              </>
            )}

            <p className="ob-ligne">
              <TexteEcrit texte={t("onboarding.eveil.question")} retard={refuse ? 700 : 2500} />
            </p>

            <div className="ob-gestes">
              <button type="button" className="ob-bouton" onClick={onAccepter}>
                {t("onboarding.eveil.oui")}
              </button>
              <button type="button" className="ob-bouton ob-bouton--sourd" onClick={refuser}>
                {t("onboarding.eveil.non")}
              </button>
            </div>
          </FenetreSysteme>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
