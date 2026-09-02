import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ActeEveil } from "@/domaines/onboarding/composants/ActeEveil";
import { LaForge } from "@/domaines/onboarding/composants/LaForge";
import { LaRencontre } from "@/domaines/onboarding/composants/LaRencontre";
import { LeScellement } from "@/domaines/onboarding/composants/LeScellement";
import { Signature } from "@/domaines/onboarding/composants/Signature";
import type { FormeDuGeste } from "@/domaines/onboarding/hooks/useGesteDeSignature";
import { TEINTE } from "@/domaines/onboarding/logique/gabarits";
import {
  ACTE_DE, ETAT_VIDE, ecranPrecedent, ecranSuivant, ecransDuRite,
  fenetresCloses, peutAvancer, type Ecran, type EtatDuRite,
} from "@/domaines/onboarding/logique/rite";


export interface ReglagesDuRite {
  /** Force le mode sobre, quelle que soit la preference du systeme. */
  sobre?: boolean;
  /** Force le geste, quel que soit le pointeur de l appareil. */
  forme?: FormeDuGeste;
}

interface Props {
  abrege: boolean;
  /** Rend `true` si le pacte a bien ete scelle. */
  onSceller: (etat: EtatDuRite) => Promise<boolean>;
  /** Faux tant qu on ne peut pas ecrire — pas de session, envoi en cours. */
  pretAEcrire: boolean;
  onQuitter: () => void;
  /** Le banc d essai s en sert pour partir d ou il veut. */
  ecranInitial?: Ecran;
  etatInitial?: EtatDuRite;
  reglages?: ReglagesDuRite;
  /** Le banc observe sans ecrire. */
  onEcranChange?: (ecran: Ecran) => void;
  onEtatChange?: (etat: EtatDuRite) => void;
}

/**
 * LE RITE, SANS SAVOIR OU IL ECRIT.
 *
 * Il etait dans la page ; il en sort pour que le BANC D ESSAI puisse
 * le monter aussi, avec un scellement qui n ecrit rien. Sans cela, on
 * ne peut retravailler le rite qu en creant un compte a chaque
 * passage — et ce qu on ne peut pas regarder, on ne le corrige pas.
 *
 * La page lui donne « useSceller » et une session ; le banc lui donne
 * un faux et des reglages forces. Ni l un ni l autre ne change ce qui
 * se joue a l ecran, et c est tout l interet.
 */
export function LeRite({
  abrege, onSceller, pretAEcrire, onQuitter,
  ecranInitial, etatInitial, reglages, onEcranChange, onEtatChange,
}: Props) {
  const { t } = useTranslation();
  const preference = useReducedMotion();
  const sobre = reglages?.sobre ?? !!preference;

  const [ecran, poserEcran] = useState<Ecran>(() => ecranInitial ?? ecransDuRite(abrege)[0]);
  const [etat, setEtat] = useState<EtatDuRite>(() => etatInitial ?? ETAT_VIDE);
  const [voile, setVoile] = useState(false);

  const setEcran = useCallback((e: Ecran) => {
    poserEcran(e);
    onEcranChange?.(e);
  }, [onEcranChange]);

  /* Il accepte une FONCTION autant qu un objet : sans cela, deux clics
     dans la meme image lisent tous les deux l etat d avant, et le
     second efface le premier. Trois valeurs cochees vite n en
     laissaient qu une — mesure a l ecran. */
  const modifier = useCallback(
    (champ: Partial<EtatDuRite> | ((e: EtatDuRite) => Partial<EtatDuRite>)) =>
      setEtat((e) => {
        const suivant = { ...e, ...(typeof champ === "function" ? champ(e) : champ) };
        onEtatChange?.(suivant);
        return suivant;
      }),
    [onEtatChange],
  );

  const terminer = useCallback(async () => {
    if (await onSceller(etat)) setVoile(true);
  }, [onSceller, etat]);

  const avancer = useCallback(() => {
    const suite = ecranSuivant(ecran, abrege);
    if (suite) return setEcran(suite);
    void terminer();
  }, [ecran, abrege, terminer, setEcran]);

  const reculer = useCallback(() => {
    const avant = ecranPrecedent(ecran, abrege);
    if (avant) setEcran(avant);
  }, [ecran, abrege, setEcran]);

  const acte = ACTE_DE[ecran];
  const closes = fenetresCloses(ecran, abrege);

  /* L ARC CHROMATIQUE. Le systeme cede la place au pacte : « --ob-part »
     va de 0 a 1 a mesure que les fenetres se ferment, et les cadres,
     l entete et la lueur se melangent de l un vers l autre. Quand la
     teinte du porteur domine, le pacte est pret a etre scelle.

     LE SCEAU EST LA TROISIEME FENETRE, et c est la que sa couleur
     entre : avant, il n a rien choisi, et la voix reste celle du
     systeme. */
  /* LA COULEUR DU PORTEUR N EXISTE PAS AVANT QU IL L AIT CHOISIE.
     Elle entre PENDANT l ecran du sceau — il la voit se poser sous ses
     yeux au moment ou il clique — puis gagne a chaque fenetre close.
     La faire paraitre des la deuxieme fenetre montrerait l ambre par
     defaut comme si c etait un choix. */
  const forge = ecransDuRite(abrege).filter((e) => ACTE_DE[e] === "forge");
  const rangDuSceau = forge.indexOf("sceau");
  const part = acte === "eveil" ? 0
    : acte !== "forge" ? 1
    : closes < rangDuSceau ? 0
    : Math.min(1, (closes - rangDuSceau + 1) / (forge.length - rangDuSceau));
  const habillage = {
    "--ob-teinte": TEINTE[etat.couleur] ?? TEINTE.amber,
    "--ob-part": part,
  } as React.CSSProperties;

  /* LE VOILE. Une demi-seconde de silence total, le cercle brule, et
     l ecran passe a la couleur du pacte avec son nom en Orbitron. */
  if (voile) {
    return (
      <div className="ob ob-voile" style={{ ...habillage, color: TEINTE[etat.couleur] ?? TEINTE.amber }}>
        <b>{etat.nomDuPacte}</b>
      </div>
    );
  }

  return (
    <div className="ob" style={habillage}>
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
            <ActeEveil onAccepter={avancer} onRefuser={onQuitter} sansAnimation={sobre} />
          )}

          {acte === "forge" && <LaForge ecran={ecran} etat={etat} modifier={modifier} />}

          {acte === "scellement" && (
            <LeScellement
              etat={etat}
              modifier={modifier}
              signature={
                <Signature
                  actif
                  sansAnimation={sobre}
                  formeForcee={reglages?.forme}
                  onSigne={() => modifier({ signe: true })}
                />
              }
            />
          )}

          {acte === "rencontre" && (
            <LaRencontre etat={etat} modifier={modifier} sansAttente={sobre} />
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
            disabled={!peutAvancer(ecran, etat) || !pretAEcrire}
            onClick={avancer}
          >
            {ecranSuivant(ecran, abrege) ? t("onboarding.continuer") : t("onboarding.sceller")}
          </button>
        </div>
      )}

      {/* La sortie : discrete, jamais cachee. Un rite dont on ne peut
          pas sortir est une porte, pas un rite. */}
      {acte !== "scellement" && (
        <button type="button" className="ob-passer" onClick={() => setEcran("scellement")}>
          {t("onboarding.passer")}
        </button>
      )}
    </div>
  );
}
