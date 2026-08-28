import { useMemo } from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import type { TodoTask, TodoStats } from "@/domaines/taches/hooks/useTodoList";

/* LE CARTOUCHE
 *
 * La telemetrie etait cinq encadres a grands chiffres — et, a cause
 * d une requete de conteneur qui ne pouvait pas s appliquer, ils
 * tombaient pleine largeur SOUS la liste au lieu de tenir a cote.
 *
 * Ils redeviennent ce qu ils auraient du etre : un cartouche de
 * lignes, qui s arrete ou son contenu s arrete. Sur les cinq mesures,
 * une seule etait unique — la prochaine echeance. Le niveau et la
 * serie restent, en une ligne chacun ; le score detaille vit dans la
 * vue Stats, a un clic.
 */

interface TodoCartoucheProps {
  tasks: TodoTask[];
  stats?: TodoStats | null;
  maxTasks: number;
  analyses: { cle: string; params?: Record<string, unknown> }[];
  onOuvrirTache: (task: TodoTask) => void;
}

export function TodoCartouche({ tasks, stats, maxTasks, analyses, onOuvrirTache }: TodoCartoucheProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  const mesures = useMemo(() => {
    const avecEcheance = tasks
      .filter((x) => x.deadline)
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));

    const enRetard = avecEcheance.filter((x) => {
      const d = new Date(x.deadline!);
      return isPast(d) && !isToday(d);
    });

    const prochaine =
      enRetard[0]
      ?? avecEcheance.find((x) => !isPast(new Date(x.deadline!)) || isToday(new Date(x.deadline!)))
      ?? null;

    const score = stats?.score ?? 0;
    return {
      prochaine,
      prochaineEnRetard: !!prochaine && enRetard.includes(prochaine),
      niveau: Math.floor(score / 100) + 1,
      versLeNiveau: score % 100,
    };
  }, [tasks, stats]);

  const quand = (d: Date) => {
    if (isPast(d) && !isToday(d)) return t("todo.taskCard.overdue");
    if (isToday(d)) return t("todo.taskCard.today");
    if (isTomorrow(d)) return t("todo.taskCard.tomorrow");
    return format(d, "d MMM", { locale });
  };

  return (
    <div className="tsk-plaque tsk-cartouche">
      <div className="tsk-rail">
        <b>REL.</b>
        <i />
        <span>{t("todo.tel.title")}</span>
      </div>

      <div className={cn("tsk-mes", mesures.prochaineEnRetard && "est-alerte")}>
        <span>{t("todo.tel.next")}</span>
        <b>{mesures.prochaine ? quand(new Date(mesures.prochaine.deadline!)) : "—"}</b>
      </div>
      <div className="tsk-mes-suite">
        {mesures.prochaine ? (
          <button type="button" className="tsk-prochaine" onClick={() => onOuvrirTache(mesures.prochaine!)}>
            {mesures.prochaine.name}
          </button>
        ) : (
          <span className="tsk-prochaine">{t("todo.tel.noDeadline")}</span>
        )}
      </div>

      <div className="tsk-mes">
        <span>{t("todo.tel.load")}</span>
        <b>{tasks.length} / {maxTasks}</b>
      </div>
      <div className="tsk-mes">
        <span>{t("todo.tel.streak")}</span>
        <b>{t("todo.advanced.days", { count: stats?.current_streak ?? 0 })}</b>
      </div>
      <div className="tsk-mes">
        <span>{t("todo.tel.level")}</span>
        <b>{mesures.niveau}</b>
      </div>
      <div className="tsk-jauge" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={i < Math.round(mesures.versLeNiveau / 10) ? "est-plein" : undefined} />
        ))}
      </div>

      {/* Ce que la liste ne dit pas d elle-meme : au plus deux lectures,
          et ici — pas au-dessus des taches. */}
      {analyses.slice(0, 2).map((a) => (
        <p key={a.cle} className="tsk-lecture">{t(a.cle, a.params)}</p>
      ))}
    </div>
  );
}
