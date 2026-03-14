import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, X } from "lucide-react";

interface WishlistBulkBarProps {
  count: number;
  onMarkAcquired: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function WishlistBulkBar({ count, onMarkAcquired, onDelete, onCancel }: WishlistBulkBarProps) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl bg-card/95 backdrop-blur-2xl border border-primary/30 shadow-2xl shadow-primary/10"
    >
      <span className="font-orbitron text-xs tracking-wider text-primary font-bold">
        {count} SELECTED
      </span>
      <div className="w-px h-6 bg-primary/20" />
      <Button
        size="sm"
        variant="outline"
        onClick={onMarkAcquired}
        className="font-rajdhani text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
      >
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Mark Acquired ({count})
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onDelete}
        className="font-rajdhani text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Delete ({count})
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onCancel}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
