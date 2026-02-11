import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JournalEditor } from "./JournalEditor";
import { useCreateJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournal";
import type { JournalEntry } from "@/types/journal";
import { VALENCE_LABELS, ENERGY_LABELS } from "@/types/journal";
import { useGoals, Goal } from "@/hooks/useGoals";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { X, Plus, Link2, Zap, Heart } from "lucide-react";

interface JournalNewEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editingEntry?: JournalEntry | null;
}

export function JournalNewEntryModal({ open, onOpenChange, userId, editingEntry }: JournalNewEntryModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lifeContext, setLifeContext] = useState("");
  const [valence, setValence] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const activeGoals = useMemo(() => goals.filter((g: Goal) => g.status !== "fully_completed"), [goals]);

  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const isEditing = !!editingEntry;

  useEffect(() => {
    if (open) {
      if (editingEntry) {
        setTitle(editingEntry.title);
        setContent(editingEntry.content);
        setLifeContext(editingEntry.life_context || "");
        setValence(editingEntry.valence_level ?? 5);
        setEnergy(editingEntry.energy_level ?? 5);
        setLinkedGoalId(editingEntry.linked_goal_id);
        setTags(editingEntry.tags ?? []);
      } else {
        setTitle("");
        setContent("");
        setLifeContext("");
        setValence(5);
        setEnergy(5);
        setLinkedGoalId(null);
        setTags([]);
        setTagInput("");
      }
    }
  }, [open, editingEntry]);

  const handleAddTag = useCallback(() => {
    const cleaned = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const handleRemoveTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    const payload = {
      title: title.trim(),
      content,
      mood: "reflective" as const,
      life_context: lifeContext.trim() || null,
      valence_level: valence,
      energy_level: energy,
      linked_goal_id: linkedGoalId || null,
      tags,
      is_favorite: editingEntry?.is_favorite ?? false,
    };

    if (isEditing) {
      await updateEntry.mutateAsync({ id: editingEntry.id, userId, updates: payload });
    } else {
      await createEntry.mutateAsync({ user_id: userId, ...payload });
    }
    onOpenChange(false);
  };

  const isPending = createEntry.isPending || updateEntry.isPending;
  const valenceInfo = VALENCE_LABELS[valence - 1];
  const energyInfo = ENERGY_LABELS[energy - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl border border-primary/10 shadow-2xl rounded-2xl p-0 gap-0 flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
          backdropFilter: "blur(40px)",
          boxShadow: "0 0 60px hsl(var(--primary) / 0.08), 0 25px 50px hsl(var(--background) / 0.5)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse, hsl(var(--primary) / 0.15) 0%, transparent 70%)` }}
        />

        {/* Header */}
        <div className="relative z-10 px-6 pt-5 pb-4 border-b border-border/20">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <DialogTitle className="text-lg font-mono tracking-widest text-foreground/90 uppercase">
                {isEditing ? "EDIT_LOG" : "NEW_NEURAL_LOG"}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-5">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono tracking-[0.15em] uppercase">LOG_TITLE</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter log identifier..."
                className="bg-card/40 border-border/20 text-foreground/90 placeholder:text-muted-foreground/30 focus:border-primary/30 rounded-lg h-11 font-mono text-sm"
              />
            </div>

            {/* Valence & Energy sliders */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs font-mono tracking-[0.15em] uppercase flex items-center gap-1.5">
                    <Heart className="h-3 w-3" /> VALENCE
                  </Label>
                  <span className="text-xs font-mono" style={{ color: valenceInfo.color }}>
                    {valenceInfo.label}
                  </span>
                </div>
                <Slider
                  value={[valence]}
                  onValueChange={([v]) => setValence(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-primary/50"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground/40">
                  <span>NEGATIVE</span>
                  <span>POSITIVE</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs font-mono tracking-[0.15em] uppercase flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> ENERGY
                  </Label>
                  <span className="text-xs font-mono" style={{ color: energyInfo.color }}>
                    {energyInfo.label}
                  </span>
                </div>
                <Slider
                  value={[energy]}
                  onValueChange={([v]) => setEnergy(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-primary/50"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground/40">
                  <span>LOW</span>
                  <span>HIGH</span>
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono tracking-[0.15em] uppercase">LOG_CONTENT</Label>
              <JournalEditor
                content={content}
                onChange={setContent}
                placeholder="Begin neural log entry..."
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono tracking-[0.15em] uppercase">TAGS</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-primary/10 text-primary border border-primary/20 font-mono text-[11px] gap-1 hover:bg-primary/20 cursor-default"
                  >
                    #{tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-destructive">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="#tag"
                  className="bg-card/40 border-border/20 text-foreground/90 placeholder:text-muted-foreground/30 rounded-lg h-9 font-mono text-xs flex-1"
                />
                <Button size="sm" variant="outline" onClick={handleAddTag} className="h-9 border-border/20 text-muted-foreground hover:text-primary">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Goal Linking (optional) */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono tracking-[0.15em] uppercase flex items-center gap-1.5">
                <Link2 className="h-3 w-3" /> LINKED_GOAL <span className="text-muted-foreground/30">(optional)</span>
              </Label>
              <Select value={linkedGoalId ?? "none"} onValueChange={(v) => setLinkedGoalId(v === "none" ? null : v)}>
                <SelectTrigger className="bg-card/40 border-border/20 text-foreground/90 h-9 font-mono text-xs rounded-lg">
                  <SelectValue placeholder="No goal linked" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/20 font-mono text-xs">
                  <SelectItem value="none">No goal linked</SelectItem>
                  {activeGoals.map((g: Goal) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Life Context */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono tracking-[0.15em] uppercase">
                CONTEXT <span className="text-muted-foreground/30">(optional)</span>
              </Label>
              <Input
                value={lifeContext}
                onChange={(e) => setLifeContext(e.target.value)}
                placeholder="e.g., During a period of change..."
                className="bg-card/40 border-border/20 text-foreground/90 placeholder:text-muted-foreground/30 rounded-lg h-9 font-mono text-xs italic"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border/10">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground rounded-lg px-5 font-mono text-xs">
                ABORT
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSave}
                  disabled={!title.trim() || !content.trim() || isPending}
                  className="bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 rounded-lg px-6 font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                >
                  {isPending ? "SAVING..." : isEditing ? "UPDATE_LOG" : "SAVE_LOG"}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
