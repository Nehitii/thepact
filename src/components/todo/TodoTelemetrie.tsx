import { useMemo } from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import type { TodoTask, TodoStats } from "@/hooks/useTodoList";

/* LA TELEMETRIE
 *
 * La barre de statistiques etait une ligne de texte centree — niveau,
 * score, serie, compte — que rien ne separait et que personne ne
 * lisait. Elle devient une colonne d instrument : une mesure par bloc,
 * un nombre en grand, et une phrase qui dit ce qu il faut en faire.
 *
 * Elle repond a la question que la liste ne posait pas : par quoi
 * commencer.
 */

interface TodoTelemetrieProps {
  tasks: TodoTask[];
  stats?: TodoStats | null;
  maxTasks: number;
  onOuvrirTache: (task: TodoTask) => void;
}

export function TodoTelemetrie({ tasks, stats, maxTasks, onOuvrirTache }: TodoTelemetrieProps) {
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

    const prochaine = enRetard[0] ?? avecEcheance.find((x) => !isPast(new Date(x.deadline!)) || isToday(new Date(x.deadline!))) ?? null;
    const score = stats?.score ?? 0;

    return {
      prochaine,
      prochaineEnRetard: !!prochaine && enRetard.includes(prochaine),
      enRetard: enRetard.length,
      pireReport: tasks.reduce((m, x) => Math.max(m, x.postpone_count), 0),
      niveau: Math.floor(score / 100) + 1,
      score,
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
    <div className="tsk-tel">
      <div className={cn("tsk-bloc", mesures.prochaineEnRetard ? "est-alerte" : "est-signal")}>
        <span className="tsk-tel-nom">{t("todo.tel.next")}</span>
        {mesures.prochaine ? (
          <>
            <span className="tsk-tel-val">{quand(new Date(mesures.prochaine.deadline!))}</span>
            <button
              type="button"
              onClick={() => onOuvrirTache(mesures.prochaine!)}
              className="tsk-tel-note text-left hover:text-[hsl(var(--ds-accent-primary))] transition-colors"
            >
              {mesures.prochaine.name}
            </button>
          </>
        ) : (
          <>
            <span className="tsk-tel-val">—</span>
            <span className="tsk-tel-note">{t("todo.tel.noDeadline")}</span>
          </>
        )}
      </div>

      {mesures.enRetard > 0 && (
        <div className="tsk-bloc est-alerte">
          <span className="tsk-tel-nom">{t("todo.tel.overdue")}</span>
          <span className="tsk-tel-val">{mesures.enRetard}</span>
          <span className="tsk-tel-note">
            {mesures.pireReport >= 3
              ? t("todo.tel.worstPostponed", { count: mesures.pireReport })
              : t("todo.tel.overdueNote")}
          </span>
        </div>
      )}

      <div className="tsk-bloc">
        <span className="tsk-tel-nom">{t("todo.tel.level")}</span>
        <span className="tsk-tel-val">{mesures.niveau}</span>
        <span className="tsk-tel-note">
          {t("todo.tel.levelNote", { score: mesures.score, reste: 100 - mesures.versLeNiveau })}
        </span>
        <div className="tsk-jauge" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={i < Math.round(mesures.versLeNiveau / 10) ? "est-plein" : undefined} />
          ))}
        </div>
      </div>

      <div className="tsk-bloc">
        <span className="tsk-tel-nom">{t("todo.tel.streak")}</span>
        <span className="tsk-tel-val">{t("todo.advanced.days", { count: stats?.current_streak ?? 0 })}</span>
        <span className="tsk-tel-note">
          {t("todo.tel.bestStreak", { count: stats?.longest_streak ?? 0 })}
        </span>
      </div>

      <div className="tsk-bloc">
        <span className="tsk-tel-nom">{t("todo.tel.load")}</span>
        <span className="tsk-tel-val">{tasks.length} / {maxTasks}</span>
        <div className="tsk-jauge" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={i < Math.round((tasks.length / maxTasks) * 10) ? "est-plein" : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
