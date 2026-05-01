import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentWeekReview, useWeeklyReviews, useGenerateWeeklyReview, useSaveWeeklyReflection, WeeklyReview } from "@/hooks/useWeeklyReview";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Target,
  Heart,
  Wallet,
  BookOpen,
  ListTodo,
  Sparkles,
  Star,
  Loader2,
  ChevronDown,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface WeeklyReviewModalProps {
  open: boolean;
  onClose: () => void;
}

export function WeeklyReviewModal({ open, onClose }: WeeklyReviewModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { data: currentReview } = useCurrentWeekReview();
  const { data: pastReviews = [] } = useWeeklyReviews();
  const generateReview = useGenerateWeeklyReview();
  const saveReflection = useSaveWeeklyReflection();

  const [reflectionNote, setReflectionNote] = useState(currentReview?.reflection_note || "");
  const [weekRating, setWeekRating] = useState(currentReview?.week_rating || 0);
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerate = async () => {
    try {
      await generateReview.mutateAsync();
      toast({ title: "Weekly review generated!", description: "Your week has been analyzed." });
    } catch (e: any) {
      toast.error({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveReflection = async () => {
    if (!currentReview) return;
    try {
      await saveReflection.mutateAsync({
        reviewId: currentReview.id,
        reflection_note: reflectionNote,
        week_rating: weekRating,
      });
      toast({ title: "Reflection saved" });
    } catch (e: any) {
      toast.error({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const stats = currentReview
    ? [
        { icon: Target, label: "Goals progressed", value: currentReview.goals_progressed, color: "text-blue-400" },
        { icon: ListTodo, label: "Steps completed", value: currentReview.steps_completed, color: "text-emerald-400" },
        { icon: Heart, label: "Health score", value: currentReview.health_avg_score ? `${currentReview.health_avg_score}/10` : "N/A", color: "text-red-400" },
        { icon: Wallet, label: "Finance net", value: currentReview.finance_net != null ? formatCurrency(currentReview.finance_net, currency) : "N/A", color: "text-yellow-400" },
        { icon: BookOpen, label: "Journal entries", value: currentReview.journal_entries_count, color: "text-purple-400" },
        { icon: ListTodo, label: "Tasks done", value: currentReview.todo_completed, color: "text-cyan-400" },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 bg-card border-white/10 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="flex items-center gap-3 text-lg font-orbitron tracking-wider">
            <CalendarDays className="h-5 w-5 text-primary" />
            Weekly Review
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-rajdhani">
            Reflect on your week and plan ahead
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-6">
            {/* Generate button */}
            {!currentReview && (
              <div className="text-center py-8">
                <Brain className="h-16 w-16 mx-auto text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-4">Generate your weekly summary with AI insights</p>
                <Button
                  onClick={handleGenerate}
                  disabled={generateReview.isPending}
                  className="bg-primary hover:bg-primary/80"
                >
                  {generateReview.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Review
                </Button>
              </div>
            )}

            {/* Current week stats */}
            {currentReview && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="p-3 rounded-xl bg-background/50 border border-white/5 text-center"
                    >
                      <stat.icon className={cn("h-4 w-4 mx-auto mb-1", stat.color)} />
                      <p className="text-lg font-bold font-orbitron text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* AI Insights */}
                {currentReview.ai_insights && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold font-orbitron text-primary uppercase tracking-wider">AI Insights</h3>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                      {currentReview.ai_insights}
                    </p>
                  </div>
                )}

                {/* Refresh button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generateReview.isPending}
                  className="w-full border-white/10"
                >
                  {generateReview.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                  )}
                  Refresh Summary
                </Button>

                {/* Week Rating */}
                <div>
                  <h3 className="text-sm font-bold mb-2 text-foreground">Rate your week</h3>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setWeekRating(rating)}
                        className={cn(
                          "w-10 h-10 rounded-lg border transition-all",
                          rating <= weekRating
                            ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500"
                            : "bg-background/50 border-white/10 text-muted-foreground hover:border-white/20"
                        )}
                      >
                        <Star className={cn("h-5 w-5 mx-auto", rating <= weekRating && "fill-current")} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reflection note */}
                <div>
                  <h3 className="text-sm font-bold mb-2 text-foreground">Your reflection</h3>
                  <Textarea
                    value={reflectionNote}
                    onChange={(e) => setReflectionNote(e.target.value)}
                    placeholder="What went well? What could be better? What are you grateful for?"
                    className="min-h-[100px] bg-background/50 border-white/10 resize-none"
                    maxLength={1000}
                  />
                  <Button
                    onClick={handleSaveReflection}
                    disabled={saveReflection.isPending}
                    size="sm"
                    className="mt-2"
                  >
                    Save Reflection
                  </Button>
                </div>
              </>
            )}

            {/* History toggle */}
            {pastReviews.length > 1 && (
              <div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showHistory && "rotate-180")} />
                  Past Reviews ({pastReviews.length - (currentReview ? 1 : 0)})
                </button>
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-2"
                    >
                      {pastReviews
                        .filter((r) => r.id !== currentReview?.id)
                        .map((review) => (
                          <div
                            key={review.id}
                            className="p-3 rounded-lg border border-white/5 bg-background/30 text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-foreground">
                                {format(new Date(review.week_start), "MMM d")} – {format(new Date(review.week_end), "MMM d")}
                              </span>
                              {review.week_rating && (
                                <div className="flex">
                                  {Array.from({ length: review.week_rating }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>{review.goals_progressed} goals</span>
                              <span>{review.steps_completed} steps</span>
                              <span>{review.todo_completed} tasks</span>
                            </div>
                          </div>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
