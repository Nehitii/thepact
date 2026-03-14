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

// On enrichit le type proprement pour s'en servir dans le composant
type ExtendedWishlistItem = PactWishlistItem & {
  url?: string;
  source_type?: string;
  image_url?: string;
};

interface WishlistItemCardProps {
  item: ExtendedWishlistItem;
  currency: string;
  onEdit: (item: PactWishlistItem) => void;
  onDelete: (id: string) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
}

// Constante pour éviter de recréer le tableau à chaque rendu (optimisation)
const CELEBRATION_PARTICLES = Array.from({ length: 8 });

export function WishlistItemCard({ item, currency, onEdit, onDelete, onToggleAcquired }: WishlistItemCardProps) {
  const navigate = useNavigate();

  // 1. Destructuration pour un code plus lisible et éviter les "item.propriété" partout
  const { id, name, category, notes, estimated_cost, acquired, goal, item_type, url, source_type, image_url } = item;

  const isRequired = item_type === "required";
  const isSynced = source_type === "goal_sync";
  const [showCelebration, setShowCelebration] = useState(false);

  const handleAcquiredToggle = useCallback(
    (checked: boolean) => {
      onToggleAcquired(id, checked);
      if (checked) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
      }
    },
    [id, onToggleAcquired],
  );

  // 2. Extraction des classes conditionnelles pour alléger le JSX
  const themeStyles = {
    card: isRequired
      ? "border-destructive/20 shadow-[0_0_20px_hsl(var(--destructive)/0.06)] hover:shadow-[0_0_30px_hsl(var(--destructive)/0.12)]"
      : "border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.06)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.12)]",
    stripe: isRequired ? "via-destructive/70" : "via-primary/70",
    imageBg: isRequired ? "bg-destructive/5" : "bg-primary/5",
    badge: isRequired
      ? "bg-destructive/80 text-destructive-foreground border-destructive/40"
      : "bg-primary/80 text-primary-foreground border-primary/40",
    textCost: isRequired ? "text-destructive" : "text-primary",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={`group relative rounded-xl border overflow-hidden backdrop-blur-xl transition-shadow cursor-default bg-card/50 ${themeStyles.card}`}
    >
      {/* Top rarity stripe */}
      <div className={`h-[3px] w-full bg-gradient-to-r from-transparent to-transparent ${themeStyles.stripe}`} />

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {CELEBRATION_PARTICLES.map((_, i) => (
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
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.5 }}>
              <Zap className="h-8 w-8 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image area */}
      <div className={`aspect-[4/3] relative overflow-hidden ${themeStyles.imageBg}`}>
        {image_url ? (
          <img
            src={image_url}
            alt={`Image of ${name}`}
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
            className={`font-rajdhani text-[10px] font-bold tracking-wider backdrop-blur-md border ${themeStyles.badge}`}
          >
            {isRequired ? "REQUIRED" : "OPTIONAL"}
          </Badge>
        </div>

        {/* Top-right actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${name}`}
            title="Edit item"
            className="h-7 w-7 bg-background/60 backdrop-blur-md hover:bg-background/80 text-foreground"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(id)}
            aria-label={`Delete ${name}`}
            title="Delete item"
            className="h-7 w-7 bg-background/60 backdrop-blur-md hover:bg-destructive/80 text-foreground hover:text-destructive-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Synced badge */}
        {isSynced && (
          <div className="absolute bottom-2 left-2">
            <Badge
              variant="outline"
              className="font-rajdhani text-[9px] border-amber-500/40 text-amber-500 bg-background/60 backdrop-blur-md"
            >
              SYNCED
            </Badge>
          </div>
        )}

        {/* Category badge */}
        {category && (
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="outline"
              className="font-rajdhani text-[9px] bg-background/60 backdrop-blur-md border-border/50"
            >
              {category}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-rajdhani font-semibold text-sm text-foreground truncate leading-tight" title={name}>
              {name}
            </p>
            {goal?.name && (
              <button
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary font-rajdhani transition-colors mt-0.5 text-left"
                title={`Go to goal: ${goal.name}`}
              >
                <Target className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px]">{goal.name}</span>
              </button>
            )}
          </div>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`External link for ${name}`}
              title="Open link"
              className="text-muted-foreground/50 hover:text-primary transition-colors shrink-0 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {notes && (
          <p className="text-[11px] text-muted-foreground line-clamp-2" title={notes}>
            {notes}
          </p>
        )}

        {/* Price + Acquired */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30 mt-auto">
          <p className={`font-orbitron text-sm font-bold ${themeStyles.textCost}`}>
            {formatCurrency(Number(estimated_cost || 0), currency)}
          </p>
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor={`acquired-${id}`}
              className="text-[9px] text-muted-foreground font-rajdhani uppercase cursor-pointer"
            >
              Acquired
            </Label>
            <Switch
              id={`acquired-${id}`}
              checked={acquired}
              onCheckedChange={handleAcquiredToggle}
              className="scale-75 origin-right"
              aria-label="Toggle acquired status"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
