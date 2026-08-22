import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { ClipboardCheck, Check } from "lucide-react";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cleDuJour, laVeille, joursARelever, nomDuJour } from "@/lib/health/journee";

interface Props {
  /** Les dates deja relevees, au format yyyy-MM-dd. */
  datesRelevees: string[];
  onOuvrir: (date: string) => void;
}

/**
 * QU AI-JE A RELEVER.
 *
 * Le releve portait sur AUJOURD HUI : on le remplissait le matin, donc
 * on notait un sommeil qu on venait de finir a cote d une activite qui
 * n avait pas eu lieu. La moitie des champs etaient des suppositions.
 *
 * Il porte sur LA VEILLE. Une journee close se raconte ; une journee
 * qui commence se devine.
 *
 * ET LES JOURS MANQUES RESTENT LA. Sauter un matin les effacait pour
 * toujours ; ils attendent maintenant, quinze jours durant, sous la
 * forme d une file qu on vide quand on veut. Au-dela, ce ne serait plus
 * un souvenir mais une reconstitution.
 */
export function ReleveDuJour({ datesRelevees, onOuvrir }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  const veille = cleDuJour(laVeille());
  const faite = datesRelevees.map((d) => d.slice(0, 10)).includes(veille);

  /* La veille est traitee a part : elle a son appel. La file ne montre
     que ce qu il reste EN PLUS. */
  const enAttente = useMemo(
    () => joursARelever(datesRelevees).filter((d) => d !== veille),
    [datesRelevees, veille],
  );

  const nommer = (cle: string) =>
    nomDuJour(cle, (d) => format(d, "EEE d MMM", { locale }), {
      hier: t("health.day.yesterday", "hier"),
      avantHier: t("health.day.dayBefore", "avant-hier"),
    });

  return (
    <section>
      <h2 className="hlt-titre">
        {t("health.log.title", "Le relevé")}
        {enAttente.length > 0 && <b>{enAttente.length} {t("health.log.pending", "en attente")}</b>}
      </h2>

      <div className="hlt-releve" data-fait={faite ? "1" : "0"}>
        <div>
          <div className="hlt-releve-jour">
            {format(laVeille(), "EEEE d MMMM", { locale })}
          </div>
          <p className="hlt-releve-appel">
            {faite
              ? t("health.log.done", "Hier est relevé.")
              : t("health.log.todo", "Comment s’est passée ta journée d’hier ?")}
          </p>
          <p className="hlt-releve-aide">
            {faite
              ? t("health.log.doneHint", "Tu peux le rouvrir pour corriger. Le prochain relevé sera demain matin.")
              : t("health.log.todoHint", "Une journée finie se raconte, elle ne se devine pas — c’est pour ça que le relevé porte sur la veille.")}
          </p>

          {enAttente.length > 0 && (
            <div className="hlt-attente">
              <u>{t("health.log.catchUp", "Rattraper")}</u>
              {enAttente.map((d) => (
                <button key={d} type="button" className="hlt-jour" onClick={() => onOuvrir(d)}>
                  {nommer(d)}
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button" className="hlt-bouton" onClick={() => onOuvrir(veille)}>
          {faite ? <Check aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}
          {faite ? t("health.log.review", "Revoir") : t("health.log.open", "Relever")}
        </button>
      </div>
    </section>
  );
}
