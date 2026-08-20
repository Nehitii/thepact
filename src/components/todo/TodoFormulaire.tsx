import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Briefcase, Heart, User, BookOpen, Cog, Tag,
  Sparkles, Hourglass, CalendarClock, Clock,
  MapPin, Bell, Calendar as CalendarIcon, Check,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import type { TodoPriority, TodoTask, TodoTaskType, ReminderFrequency } from "@/hooks/useTodoList";
import { Calendar as CalendrierChoix } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ValeursTache } from "./valeursTache";

/* LE TERMINAL DE SAISIE
 *
 * Le formulaire etait reste en shadcn au milieu d une console :
 * coins arrondis, six pastilles de couleurs franches qui ne voulaient
 * rien dire ensemble, un bouton en degrade. Et il existait DEUX fois,
 * a la virgule pres — creation et edition — avec ses libelles anglais
 * en dur dans la seconde copie.
 *
 * C est maintenant un seul terminal, en sections numerotees. La teinte
 * du formulaire entier suit la PRIORITE choisie, et bascule au rouge
 * des qu on marque la tache critique : la machine repond a ce qu on
 * lui dit. L entree se fait en cascade, et tout s arrete sous
 * « prefers-reduced-motion ».
 */


interface TodoFormulaireProps {
  tache?: TodoTask;
  onValider: (v: ValeursTache) => void;
  onAnnuler: () => void;
  isLoading: boolean;
  corpsRef?: (node: HTMLDivElement | null) => void;
  entier?: boolean;
}

const CATEGORIES = [
  { id: "work", icone: Briefcase, c: "#3b82f6" },
  { id: "health", icone: Heart, c: "#ff4d5e" },
  { id: "personal", icone: User, c: "#a855f7" },
  { id: "study", icone: BookOpen, c: "#10b981" },
  { id: "admin", icone: Cog, c: "#94a3b8" },
  { id: "general", icone: Tag, c: "#7dd3fc" },
] as const;

const TYPES: { id: TodoTaskType; icone: typeof Sparkles; c: string }[] = [
  { id: "flexible", icone: Sparkles, c: "#22d3ee" },
  { id: "waiting", icone: Hourglass, c: "#f59e0b" },
  { id: "rendezvous", icone: CalendarClock, c: "#a855f7" },
  { id: "deadline", icone: Clock, c: "#ff4d5e" },
];

const PRIORITES: { id: TodoPriority; c: string; part: string }[] = [
  { id: "low", c: "#10b981", part: "33%" },
  { id: "medium", c: "#3b82f6", part: "66%" },
  { id: "high", c: "#f59e0b", part: "100%" },
];

const FREQUENCES: ReminderFrequency[] = ["weekly", "monthly", "bimonthly", "semiannual", "yearly"];

const MAX_NOM = 100;


/* Definie hors du composant : une fonction-composant creee pendant le
   rendu change de type a chaque passe, et React remonte alors tous ses
   enfants — le champ du nom aurait perdu le focus a chaque frappe. */
function Section({ n, titre, requis, variants, bouge, children }: {
  n: string; titre: string; requis?: boolean; bouge?: boolean;
  variants?: Variants; children: React.ReactNode;
}) {
  return (
    /* Les voisines glissent quand un volet apparait — sauf si le
       systeme demande le calme. */
    <motion.div variants={variants} layout={bouge ? "position" : false}>
      <p className="tsk-f-tete">
        <b>{n}</b>
        {titre}
        {requis && <em aria-hidden="true">*</em>}
        <i />
      </p>
      {children}
    </motion.div>
  );
}

export function TodoFormulaire({
  tache, onValider, onAnnuler, isLoading, corpsRef, entier,
}: TodoFormulaireProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const edition = !!tache;
  const immobile = useReducedMotion();

  const [name, setName] = useState(tache?.name ?? "");
  const [deadline, setDeadline] = useState<Date | undefined>(tache?.deadline ? new Date(tache.deadline) : undefined);
  const [appointmentTime, setAppointmentTime] = useState(tache?.appointment_time ?? "");
  const [priority, setPriority] = useState<TodoPriority>(tache?.priority ?? "medium");
  const [category, setCategory] = useState(tache?.category ?? "general");
  const [taskType, setTaskType] = useState<TodoTaskType>((tache?.task_type as TodoTaskType) ?? "flexible");
  const [isUrgent, setIsUrgent] = useState(tache?.is_urgent ?? false);
  const [location, setLocation] = useState(tache?.location ?? "");
  const [reminderEnabled, setReminderEnabled] = useState(tache?.reminder_enabled ?? false);
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>(tache?.reminder_frequency ?? "weekly");

  /* Une tache souple n a ni date ni heure : les garder en memoire
     enverrait une echeance que le formulaire n affiche plus. */
  useEffect(() => {
    if (taskType === "flexible") { setDeadline(undefined); setAppointmentTime(""); }
  }, [taskType]);

  const dateRequise = taskType === "deadline" || taskType === "rendezvous";
  const montreDate = taskType !== "flexible";
  const montreLieu = taskType === "rendezvous";
  const montreRappel = taskType === "waiting";

  /* Un bouton eteint doit dire POURQUOI il l est. */
  const manque = !name.trim()
    ? t("todo.create.missingName")
    : dateRequise && !deadline
      ? t("todo.create.missingDate")
      : null;

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (manque || isLoading) return;
    onValider({
      name: name.trim(), deadline, appointmentTime, priority, category,
      taskType, isUrgent, location, reminderEnabled, reminderFrequency,
    });
  };

  const cascade: Variants = immobile
    ? {}
    : { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } } };
  const bloc: Variants = immobile
    ? {}
    : {
      hidden: { opacity: 0, y: 12 },
      visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 34, mass: 0.7 } },
    };

  const teinteDeLaPriorite = PRIORITES.find((p) => p.id === priority)?.c;

  return (
    <form onSubmit={envoyer} className="tsk-f-cadre">
      <div ref={corpsRef} className={cn("tsk-f-corps", entier && "est-entier")}>
        <motion.div
          className="tsk-f"
          data-prio={priority}
          data-urgent={isUrgent}
          variants={cascade}
          initial={immobile ? false : "hidden"}
          animate="visible"
        >
          {/* 01 — la designation */}
          <Section variants={bloc} bouge={!immobile} n="01" titre={t("todo.create.questName")} requis>
            <div className="tsk-f-nom">
              <span className="tsk-f-sigle" aria-hidden="true">&gt;</span>
              <input
                id="tsk-nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("todo.create.questPlaceholder")}
                maxLength={MAX_NOM}
                autoComplete="off"
                autoFocus
                aria-label={t("todo.create.questName")}
              />
              <span className={cn("tsk-f-cpt", name.length > MAX_NOM - 15 && "est-proche")} aria-hidden="true">
                {String(name.length).padStart(3, "0")}/{MAX_NOM}
              </span>
            </div>
          </Section>

          {/* 02 — l affectation */}
          <Section variants={bloc} bouge={!immobile} n="02" titre={t("todo.create.category")}>
            <div className="tsk-f-grille est-3" role="group" aria-label={t("todo.create.category")}>
              {CATEGORIES.map(({ id, icone: Icone, c }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={category === id}
                  onClick={() => setCategory(id)}
                  className="tsk-f-chip"
                  style={{ ["--tsk-c" as string]: c } as React.CSSProperties}
                >
                  <Icone className="w-4 h-4 tsk-f-chip-i" aria-hidden="true" />
                  {t(`todo.categories.${id}`)}
                </button>
              ))}
            </div>
          </Section>

          {/* 03 — la nature */}
          <Section variants={bloc} bouge={!immobile} n="03" titre={t("todo.create.taskType")}>
            <div className="tsk-f-grille est-2" role="group" aria-label={t("todo.create.taskType")}>
              {TYPES.map(({ id, icone: Icone, c }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={taskType === id}
                  onClick={() => setTaskType(id)}
                  className="tsk-f-chip"
                  style={{ ["--tsk-c" as string]: c } as React.CSSProperties}
                >
                  <Icone className="w-4 h-4 tsk-f-chip-i" aria-hidden="true" />
                  <span className="min-w-0">
                    {t(`todo.taskTypes.${id}`)}
                    <small>{t(`todo.taskTypeHints.${id}`)}</small>
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* 04 — la priorite, qui donne sa couleur au reste */}
          <Section variants={bloc} bouge={!immobile} n="04" titre={t("todo.create.difficulty")}>
            <div className="tsk-f-cadran" role="group" aria-label={t("todo.create.difficulty")}>
              {PRIORITES.map(({ id, c, part }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={priority === id}
                  onClick={() => setPriority(id)}
                  className="tsk-f-cran"
                  style={{ ["--tsk-c" as string]: c, ["--tsk-part" as string]: part } as React.CSSProperties}
                >
                  {t(`todo.difficulty.${id}`)}
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
          </Section>

          {/* 05 — l echeance, seulement quand la nature l appelle */}
          {montreDate && (
            <motion.div
              className="tsk-f-volet"
              layout={immobile ? false : "position"}
              initial={immobile ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
                <p className="tsk-f-tete">
                  <b>05</b>
                  {taskType === "deadline" ? t("todo.create.dueDate") : t("todo.create.deadline")}
                  {dateRequise && <em aria-hidden="true">*</em>}
                  <i />
                </p>
                <div className="flex flex-col gap-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className={cn("tsk-f-ligne", !deadline && "est-vide")}>
                        <CalendarIcon className="w-4 h-4" aria-hidden="true" />
                        {deadline ? format(deadline, "PPP", { locale }) : t("todo.create.pickDate")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="tsk tsk-dater w-auto p-0 rounded-none">
                      <CalendrierChoix
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                        disabled={edition ? undefined : (d: Date) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="pointer-events-auto"
                      />
                      {deadline && !dateRequise && (
                        <div className="p-2 border-t border-[hsl(var(--ds-border-default)/0.2)]">
                          <button type="button" onClick={() => setDeadline(undefined)} className="tsk-outil w-full">
                            {t("todo.create.clearDate")}
                          </button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  {montreLieu && (
                    <>
                      <label className="tsk-f-ligne">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">{t("todo.create.appointmentTime")}</span>
                        <input
                          type="time"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          aria-label={t("todo.create.appointmentTime")}
                        />
                      </label>
                      <label className="tsk-f-ligne">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        <input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={t("todo.create.locationPlaceholder")}
                          maxLength={200}
                          aria-label={t("todo.create.location")}
                        />
                      </label>
                    </>
                  )}
                </div>
            </motion.div>
          )}

          {/* 06 — le rappel, pour ce qu on attend de quelqu un d autre */}
          {montreRappel && (
            <motion.div
              className="tsk-f-volet"
              layout={immobile ? false : "position"}
              initial={immobile ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
                <p className="tsk-f-tete"><b>06</b>{t("todo.create.reminder")}<i /></p>
                <div className="tsk-f-encart" style={{ ["--tsk-c" as string]: "#f59e0b" } as React.CSSProperties}>
                  <div className="tsk-f-bascule">
                    <label htmlFor="tsk-rappel" className="flex items-center gap-2 text-[hsl(var(--ds-text-primary))]">
                      <Bell className="w-4 h-4 text-[#f59e0b]" aria-hidden="true" />
                      {t("todo.create.reminderEnabled")}
                    </label>
                    <Switch id="tsk-rappel" checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
                  </div>
                  <p className="tsk-f-note">{t("todo.create.reminderHint")}</p>

                  {reminderEnabled && (
                    <div className="mt-3">
                      <Select value={reminderFrequency} onValueChange={(v) => setReminderFrequency(v as ReminderFrequency)}>
                        <SelectTrigger className="tsk-f-ligne" aria-label={t("todo.create.reminderFrequency")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="tsk rounded-none bg-[hsl(var(--ds-surface-1))] border-[hsl(var(--ds-border-default)/0.22)]">
                          {FREQUENCES.map((f) => (
                            <SelectItem key={f} value={f} className="font-mono text-xs">
                              {t(`todo.create.frequencies.${f}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
            </motion.div>
          )}

          {/* 07 — le caractere critique */}
          <Section variants={bloc} bouge={!immobile} n="07" titre={t("todo.create.markUrgent")}>
            <button
              type="button"
              aria-pressed={isUrgent}
              onClick={() => setIsUrgent((v) => !v)}
              className="tsk-f-danger"
            >
              <span className="tsk-f-case" aria-hidden="true" />
              <span>
                <strong>{t("todo.create.markUrgent")}</strong>
                <span>{t("todo.create.urgentHint")}</span>
              </span>
            </button>
          </Section>
        </motion.div>
      </div>

      <div
        className="tsk-dlg-pied est-colonne"
        style={{ ["--tsk-f-teinte" as string]: isUrgent ? "var(--tsk-retard)" : teinteDeLaPriorite } as React.CSSProperties}
      >
        {manque && <span className="tsk-f-manque">{manque}</span>}
        <div className="flex items-center w-full" style={{ gap: 8 }}>
          <button type="button" onClick={onAnnuler} disabled={isLoading} className="tsk-outil">
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={!!manque || isLoading}
            className={cn("tsk-f-commit", isLoading && "est-en-cours")}
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            {isLoading
              ? (edition ? t("common.saving") : t("todo.create.creating"))
              : (edition ? t("common.saveChanges") : t("todo.create.createQuest"))}
          </button>
        </div>
      </div>
    </form>
  );
}
