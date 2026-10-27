import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ActeEveil } from "@/domaines/onboarding/composants/ActeEveil";
import { LObjetDuPacte } from "@/domaines/onboarding/composants/LObjetDuPacte";
import { LaForge } from "@/domaines/onboarding/composants/LaForge";
import { LaLecture } from "@/domaines/onboarding/composants/LaLecture";
import { LeCompact } from "@/domaines/onboarding/composants/LeCompact";
import { LaRencontre } from "@/domaines/onboarding/composants/LaRencontre";
import { LeScellement } from "@/domaines/onboarding/composants/LeScellement";
import { Signature } from "@/domaines/onboarding/composants/Signature";
import type { FormeDuGeste } from "@/domaines/onboarding/hooks/useGesteDeSignature";
import { TEINTE, TEINTE_ETEINTE } from "@/domaines/onboarding/logique/gabarits";
import {
  ACTE_DE, ETAT_VIDE, ecranPrecedent, ecranSuivant, ecransDuRite,
  fenetresCloses, pacteDeclare, peutAvancer, type Acte, type Ecran, type EtatDuRite,
} from "@/domaines/onboarding/logique/rite";

/**
 * LES ACTES DU RITE EN COURS, dans l ordre ou on les traverse.
 *
 * DEDUITS DES ECRANS, pas ecrits en dur : le rite abrege saute l eveil
 * et la rencontre, et un jalonnement fixe a quatre lui promettait deux
 * actes qui ne viendraient jamais.
 */
const actesDuRite = (abrege: boolean): Acte[] => {
  const vus: Acte[] = [];
  for (const e of ecransDuRite(abrege)) {
    if (!vus.includes(ACTE_DE[e])) vus.push(ACTE_DE[e]);
  }
  return vus;
};

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
 * LE RITE — UN ATELIER, PAS UNE PILE DE FENETRES.
 *
 * ═══ CE QUI A CHANGE, ET POURQUOI ═══
 *
 * L ancien rite ouvrait une fenetre par question, empilait les
 * precedentes en transparence derriere, et posait les boutons SOUS
 * elle. Trois defauts en decoulaient, tous vus a l ecran :
 *
 *   LES FENETRES SE SUPERPOSAIENT. La pile debordait du cadre.
 *   « Scellement » N ETAIT PAS CADRE : la fenetre grandissait avec son
 *   contenu et ejectait « Retour » et « Continuer » hors de l ecran.
 *   ON NE VOYAIT JAMAIS CE QU ON FABRIQUAIT : chaque reponse partait
 *   dans une fenetre qui se refermait.
 *
 * L atelier repond aux trois PAR SA STRUCTURE, pas par des retouches :
 *
 *   UN OBJET, PERMANENT. Le pacte est la, a gauche, du premier mot
 *   jusqu au sceau, et chaque reponse le change sous les yeux. C est
 *   lui la barre de progression.
 *
 *   UNE SEULE VOIE. Les questions se remplacent dans une colonne de
 *   hauteur FIXE. Rien ne s empile, donc rien ne peut deborder.
 *
 *   LES GESTES SONT DANS LE CADRE. « Retour » et « Continuer » vivent
 *   dans le pied de la voie, entre ses bords : c est le corps qui
 *   defile quand le contenu est long, jamais les boutons qui sortent.
 *
 * L EVEIL RESTE PLEIN CADRE. L objet n existe pas encore — il n y a
 * rien a montrer a cote, et un atelier vide serait un mensonge.
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

  /* ON PREVIENT LE BANC DEPUIS UN EFFET, PAS DEPUIS LE RENDU.
     « onEtatChange » etait appele DANS la fonction de mise a jour de
     « setEtat » — que React peut executer pendant un rendu. Il posait
     donc un etat sur « BancDuRite » au milieu du rendu de « LeRite »,
     et React le signalait : « Cannot update a component while rendering
     a different component ». Un avertissement, pas un plantage — mais
     l ordre des rendus n est alors plus garanti.
     Les effets se declenchent APRES le rendu : c est leur role. */
  useEffect(() => { onEcranChange?.(ecran); }, [ecran, onEcranChange]);
  useEffect(() => { onEtatChange?.(etat); }, [etat, onEtatChange]);

  const setEcran = useCallback((e: Ecran) => poserEcran(e), []);

  /* Il accepte une FONCTION autant qu un objet : sans cela, deux clics
     dans la meme image lisent tous les deux l etat d avant, et le
     second efface le premier. Trois valeurs cochees vite n en
     laissaient qu une — mesure a l ecran. */
  const modifier = useCallback(
    (champ: Partial<EtatDuRite> | ((e: EtatDuRite) => Partial<EtatDuRite>)) =>
      setEtat((e) => ({ ...e, ...(typeof champ === "function" ? champ(e) : champ) })),
    [],
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
  const actes = actesDuRite(abrege);
  const closes = fenetresCloses(ecran, abrege);
  /* Pas de couleur choisie, pas de teinte : l objet reste eteint.
     L ambre par defaut faisait croire a un choix deja fait. */
  const teinte = etat.couleur ? (TEINTE[etat.couleur] ?? TEINTE.amber) : TEINTE_ETEINTE;

  /* L ARC CHROMATIQUE. Le systeme cede la place au pacte : « --ob-part »
     va de 0 a 1 a mesure que les fenetres se ferment, et les cadres,
     l entete et la lueur se melangent de l un vers l autre.

     LA COULEUR DU PORTEUR N EXISTE PAS AVANT QU IL L AIT CHOISIE.
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
    "--ob-teinte": teinte,
    "--ob-part": part,
  } as React.CSSProperties;

  /* LE VOILE. Une demi-seconde de silence total, le cercle brule, et
     l ecran passe a la couleur du pacte avec son nom en Orbitron. */
  if (voile) {
    return (
      <div className="ob ob-voile" style={{ ...habillage, color: teinte }}>
        <b>{etat.nomDuPacte}</b>
      </div>
    );
  }

  /* L EVEIL — plein cadre. Rien n est encore jure : il n y a pas
     d objet a poser a cote, et pas d acte a jalonner. */
  if (acte === "eveil") {
    return (
      <div className="ob ob--eveil" style={habillage}>
        <ActeEveil onAccepter={avancer} onRefuser={onQuitter} sansAnimation={sobre} />
      </div>
    );
  }

  const suite = ecranSuivant(ecran, abrege);

  return (
    <div className="ob ob--atelier" style={habillage}>
      <div className="ob-atelier">
        {/* ═══ L OBJET — permanent, et il change a chaque reponse ═══ */}
        <section className="ob-scene" aria-label={t("onboarding.objet.entete")}>
          <LObjetDuPacte
            nomDuPacte={etat.nomDuPacte}
            valeurs={etat.valeurs}
            symbole={etat.symbole}
            mantra={etat.mantra}
            teinte={teinte}
            scelle={etat.signe}
            sansAnimation={sobre}
          />
        </section>

        {/* ═══ LA VOIE — une seule, de hauteur fixe ═══ */}
        <section className="ob-voie">
          {/* LES ACTES DU RITE EN COURS. Les barres disent la position, le nom
              ecrit dit lequel on traverse. Les quatre noms cote a cote
              ne tenaient pas dans la voie : « LE SCELLEMENT » s y
              lisait « LE SCELLE… », et un jalon tronque ne jalonne
              rien. Les noms restent lisibles aux lecteurs d ecran. */}
          <header className="ob-voie-tete">
            <ol className="ob-actes">
              {actes.map((a, i) => (
                <li
                  key={a}
                  className={a === acte ? "est-ici" : actes.indexOf(acte) > i ? "est-passe" : ""}
                  aria-current={a === acte ? "step" : undefined}
                >
                  <i aria-hidden="true" />
                  <span className="sr-only">{t(`onboarding.actes.${a}`)}</span>
                </li>
              ))}
            </ol>
            <div className="ob-voie-jalon">
              <p className="ob-acte-nom" aria-hidden="true">
                <b>{"I".repeat(actes.indexOf(acte) + 1).replace("IIII", "IV")}</b>
                <span>{t(`onboarding.actes.${acte}`)}</span>
              </p>

              {/* LA SORTIE EST EN HAUT, pas dans le pied. Les trois
                  boutons cote a cote ne tenaient pas dans la voie et
                  le pied se repliait sur trois rangs. Elle est de
                  toute facon d un autre ordre que « Retour » et
                  « Continuer » : la mettre a cote d eux la deguisait
                  en geste du rite. Discrete, jamais cachee.

                  ON NE PEUT ABREGER QUE CE QUI EXISTE. Offerte des le
                  premier ecran, elle sautait au scellement d un pacte
                  sans nom, sans signe — et a un bouton mort. Elle
                  parait quand le pacte est declare, et seulement dans
                  la forge : depuis la rencontre, elle ramenait EN
                  ARRIERE, au scellement. */}
              {/* LA SORTIE MENE AU FORMULAIRE COMPACT, plus au
                  scellement. Elle y sautait — et le scellement refuse un
                  pacte non declare : le raccourci ne servait donc
                  qu une fois toutes les fenetres remplies, c est-a-dire
                  quand il n y avait plus rien a passer. Elle est
                  desormais offerte des la premiere fenetre, sans
                  condition : c est ce que « jamais cachee » veut dire. */}
              {acte === "forge" && ecran !== "compact" && (
                <button type="button" className="ob-passer" onClick={() => setEcran("compact")}>
                  {t("onboarding.passer")}
                </button>
              )}
            </div>
          </header>

          {/* C EST LUI QUI DEFILE, jamais la page : le pied reste pose
              au bas du cadre quoi qu il arrive au-dessus. */}
          <div className="ob-voie-corps">
            <AnimatePresence mode="wait">
              <motion.div
                key={ecran}
                className="ob-ecran"
                initial={sobre ? false : { opacity: 0, x: 26 }}
                animate={{ opacity: 1, x: 0 }}
                exit={sobre ? undefined : { opacity: 0, x: -18 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {acte === "forge" && ecran !== "compact"
                  && <LaForge ecran={ecran} etat={etat} modifier={modifier} />}

                {ecran === "compact" && <LeCompact etat={etat} modifier={modifier} />}

                {ecran === "lecture" && <LaLecture etat={etat} />}

                {ecran === "scellement" && (
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
          </div>

          <footer className="ob-voie-pied">
            {/* A LA LECTURE, LES DEUX GESTES SE NOMMENT AUTREMENT :
                on ne continue pas, on confirme — et revenir n est pas
                reculer d un ecran, c est aller corriger. */}
            {ecranPrecedent(ecran, abrege) ? (
              <button type="button" className="ob-bouton ob-bouton--sourd" onClick={reculer}>
                {ecran === "lecture" ? t("onboarding.lecture.corriger") : t("onboarding.retour")}
              </button>
            ) : <span />}

            <button
              type="button"
              className="ob-bouton"
              disabled={!peutAvancer(ecran, etat) || !pretAEcrire}
              onClick={avancer}
            >
              {ecran === "lecture" ? t("onboarding.lecture.confirmer")
                : suite ? t("onboarding.continuer")
                : t("onboarding.sceller")}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
