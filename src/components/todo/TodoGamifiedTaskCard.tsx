import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  Check,
  Clock,
  Trash2,
  AlertTriangle,
  Tag,
  Briefcase,
  Heart,
  BookOpen,
  Cog,
  User,
  Sparkles,
  Pencil,
  Hourglass,
  CalendarClock,
  MapPin,
  Bell,
  Crosshair,
  GripVertical,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { TodoTask } from "@/hooks/useTodoList";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useParticleEffect } from "@/components/ParticleEffect";
import { useTranslation } from "react-i18next";
import { useSound } from "@/contexts/SoundContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface TodoGamifiedTaskCardProps {
  task: TodoTask;
  onComplete: () => void;
  onPostpone: (newDeadline: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onFocus?: () => void;
  variant?: "expanded" | "compact";
  isDragging?: boolean;
  /* La poignee de deplacement etait posee sur la carte ENTIERE, qui
     devenait un role="button" contenant cinq boutons — un controle dans
     un controle, que rien ne definit. Elle est maintenant un element a
     part, et la carte redevient un conteneur. */
  poignee?: React.HTMLAttributes<HTMLElement>;
}

// --- CONFIGURATION CYBERPUNK ---
const priorityConfig = {
  low: {
    border: "border-emerald-500/20",
    bg: "from-emerald-950/30 to-black/40",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    accent: "#10b981",
    scanline: "bg-emerald-500/20",
  },
  medium: {
    border: "border-blue-500/20",
    bg: "from-blue-950/30 to-black/40",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    badge: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    accent: "#3b82f6",
    scanline: "bg-blue-500/20",
  },
  high: {
    border: "border-amber-500/20",
    bg: "from-amber-950/30 to-black/40",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    accent: "#f59e0b",
    scanline: "bg-amber-500/20",
  },
};

const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
  work: { icon: Briefcase, color: "text-blue-400" },
  health: { icon: Heart, color: "text-red-400" },
  personal: { icon: User, color: "text-purple-400" },
  study: { icon: BookOpen, color: "text-emerald-400" },
  admin: { icon: Cog, color: "text-gray-400" },
  general: { icon: Tag, color: "text-slate-400" },
};

const taskTypeConfig: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  rendezvous: { icon: CalendarClock, color: "text-purple-300", labelKey: "todo.taskTypes.rendezvous" },
  deadline: { icon: Clock, color: "text-red-300", labelKey: "todo.taskTypes.deadline" },
  flexible: { icon: Sparkles, color: "text-cyan-300", labelKey: "todo.taskTypes.flexible" },
  waiting: { icon: Hourglass, color: "text-amber-300", labelKey: "todo.taskTypes.waiting" },
};

const SWIPE_THRESHOLD = 100;

export function TodoGamifiedTaskCard({
  task,
  onComplete,
  onPostpone,
  onDelete,
  onEdit,
  onFocus,
  variant = "expanded",
  isDragging,
  poignee,
}: TodoGamifiedTaskCardProps) {
  const { t } = useTranslation();
  const sound = useSound();
  const isMobile = useIsMobile();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [swiped, setSwiped] = useState<"left" | "right" | null>(null);
  const { trigger, ParticleEffects } = useParticleEffect();

  /* Deux minuteries partaient sans jamais etre annulees : si la carte
     disparaissait entre-temps, l action partait quand meme. */
  const minuteries = useRef<number[]>([]);
  const differer = useCallback((fn: () => void, ms: number) => {
    minuteries.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => { minuteries.current.forEach(clearTimeout); }, []);

  const x = useMotionValue(0);
  const bgRight = useTransform(x, [0, SWIPE_THRESHOLD], ["rgba(16,185,129,0)", "rgba(16,185,129,0.2)"]);
  const bgLeft = useTransform(x, [-SWIPE_THRESHOLD, 0], ["rgba(239,68,68,0.2)", "rgba(239,68,68,0)"]);

  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate);

  const config = priorityConfig[task.priority];
  const category = task.category || "general";
  const taskType = task.task_type || "flexible";
  const CategoryIcon = categoryConfig[category]?.icon || Tag;
  const typeConfig = taskTypeConfig[taskType] || taskTypeConfig.flexible;
  const TypeIcon = typeConfig.icon;

  const formatDeadline = () => {
    if (!deadlineDate) return null;
    if (isToday(deadlineDate)) return t("todo.taskCard.today");
    if (isTomorrow(deadlineDate)) return t("todo.taskCard.tomorrow");
    return format(deadlineDate, "MMM d");
  };

  const postponeOptions = [
    { label: t("todo.taskCard.tomorrow"), date: addDays(new Date(), 1) },
    { label: t("todo.taskCard.in3Days", { defaultValue: "In 3 days" }), date: addDays(new Date(), 3) },
    { label: t("todo.taskCard.nextWeek", { defaultValue: "Next week" }), date: addDays(new Date(), 7) },
  ];

  const handleComplete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsCompleting(true);
      sound.play("success", "reward");
      const particleCount = task.priority === "high" ? 40 : task.priority === "medium" ? 25 : 15;
      trigger(e.clientX, e.clientY, config.accent, particleCount);
      differer(() => onComplete(), 500);
    },
    [onComplete, trigger, config.accent, sound, task.priority, differer],
  );

  const handleSwipeEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        setSwiped("right");
        differer(() => onComplete(), 300);
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        /* Le balayage supprimait sur-le-champ, sans confirmation ni
           annulation — alors que le bouton, lui, en demandait une. Sur
           telephone c etait le SEUL chemin vers la suppression. */
        x.set(0);
        setShowDeleteConfirm(true);
      }
    },
    [onComplete, differer, x],
  );

  // --- RENDU COMPACT (LOG STYLE) ---
  if (variant === "compact") {
    return (
      <>
        <ParticleEffects />
        <AnimatePresence>
          {!isCompleting && !swiped && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: swiped === "right" ? 100 : swiped === "left" ? -100 : 0 }}
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleSwipeEnd}
              style={{ x }}
              className={cn(
                "group relative flex items-center gap-3 min-h-[44px] py-1 px-3 rounded-none border-b border-border/20 transition-all",
                "bg-black/20 hover:bg-white/5",
                isDragging && "opacity-50",
              )}
            >
              {/* Le liseret de priorite etait declare par une classe
                  fabriquee a l execution — before:bg-[#f59e0b] — que
                  Tailwind ne genere jamais : il etait transparent. */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: config.accent }}
              />

              {poignee && (
                <button
                  type="button"
                  {...poignee}
                  aria-label={t("todo.taskCard.dragHandle")}
                  className="shrink-0 -ml-1 w-6 [@media(pointer:coarse)]:min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
                >
                  <GripVertical className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}

              {/* Checkbox Holographique */}
              <motion.button
                onClick={handleComplete}
                aria-label={t("todo.taskCard.complete", { name: task.name })}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors",
                  "text-white/30 hover:text-white/80",
                )}
                style={{ borderColor: isCompleting ? config.accent : undefined }}
              >
                <span className="w-4 h-4 rounded-sm border border-current flex items-center justify-center">
                  {isCompleting && <Check className="w-3 h-3" style={{ color: config.accent }} aria-hidden="true" />}
                </span>
              </motion.button>

              {/* Title & Meta */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    "text-sm font-mono truncate text-foreground/80 group-hover:text-foreground transition-colors",
                    task.is_urgent && "text-red-300",
                  )}
                >
                  {task.name}
                </span>

                {/* Micro Badges */}
                <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  {deadlineDate && (
                    <span
                      className={cn(
                        "ds-t-label font-mono uppercase tracking-wider",
                        isOverdue ? "text-red-400" : "text-muted-foreground",
                      )}
                    >
                      {isOverdue ? t("todo.taskCard.overdue") : formatDeadline()}
                    </span>
                  )}
                  {task.is_urgent && <AlertTriangle className="w-3 h-3 text-red-400" />}
                </div>
              </div>

              {/* « opacity-0 » cache a l oeil et laisse au clavier : ces
                  boutons restaient focalisables, invisibles. Ils
                  apparaissent maintenant au focus, et en permanence
                  quand le pointeur est grossier — un doigt ne survole
                  rien. */}
              <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity">
                {onFocus && (
                  <Button
                    variant="ghost" size="icon"
                    className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-cyan-400"
                    onClick={onFocus}
                    aria-label={t("todo.taskCard.focus", { name: task.name })}
                  >
                    <Crosshair className="w-4 h-4" aria-hidden="true" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon"
                  className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-white"
                  onClick={onEdit}
                  aria-label={t("todo.taskCard.edit", { name: task.name })}
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-red-400"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label={t("todo.taskCard.delete", { name: task.name })}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} onConfirm={onDelete} />
      </>
    );
  }

  // --- RENDU EXPANDED (TACTICAL PLATE) ---
  return (
    <>
      <ParticleEffects />
      <AnimatePresence>
        {!isCompleting && !swiped && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -10, x: swiped === "right" ? 100 : swiped === "left" ? -100 : 0 }}
            transition={{ duration: 0.3, ease: "backOut" }}
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={handleSwipeEnd}
            // Correction de l'erreur TS : fusion des props style
            style={{ x, borderLeftColor: config.accent }}
            className={cn(
              "group relative mb-3 rounded-r-xl border-l-[3px] overflow-hidden transition-all duration-300",
              "bg-gradient-to-r backdrop-blur-md",
              config.border,
              config.bg,
              isDragging && "opacity-50 grayscale",
              isCompleting && "scale-95 opacity-50 brightness-150",
            )}
          >
            {/* Tech Decoration Lines */}
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-50 transition-opacity pointer-events-none">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-current rounded-full" />
                <div className="w-1 h-1 bg-current rounded-full" />
                <div className="w-6 h-1 bg-current rounded-full" />
              </div>
            </div>

            {/* Scanline Effect (Hover) */}
            <div
              className={cn(
                "absolute inset-0 w-[200%] h-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                "bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-shine",
              )}
            />

            {/* Swipe Backgrounds (Mobile) */}
            {isMobile && (
              <>
                <motion.div className="absolute inset-0 z-0" style={{ backgroundColor: bgRight }} />
                <motion.div className="absolute inset-0 z-0" style={{ backgroundColor: bgLeft }} />
              </>
            )}

            <div className="relative z-10 p-4 pl-5">
              <div className="flex items-start gap-3">
                {poignee && (
                  <button
                    type="button"
                    {...poignee}
                    aria-label={t("todo.taskCard.dragHandle")}
                    className="shrink-0 -ml-2 w-6 [@media(pointer:coarse)]:min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
                  >
                    <GripVertical className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}

                {/* Checkbox Tactique */}
                <motion.button
                  onClick={handleComplete}
                  aria-label={t("todo.taskCard.complete", { name: task.name })}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex-shrink-0 min-w-[44px] min-h-[44px] rounded-lg border bg-black/20 flex items-center justify-center transition-all duration-300",
                    "group/btn hover:bg-white/5",
                    "border-white/10 hover:border-white/30",
                  )}
                  style={{ boxShadow: `0 0 10px ${config.accent}10` }}
                >
                  <div
                    className={cn(
                      "w-5 h-5 border-2 rounded-sm transition-all duration-300 flex items-center justify-center",
                      "border-white/30 group-hover/btn:border-white/80",
                    )}
                  >
                    <Check className="w-3.5 h-3.5 text-transparent group-hover/btn:text-white transition-colors" />
                  </div>
                </motion.button>

                {/* Main Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      {/* Title */}
                      <h4
                        className={cn(
                          "text-base font-semibold leading-snug tracking-tight text-white/90 group-hover:text-white transition-colors",
                          task.is_urgent && "text-red-50 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",
                        )}
                      >
                        {task.name}
                      </h4>

                      {/* Location Data */}
                      {task.location && taskType === "rendezvous" && (
                        <div className="flex items-center gap-1.5 text-xs text-purple-300/80 font-mono">
                          <MapPin className="w-3 h-3" />
                          <span>{t("todo.taskCard.location")} :: {task.location.toUpperCase()}</span>
                        </div>
                      )}

                      {/* Badges Row */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {/* Category Chip */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 ds-t-label uppercase font-bold tracking-wider text-muted-foreground">
                          <CategoryIcon className="w-3 h-3" />
                          {t(`todo.categories.${category}`)}
                        </div>

                        {/* Type Chip */}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded ds-t-label uppercase font-bold tracking-wider border border-transparent bg-white/5",
                            typeConfig.color,
                          )}
                        >
                          <TypeIcon className="w-3 h-3" />
                          {t(typeConfig.labelKey)}
                        </div>

                        {/* Priority Indicator */}
                        <div
                          className={cn(
                            "px-2 py-0.5 rounded ds-t-label uppercase font-bold tracking-wider border",
                            config.badge,
                          )}
                        >
                          {t("todo.priorities." + task.priority)}
                        </div>

                        {/* Urgent Alert */}
                        {task.is_urgent && (
                          <div className="flex items-center gap-1 ds-t-label font-bold text-red-400 animate-pulse">
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            {t("todo.taskCard.critical")}
                          </div>
                        )}

                        {/* Deadline & Time */}
                        {deadlineDate && (
                          <div
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-0.5 rounded border ds-t-label font-mono",
                              isOverdue
                                ? "bg-red-500/10 border-red-500/30 text-red-300"
                                : "bg-black/30 border-white/10 text-slate-400",
                            )}
                          >
                            <Clock className="w-3 h-3" />
                            {formatDeadline()}
                            {task.appointment_time && (
                              <span className="text-white/60"> // {task.appointment_time}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Elles etaient retirees sous 768 px et invisibles
                        au-dessus jusqu au survol : sur telephone il ne
                        restait aucun bouton, et le seul chemin vers la
                        suppression etait un balayage sans confirmation. */}
                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 group-focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity duration-300 ease-out">
                      {onFocus && (
                        <ActionButton
                          icon={Crosshair}
                          onClick={onFocus}
                          label={t("todo.taskCard.focus", { name: task.name })}
                          color="hover:text-cyan-400 hover:bg-cyan-500/10"
                        />
                      )}
                      <ActionButton icon={Pencil} onClick={onEdit} label={t("todo.taskCard.edit", { name: task.name })} color="hover:text-white hover:bg-white/10" />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("todo.taskCard.postpone", { name: task.name })}
                            className="min-h-[44px] min-w-[44px] rounded text-muted-foreground hover:text-white hover:bg-white/10"
                          >
                            <Clock className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-black/90 border-white/10 text-white backdrop-blur-xl"
                        >
                          {postponeOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.label}
                              onClick={() => onPostpone(option.date.toISOString())}
                              className="font-mono text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <ActionButton
                        icon={Trash2}
                        onClick={() => setShowDeleteConfirm(true)}
                        label={t("todo.taskCard.delete", { name: task.name })}
                        color="hover:text-red-400 hover:bg-red-500/10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} onConfirm={onDelete} />
    </>
  );
}

// --- HELPER COMPONENTS ---

function ActionButton({ icon: Icon, onClick, color, label }: {
  icon: React.ElementType;
  onClick: () => void;
  color: string;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn("min-h-[44px] min-w-[44px] rounded text-muted-foreground transition-all duration-200", color)}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </Button>
  );
}

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-black/95 border border-white/10 shadow-2xl backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono text-red-400 tracking-widest uppercase text-sm">
            {t("todo.taskCard.deleteTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">{t("todo.taskCard.deleteDesc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:text-white font-mono text-xs">
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 font-mono text-xs"
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
