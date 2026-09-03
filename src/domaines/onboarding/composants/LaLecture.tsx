import { useTranslation } from "react-i18next";
import { FenetreSysteme } from "@/domaines/onboarding/composants/FenetreSysteme";
import { Temoin } from "@/domaines/onboarding/composants/Temoin";
import type { EtatDuRite } from "@/domaines/onboarding/logique/rite";

interface Props {
  etat: EtatDuRite;
}

/**
 * LA LECTURE — le systeme relit le pacte avant qu on le jure.
 *
 * L ecran qui manquait. Le scellement, c etait un titre, une case a
 * cocher et un bouton a maintenir trois secondes : le moment le plus
 * important du produit avait moins de ceremonie que le choix d un
 * symbole, et l on signait sans jamais avoir relu.
 *
 * L OBJET NE SUFFIT PAS. Il montre le nom et la phrase, mais ni les
 * valeurs dans leur ordre, ni le signe en toutes lettres — or c est cet
 * ordre qui dessine la corde du sceau, et il se decide ici pour
 * toujours.
 *
 * ON LIT DANS L ORDRE OU C EST ECRIT EN BASE. Porteur, pacte, valeurs,
 * phrase : les memes lignes que « useSceller » posera, dans le meme
 * ordre. Ce qu on relit est litteralement ce qu on va ecrire.
 *
 * ELLE SERT AUSSI AU SECOND PASSAGE. Le rite abrege y passe : avant de
 * rejurer, on revoit ce qu on avait jure.
 */
export function LaLecture({ etat }: Props) {
  const { t } = useTranslation();

  const lignes = [
    [t("onboarding.lecture.porteur"), etat.nomDuPorteur.trim()],
    [
      t("onboarding.lecture.pacte"),
      /* LES NOMS DE SIGNE ET DE TEINTE RESTENT TELS QUELS. Les mettre
         en minuscules donnait « sous flamme, teinte violet » : ni le
         genre ni l article ne suivent, et il y a neuf signes pour six
         teintes. « sous le signe Flamme, en teinte Violet » se tient
         pour toutes les combinaisons, sans table d accords. */
      t("onboarding.lecture.sousLeSigne", {
        nom: etat.nomDuPacte.trim(),
        signe: t(`onboarding.forge.sceau.symboles.${etat.symbole}`),
        teinte: t(`onboarding.forge.sceau.couleurs.${etat.couleur}`),
      }),
    ],
    [
      t("onboarding.lecture.valeurs"),
      etat.valeurs.length > 0
        ? `${etat.valeurs.join(", ")}.`
        : t("onboarding.lecture.aucuneValeur"),
    ],
    [t("onboarding.lecture.phrase"), `« ${etat.mantra.trim()} »`],
  ] as const;

  return (
    <FenetreSysteme entete={t("onboarding.lecture.entete")}>
      <dl className="ob-lecture">
        {lignes.map(([quoi, quel]) => (
          <div key={quoi}>
            <dt>{quoi}</dt>
            <dd>{quel}</dd>
          </div>
        ))}
      </dl>

      <p className="ob-ligne">{t("onboarding.lecture.question")}</p>
      <Temoin texte={t("onboarding.temoin.lecture")} />
    </FenetreSysteme>
  );
}
