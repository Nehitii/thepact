/**
 * ReviewRitualModal — generic step-by-step ritual modal for daily, monthly,
 * quarterly, and annual reviews. Weekly review keeps its own dedicated modal
 * because it integrates AI insights.
 */
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Sparkles, Star, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REVIEW_PROMPTS,
  ReviewType,
  useReviews,
  useReviewMutations,
} from "@/hooks/useReviews";

interface Props {
  open: boolean;
  onClose: () => void;
  type: ReviewType;
}

const TYPE_LABEL: Record<ReviewType, string> = {
  daily: "Daily Shutdown",
  weekly: "Weekly Review",
  monthly: "Monthly Review",
  quarterly: "Quarterly Reset",
  annual: "Annual Pact",
};

function periodFor(type: ReviewType): { start: string; end: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (type === "daily") return { start: iso(now), end: iso(now) };
  if (type === "weekly") {
    const day = (now.getDay() + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: iso(start), end: iso(end) };
  }
  if (type === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: iso(start), end: iso(end) };
  }
  if (type === "quarterly") {
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1);
    const end = new Date(now.getFullYear(), q * 3 + 3, 0);
    return { start: iso(start), end: iso(end) };
  }
  // annual
  return {
    start: `${now.getFullYear()}-01-01`,
    end: `${now.getFullYear()}-12-31`,
  };
}

export function ReviewRitualModal({ open, onClose, type }: Props) {
  const period = useMemo(() => periodFor(type), [type]);
  const { data: existing = [] } = useReviews({ type, limit: 5 });
  const { create, update, complete } = useReviewMutations();

  // Find or create an in-progress review for the current period
  const current = useMemo(
    () =>
      existing.find(
        (r) => r.period_start === period.start && r.status === "in_progress",
      ),
    [existing, period],
  );

  const prompts = REVIEW_PROMPTS[type];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mood, setMood] = useState<number | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Hydrate from existing
  useEffect(() => {
    if (!open) return;
    if (current) {
      setReviewId(current.id);
      setAnswers(current.answers ?? {});
      setMood(current.mood);
    } else {
      setReviewId(null);
      setAnswers({});
      setMood(null);
      setStep(0);
    }
  }, [open, current]);

  const ensureReview = async () => {
    if (reviewId) return reviewId;
    const r = await create.mutateAsync({
      type,
      period_start: period.start,
      period_end: period.end,
      prompts,
    });
    setReviewId(r.id);
    return r.id;
  };

  const persist = async (next: Record<string, string>, nextMood = mood) => {
    const id = await ensureReview();
    await update.mutateAsync({
      id,
      answers: next,
      mood: nextMood,
    });
  };

  const totalSteps = prompts.length + 1; // +1 for mood / wrap-up
  const isLast = step === totalSteps - 1;
  const isMoodStep = step === prompts.length;

  const handleNext = async () => {
    setBusy(true);
    try {
      if (!isMoodStep) {
        const promptKey = prompts[step].key;
        await persist({ ...answers, [promptKey]: answers[promptKey] ?? "" });
      } else {
        await persist(answers, mood);
      }
      if (isLast) {
        const id = await ensureReview();
        await complete.mutateAsync(id);
        onClose();
      } else {
        setStep((s) => s + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-card border-white/10 overflow-hidden isolate">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-white/10">
          <DialogTitle className="flex items-center gap-3 text-base font-orbitron tracking-wider">
            <CalendarDays className="h-5 w-5 text-primary" />
            {TYPE_LABEL[type]}
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-rajdhani">
            {period.start === period.end
              ? period.start
              : `${period.start} → ${period.end}`}
          </p>
          <Progress value={((step + 1) / totalSteps) * 100} className="mt-3 h-1" />
        </DialogHeader>

        <div className="px-6 py-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {!isMoodStep ? (
                <>
                  <h3 className="text-lg font-orbitron text-foreground mb-1">
                    {prompts[step].label}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 font-rajdhani">
                    Étape {step + 1} sur {totalSteps}
                  </p>
                  <Textarea
                    autoFocus
                    value={answers[prompts[step].key] ?? ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [prompts[step].key]: e.target.value }))
                    }
                    placeholder={prompts[step].placeholder ?? "Écris librement…"}
                    className="min-h-[160px] bg-background/50 border-white/10 resize-none"
                    maxLength={2000}
                  />
                </>
              ) : (
                <>
                  <h3 className="text-lg font-orbitron text-foreground mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Note ton {type === "daily" ? "jour" : type === "weekly" ? "semaine" : type === "monthly" ? "mois" : type === "quarterly" ? "trimestre" : "année"}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6 font-rajdhani">
                    Une intuition globale, sans réfléchir.
                  </p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setMood(n)}
                        aria-label={`Note ${n} sur 5`}
                        className={cn(
                          "w-12 h-12 rounded-lg border transition-all",
                          mood !== null && n <= mood
                            ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                            : "bg-background/40 border-white/10 text-muted-foreground hover:border-white/30",
                        )}
                      >
                        <Star className={cn("h-6 w-6 mx-auto", mood !== null && n <= mood && "fill-current")} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <Button
            variant="ghost"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Précédent
          </Button>
          <Button onClick={handleNext} disabled={busy} className="min-w-[120px]">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLast ? (
              <>
                <Check className="h-4 w-4 mr-2" /> Clôturer
              </>
            ) : (
              "Suivant"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}