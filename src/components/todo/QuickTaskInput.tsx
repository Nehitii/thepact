import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, CornerDownLeft } from "lucide-react";
import { TodoPriority, CreateTaskInput, TodoTaskType } from "@/hooks/useTodoList";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { addDays } from "date-fns";

interface QuickTaskInputProps {
  onSubmit: (input: CreateTaskInput & { category: string; task_type: TodoTaskType }) => void;
  isLoading: boolean;
  disabled: boolean;
}

// Regex patterns for inline commands
const PRIORITY_REGEX = /!(high|med|low)\b/gi;
const CATEGORY_REGEX = /#(\w+)\b/g;
const DEADLINE_REGEX = /@(today|tomorrow|nextweek)\b/gi;

const VALID_CATEGORIES = ["work", "health", "personal", "study", "admin", "general"];

function parseCommand(raw: string) {
  let priority: TodoPriority = "medium";
  let category = "general";
  let deadline: string | null = null;
  let task_type: TodoTaskType = "flexible";

  // Parse priority
  const prioMatch = raw.match(PRIORITY_REGEX);
  if (prioMatch) {
    const p = prioMatch[0].slice(1).toLowerCase();
    if (p === "high") priority = "high";
    else if (p === "low") priority = "low";
    else priority = "medium";
  }

  // Parse category
  const catMatch = raw.match(CATEGORY_REGEX);
  if (catMatch) {
    const c = catMatch[0].slice(1).toLowerCase();
    if (VALID_CATEGORIES.includes(c)) category = c;
  }

  // Parse deadline
  const deadMatch = raw.match(DEADLINE_REGEX);
  if (deadMatch) {
    const d = deadMatch[0].slice(1).toLowerCase();
    const now = new Date();
    if (d === "today") {
      deadline = now.toISOString();
      task_type = "deadline";
    } else if (d === "tomorrow") {
      deadline = addDays(now, 1).toISOString();
      task_type = "deadline";
    } else if (d === "nextweek") {
      deadline = addDays(now, 7).toISOString();
      task_type = "deadline";
    }
  }

  // Strip all commands from the name
  const name = raw
    .replace(PRIORITY_REGEX, "")
    .replace(CATEGORY_REGEX, "")
    .replace(DEADLINE_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();

  return { name, priority, category, deadline, task_type };
}

/** * Highlight inline commands.
 * CORRECTION : Affiche tout le texte (normal + coloré) pour gérer l'affichage complet
 * puisque l'input réel sera transparent.
 */
function highlightedParts(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const combinedRegex = /(!(?:high|med|low)|#\w+|@(?:today|tomorrow|nextweek))/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Texte normal avant le match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`} className="text-foreground">
          {text.slice(lastIndex, match.index)}
        </span>,
      );
    }

    // Le token (mot clé) coloré
    const token = match[0];
    let color = "text-primary";
    if (token.startsWith("!")) color = "text-amber-400";
    else if (token.startsWith("#")) color = "text-emerald-400";
    else if (token.startsWith("@")) color = "text-purple-400";

    parts.push(
      <span key={`token-${match.index}`} className={cn(color, "font-bold")}>
        {token}
      </span>,
    );
    lastIndex = combinedRegex.lastIndex;
  }

  // Reste du texte normal à la fin
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="text-foreground">
        {text.slice(lastIndex)}
      </span>,
    );
  }
  return parts;
}

export function QuickTaskInput({ onSubmit, isLoading, disabled }: QuickTaskInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseCommand(value), [value]);

  const handleSubmit = useCallback(() => {
    if (!parsed.name || isLoading || disabled) return;
    onSubmit({
      name: parsed.name,
      priority: parsed.priority,
      is_urgent: parsed.priority === "high",
      category: parsed.category,
      task_type: parsed.task_type,
      deadline: parsed.deadline,
    });
    setValue("");
  }, [parsed, isLoading, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // On vérifie s'il y a des commandes pour afficher l'overlay complet ou juste le placeholder
  const hasCommands = PRIORITY_REGEX.test(value) || CATEGORY_REGEX.test(value) || DEADLINE_REGEX.test(value);

  // Reset regex lastIndex (sécurité)
  PRIORITY_REGEX.lastIndex = 0;
  CATEGORY_REGEX.lastIndex = 0;
  DEADLINE_REGEX.lastIndex = 0;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
      <div
        className={cn(
          "relative flex items-center rounded-xl border transition-all duration-300 overflow-hidden",
          "bg-[hsl(210_80%_6%/0.9)] backdrop-blur-md",
          "border-primary/30 hover:border-primary/50",
          "focus-within:border-primary focus-within:shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* CORRECTION 1 : Une seule décoration (Terminal Icon), positionnée en absolu pour ne pas gêner le flux */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
          <Terminal className="w-4 h-4 text-primary" />
        </div>

        {/* Container principal pour l'input et l'overlay */}
        <div className="relative flex-1 h-full py-3">
          {/* CORRECTION 2 : Shadow overlay (Surbrillance) */}
          {/* Positionné en absolute inset-0 avec le MÊME padding que l'input */}
          <div
            className="absolute inset-0 pl-12 pr-12 flex items-center pointer-events-none font-mono text-sm whitespace-pre overflow-hidden"
            aria-hidden="true"
          >
            {/* On affiche le texte coloré ici. Si l'input est vide, on n'affiche rien ici. */}
            {value ? highlightedParts(value) : null}
          </div>

          {/* CORRECTION 3 : L'Input Réel */}
          {/* text-transparent : pour cacher le texte noir doublé */}
          {/* caret-primary : pour garder le curseur visible */}
          {/* pl-12 : padding-left suffisant pour éviter l'icône Terminal */}
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={t("todo.neuralInput.placeholder", { defaultValue: "Type task... !high #work @today" })}
            className={cn(
              "w-full bg-transparent outline-none font-mono text-sm",
              "pl-12 pr-12", // Padding identique à l'overlay
              "placeholder:text-muted-foreground/50",
              "caret-primary", // Curseur visible
              "text-transparent", // Texte invisible (car géré par l'overlay)
              "z-10 relative",
            )}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Submit hint */}
        <AnimatePresence>
          {value.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleSubmit}
              disabled={!parsed.name || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/30 transition-colors z-30"
            >
              <CornerDownLeft className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Parsed preview tags (reste inchangé) */}
      <AnimatePresence>
        {value.trim() && hasCommands && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mt-2 ml-1 flex-wrap"
          >
            {parsed.priority !== "medium" && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border",
                  parsed.priority === "high"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                )}
              >
                {parsed.priority}
              </span>
            )}
            {parsed.category !== "general" && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                #{parsed.category}
              </span>
            )}
            {parsed.deadline && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                @deadline
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
