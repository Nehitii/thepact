import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarIcon,
  Briefcase,
  Heart,
  BookOpen,
  Cog,
  User,
  Tag,
  Clock,
  Sparkles,
  Hourglass,
  CalendarClock,
  MapPin,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { TodoPriority, CreateTaskInput, TodoTaskType, ReminderFrequency } from "@/hooks/useTodoList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

interface TodoGamifiedCreateFormProps {
  onSubmit: (input: CreateTaskInput & { category: string; task_type: TodoTaskType }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const categories = [
  { id: "work", icon: Briefcase, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { id: "health", icon: Heart, color: "text-red-400 border-red-500/30 bg-red-500/10" },
  { id: "personal", icon: User, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id: "study", icon: BookOpen, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "admin", icon: Cog, color: "text-gray-400 border-gray-500/30 bg-gray-500/10" },
  { id: "general", icon: Tag, color: "text-muted-foreground border-border bg-muted/30" },
] as const;

const taskTypes: { id: TodoTaskType; icon: typeof Sparkles; color: string }[] = [
  { id: "flexible", icon: Sparkles, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  { id: "waiting", icon: Hourglass, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "rendezvous", icon: CalendarClock, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id: "deadline", icon: Clock, color: "text-red-400 border-red-500/30 bg-red-500/10" },
];

const priorities = [
  { id: "low", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20" },
  { id: "medium", color: "text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20" },
  { id: "high", color: "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20" },
] as const;

const reminderFrequencies: ReminderFrequency[] = ["weekly", "monthly", "bimonthly", "semiannual", "yearly"];

export function TodoGamifiedCreateForm({ onSubmit, onCancel, isLoading }: TodoGamifiedCreateFormProps) {
  const { t } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [appointmentTime, setAppointmentTime] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [category, setCategory] = useState("general");
  const [taskType, setTaskType] = useState<TodoTaskType>("flexible");
  const [isUrgent, setIsUrgent] = useState(false);
  const [location, setLocation] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>("weekly");

  // Reset deadline when switching to flexible type
  useEffect(() => {
    if (taskType === "flexible") {
      setDeadline(undefined);
      setAppointmentTime("");
    }
  }, [taskType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    // Validate required fields based on task type
    if (taskType === "deadline" && !deadline) return;
    if (taskType === "rendezvous" && !deadline) return;

    onSubmit({
      name: name.trim(),
      deadline: deadline?.toISOString() ?? null,
      priority,
      is_urgent: isUrgent,
      category,
      task_type: taskType,
      reminder_enabled: taskType === "waiting" ? reminderEnabled : false,
      reminder_frequency: taskType === "waiting" && reminderEnabled ? reminderFrequency : null,
      location: taskType === "rendezvous" ? location || null : null,
      appointment_time: taskType === "rendezvous" && appointmentTime ? appointmentTime : null,
    });
  };

  // Determine if deadline is required
  const isDeadlineRequired = taskType === "deadline" || taskType === "rendezvous";
  const showDeadline = taskType !== "flexible";
  const showLocation = taskType === "rendezvous";
  const showTime = taskType === "rendezvous";
  const showReminder = taskType === "waiting";

  return (
    // CORRECTION : Suppression de "max-h-[70vh] overflow-y-auto pr-1" pour laisser la modale gérer le scroll
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Task name */}
      <div className="space-y-3">
        <Label
          htmlFor="task-name"
          className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2"
        >
          {t("todo.create.questName")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("todo.create.questPlaceholder")}
          variant="light"
          className="h-12 text-base rounded-xl"
          maxLength={100}
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Category selection */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">{t("todo.create.category")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all",
                  isSelected ? cat.color + " ring-1 ring-current" : "border-border/50 bg-card/30 hover:bg-card/50",
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", isSelected ? "" : "text-muted-foreground")}>
                  {t(`todo.categories.${cat.id}`)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Task type */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">{t("todo.create.taskType")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {taskTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = taskType === type.id;
            return (
              <motion.button
                key={type.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTaskType(type.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                  isSelected ? type.color + " ring-1 ring-current" : "border-border/50 bg-card/30 hover:bg-card/50",
                )}
              >
                <Icon className={cn("w-5 h-5", isSelected ? "" : "text-muted-foreground")} />
                <span className={cn("text-xs font-medium", isSelected ? "" : "text-muted-foreground")}>
                  {t(`todo.taskTypes.${type.id}`)}
                </span>
                <span className="text-[10px] text-muted-foreground/70">{t(`todo.taskTypeHints.${type.id}`)}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Priority / Difficulty */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">{t("todo.create.difficulty")}</Label>
        <div className="flex gap-2">
          {priorities.map((p) => {
            const isSelected = priority === p.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPriority(p.id as TodoPriority)}
                className={cn(
                  "flex-1 py-3 rounded-xl border font-medium transition-all",
                  isSelected
                    ? p.color + " ring-1 ring-current"
                    : "border-border/50 bg-card/30 text-muted-foreground hover:bg-card/50",
                )}
              >
                {t(`todo.difficulty.${p.id}`)}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Deadline - conditionally shown */}
      {showDeadline && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            {taskType === "deadline" ? t("todo.create.dueDate") : t("todo.create.deadline")}
            {isDeadlineRequired && <span className="text-destructive">*</span>}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className={cn(
                  "w-full justify-start text-left font-normal bg-card/50 border-border/50 rounded-xl h-12",
                  !deadline && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "PPP", { locale: dateLocale }) : t("todo.create.pickDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border" align="start">
              <CalendarComponent
                mode="single"
                selected={deadline}
                onSelect={setDeadline}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="pointer-events-auto"
              />
              {deadline && !isDeadlineRequired && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setDeadline(undefined)}
                    className="w-full text-muted-foreground"
                  >
                    {t("todo.create.clearDate")}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Time - for rendezvous only */}
      {showTime && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t("todo.create.appointmentTime")}</Label>
          <Input
            type="time"
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            className="h-12 rounded-xl bg-card/50 border-border/50"
          />
        </div>
      )}

      {/* Location - for rendezvous only */}
      {showLocation && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {t("todo.create.location")}
          </Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("todo.create.locationPlaceholder")}
            className="h-12 rounded-xl bg-card/50 border-border/50"
            maxLength={200}
          />
        </div>
      )}

      {/* Reminder settings - for waiting only */}
      {showReminder && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <Label htmlFor="reminder-toggle" className="text-sm font-medium cursor-pointer">
                {t("todo.create.reminderEnabled")}
              </Label>
            </div>
            <Switch id="reminder-toggle" checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
          </div>
          <p className="text-xs text-muted-foreground">{t("todo.create.reminderHint")}</p>

          {reminderEnabled && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2">
              <Label className="text-sm text-muted-foreground">{t("todo.create.reminderFrequency")}</Label>
              <Select value={reminderFrequency} onValueChange={(v) => setReminderFrequency(v as ReminderFrequency)}>
                <SelectTrigger className="h-10 rounded-xl bg-card/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderFrequencies.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {t(`todo.create.frequencies.${freq}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Urgent checkbox */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5"
      >
        <Checkbox
          id="urgent"
          checked={isUrgent}
          onCheckedChange={(checked) => setIsUrgent(checked === true)}
          className="border-red-400/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
        />
        <Label htmlFor="urgent" className="text-sm text-foreground cursor-pointer select-none flex-1">
          <span className="font-medium">{t("todo.create.markUrgent")}</span>
          <p className="text-xs text-muted-foreground mt-0.5">{t("todo.create.urgentHint")}</p>
        </Label>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 sticky bottom-0 bg-gradient-to-t from-card via-card to-transparent pb-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="text-muted-foreground rounded-xl"
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || isLoading || (isDeadlineRequired && !deadline)}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0 rounded-xl px-6"
        >
          {isLoading ? t("todo.create.creating") : t("todo.create.createQuest")}
        </Button>
      </div>
    </form>
  );
}
