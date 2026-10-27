import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { ClipboardCheck, Check } from "lucide-react";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { cleDuJour, laVeille, pagesDuJournal, veilleRelevee, serieDeJours } from "@/domaines/sante/logique/journee";

interface Props {
  /** Les dates deja relevees, au format yyyy-MM-dd. */
  datesRelevees: string[];
  onOuvrir: (date: string) => void;
}

/**
 * LE JOURNAL DU DOSSIER.
 *
 * Les jours manques etaient une pile de pastilles grises posee sous la
 * question : l information la plus importante de la page, rendue comme
 * la moins importante. Et l on n y voyait que ses manquements, jamais
 * sa regularite — les journees relevees, elles, disparaissaient.
 *
 * Le journal montre toute la quinzaine, du plus recent au plus ancien,
 * chaque jour avec son etat. La veille garde sa carte a rail jaune :
 * c est le seul appel a l action. Le reste est une suite de lignes
 * datees qu on parcourt du regard, et qu on clique pour rattraper.
 */
export function JournalDuCorps({ datesRelevees, onOuvrir }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  const veille = cleDuJour(laVeille());
  const faite = veilleRelevee(datesRelevees);

  /* La veille est traitee a part : elle a sa carte. Les lignes ne
     montrent que ce qui vient avant. */
  const lignes = useMemo(
    () => pagesDuJournal(datesRelevees).filter((p) => p.cle !== veille),
    [datesRelevees, veille],
  );

  /* LA SERIE SE CALCULE, ELLE NE SE STOCKE PLUS.
     health_streaks tenait un compteur incremente a chaque
     enregistrement, contre la date du jour et non contre la date
     relevee : rattraper treize jours l avancait d un cran, et la table
     mesurait « les jours ou j ai appuye sur enregistrer » plutot que
     « les jours dont j ai le releve ». On la lit desormais dans les
     dates elles-memes, ou elle ne peut pas mentir. */
  const serie = useMemo(
    () => serieDeJours(datesRelevees.map((d) => d.slice(0, 10))),
    [datesRelevees],
  );

  return (
    <section className="hlt-journal">
      {/* Pas de compte des manquants ici : la bande de dossier
          l annonce deja, quatre cents pixels au-dessus. La serie, elle,
          n est affichee nulle part ailleurs. */}
      <h2 className="hlt-titre">
        {t("health.journal.title", "Le journal")}
        {serie > 0 && <b>{t("health.journal.streak", { count: serie })}</b>}
      </h2>

      <div className="hlt-veille" data-fait={faite ? "1" : "0"}>
        <div>
          <div className="hlt-veille-jour">{format(laVeille(), "EEEE d MMMM", { locale })}</div>
          <p className="hlt-veille-appel">
            {faite
              ? t("health.log.done", "Hier est relevé.")
              : t("health.log.todo", "Comment s’est passée ta journée d’hier ?")}
          </p>
          <p className="hlt-veille-aide">
            {faite
              ? t("health.log.doneHint", "Tu peux le rouvrir pour corriger. Le prochain relevé sera demain matin.")
              : t("health.log.todoHint", "Une journée finie se raconte, elle ne se devine pas — c’est pour ça que le relevé porte sur la veille.")}
          </p>
        </div>

        <button type="button" className="hlt-bouton" onClick={() => onOuvrir(veille)}>
          {faite ? <Check aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}
          {faite ? t("health.log.review", "Revoir") : t("health.log.open", "Relever")}
        </button>
      </div>

      <ol className="hlt-lignes">
        {lignes.map((p, i) => (
          <li key={p.cle} style={{ ["--i" as string]: i }}>
            <button
              type="button"
              className="hlt-lignes-jour"
              data-fait={p.relevee ? "1" : "0"}
              onClick={() => onOuvrir(p.cle)}
              aria-label={t(p.relevee ? "health.journal.reviewDay" : "health.journal.openDay", {
                jour: format(parseISO(p.cle), "EEEE d MMMM", { locale }),
              })}
            >
              <time dateTime={p.cle}>{format(parseISO(p.cle), "EEE d MMM", { locale })}</time>
              <span aria-hidden="true" />
              <u>
                {p.relevee
                  ? t("health.journal.filled", "Relevé")
                  : t("health.journal.empty", "Vide")}
              </u>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
