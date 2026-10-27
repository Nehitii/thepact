import { useTranslation } from "react-i18next";
import { PactVisual } from "@/domaines/objectifs";
import { FenetreSysteme } from "@/domaines/onboarding/composants/FenetreSysteme";
import { COULEURS, SYMBOLES, TEINTE, VALEURS_SUGGEREES } from "@/domaines/onboarding/logique/gabarits";
import { LIMITES, VALEURS_MAX, type EtatDuRite } from "@/domaines/onboarding/logique/rite";

interface Props {
  etat: EtatDuRite;
  modifier: (champ: Partial<EtatDuRite> | ((e: EtatDuRite) => Partial<EtatDuRite>)) => void;
}

/**
 * LE FORMULAIRE COMPACT — la sortie que la spec demandait.
 *
 * « Passer. Discret, jamais cache. Qui veut entrer entre : formulaire
 * compact, memes champs, pacte scelle sans cercle. »
 *
 * ═══ CE QUE « PASSER » FAISAIT AVANT ═══
 *
 * Il sautait directement au scellement. Or le scellement refuse un
 * pacte non declare : le raccourci ne servait donc qu une fois toutes
 * les fenetres remplies — c est-a-dire quand on n avait plus rien a
 * passer. Un bouton qui ne fonctionne qu apres avoir fait le travail
 * qu il promet d eviter.
 *
 * ═══ CE QU IL FAIT MAINTENANT ═══
 *
 * Les cinq declarations de la forge sur UN ecran, dans le meme ordre :
 * porteur, signe, valeurs, phrase, nom. Rien n est retire, rien n est
 * facultatif qui ne l etait pas — c est la mise en scene qu on abrege,
 * pas le pacte.
 *
 * IL NE DISPENSE NI DE RELIRE NI DE JURER. Il sort vers la lecture,
 * puis le serment : « pacte scelle sans cercle » veut dire sans la
 * ceremonie, pas sans le consentement.
 *
 * PAS DE TEMOIN ICI. Le systeme accuse reception d une declaration a
 * la fois ; cinq accuses empiles sur un formulaire feraient du bruit,
 * pas une voix.
 */
export function LeCompact({ etat, modifier }: Props) {
  const { t } = useTranslation();

  const basculerValeur = (valeur: string) =>
    modifier((e) => {
      const dedans = e.valeurs.includes(valeur);
      if (!dedans && e.valeurs.length >= VALEURS_MAX) return {};
      return { valeurs: dedans ? e.valeurs.filter((v) => v !== valeur) : [...e.valeurs, valeur] };
    });

  return (
    <FenetreSysteme entete={t("onboarding.compact.entete")}>
      <p className="ob-ligne">{t("onboarding.compact.invite")}</p>

      <label className="ob-compact-champ">
        <span>{t("onboarding.forge.porteur.entete")}</span>
        <input
          className="ob-champ"
          value={etat.nomDuPorteur}
          onChange={(e) => modifier({ nomDuPorteur: e.target.value })}
          placeholder={t("onboarding.forge.porteur.exemple")}
          maxLength={LIMITES.nomDuPorteur}
          autoFocus
        />
      </label>

      <div className="ob-compact-champ">
        <span>{t("onboarding.forge.sceau.entete")}</span>
        <div className="ob-symboles" role="group" aria-label={t("onboarding.forge.sceau.symbole")}>
          {SYMBOLES.map((s) => (
            <button
              key={s} type="button" className="ob-symbole"
              aria-pressed={etat.symbole === s}
              aria-label={t(`onboarding.forge.sceau.symboles.${s}`)}
              onClick={() => modifier({ symbole: s })}
            >
              <PactVisual symbol={s} size="sm" elan={etat.symbole === s ? 1 : 0.4} />
              <small>{t(`onboarding.forge.sceau.symboles.${s}`)}</small>
            </button>
          ))}
        </div>
        <div className="ob-choix" role="group" aria-label={t("onboarding.forge.sceau.couleur")}>
          {COULEURS.map((c) => (
            <button
              key={c} type="button"
              aria-pressed={etat.couleur === c}
              aria-label={t(`onboarding.forge.sceau.couleurs.${c}`)}
              title={t(`onboarding.forge.sceau.couleurs.${c}`)}
              onClick={() => modifier({ couleur: c })}
            >
              <span className="ob-pastille" style={{ background: TEINTE[c] }} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="ob-compact-champ">
        <span>{t("onboarding.forge.valeurs.entete")}</span>
        <div className="ob-valeurs" role="group" aria-label={t("onboarding.forge.valeurs.ajouter")}>
          {VALEURS_SUGGEREES.map((cle) => {
            const mot = t(`onboarding.valeurs.${cle}`);
            const prise = etat.valeurs.includes(mot);
            return (
              <button
                key={cle} type="button" className="ob-valeur"
                aria-pressed={prise}
                disabled={!prise && etat.valeurs.length >= VALEURS_MAX}
                onClick={() => basculerValeur(mot)}
              >
                {mot}
              </button>
            );
          })}
        </div>
      </div>

      <label className="ob-compact-champ">
        <span>{t("onboarding.forge.phrase.entete")}</span>
        <input
          className="ob-champ"
          value={etat.mantra}
          onChange={(e) => modifier({ mantra: e.target.value })}
          placeholder={t("onboarding.forge.phrase.exemple")}
          maxLength={LIMITES.mantra}
        />
      </label>

      <label className="ob-compact-champ">
        <span>{t("onboarding.forge.pacte.entete")}</span>
        <input
          className="ob-champ"
          value={etat.nomDuPacte}
          onChange={(e) => modifier({ nomDuPacte: e.target.value })}
          placeholder={t("onboarding.forge.pacte.exemple")}
          maxLength={LIMITES.nomDuPacte}
        />
      </label>
    </FenetreSysteme>
  );
}
