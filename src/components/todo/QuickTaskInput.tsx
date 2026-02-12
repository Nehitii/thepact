import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CornerDownLeft } from 'lucide-react';
import { TodoPriority, CreateTaskInput, TodoTaskType } from '@/hooks/useTodoList';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { addDays } from 'date-fns';

interface QuickTaskInputProps {
  onSubmit: (input: CreateTaskInput & { category: string; task_type: TodoTaskType }) => void;
  isLoading: boolean;
  disabled: boolean;
}

// Regex patterns for inline commands
const PRIORITY_REGEX = /!(high|med|low)\b/gi;
const CATEGORY_REGEX = /#(\w+)\b/g;
const DEADLINE_REGEX = /@(today|tomorrow|nextweek)\b/gi;

const VALID_CATEGORIES = ['work', 'health', 'personal', 'study', 'admin', 'general'];

function parseCommand(raw: string): {
  name: string;
  priority: TodoPriority;
  category: string;
  deadline: string | null;
  task_type: TodoTaskType;
} {
  let priority: TodoPriority = 'medium';
  let category = 'general';
  let deadline: string | null = null;
  let task_type: TodoTaskType = 'flexible';

  // Parse priority
  const prioMatch = raw.match(PRIORITY_REGEX);
  if (prioMatch) {
    const p = prioMatch[0].slice(1).toLowerCase();
    if (p === 'high') priority = 'high';
    else if (p === 'low') priority = 'low';
    else priority = 'medium';
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
    if (d === 'today') {
      deadline = now.toISOString();
      task_type = 'deadline';
    } else if (d === 'tomorrow') {
      deadline = addDays(now, 1).toISOString();
      task_type = 'deadline';
    } else if (d === 'nextweek') {
      deadline = addDays(now, 7).toISOString();
      task_type = 'deadline';
    }
  }

  // Strip all commands from the name
  const name = raw
    .replace(PRIORITY_REGEX, '')
    .replace(CATEGORY_REGEX, '')
    .replace(DEADLINE_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { name, priority, category, deadline, task_type };
}

/** Highlight inline commands in the input for the shadow overlay */
function highlightedParts(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const combinedRegex = /(!(?:high|med|low)|#\w+|@(?:today|tomorrow|nextweek))/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex} className="text-transparent">{text.slice(lastIndex, match.index)}</span>);
    }
    const token = match[0];
    let color = 'text-primary';
    if (token.startsWith('!')) color = 'text-amber-400';
    else if (token.startsWith('#')) color = 'text-emerald-400';
    else if (token.startsWith('@')) color = 'text-purple-400';

    parts.push(
      <span key={match.index} className={cn(color, 'font-bold')}>
        {token}
      </span>
    );
    lastIndex = combinedRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex} className="text-transparent">{text.slice(lastIndex)}</span>);
  }
  return parts;
}

export function QuickTaskInput({ onSubmit, isLoading, disabled }: QuickTaskInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseCommand(value), [value]);

  const handleSubmit = useCallback(() => {
    if (!parsed.name || isLoading || disabled) return;
    onSubmit({
      name: parsed.name,
      priority: parsed.priority,
      is_urgent: parsed.priority === 'high',
      category: parsed.category,
      task_type: parsed.task_type,
      deadline: parsed.deadline,
    });
    setValue('');
  }, [parsed, isLoading, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasCommands = PRIORITY_REGEX.test(value) || CATEGORY_REGEX.test(value) || DEADLINE_REGEX.test(value);
  // Reset regex lastIndex
  PRIORITY_REGEX.lastIndex = 0;
  CATEGORY_REGEX.lastIndex = 0;
  DEADLINE_REGEX.lastIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
        "bg-[hsl(210_80%_6%/0.9)] backdrop-blur-md",
        "border-primary/30 hover:border-primary/50",
        "focus-within:border-primary focus-within:shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {/* Terminal prompt icon */}
        <Terminal className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-primary font-mono text-sm flex-shrink-0 select-none">{'>'}</span>

        {/* Shadow overlay for syntax highlighting */}
        <div className="absolute left-[4.5rem] right-12 top-0 bottom-0 flex items-center pointer-events-none overflow-hidden font-mono text-sm whitespace-pre">
          {hasCommands && highlightedParts(value)}
        </div>

        {/* Actual input */}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={t('todo.neuralInput.placeholder', { defaultValue: 'Type task... !high #work @today' })}
          className={cn(
            "flex-1 bg-transparent outline-none font-mono text-sm",
            "text-foreground placeholder:text-muted-foreground/50",
            "caret-primary",
            hasCommands && "text-foreground/80"
          )}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Submit hint */}
        <AnimatePresence>
          {value.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleSubmit}
              disabled={!parsed.name || isLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/30 transition-colors flex-shrink-0"
            >
              <CornerDownLeft className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Parsed preview tags */}
      <AnimatePresence>
        {value.trim() && hasCommands && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mt-2 ml-1 flex-wrap"
          >
            {parsed.priority !== 'medium' && (
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border",
                parsed.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              )}>
                {parsed.priority}
              </span>
            )}
            {parsed.category !== 'general' && (
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
