import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Edit, ExternalLink, ImageIcon, Target, Trash2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";

interface WishlistItemCardProps {
  item: PactWishlistItem & { url?: string; source_type?: string; image_url?: string };
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

  const accentColor = isRequired ? "destructive" : "primary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={`group relative rounded-xl border overflow-hidden backdrop-blur-xl transition-shadow cursor-default ${
        isRequired
          ? "border-destructive/20 bg-card/50 shadow-[0_0_20px_hsl(var(--destructive)/0.06)] hover:shadow-[0_0_30px_hsl(var(--destructive)/0.12)]"
          : "border-primary/20 bg-card/50 shadow-[0_0_20px_hsl(var(--primary)/0.06)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.12)]"
      }`}
    >
      {/* Top rarity stripe */}
      <div
        className={`h-[3px] w-full ${
          isRequired
            ? "bg-gradient-to-r from-transparent via-destructive/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-primary/70 to-transparent"
        }`}
      />

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
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

      {/* Image area */}
      <div className={`aspect-[4/3] relative overflow-hidden ${
        isRequired ? "bg-destructive/5" : "bg-primary/5"
      }`}>
        {(item as any).image_url ? (
          <img
            src={(item as any).image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/15" />
          </div>
        )}

        {/* Top-left badge */}
        <div className="absolute top-2 left-2">
          <Badge
            className={`font-rajdhani text-[10px] font-bold tracking-wider backdrop-blur-md border ${
              isRequired
                ? "bg-destructive/80 text-destructive-foreground border-destructive/40"
                : "bg-primary/80 text-primary-foreground border-primary/40"
            }`}
          >
            {isRequired ? "REQUIRED" : "OPTIONAL"}
          </Badge>
        </div>

        {/* Top-right actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(item as PactWishlistItem)}
            className="h-7 w-7 bg-background/60 backdrop-blur-md hover:bg-background/80 text-foreground"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            className="h-7 w-7 bg-background/60 backdrop-blur-md hover:bg-destructive/80 text-foreground hover:text-destructive-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Synced badge */}
        {isSynced && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="font-rajdhani text-[9px] border-amber-500/40 text-amber-500 bg-background/60 backdrop-blur-md">
              SYNCED
            </Badge>
          </div>
        )}

        {/* Category badge */}
        {item.category && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="outline" className="font-rajdhani text-[9px] bg-background/60 backdrop-blur-md border-border/50">
              {item.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-rajdhani font-semibold text-sm text-foreground truncate leading-tight">
              {item.name}
            </p>
            {item.goal?.name && (
              <button
                onClick={() => navigate(`/goals/${item.goal?.id}`)}
                className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary font-rajdhani transition-colors mt-0.5"
              >
                <Target className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{item.goal.name}</span>
              </button>
            )}
          </div>

          {(item as any).url && (
            <a
              href={(item as any).url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/50 hover:text-primary transition-colors shrink-0 mt-0.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {item.notes && (
          <p className="text-[11px] text-muted-foreground truncate">{item.notes}</p>
        )}

        {/* Price + Acquired */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <p className={`font-orbitron text-sm font-bold ${isRequired ? "text-destructive" : "text-primary"}`}>
            {formatCurrency(Number(item.estimated_cost || 0), currency)}
          </p>
          <div className="flex items-center gap-1.5">
            <Label className="text-[9px] text-muted-foreground font-rajdhani uppercase">Acquired</Label>
            <Switch
              checked={item.acquired}
              onCheckedChange={handleAcquiredToggle}
              className="scale-75"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
