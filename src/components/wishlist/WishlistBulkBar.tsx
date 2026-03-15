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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/25 shadow-[0_0_30px_rgba(0,200,255,0.1)]"
      style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
    >
      <span className="font-mono text-[10px] tracking-[0.15em] text-cyan-400 font-bold">
        {count} SELECTED
      </span>
      <div className="w-px h-6 bg-cyan-500/20" />
      <Button
        size="sm"
        variant="outline"
        onClick={onMarkAcquired}
        className="font-mono text-[10px] tracking-wider border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-sm"
      >
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Acquire ({count})
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onDelete}
        className="font-mono text-[10px] tracking-wider border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-sm"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Delete ({count})
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onCancel}
        className="h-8 w-8 text-slate-500 hover:text-foreground rounded-sm"
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
