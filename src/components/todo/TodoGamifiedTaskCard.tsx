import { useState, useCallback } from "react";
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
  ChevronRight,
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
}: TodoGamifiedTaskCardProps) {
  const { t } = useTranslation();
  const sound = useSound();
  const isMobile = useIsMobile();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [swiped, setSwiped] = useState<"left" | "right" | null>(null);
  const { trigger, ParticleEffects } = useParticleEffect();

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
      trigger(e, config.accent, particleCount);
      setTimeout(() => onComplete(), 500);
    },
    [onComplete, trigger, config.accent, sound, task.priority],
  );

  const handleSwipeEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        setSwiped("right");
        setTimeout(() => onComplete(), 300);
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        setSwiped("left");
        setTimeout(() => onDelete(), 300);
      }
    },
    [onComplete, onDelete],
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
                "group relative flex items-center gap-3 h-11 px-3 rounded-none border-b border-border/20 transition-all",
                "bg-black/20 hover:bg-white/5",
                "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:transition-all",
                `before:bg-[${config.accent}] before:opacity-50 group-hover:before:opacity-100`,
                isDragging && "opacity-50",
              )}
            >
              {/* Checkbox Holographique */}
              <motion.button
                onClick={handleComplete}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                  "border-white/20 hover:border-white/50 bg-transparent group-hover:bg-white/5",
                )}
                style={{ borderColor: isCompleting ? config.accent : undefined }}
              >
                {isCompleting && <Check className="w-3 h-3" style={{ color: config.accent }} />}
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
                        "text-[10px] font-mono uppercase tracking-wider",
                        isOverdue ? "text-red-400" : "text-muted-foreground",
                      )}
                    >
                      {isOverdue ? "OVERDUE" : formatDeadline()}
                    </span>
                  )}
                  {task.is_urgent && <AlertTriangle className="w-3 h-3 text-red-400" />}
                </div>
              </div>

              {/* Actions on Hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onFocus && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-cyan-400"
                    onClick={onFocus}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-white"
                  onClick={onEdit}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-400"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
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
            style={{ x }}
            className={cn(
              "group relative mb-3 rounded-r-xl border-l-[3px] overflow-hidden transition-all duration-300",
              "bg-gradient-to-r backdrop-blur-md",
              config.border,
              config.bg,
              isDragging && "opacity-50 grayscale",
              isCompleting && "scale-95 opacity-50 brightness-150",
            )}
            style={{ borderLeftColor: config.accent }}
          >
            {/* Tech Decoration Lines */}
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-50 transition-opacity">
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
              <div className="flex items-start gap-4">
                {/* Checkbox Tactique */}
                <motion.button
                  onClick={handleComplete}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex-shrink-0 w-11 h-11 rounded-lg border bg-black/20 flex items-center justify-center transition-all duration-300",
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
                          <span>LOC :: {task.location.toUpperCase()}</span>
                        </div>
                      )}

                      {/* Badges Row */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {/* Category Chip */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                          <CategoryIcon className="w-3 h-3" />
                          {t(`todo.categories.${category}`)}
                        </div>

                        {/* Type Chip */}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-transparent bg-white/5",
                            typeConfig.color,
                          )}
                        >
                          <TypeIcon className="w-3 h-3" />
                          {t(typeConfig.labelKey)}
                        </div>

                        {/* Priority Indicator */}
                        <div
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                            config.badge,
                          )}
                        >
                          {task.priority} PRTY
                        </div>

                        {/* Urgent Alert */}
                        {task.is_urgent && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-red-400 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            CRITICAL
                          </div>
                        )}

                        {/* Deadline & Time */}
                        {deadlineDate && (
                          <div
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono",
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

                    {/* Desktop Actions (Hover Slide-in) */}
                    <div className="hidden md:flex items-center gap-1 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                      {onFocus && (
                        <ActionButton
                          icon={Crosshair}
                          onClick={onFocus}
                          color="hover:text-cyan-400 hover:bg-cyan-500/10"
                        />
                      )}
                      <ActionButton icon={Pencil} onClick={onEdit} color="hover:text-white hover:bg-white/10" />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded text-muted-foreground hover:text-white hover:bg-white/10"
                          >
                            <Clock className="w-4 h-4" />
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

function ActionButton({ icon: Icon, onClick, color }: { icon: any; onClick: () => void; color: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn("h-8 w-8 rounded text-muted-foreground transition-all duration-200", color)}
    >
      <Icon className="w-4 h-4" />
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
            System Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">{t("todo.taskCard.deleteDesc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:text-white font-mono text-xs">
            ABORT
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 font-mono text-xs"
          >
            CONFIRM_DELETE
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
