import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReseauMia } from "@/domaines/mia";
import { BulleDuRite } from "@/domaines/onboarding/composants/BulleDuRite";
import { GABARITS } from "@/domaines/onboarding/logique/gabarits";
import {
  DERNIERE, REPLIQUES, aFiniDeParler, repliquesDites,
} from "@/domaines/onboarding/logique/repliques";
import { LIMITES, type EtatDuRite } from "@/domaines/onboarding/logique/rite";

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
 * DE VRAIES BULLES, et c est ce qui a change. Ses phrases etaient des
 * paragraphes empiles : on lisait le systeme, on n entendait
 * personne. Une bulle a un emetteur, une queue qui pointe vers lui, et
 * un visage qui reparait QUAND SON EXPRESSION CHANGE — pas a chaque
 * ligne, sinon la colonne de portraits repetes devient un decor.
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
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sansAttente || rang >= DERNIERE) return;
    const suivante = REPLIQUES[rang + 1];
    const minuteur = window.setTimeout(() => setRang((r) => r + 1), suivante.attente);
    return () => window.clearTimeout(minuteur);
  }, [rang, sansAttente]);

  /* La derniere bulle reste sous les yeux : la voie a une hauteur
     fixe, et sans cela une conversation de dix repliques parle dans le
     vide sous le pli. */
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: sansAttente ? "auto" : "smooth", block: "end" });
  }, [rang, sansAttente]);

  /* Le clic n avance pas d une bulle : il les dit toutes. Accelerer
     n est pas piloter — elle garde son rythme ou on la coupe. */
  const tout = () => setRang(DERNIERE);

  const dites = repliquesDites(rang);
  const surMesure = etat.objectif && "surMesure" in etat.objectif;

  return (
    <div className="ob-rencontre" onClick={aFiniDeParler(rang) ? undefined : tout}>
      {/* Elle n a pas de fenetre, donc pas d entete : son titre est
          pour la voix seule. Sans lui, le dernier ecran du rite serait
          le seul sans niveau. */}
      <h1 className="sr-only">{t("onboarding.mia.titre")}</h1>

      <div className="ob-bulles" aria-live="polite">
        {/* Son anneau seul, tant qu aucun visage n est paru. */}
        {dites.length > 0 && !dites.some((r) => r.visage) && (
          <div className="ob-bulles-anneau" aria-hidden="true">
            <ReseauMia etat="reponse" taille={64} />
          </div>
        )}

        {dites.map((r, i) => (
          <BulleDuRite
            key={r.cle}
            texte={t(`onboarding.mia.${r.cle}`)}
            expression={r.expression}
            /* Le visage reparait quand elle change d expression. */
            visage={i === 0 || dites[i - 1].expression !== r.expression}
            anonyme={!r.visage}
            passee={i < dites.length - 1}
            ecrite={i === dites.length - 1}
            sansAnimation={sansAttente}
          />
        ))}
        <div ref={fin} />
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
              maxLength={LIMITES.objectif}
              autoFocus
            />
          )}
        </div>
      )}
    </div>
  );
}
