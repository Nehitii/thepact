import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { JournalEntry, JournalMood, MOOD_CONFIG, useCreateJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournal";
import { motion, AnimatePresence } from "framer-motion";

interface JournalNewEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editingEntry?: JournalEntry | null;
}

const MOODS: JournalMood[] = [
  "contemplative",
  "nostalgic", 
  "inspired",
  "heavy",
  "calm",
  "reflective",
  "grateful",
  "melancholic",
];

// Premium mood colors for the modal
const MOOD_PREMIUM_COLORS: Record<JournalMood, { bg: string; text: string; glow: string }> = {
  contemplative: { bg: 'rgba(99, 102, 241, 0.15)', text: 'rgba(165, 180, 252, 0.95)', glow: 'rgba(99, 102, 241, 0.3)' },
  nostalgic: { bg: 'rgba(245, 158, 11, 0.15)', text: 'rgba(252, 211, 77, 0.95)', glow: 'rgba(245, 158, 11, 0.3)' },
  inspired: { bg: 'rgba(6, 182, 212, 0.15)', text: 'rgba(103, 232, 249, 0.95)', glow: 'rgba(6, 182, 212, 0.3)' },
  heavy: { bg: 'rgba(100, 116, 139, 0.15)', text: 'rgba(148, 163, 184, 0.95)', glow: 'rgba(100, 116, 139, 0.3)' },
  calm: { bg: 'rgba(16, 185, 129, 0.15)', text: 'rgba(110, 231, 183, 0.95)', glow: 'rgba(16, 185, 129, 0.3)' },
  reflective: { bg: 'rgba(139, 92, 246, 0.15)', text: 'rgba(196, 181, 253, 0.95)', glow: 'rgba(139, 92, 246, 0.3)' },
  grateful: { bg: 'rgba(236, 72, 153, 0.15)', text: 'rgba(249, 168, 212, 0.95)', glow: 'rgba(236, 72, 153, 0.3)' },
  melancholic: { bg: 'rgba(59, 130, 246, 0.15)', text: 'rgba(147, 197, 253, 0.95)', glow: 'rgba(59, 130, 246, 0.3)' },
};

export function JournalNewEntryModal({ 
  open, 
  onOpenChange, 
  userId,
  editingEntry 
}: JournalNewEntryModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalMood>("reflective");
  const [lifeContext, setLifeContext] = useState("");
  
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  
  const isEditing = !!editingEntry;
  
  // Reset form when opening or when editing entry changes
  useEffect(() => {
    if (open) {
      if (editingEntry) {
        setTitle(editingEntry.title);
        setContent(editingEntry.content);
        setMood(editingEntry.mood as JournalMood);
        setLifeContext(editingEntry.life_context || "");
      } else {
        setTitle("");
        setContent("");
        setMood("reflective");
        setLifeContext("");
      }
    }
  }, [open, editingEntry]);
  
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    
    if (isEditing) {
      await updateEntry.mutateAsync({
        id: editingEntry.id,
        userId,
        updates: {
          title: title.trim(),
          content: content.trim(),
          mood,
          life_context: lifeContext.trim() || null,
        }
      });
    } else {
      await createEntry.mutateAsync({
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        mood,
        life_context: lifeContext.trim() || undefined,
      });
    }
    
    onOpenChange(false);
  };
  
  const isPending = createEntry.isPending || updateEntry.isPending;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          "w-[calc(100vw-2rem)] sm:w-full max-w-2xl border border-white/[0.05] shadow-2xl rounded-2xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden"
        }
        style={{
          background:
            "linear-gradient(180deg, rgba(15, 20, 30, 0.98) 0%, rgba(10, 14, 22, 0.98) 100%)",
          backdropFilter: "blur(40px)",
        }}
      >
        {/* Subtle ambient glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full blur-[80px] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${MOOD_PREMIUM_COLORS[mood].glow} 0%, transparent 70%)`,
          }}
        />

        {/* Header (always visible) */}
        <div className="relative z-10 px-6 pt-6 pb-4 border-b border-white/[0.05]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-light text-white/90 tracking-tight pr-10">
              {isEditing ? "Edit Entry" : "New Entry"}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-6">
          <div className="space-y-7">
            {/* Title */}
            <div className="space-y-3">
              <Label className="text-slate-500 text-sm font-light tracking-wide">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What would you like to remember?"
                className="bg-white/[0.03] border-white/[0.06] text-white/90 placeholder:text-slate-600 focus:border-white/[0.12] focus:ring-0 rounded-xl h-12 text-base font-light transition-all duration-300"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              />
            </div>

            {/* Mood Selection - Premium Pills */}
            <div className="space-y-3">
              <Label className="text-slate-500 text-sm font-light tracking-wide">Mood</Label>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="wait">
                  {MOODS.map((m) => {
                    const config = MOOD_CONFIG[m];
                    const premiumColors = MOOD_PREMIUM_COLORS[m];
                    const isSelected = mood === m;
                    return (
                      <motion.button
                        key={m}
                        onClick={() => setMood(m)}
                        className="relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm capitalize transition-all duration-400"
                        style={{
                          background: isSelected ? premiumColors.bg : "rgba(255,255,255,0.02)",
                          color: isSelected ? premiumColors.text : "rgba(148, 163, 184, 0.7)",
                          border: isSelected
                            ? `1px solid ${premiumColors.text.replace("0.95", "0.2")}`
                            : "1px solid rgba(255,255,255,0.04)",
                          boxShadow: isSelected ? `0 0 20px ${premiumColors.glow}` : "none",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                      >
                        <span className="text-base">{config.icon}</span>
                        <span className="font-light">{m}</span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <Label className="text-slate-500 text-sm font-light tracking-wide">Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts, memories, reflections..."
                className="min-h-[200px] bg-white/[0.03] border-white/[0.06] text-white/90 placeholder:text-slate-600 focus:border-white/[0.12] focus:ring-0 resize-none leading-[1.8] rounded-xl text-base font-light transition-all duration-300"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              />
            </div>

            {/* Life Context (Optional) */}
            <div className="space-y-3">
              <Label className="text-slate-500 text-sm font-light tracking-wide">
                Life Context <span className="text-slate-700">(optional)</span>
              </Label>
              <Input
                value={lifeContext}
                onChange={(e) => setLifeContext(e.target.value)}
                placeholder="e.g., During a period of change..."
                className="bg-white/[0.03] border-white/[0.06] text-white/90 placeholder:text-slate-600 focus:border-white/[0.12] focus:ring-0 rounded-xl h-12 text-base font-light italic transition-all duration-300"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] rounded-xl px-5 font-light transition-all duration-300"
              >
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || !content.trim() || isPending}
                  className="relative min-h-[44px] px-6 py-3 rounded-xl border-0 font-light transition-all duration-400 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
                    color: "rgba(110, 231, 183, 0.95)",
                    boxShadow:
                      "0 0 25px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-emerald-400/30 border-t-emerald-400/80"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Saving...
                    </span>
                  ) : isEditing ? (
                    "Update Entry"
                  ) : (
                    "Save Entry"
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
