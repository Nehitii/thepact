import { format } from "date-fns";
import type { JournalEntry } from "@/types/journal";
import { VALENCE_LABELS, ENERGY_LABELS } from "@/types/journal";
import { Pencil, Trash2, Star, Link2, Zap, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToggleFavorite } from "@/hooks/useJournal";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
}

function formatNeuralDate(date: Date) {
  return `LOG_${format(date, "yyyy.MM.dd")} // ${format(date, "HH:mm")}`;
}

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const { user } = useAuth();
  const toggleFav = useToggleFavorite();
  const createdDate = new Date(entry.created_at);
  const valenceInfo = entry.valence_level ? VALENCE_LABELS[entry.valence_level - 1] : null;
  const energyInfo = entry.energy_level ? ENERGY_LABELS[entry.energy_level - 1] : null;

  const handleToggleFavorite = () => {
    if (!user) return;
    toggleFav.mutate({ id: entry.id, userId: user.id, isFavorite: !entry.is_favorite });
  };

  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden transition-all duration-300 border border-border/15 hover:border-primary/20"
      style={{
        background: "linear-gradient(180deg, hsl(var(--card) / 0.7) 0%, hsl(var(--card) / 0.4) 100%)",
        boxShadow: "0 4px 30px hsl(var(--background) / 0.3), inset 0 1px 0 hsl(var(--foreground) / 0.02)",
      }}
      whileHover={{ y: -1, boxShadow: "0 8px 40px hsl(var(--background) / 0.4), 0 0 30px hsl(var(--primary) / 0.05)" }}
      transition={{ duration: 0.3 }}
    >
      {/* Favorite indicator bar */}
      {entry.is_favorite && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      <div className="relative z-10 p-5 sm:p-6">
        {/* Header: date + actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1.5">
            <div className="font-mono text-[11px] text-primary/60 tracking-[0.2em] uppercase">
              {formatNeuralDate(createdDate)}
            </div>
            <h3 className="text-lg font-medium text-foreground/90 tracking-tight leading-tight font-mono">
              {entry.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleToggleFavorite}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                entry.is_favorite
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground/40 hover:text-primary/60 hover:bg-card/60"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${entry.is_favorite ? "fill-current" : ""}`} />
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(entry)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-foreground/70 hover:bg-card/60 transition-all duration-200"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive/70 hover:bg-destructive/5 transition-all duration-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Metrics row */}
        {(valenceInfo || energyInfo) && (
          <div className="flex items-center gap-3 mb-3">
            {valenceInfo && (
              <div className="flex items-center gap-1 text-[11px] font-mono" style={{ color: valenceInfo.color }}>
                <Heart className="h-3 w-3" />
                <span>{valenceInfo.label}</span>
              </div>
            )}
            {energyInfo && (
              <div className="flex items-center gap-1 text-[11px] font-mono" style={{ color: energyInfo.color }}>
                <Zap className="h-3 w-3" />
                <span>{energyInfo.label}</span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entry.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-primary/8 text-primary/70 border-primary/15 font-mono text-[10px] py-0 h-5"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content - rendered as HTML */}
        <div
          className="text-foreground/70 leading-[1.8] text-sm max-w-prose journal-html-content"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />

        {/* Footer: linked goal + life context */}
        {(entry.linked_goal_id || entry.life_context) && (
          <div className="mt-4 pt-3 border-t border-border/10 flex flex-wrap items-center gap-3">
            {entry.linked_goal_id && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50">
                <Link2 className="h-3 w-3" />
                <span>GOAL_LINKED</span>
              </div>
            )}
            {entry.life_context && (
              <p className="text-xs text-muted-foreground/40 italic font-light">
                "{entry.life_context}"
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
