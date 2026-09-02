import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/socle/contextes/AuthContext";
import { ActeEveil } from "@/domaines/onboarding/composants/ActeEveil";
import { LaForge } from "@/domaines/onboarding/composants/LaForge";
import { LaRencontre } from "@/domaines/onboarding/composants/LaRencontre";
import { LeScellement } from "@/domaines/onboarding/composants/LeScellement";
import { Signature } from "@/domaines/onboarding/composants/Signature";
import { useSceller } from "@/domaines/onboarding/hooks/useSceller";
import {
  ACTE_DE, ETAT_VIDE, ecranPrecedent, ecranSuivant, ecransDuRite,
  fenetresCloses, peutAvancer, type Ecran, type EtatDuRite,
} from "@/domaines/onboarding/logique/rite";
import "@/domaines/onboarding/onboarding.css";

/* Les six teintes, en clair : une classe Tailwind construite a la
   volee serait purgee du bundle. */
const TEINTE: Record<string, string> = {
  amber: "#F59E0B", rose: "#F43F5E", emerald: "#10B981",
  sky: "#0EA5E9", violet: "#8B5CF6", cyan: "#06B6D4",
};

/**
 * LE RITE DU PACTE.
 *
 * L ancienne page etait six etapes numerotees et un formulaire bien
 * habille : elle prononcait « pacte » sept fois sans jamais le tenir —
 * on ne signait rien, on validait. Celle-ci a quatre actes, huit
 * ecrans, et quatre seulement demandent de taper quelque chose.
 *
 * ELLE N ASSEMBLE QUE. L ordre des ecrans, ce qui bloque et ce que le
 * second passage saute sont dans « logique/rite.ts », avec leurs
 * tests ; les cinq ecritures sont dans « hooks/useSceller.ts », reprises
 * telles quelles de l ancienne page parce qu elles etaient justes.
 *
 * LE RITE EST MUET. Aucun son, nulle part — c est une exclusion de la
 * conception, pas un oubli.
 */
export default function Onboarding() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sceller, enCours } = useSceller();
  const sobre = useReducedMotion();

  /* Le second passage n est jamais le premier : quelqu un qui a deja
     un pacte repasse par la depuis « ReinitialiserLePacte ». */
  const abrege = useMemo(
    () => new URLSearchParams(window.location.search).has("abrege"),
    [],
  );

  const [ecran, setEcran] = useState<Ecran>(() => ecransDuRite(abrege)[0]);
  const [etat, setEtat] = useState<EtatDuRite>(ETAT_VIDE);
  const [voile, setVoile] = useState(false);

  /* Il accepte une FONCTION autant qu un objet : sans cela, deux
     clics dans la meme image lisent tous les deux l etat d avant, et
     le second efface le premier. Trois valeurs cochees vite n en
     laissaient qu une — mesure a l ecran. */
  const modifier = useCallback(
    (champ: Partial<EtatDuRite> | ((e: EtatDuRite) => Partial<EtatDuRite>)) =>
      setEtat((e) => ({ ...e, ...(typeof champ === "function" ? champ(e) : champ) })),
    [],
  );

  const terminer = useCallback(async () => {
    if (await sceller(etat)) {
      setVoile(true);
      toast.success(t("onboarding.welcomeToast"), { description: t("onboarding.pactSealed") });
      navigate("/");
    }
  }, [sceller, etat, t, navigate]);

  const avancer = useCallback(() => {
    const suite = ecranSuivant(ecran, abrege);
    if (suite) return setEcran(suite);
    void terminer();
  }, [ecran, abrege, terminer]);

  const reculer = useCallback(() => {
    const avant = ecranPrecedent(ecran, abrege);
    if (avant) setEcran(avant);
  }, [ecran, abrege]);

  /* La sortie : discrete, jamais cachee. Un rite dont on ne peut pas
     sortir est une porte, pas un rite. */
  const passer = useCallback(() => setEcran("scellement"), []);

  const acte = ACTE_DE[ecran];
  const closes = fenetresCloses(ecran, abrege);

  /* LE VOILE. Une demi-seconde de silence total, le cercle brule, et
     l ecran passe a la couleur du pacte avec son nom en Orbitron. */
  if (voile) {
    return (
      <div className="ob ob-voile" style={{ color: TEINTE[etat.couleur] ?? TEINTE.amber }}>
        <b>{etat.nomDuPacte}</b>
      </div>
    );
  }

  return (
    <div className="ob">
      {/* LES FENETRES CLOSES restent empilees derriere, en
          transparence : c est la trace de ce qu on a declare, et ca
          remplace la barre de progression — un rite n en a pas. */}
      {closes > 0 && (
        <div className="ob-pile" aria-hidden="true">
          {Array.from({ length: closes }, (_, i) => (
            <i key={i} style={{ transform: `translateY(${(i + 1) * -9}px) scale(${1 - (i + 1) * 0.03})` }} />
          ))}
        </div>
      )}

      {/* CHAQUE FENETRE SE REPLIE VERS LE CENTRE, et la suivante monte
          a sa place. C est ce mouvement — pas une barre — qui dit
          qu on avance : ce qui est declare s en va vers le sceau. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={ecran}
          initial={sobre ? false : { opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={sobre ? undefined : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          {acte === "eveil" && (
            <ActeEveil onAccepter={avancer} onRefuser={() => navigate("/auth")} />
          )}

          {acte === "forge" && <LaForge ecran={ecran} etat={etat} modifier={modifier} />}

          {acte === "scellement" && (
            <LeScellement
              etat={etat}
              modifier={modifier}
              signature={
                <Signature
                  actif
                  sansAnimation={!!sobre}
                  onSigne={() => modifier({ signe: true })}
                />
              }
            />
          )}

          {acte === "rencontre" && (
            <LaRencontre etat={etat} modifier={modifier} sansAttente={!!sobre} />
          )}
        </motion.div>
      </AnimatePresence>

      {acte !== "eveil" && (
        <div className="ob-gestes">
          {ecranPrecedent(ecran, abrege) && (
            <button type="button" className="ob-bouton ob-bouton--sourd" onClick={reculer}>
              {t("onboarding.retour")}
            </button>
          )}
          <button
            type="button"
            className="ob-bouton"
            disabled={!peutAvancer(ecran, etat) || enCours || !user}
            onClick={avancer}
          >
            {ecranSuivant(ecran, abrege) ? t("onboarding.continuer") : t("onboarding.sceller")}
          </button>
        </div>
      )}

      {acte !== "scellement" && (
        <button type="button" className="ob-passer" onClick={passer}>
          {t("onboarding.passer")}
        </button>
      )}
    </div>
  );
}
