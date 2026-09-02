import { useTranslation } from "react-i18next";
import { Flame, Heart, Target, Sparkles } from "lucide-react";
import { FenetreSysteme } from "@/domaines/onboarding/composants/FenetreSysteme";
import { COULEURS, SYMBOLES, TEINTE, VALEURS_SUGGEREES } from "@/domaines/onboarding/logique/gabarits";
import { VALEURS_MAX, type Ecran, type EtatDuRite } from "@/domaines/onboarding/logique/rite";

const ICONE = { flame: Flame, heart: Heart, target: Target, sparkles: Sparkles } as const;


interface Props {
  ecran: Ecran;
  etat: EtatDuRite;
  modifier: (champ: Partial<EtatDuRite> | ((e: EtatDuRite) => Partial<EtatDuRite>)) => void;
}

/**
 * ACTE II — LA FORGE.
 *
 * Cinq fenetres, une par declaration. Chacune s ouvre, se remplit, et
 * se replie vers le centre ou le sceau grandit d un cran.
 *
 * LE SCEAU PASSE AVANT LA PHRASE, et c est l ecart qui fait tout :
 * en troisieme position, il y a un objet au centre de l ecran pendant
 * tout le reste du rite, et il change de couleur sous les yeux.
 * L ancienne page le mettait en dernier — il arrivait quand plus rien
 * ne s y accrochait.
 *
 * LA PHRASE SE GRAVE : une ligne unique qui rougeoie, pas un pave de
 * trois lignes. Une phrase gravee ne se corrige pas a la legere.
 *
 * LES VALEURS SONT FACULTATIVES — trois a cinq, ou aucune. Forcer
 * trois cases produirait trois mensonges plutot qu un silence.
 */
export function LaForge({ ecran, etat, modifier }: Props) {
  const { t } = useTranslation();

  /* LA FORME FONCTIONNELLE, ET ELLE EST NECESSAIRE : deux clics dans
     la meme image liraient tous les deux la meme prop, et le second
     effacerait le premier. Trois valeurs cochees vite n en laissaient
     qu une — mesure a l ecran avant correction. */
  const basculerValeur = (valeur: string) =>
    modifier((e) => {
      const dedans = e.valeurs.includes(valeur);
      if (!dedans && e.valeurs.length >= VALEURS_MAX) return {};
      return { valeurs: dedans ? e.valeurs.filter((v) => v !== valeur) : [...e.valeurs, valeur] };
    });

  if (ecran === "porteur") {
    return (
      <FenetreSysteme entete={t("onboarding.forge.porteur.entete")}>
        <p className="ob-ligne">{t("onboarding.forge.porteur.invite")}</p>
        <input
          className="ob-champ"
          value={etat.nomDuPorteur}
          onChange={(e) => modifier({ nomDuPorteur: e.target.value })}
          placeholder={t("onboarding.forge.porteur.exemple")}
          aria-label={t("onboarding.forge.porteur.invite")}
          autoFocus
        />
      </FenetreSysteme>
    );
  }

  if (ecran === "pacte") {
    return (
      <FenetreSysteme entete={t("onboarding.forge.pacte.entete")}>
        {/* Son nom — pas le tien : celui de la chose juree. */}
        <p className="ob-ligne">{t("onboarding.forge.pacte.invite")}</p>
        <p className="ob-ligne ob-ligne--sourde">{t("onboarding.forge.pacte.precision")}</p>
        <input
          className="ob-champ"
          value={etat.nomDuPacte}
          onChange={(e) => modifier({ nomDuPacte: e.target.value })}
          placeholder={t("onboarding.forge.pacte.exemple")}
          aria-label={t("onboarding.forge.pacte.invite")}
          autoFocus
        />
      </FenetreSysteme>
    );
  }

  if (ecran === "sceau") {
    return (
      <FenetreSysteme entete={t("onboarding.forge.sceau.entete")}>
        <p className="ob-ligne">{t("onboarding.forge.sceau.invite")}</p>
        <div className="ob-choix" role="group" aria-label={t("onboarding.forge.sceau.symbole")}>
          {SYMBOLES.map((s) => {
            const Icone = ICONE[s];
            return (
              <button
                key={s} type="button"
                aria-pressed={etat.symbole === s}
                aria-label={t(`onboarding.forge.sceau.symboles.${s}`)}
                title={t(`onboarding.forge.sceau.symboles.${s}`)}
                onClick={() => modifier({ symbole: s })}
              >
                <Icone aria-hidden="true" />
              </button>
            );
          })}
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
      </FenetreSysteme>
    );
  }

  if (ecran === "phrase") {
    return (
      <FenetreSysteme entete={t("onboarding.forge.phrase.entete")}>
        <p className="ob-ligne">{t("onboarding.forge.phrase.invite")}</p>
        {/* La braise est un halo DERRIERE, pas une ombre sur le texte :
            un « text-shadow » anime repeint la phrase a chaque image,
            pendant qu on l ecrit. */}
        <span className="ob-champ-grave">
        <input
          className="ob-gravure"
          value={etat.mantra}
          onChange={(e) => modifier({ mantra: e.target.value })}
          placeholder={t("onboarding.forge.phrase.exemple")}
          aria-label={t("onboarding.forge.phrase.invite")}
          autoFocus
        />
        <i className="ob-braise" aria-hidden="true" />
        </span>
      </FenetreSysteme>
    );
  }

  return (
    <FenetreSysteme entete={t("onboarding.forge.valeurs.entete")}>
      <p className="ob-ligne">{t("onboarding.forge.valeurs.invite")}</p>
      <p className="ob-ligne ob-ligne--sourde">
        {t("onboarding.forge.valeurs.compte", { n: etat.valeurs.length, max: VALEURS_MAX })}
      </p>
      <div className="ob-valeurs" role="group" aria-label={t("onboarding.forge.valeurs.entete")}>
        {VALEURS_SUGGEREES.map((cle) => {
          const mot = t(`onboarding.valeurs.${cle}`);
          const choisie = etat.valeurs.includes(mot);
          return (
            <button
              key={cle} type="button" className="ob-valeur"
              aria-pressed={choisie}
              disabled={!choisie && etat.valeurs.length >= VALEURS_MAX}
              onClick={() => basculerValeur(mot)}
            >
              {mot}
            </button>
          );
        })}
      </div>
    </FenetreSysteme>
  );
}
