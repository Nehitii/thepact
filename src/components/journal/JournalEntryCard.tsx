import { format } from "date-fns";
import { JournalEntry, MOOD_CONFIG, JournalMood } from "@/hooks/useJournal";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
}

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const moodConfig = MOOD_CONFIG[entry.mood as JournalMood] || MOOD_CONFIG.reflective;
  const createdDate = new Date(entry.created_at);
  
  return (
    <div className="group relative rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 p-6 transition-all duration-300 hover:border-white/10 hover:bg-card/50">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${moodConfig.bgColor.replace('/20', '/5')} 0%, transparent 70%)`
        }}
      />
      
      <div className="relative z-10">
        {/* Top Row: Mood Icon + Title */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            {/* Mood Icon */}
            <div className={`w-12 h-12 rounded-full ${moodConfig.bgColor} flex items-center justify-center text-2xl shrink-0`}>
              {moodConfig.icon}
            </div>
            <div>
              <h3 className="text-xl font-medium text-white/90 font-rajdhani tracking-wide">
                {entry.title}
              </h3>
              {/* Metadata Row */}
              <div className="flex items-center gap-2 mt-1 text-sm text-white/40">
                <span>{format(createdDate, "EEEE, MMMM d, yyyy")}</span>
                <span className="text-white/20">·</span>
                <span className={`${moodConfig.color} capitalize`}>{entry.mood}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(entry)}
                className="h-8 w-8 text-white/40 hover:text-white/80 hover:bg-white/5"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(entry.id)}
                className="h-8 w-8 text-white/40 hover:text-red-400/80 hover:bg-red-500/5"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="text-white/70 leading-relaxed whitespace-pre-wrap text-base font-light">
          {entry.content}
        </div>
        
        {/* Life Context */}
        {entry.life_context && (
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-sm text-white/40 italic">
              "{entry.life_context}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
