import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { PactVisual } from "@/domaines/objectifs";
import { deplacerValeur, peutDescendre, peutMonter } from "@/domaines/onboarding/logique/rangDesValeurs";
import { FenetreSysteme } from "@/domaines/onboarding/composants/FenetreSysteme";
import { Temoin } from "@/domaines/onboarding/composants/Temoin";
import { COULEURS, SYMBOLES, TEINTE, VALEURS_SUGGEREES } from "@/domaines/onboarding/logique/gabarits";
import { LIMITES, VALEURS_MAX, peutAvancer, type Ecran, type EtatDuRite } from "@/domaines/onboarding/logique/rite";


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
  /* Le signe survole ou pris au clavier : sa ligne de sens s affiche
     sous la grille. Nul : celui qui est choisi, s il y en a un. */
  const [survole, setSurvole] = useState<string | null>(null);

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
          maxLength={LIMITES.nomDuPorteur}
          autoFocus
        />
        {/* LE TEMOIN ACCUSE RECEPTION — voir « Temoin.tsx ». C est la
            premiere fois que le rite repond a ce qu on lui dit. */}
        <Temoin texte={peutAvancer("porteur", etat) ? t("onboarding.temoin.porteur", { nom: etat.nomDuPorteur.trim() }) : ""} />
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
          maxLength={LIMITES.nomDuPacte}
          autoFocus
        />
        {/* « Aucun antecedent » : le nom est neuf, et c est vrai — un
            pacte par porteur, et la forge ne se joue qu au premier
            passage. */}
        <Temoin texte={peutAvancer("pacte", etat) ? t("onboarding.temoin.pacte", { nom: etat.nomDuPacte.trim() }) : ""} />
      </FenetreSysteme>
    );
  }

  if (ecran === "sceau") {
    return (
      <FenetreSysteme entete={t("onboarding.forge.sceau.entete")}>
        <p className="ob-ligne">{t("onboarding.forge.sceau.invite")}</p>
        {/* LE LOGO VIVANT, PAS SA DOUBLURE. Chaque signe bat ici comme
            il battra sur le tableau de bord — la flamme vacille, le
            coeur fait son double battement, le vortex tourne. On ne
            choisit pas une icone dans une liste : on regarde neuf
            choses vivre, et on en prend une. */}
        <div className="ob-symboles" role="group" aria-label={t("onboarding.forge.sceau.symbole")}>
          {SYMBOLES.map((s) => (
            <button
              key={s} type="button" className="ob-symbole"
              aria-pressed={etat.symbole === s}
              aria-label={t(`onboarding.forge.sceau.symboles.${s}`)}
              onClick={() => modifier({ symbole: s })}
              onMouseEnter={() => setSurvole(s)}
              onMouseLeave={() => setSurvole(null)}
              onFocus={() => setSurvole(s)}
              onBlur={() => setSurvole(null)}
            >
              <PactVisual symbol={s} size="sm" elan={etat.symbole === s ? 1 : 0.4} />
              <small>{t(`onboarding.forge.sceau.symboles.${s}`)}</small>
            </button>
          ))}
        </div>
        {/* UNE LIGNE DE SENS par signe — celui qu on survole, sinon celui
            qu on a pris. Neuf logos magnifiques ne disaient rien : on
            choisissait une image. On choisit un sens. */}
        <p className="ob-sens" aria-live="polite">
          {(survole ?? etat.symbole)
            ? t(`onboarding.forge.sceau.sens.${survole ?? etat.symbole}`)
            : ""}
        </p>
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
        {/* Le temoin suit les deux gestes : le signe d abord, puis la
            teinte qui se verrouille. Chaque clic recoit sa ligne. */}
        <Temoin texte={
          etat.symbole
            ? t(etat.couleur ? "onboarding.temoin.sceau" : "onboarding.temoin.signe", {
                signe: t(`onboarding.forge.sceau.symboles.${etat.symbole}`),
              })
            : ""
        } />
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
          maxLength={LIMITES.mantra}
          autoFocus
        />
        <i className="ob-braise" aria-hidden="true" />
        </span>
        <Temoin texte={peutAvancer("phrase", etat) ? t("onboarding.temoin.phrase") : ""} />
      </FenetreSysteme>
    );
  }

  return (
    <FenetreSysteme entete={t("onboarding.forge.valeurs.entete")}>
      <p className="ob-ligne">{t("onboarding.forge.valeurs.invite")}</p>
      <p className="ob-ligne ob-ligne--sourde">
        {t("onboarding.forge.valeurs.compte", { n: etat.valeurs.length, max: VALEURS_MAX })}
      </p>
      {/* LES CHOISIES MONTENT EN LISTE NUMEROTEE, et c est tout l objet
          du lot : leur rang est ecrit en base et DESSINE LA CORDE DU
          SCEAU, pour toujours. Il valait l ordre des clics — une donnee
          permanente produite par un effet de bord, que le porteur ne
          voyait pas et ne pouvait pas changer. */}
      {etat.valeurs.length > 0 && (
        <>
          <ol className="ob-rangs" aria-label={t("onboarding.forge.valeurs.choisies")}>
            {etat.valeurs.map((mot, rang) => (
              <li key={mot} className="ob-rang">
                <b aria-hidden="true">{rang + 1}</b>
                <span>{mot}</span>
                <span className="ob-rang-gestes">
                  <button
                    type="button"
                    disabled={!peutMonter(rang)}
                    aria-label={t("onboarding.forge.valeurs.monter", { valeur: mot })}
                    onClick={() => modifier((e) => ({ valeurs: [...deplacerValeur(e.valeurs, rang, rang - 1)] }))}
                  >
                    <ChevronUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={!peutDescendre(rang, etat.valeurs.length)}
                    aria-label={t("onboarding.forge.valeurs.descendre", { valeur: mot })}
                    onClick={() => modifier((e) => ({ valeurs: [...deplacerValeur(e.valeurs, rang, rang + 1)] }))}
                  >
                    <ChevronDown aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={t("onboarding.forge.valeurs.retirer", { valeur: mot })}
                    onClick={() => basculerValeur(mot)}
                  >
                    <X aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
          <p className="ob-ligne ob-ligne--sourde">{t("onboarding.forge.valeurs.ordre")}</p>
        </>
      )}

      <div className="ob-valeurs" role="group" aria-label={t("onboarding.forge.valeurs.ajouter")}>
        {VALEURS_SUGGEREES.map((cle) => {
          const mot = t(`onboarding.valeurs.${cle}`);
          /* Celles qu on a prises sont dans la liste au-dessus : les
             laisser aussi en puce donnerait deux fois le meme mot, et
             deux endroits pour le retirer. */
          if (etat.valeurs.includes(mot)) return null;
          return (
            <button
              key={cle} type="button" className="ob-valeur"
              disabled={etat.valeurs.length >= VALEURS_MAX}
              onClick={() => basculerValeur(mot)}
            >
              {mot}
            </button>
          );
        })}
      </div>
      {/* Aucune, une, plusieurs : trois constats, parce que la corde du
          sceau n existe qu a partir de deux — et que ne rien choisir
          est une reponse qui merite d etre constatee, pas grondee. */}
      <Temoin texte={
        etat.valeurs.length === 0 ? t("onboarding.temoin.valeurs.aucune")
          : etat.valeurs.length === 1 ? t("onboarding.temoin.valeurs.une")
          : t("onboarding.temoin.valeurs.plusieurs", { n: etat.valeurs.length })
      } />
    </FenetreSysteme>
  );
}
