import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/currency";
import { Edit, ExternalLink, Target, Trash2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";

interface WishlistItemCardProps {
  item: PactWishlistItem & { url?: string; source_type?: string };
  currency: string;
  onEdit: (item: PactWishlistItem) => void;
  onDelete: (id: string) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
}

export function WishlistItemCard({ item, currency, onEdit, onDelete, onToggleAcquired }: WishlistItemCardProps) {
  const navigate = useNavigate();
  const isRequired = item.item_type === "required";
  const isSynced = (item as any).source_type === "goal_sync";
  const [showCelebration, setShowCelebration] = useState(false);

  const handleAcquiredToggle = useCallback(
    (v: boolean) => {
      onToggleAcquired(item.id, v);
      if (v) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
      }
    },
    [item.id, onToggleAcquired]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`relative rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 backdrop-blur-xl transition-all ${
        isRequired
          ? "border-l-4 border-l-destructive bg-destructive/5 border border-destructive/15 shadow-[0_0_15px_hsl(var(--destructive)/0.08)]"
          : "border-l-4 border-l-primary bg-primary/5 border border-primary/15 shadow-[0_0_15px_hsl(var(--primary)/0.08)]"
      }`}
    >
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none z-10 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  x: Math.cos((i * Math.PI) / 4) * 60,
                  y: Math.sin((i * Math.PI) / 4) * 40,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="h-8 w-8 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-rajdhani font-semibold text-foreground truncate">{item.name}</p>
          <Badge
            variant={isRequired ? "default" : "secondary"}
            className={`font-rajdhani text-[10px] ${
              isRequired ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-primary/20 text-primary border-primary/30"
            }`}
          >
            {isRequired ? "REQUIRED" : "OPTIONAL"}
          </Badge>
          {isSynced && (
            <Badge variant="outline" className="font-rajdhani text-[10px] border-amber-500/30 text-amber-500">
              SYNCED
            </Badge>
          )}
          {item.category && (
            <Badge variant="outline" className="font-rajdhani text-[10px]">
              {item.category}
            </Badge>
          )}
          {(item as any).url && (
            <a
              href={(item as any).url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        {item.goal?.name && (
          <button
            onClick={() => navigate(`/goals/${item.goal?.id}`)}
            className="inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary font-rajdhani transition-colors"
          >
            <Target className="h-3.5 w-3.5" />
            <span className="truncate">{item.goal.name}</span>
          </button>
        )}
        {item.notes && (
          <p className="text-xs text-muted-foreground truncate max-w-md">{item.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-between md:justify-end">
        <div className="text-right space-y-1">
          <p className="font-orbitron text-sm font-bold text-foreground">
            {formatCurrency(Number(item.estimated_cost || 0), currency)}
          </p>
          <div className="flex items-center gap-2 justify-end">
            <Label className="text-[10px] text-muted-foreground font-rajdhani uppercase">Acquired</Label>
            <Switch
              checked={item.acquired}
              onCheckedChange={handleAcquiredToggle}
              className="scale-90"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(item as PactWishlistItem)}
          className="h-8 w-8 text-primary/50 hover:text-primary hover:bg-primary/10"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
