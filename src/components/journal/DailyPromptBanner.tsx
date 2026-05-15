import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyJournalPrompt } from "@/hooks/useJournalPrompt";

interface Props {
  onUse?: (prompt: string) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  reflection: "RFL",
  gratitude: "GRT",
  cbt: "CBT",
  visualization: "VIZ",
  stoic: "STO",
};

/**
 * Rotating daily prompt banner displayed at the top of the Journal feed.
 * Hidden after dismissal for the current day (localStorage flag).
 */
export function DailyPromptBanner({ onUse }: Props) {
  const { user } = useAuth();
  const { data: prompt, isLoading } = useDailyJournalPrompt(user?.id);
  const dayKey = new Date().toDateString();
  const storageKey = `journal-prompt-dismissed-${dayKey}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  if (isLoading || !prompt || dismissed) return null;

  const tag = CATEGORY_LABEL[prompt.category] ?? "PRP";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-3 border border-primary/30 bg-primary/5 px-4 py-3"
      style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
      role="region"
      aria-label="Daily journal prompt"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-primary/70">
              PROMPT_DU_JOUR
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 border border-primary/30 text-primary/80">
              {tag}
            </span>
          </div>
          <p className="text-sm text-foreground leading-snug">{prompt.prompt}</p>
          {onUse && (
            <button
              onClick={() => onUse(prompt.prompt)}
              className="mt-2 text-[10px] font-mono uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
            >
              {">> UTILISER"}
            </button>
          )}
        </div>
        <button
          onClick={() => {
            localStorage.setItem(storageKey, "1");
            setDismissed(true);
          }}
          aria-label="Dismiss prompt"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}