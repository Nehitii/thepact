import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Check, X, Target, Tag, Zap, Calendar, DollarSign,
  Image, StickyNote, ListOrdered, Sparkles, Crown, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GOAL_TAGS, DIFFICULTY_OPTIONS, getTagLabel } from "@/lib/goalConstants";
import { GoalImageUpload } from "@/components/GoalImageUpload";
import { CostItemsEditor, type CostItemData } from "@/components/goals/CostItemsEditor";
import { EditStepsList, type EditStepItem } from "@/components/goals/EditStepsList";
import type { GoalDetailData } from "@/hooks/useGoalDetail";

interface Step {
  id: string;
  title: string;
  order: number;
  status: string;
  notes?: string | null;
}

interface GoalDetailEditOverlayProps {
  isOpen: boolean;
  goal: GoalDetailData;
  userId: string | undefined;
  steps: Step[];
  // Edit state
  editName: string; setEditName: (v: string) => void;
  editDifficulty: string; setEditDifficulty: (v: string) => void;
  editTags: string[]; toggleEditTag: (tag: string) => void;
  editNotes: string; setEditNotes: (v: string) => void;
  editStartDate: string; setEditStartDate: (v: string) => void;
  editCompletionDate: string; setEditCompletionDate: (v: string) => void;
  editDeadline: string; setEditDeadline: (v: string) => void;
  editImage: string; setEditImage: (v: string) => void;
  editStepItems: EditStepItem[];
  onStepItemsChange: (items: EditStepItem[]) => void;
  editCostItems: CostItemData[];
  setEditCostItems: (items: CostItemData[]) => void;
  // Custom difficulty
  customDifficultyActive: boolean;
  customDifficultyName: string;
  customDifficultyColor: string;
  // Callbacks
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  // Wishlist
  onAddToWishlist?: (item: CostItemData) => void;
}

export const GoalDetailEditOverlay = React.memo(function GoalDetailEditOverlay(props: GoalDetailEditOverlayProps) {
  const { t } = useTranslation();
  const {
    isOpen, goal, userId, steps,
    editName, setEditName, editDifficulty, setEditDifficulty,
    editTags, toggleEditTag, editNotes, setEditNotes,
    editStartDate, setEditStartDate, editCompletionDate, setEditCompletionDate,
    editDeadline, setEditDeadline, editImage, setEditImage,
    editStepItems, onStepItemsChange, editCostItems, setEditCostItems,
    customDifficultyActive, customDifficultyName, customDifficultyColor,
    saving, onSave, onClose, onAddToWishlist,
  } = props;

  const allDifficulties = [
    ...DIFFICULTY_OPTIONS,
    ...(customDifficultyActive
      ? [{ value: "custom" as const, label: customDifficultyName || "Custom", color: customDifficultyColor }]
      : []),
  ];

  const inputStyle = "bg-background/50 border-white/10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary/50";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-background overflow-hidden"
        >
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
          </div>
          <div className="fixed inset-0 pointer-events-none opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
          </div>

          <div className="relative z-10 h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-8">
              <motion.div className="space-y-6 mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Button variant="ghost" onClick={onClose} className="text-primary/70 hover:text-primary hover:bg-primary/10 -ml-2 rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" />Back to Goal
                </Button>
                <div className="text-center space-y-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_30px_rgba(91,180,255,0.6)] font-orbitron">Edit Goal</h1>
                  <p className="text-primary/60 tracking-wide font-rajdhani text-lg">Update your evolution</p>
                </div>
              </motion.div>

              <motion.div className="relative rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative p-8 md:p-10 space-y-10">

                  {/* Section 1: Basic Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                      <Target className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Basic Information</h2>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">Goal Name <span className="text-destructive">*</span></Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className={`h-12 text-base rounded-xl ${inputStyle}`} maxLength={100} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2"><Tag className="h-4 w-4" />Tags <span className="text-destructive">*</span></Label>
                      <div className="flex flex-wrap gap-2">
                        {GOAL_TAGS.map((tag) => {
                          const isSelected = editTags.includes(tag.value);
                          return (
                            <button key={tag.value} type="button" onClick={() => toggleEditTag(tag.value)} className={`relative px-4 py-2 rounded-xl font-rajdhani text-sm font-medium transition-all duration-200 ${isSelected ? "text-white shadow-lg" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"}`} style={isSelected ? { background: tag.color, boxShadow: `0 0 20px ${tag.color}40` } : {}}>
                              <span className="flex items-center gap-1.5">{isSelected && <Check className="h-3.5 w-3.5" />}{getTagLabel(tag.value, t)}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">Select your primary tag (first selected will be saved)</p>
                    </div>
                  </div>

                  {/* Section 2: Type & Difficulty */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                      <Zap className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Type & Difficulty</h2>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Goal Type</Label>
                      <div className="flex gap-3">
                        {[
                          { key: "normal", icon: ListOrdered, label: "Normal Goal", match: goal.goal_type === "normal" || (!goal.goal_type || (goal.goal_type !== "habit" && goal.goal_type !== "super")) },
                          { key: "habit", icon: Sparkles, label: "Habit Goal", match: goal.goal_type === "habit" },
                          { key: "super", icon: Crown, label: "Super Goal", match: goal.goal_type === "super" },
                        ].map(({ key, icon: Icon, label, match }) => (
                          <div key={key} className={`flex-1 p-4 rounded-xl border-2 text-center ${match ? (key === "super" ? "border-yellow-500 bg-yellow-500/10" : "border-primary bg-primary/10") : "border-border bg-muted/30"}`}>
                            <Icon className={`h-6 w-6 mx-auto mb-1.5 ${match ? (key === "super" ? "text-yellow-500" : "text-primary") : "text-muted-foreground"}`} />
                            <span className={`text-sm font-rajdhani font-medium ${match ? (key === "super" ? "text-yellow-500" : "text-primary") : "text-muted-foreground"}`}>{label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Goal type cannot be changed after creation</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Difficulty</Label>
                      <div className="flex flex-wrap gap-2">
                        {allDifficulties.map((diff) => {
                          const isSelected = editDifficulty === diff.value;
                          return (
                            <button key={diff.value} type="button" onClick={() => setEditDifficulty(diff.value)} className={`relative px-4 py-2 rounded-xl font-rajdhani font-bold text-sm uppercase tracking-wide transition-all duration-200 ${isSelected ? "text-white shadow-lg" : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"}`} style={isSelected ? { background: diff.color, boxShadow: `0 0 20px ${diff.color}40` } : {}}>
                              {diff.value === "custom" ? customDifficultyName || t("goals.difficulties.custom") : t(`goals.difficulties.${diff.value}`)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {goal.goal_type !== "habit" && goal.goal_type !== "super" && (
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2"><ListOrdered className="h-4 w-4" />Mission Steps</Label>
                        <EditStepsList items={editStepItems} onItemsChange={onStepItemsChange} />
                      </div>
                    )}
                  </div>

                  {/* Section 3: Dates */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Scheduling</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Start Date</Label>
                        <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className={`h-12 text-base rounded-xl ${inputStyle}`} style={{ colorScheme: "dark" }} />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Completion Date</Label>
                        <Input type="date" value={editCompletionDate} onChange={(e) => setEditCompletionDate(e.target.value)} className={`h-12 text-base rounded-xl ${inputStyle}`} style={{ colorScheme: "dark" }} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2"><Clock className="h-4 w-4" />Deadline (optional)</Label>
                      <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className={`h-12 text-base rounded-xl ${inputStyle}`} style={{ colorScheme: "dark" }} />
                      <p className="text-xs text-muted-foreground">Set a deadline to enable countdown timer on goal cards</p>
                    </div>
                  </div>

                  {/* Section 4: Budget & Cost */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Budget & Cost</h2>
                    </div>
                    <CostItemsEditor items={editCostItems} onChange={setEditCostItems} legacyTotal={goal.estimated_cost} steps={steps} onAddToWishlist={onAddToWishlist} />
                  </div>

                  {/* Section 5: Media & Notes */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                      <Image className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Media & Notes</h2>
                    </div>
                    {userId && (
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Goal Image</Label>
                        <GoalImageUpload value={editImage} onChange={setEditImage} userId={userId} />
                      </div>
                    )}
                    <div className="space-y-3">
                      <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2"><StickyNote className="h-4 w-4" />Notes</Label>
                      <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} maxLength={500} placeholder="Add notes about your goal..." className={`rounded-xl resize-none text-base ${inputStyle}`} />
                      <p className="text-xs text-muted-foreground text-right">{editNotes.length}/500</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-primary/20">
                    <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 h-14 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 font-rajdhani uppercase tracking-wider text-base">
                      <X className="h-5 w-5 mr-2" />Cancel
                    </Button>
                    <Button onClick={onSave} disabled={saving} className="flex-1 h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-rajdhani uppercase tracking-wider text-base shadow-[0_0_20px_rgba(91,180,255,0.3)]">
                      <Check className="h-5 w-5 mr-2" />{saving ? "SAVING..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
