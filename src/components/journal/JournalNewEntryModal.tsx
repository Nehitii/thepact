import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { JournalEntry, JournalMood, MOOD_CONFIG, useCreateJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournal";

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
      <DialogContent className="max-w-2xl bg-[#0a0a12]/95 backdrop-blur-xl border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-white/90 tracking-wide">
            {isEditing ? "Edit Entry" : "New Entry"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-white/60 text-sm font-light">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to remember?"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-0"
            />
          </div>
          
          {/* Mood Selection */}
          <div className="space-y-3">
            <Label className="text-white/60 text-sm font-light">Mood</Label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const config = MOOD_CONFIG[m];
                const isSelected = mood === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-full text-sm capitalize
                      transition-all duration-200
                      ${isSelected 
                        ? `${config.bgColor} ${config.color} border border-white/20` 
                        : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'}
                    `}
                  >
                    <span>{config.icon}</span>
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <Label className="text-white/60 text-sm font-light">Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, memories, reflections..."
              className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-0 resize-none leading-relaxed"
            />
          </div>
          
          {/* Life Context (Optional) */}
          <div className="space-y-2">
            <Label className="text-white/60 text-sm font-light">
              Life Context <span className="text-white/30">(optional)</span>
            </Label>
            <Input
              value={lifeContext}
              onChange={(e) => setLifeContext(e.target.value)}
              placeholder="e.g., During a period of change..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-0"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/50 hover:text-white/80 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim() || isPending}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
            >
              {isPending ? "Saving..." : isEditing ? "Update" : "Save Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
