import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, type PanInfo } from "framer-motion";
import {
  Crosshair, Pencil, Clock, Trash2, GripVertical, MapPin, Bell, Repeat,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import { useSound } from "@/contexts/SoundContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDialogueConsole } from "@/hooks/useDialogueConsole";
import { useParticleEffect } from "@/components/ParticleEffect";
import type { TodoTask } from "@/hooks/useTodoList";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* LA LIGNE
 *
 * Une tache tenait dans une carte de cent pixels pour dire trois choses :
 * son nom, quand, et son importance. Elle tient maintenant dans une
 * ligne de quarante-quatre — la hauteur d une cible tactile, pas un
 * pixel de plus.
 *
 * La lampe de gauche EST le bouton « terminer » : elle porte la teinte
 * de la priorite, se remplit au survol, et bat quand la tache est en
 * retard. C est le seul element anime de la ligne, et il dit quelque
 * chose.
 */

const TEINTES: Record<string, string> = {
  low: "var(--tsk-basse)",
  medium: "var(--tsk-moy)",
  high: "var(--tsk-haute)",
};

const SEUIL_BALAYAGE = 100;

/** Une reference lisible et stable, tiree de l identifiant. */
const referenceDe = (id: string) => "T." + id.replace(/[^0-9a-f]/gi, "").slice(-4).toUpperCase();

interface TodoLigneProps {
  task: TodoTask;
  variant?: "liste" | "detaillee";
  onComplete: () => void;
  onPostpone: (newDeadline: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onFocus?: () => void;
  isDragging?: boolean;
  poignee?: React.HTMLAttributes<HTMLElement>;
}

export function TodoLigne({
  task, variant = "liste", onComplete, onPostpone, onDelete, onEdit, onFocus,
  isDragging, poignee,
}: TodoLigneProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const sound = useSound();
  const isMobile = useIsMobile();
  const { trigger, ParticleEffects } = useParticleEffect();

  const [confirmerSuppression, setConfirmerSuppression] = useState(false);
  /* Le dialogue se centre sur la zone de contenu, pas sur la fenetre. */
  const dlg = useDialogueConsole(confirmerSuppression);
  const [sortante, setSortante] = useState(false);
  const x = useMotionValue(0);

  /* Deux minuteries partaient sans jamais etre annulees. */
  const minuteries = useRef<number[]>([]);
  const differer = useCallback((fn: () => void, ms: number) => {
    minuteries.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => { minuteries.current.forEach(clearTimeout); }, []);

  const echeance = task.deadline ? new Date(task.deadline) : null;
  const enRetard = !!echeance && isPast(echeance) && !isToday(echeance);
  const teinte = enRetard ? "var(--tsk-retard)" : TEINTES[task.priority] ?? "var(--tsk-moy)";

  const quand = (() => {
    if (!echeance) return null;
    if (enRetard) return t("todo.taskCard.overdue");
    if (isToday(echeance)) return t("todo.taskCard.today");
    if (isTomorrow(echeance)) return t("todo.taskCard.tomorrow");
    return format(echeance, "d MMM", { locale });
  })();

  const reports = [
    { cle: "todo.taskCard.tomorrow", date: addDays(new Date(), 1) },
    { cle: "todo.taskCard.in3Days", date: addDays(new Date(), 3) },
    { cle: "todo.taskCard.nextWeek", date: addDays(new Date(), 7) },
  ];

  const terminer = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSortante(true);
    sound.play("success", "reward");
    trigger(e.clientX, e.clientY, enRetard ? "#ff4d5e" : task.priority === "high" ? "#f59e0b" : "#3b82f6",
      task.priority === "high" ? 34 : 20);
    differer(onComplete, 420);
  }, [onComplete, sound, trigger, task.priority, enRetard, differer]);

  const finDeBalayage = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x > SEUIL_BALAYAGE) {
      setSortante(true);
      differer(onComplete, 300);
    } else if (info.offset.x < -SEUIL_BALAYAGE) {
      /* Le balayage supprimait sur-le-champ, alors que le bouton
         demandait confirmation — et sur telephone c etait le seul
         chemin vers la suppression. */
      x.set(0);
      setConfirmerSuppression(true);
    }
  }, [onComplete, differer, x]);

  const style = { ["--tsk-teinte" as string]: teinte } as React.CSSProperties;

  return (
    <>
      <ParticleEffects />
      <AnimatePresence>
        {!sortante && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={finDeBalayage}
            style={{ ...style, x }}
            data-retard={enRetard}
            data-urgent={task.is_urgent}
            className={cn("tsk-ligne", isDragging && "est-en-vol")}
          >
            <span className="tsk-filet" aria-hidden="true" />

            <button
              type="button"
              className="tsk-lampe"
              onClick={terminer}
              aria-label={t("todo.taskCard.complete", { name: task.name })}
            >
              <span aria-hidden="true" />
            </button>

            <button type="button" className="tsk-corps-ligne" onClick={onEdit}>
              <span className="tsk-nom">{task.name}</span>
              <span className="tsk-meta">
                <span className="tsk-ref">{referenceDe(task.id)}</span>
                <span className="tsk-sep" aria-hidden="true">·</span>
                {t("todo.categories." + (task.category || "general"))}
                <span className="tsk-sep" aria-hidden="true">·</span>
                {t("todo.taskTypes." + (task.task_type || "flexible"))}
                {quand && (
                  <>
                    <span className="tsk-sep" aria-hidden="true">·</span>
                    <span className="tsk-quand">{quand}</span>
                  </>
                )}
                {task.postpone_count >= 3 && (
                  <>
                    <span className="tsk-sep" aria-hidden="true">·</span>
                    <span className="tsk-reports">
                      {t("todo.taskCard.postponedTimes", { count: task.postpone_count })}
                    </span>
                  </>
                )}
              </span>

              {variant === "detaillee" && (
                <span className="tsk-badges">
                  <span className="tsk-badge est-teinte">{t("todo.priorities." + task.priority)}</span>
                  {task.is_urgent && (
                    <span className="tsk-badge est-teinte" style={{ ["--tsk-teinte" as string]: "var(--tsk-retard)" } as React.CSSProperties}>
                      {t("todo.taskCard.critical")}
                    </span>
                  )}
                  {task.location && (
                    <span className="tsk-badge">
                      <MapPin className="w-2.5 h-2.5" aria-hidden="true" />
                      {task.location}
                    </span>
                  )}
                  {task.appointment_time && (
                    <span className="tsk-badge">
                      <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                      {task.appointment_time}
                    </span>
                  )}
                  {task.reminder_enabled && (
                    <span className="tsk-badge">
                      <Bell className="w-2.5 h-2.5" aria-hidden="true" />
                      {t("todo.taskCard.reminderActive")}
                    </span>
                  )}
                  {task.postpone_count > 0 && task.postpone_count < 3 && (
                    <span className="tsk-badge">
                      <Repeat className="w-2.5 h-2.5" aria-hidden="true" />
                      {t("todo.taskCard.postponedTimes", { count: task.postpone_count })}
                    </span>
                  )}
                </span>
              )}
            </button>

            <span className="tsk-actions">
              {poignee && (
                <button
                  type="button"
                  {...poignee}
                  aria-label={t("todo.taskCard.dragHandle")}
                  className="tsk-action tsk-poignee"
                >
                  <GripVertical className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              {onFocus && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFocus(); }}
                  aria-label={t("todo.taskCard.focus", { name: task.name })}
                  className="tsk-action est-signal"
                >
                  <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                aria-label={t("todo.taskCard.edit", { name: task.name })}
                className="tsk-action"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("todo.taskCard.postpone", { name: task.name })}
                    className="tsk-action"
                  >
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="tsk bg-[hsl(var(--ds-surface-1))] border-[hsl(var(--ds-border-default)/0.2)]">
                  {reports.map((o) => (
                    <DropdownMenuItem
                      key={o.cle}
                      onClick={() => onPostpone(o.date.toISOString())}
                      className="font-mono text-xs cursor-pointer"
                    >
                      {t(o.cle)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmerSuppression(true); }}
                aria-label={t("todo.taskCard.delete", { name: task.name })}
                className="tsk-action est-danger"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={confirmerSuppression} onOpenChange={setConfirmerSuppression}>
        <AlertDialogContent
          className="tsk tsk-dlg border-0 bg-transparent p-0 shadow-none"
          style={{ ["--tsk-dlg-decalage" as string]: `${dlg.decalage}px` } as React.CSSProperties}
        >
          <div className="tsk-dlg-rail">
            <b>TSK.01</b>
            <i />
            <AlertDialogTitle asChild>
              <span>{t("todo.taskCard.deleteTitle")}</span>
            </AlertDialogTitle>
          </div>
          <AlertDialogHeader className="px-4 pt-4 pb-0 space-y-0">
            <AlertDialogDescription className="text-[hsl(var(--ds-text-secondary))]">
              {t("todo.taskCard.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="tsk-dlg-pied sm:justify-start">
            <AlertDialogAction onClick={onDelete} className="tsk-outil est-danger est-large">
              {t("common.delete")}
            </AlertDialogAction>
            <AlertDialogCancel className="tsk-outil mt-0">{t("common.cancel")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
