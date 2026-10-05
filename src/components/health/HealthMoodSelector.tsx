import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface HealthMoodSelectorProps {
  value: number;
  onChange: (value: number) => void;
  journal?: string;
  onJournalChange?: (value: string) => void;
  showJournal?: boolean;
}

const MOOD_OPTIONS = [
  { value: 1, emoji: "😔", label: "health.mood.veryLow", color: "bg-destructive/20 border-destructive text-destructive" },
  { value: 2, emoji: "😕", label: "health.mood.low", color: "bg-hud-amber/20 border-hud-amber text-hud-amber" },
  { value: 3, emoji: "😐", label: "health.mood.neutral", color: "bg-yellow-500/20 border-yellow-500 text-yellow-500" },
  { value: 4, emoji: "🙂", label: "health.mood.good", color: "bg-hud-phosphor/20 border-hud-phosphor text-hud-phosphor" },
  { value: 5, emoji: "😊", label: "health.mood.great", color: "bg-cyan-500/20 border-cyan-500 text-cyan-500" },
];

export function HealthMoodSelector({ value, onChange, journal = "", onJournalChange, showJournal = true }: HealthMoodSelectorProps) {
  const { t } = useTranslation();
  const [journalExpanded, setJournalExpanded] = useState(!!journal);
  const selectedMood = MOOD_OPTIONS.find(m => m.value === value);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm text-muted-foreground mb-4 block font-mono">{t("health.mood.howAreYouFeeling")}</Label>
        <div className="flex gap-3 justify-center">
          {MOOD_OPTIONS.map((mood) => (
            <motion.button
              key={mood.value}
              onClick={() => onChange(mood.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 border-2 transition-all min-w-[70px]",
                value === mood.value ? mood.color : "border-border hover:border-primary/30 bg-card/50"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span className="text-3xl"
                animate={value === mood.value ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}>
                {mood.emoji}
              </motion.span>
              <span className={cn("text-xs font-mono uppercase tracking-wider", value === mood.value ? "opacity-100" : "opacity-60")}>
                {t(mood.label)}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {selectedMood && (
          <motion.div key={selectedMood.value} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="text-center">
            <p className="text-sm text-muted-foreground font-mono">{t(`health.mood.feedback.${selectedMood.value}`)}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showJournal && onJournalChange && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setJournalExpanded(!journalExpanded)}
            className="w-full justify-between text-muted-foreground hover:text-foreground font-mono">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {t("health.mood.addNote")}
            </span>
            {journalExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <AnimatePresence>
            {journalExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }} className="overflow-hidden">
                <Textarea value={journal} onChange={(e) => onJournalChange(e.target.value)}
                  placeholder={t("health.mood.journalPlaceholder")} className="min-h-[100px] bg-muted/30 resize-none font-mono" />
                <p className="text-xs text-muted-foreground/50 mt-2 font-mono">{t("health.mood.journalHint")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
