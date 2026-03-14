import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Edit, ExternalLink, ImageIcon, Target, Trash2, CheckCircle2, ShieldCheck, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";

interface WishlistItemCardProps {
  item: PactWishlistItem;
  currency: string;
  onEdit: (item: PactWishlistItem) => void;
  onDelete: (id: string) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
  bulkMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

const CELEBRATION_PARTICLES = Array.from({ length: 12 });

export function WishlistItemCard({ item, currency, onEdit, onDelete, onToggleAcquired, bulkMode, selected, onSelect }: WishlistItemCardProps) {
  const navigate = useNavigate();
  const { id, name, category, notes, estimated_cost, acquired, goal, item_type, url, source_type, image_url } = item;

  const isRequired = item_type === "required";
  const isSynced = source_type === "goal_sync";
  const [showCelebration, setShowCelebration] = useState(false);

  const handleAcquiredToggle = useCallback(
    (checked: boolean) => {
      onToggleAcquired(id, checked);
      if (checked) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    },
    [id, onToggleAcquired],
  );

  const theme = {
    accent: isRequired ? "var(--destructive)" : "var(--primary)",
    borderClass: isRequired ? "border-destructive/30" : "border-primary/30",
    textClass: isRequired ? "text-destructive" : "text-primary",
    bgClass: isRequired ? "bg-destructive/10" : "bg-primary/10",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={bulkMode ? () => onSelect?.(id) : undefined}
      className={`group relative flex flex-col rounded-[24px] bg-black/60 backdrop-blur-2xl border overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ${
        bulkMode && selected ? "ring-2 ring-primary border-primary/50" : acquired ? "ring-2 ring-emerald-500/40 border-white/10" : `border-white/10 hover:border-${isRequired ? "destructive" : "primary"}/50`
      } ${bulkMode ? "cursor-pointer" : ""}`}
    >
      {/* Bulk select checkbox */}
      {bulkMode && (
        <div className="absolute top-4 left-4 z-30">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect?.(id)}
            className="h-6 w-6 rounded-lg border-2 border-white/40 bg-black/60 backdrop-blur-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      )}

      {/* Image zone */}
      <div className="relative h-52 w-full shrink-0 overflow-hidden bg-white/5">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              acquired ? "opacity-70 sepia-[.3] hue-rotate-[130deg] saturate-150" : "opacity-90 group-hover:opacity-100"
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
            <ImageIcon className="h-16 w-16 text-white/10" />
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-[url('/scanline-pattern.png')] opacity-10 mix-blend-overlay pointer-events-none" />

        {/* Classification badges */}
        <div className={`absolute ${bulkMode ? "top-4 left-12" : "top-4 left-4"} flex flex-col gap-2`}>
          <Badge
            className={`font-orbitron text-[10px] font-black tracking-widest uppercase border backdrop-blur-md px-3 py-1 shadow-lg ${theme.bgClass} ${theme.textClass} ${theme.borderClass}`}
          >
            {isRequired ? "CLASSIFICATION: REQUIRED" : "CLASSIFICATION: OPTIONAL"}
          </Badge>
          {isSynced && (
            <Badge className="font-orbitron text-[9px] font-bold tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/40 backdrop-blur-md uppercase w-fit">
              SYNCED ENTITY
            </Badge>
          )}
        </div>

        {/* Hover action buttons */}
        {!bulkMode && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 focus-within:opacity-100 focus-within:translate-x-0">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onEdit(item)}
              className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => onDelete(id)}
              className="h-9 w-9 rounded-full bg-destructive/50 backdrop-blur-xl border border-destructive/50 hover:bg-destructive text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Acquisition celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-950/90 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3">
                <ShieldCheck className="h-20 w-20 text-emerald-400" />
                <p className="font-orbitron font-bold text-emerald-400 text-2xl tracking-[0.3em]">SECURED</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content zone */}
      <div className="relative z-10 flex flex-col flex-grow p-5 pt-2">
        {/* Title & external link */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className={`font-rajdhani text-xl font-bold leading-tight break-words transition-colors duration-300 ${acquired ? "text-emerald-50" : "text-white"}`}
          >
            {name}
          </h3>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-muted-foreground hover:text-white transition-colors shrink-0"
              title="Open link"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Tags: category & linked goal */}
        <div className="flex flex-wrap gap-2 mb-4">
          {category && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-rajdhani text-white/70">
              <Tag className="h-3 w-3 opacity-50" />
              {category}
            </div>
          )}
          {goal?.name && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/goals/${goal.id}`); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-rajdhani text-primary/90 hover:bg-primary/20 transition-colors text-left"
            >
              <Target className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{goal.name}</span>
            </button>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <p className="text-sm font-rajdhani text-muted-foreground/90 line-clamp-3 leading-relaxed mb-6 flex-grow">
            {notes}
          </p>
        )}

        {/* Data grid */}
        <div className="mt-auto grid grid-cols-2 gap-3 p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
          <div className="flex flex-col justify-center">
            <span className="text-[9px] font-orbitron text-muted-foreground/60 tracking-widest uppercase mb-1">
              Estimated Value
            </span>
            <span
              className={`font-orbitron text-xl font-black tracking-tight ${acquired ? "text-emerald-400" : theme.textClass}`}
            >
              {formatCurrency(Number(estimated_cost || 0), currency)}
            </span>
          </div>

          <div className="flex flex-col items-end justify-center border-l border-white/5 pl-3">
            <span
              className={`text-[9px] font-orbitron tracking-widest uppercase mb-2 ${acquired ? "text-emerald-400" : "text-muted-foreground/60"}`}
            >
              {acquired ? "Status: Secured" : "Status: Pending"}
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor={`acquired-${id}`} className="sr-only">
                Acquired
              </Label>
              <Switch
                id={`acquired-${id}`}
                checked={acquired}
                onCheckedChange={handleAcquiredToggle}
                onClick={(e) => e.stopPropagation()}
                className={`scale-110 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/10`}
              />
              {acquired && <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-1" />}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
