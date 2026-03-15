import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import {
  Edit, ExternalLink, ImageIcon, Target, Trash2,
  ShieldCheck, Tag, Check, GripVertical, AlertTriangle,
  Zap, Flame, CircleDot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PactWishlistItem, WishlistPriority } from "@/hooks/usePactWishlist";

const priorityConfig: Record<WishlistPriority, { label: string; colorClass: string; borderClass: string; bgClass: string; icon: any }> = {
  low: { label: "LOW", colorClass: "text-cyan-400", borderClass: "border-cyan-500/30", bgClass: "bg-cyan-500/10", icon: CircleDot },
  med: { label: "MED", colorClass: "text-amber-400", borderClass: "border-amber-500/30", bgClass: "bg-amber-500/10", icon: Zap },
  high: { label: "HIGH", colorClass: "text-orange-400", borderClass: "border-orange-500/30", bgClass: "bg-orange-500/10", icon: AlertTriangle },
  critical: { label: "CRITICAL", colorClass: "text-fuchsia-400", borderClass: "border-fuchsia-500/30", bgClass: "bg-fuchsia-500/10", icon: Flame },
};

interface WishlistItemCardProps {
  item: PactWishlistItem;
  currency: string;
  onEdit: (item: PactWishlistItem) => void;
  onDelete: (id: string) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
  bulkMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  draggable?: boolean;
}

export function WishlistItemCard({
  item, currency, onEdit, onDelete, onToggleAcquired,
  bulkMode = false, selected = false, onSelect, draggable = false,
}: WishlistItemCardProps) {
  const navigate = useNavigate();
  const { id, name, category, notes, estimated_cost, acquired, goal, item_type, url, source_type, image_url, priority } = item;

  const isRequired = item_type === "required";
  const isSynced = source_type === "goal_sync";
  const prio = priorityConfig[priority] || priorityConfig.low;
  const PrioIcon = prio.icon;

  const [isExiting, setIsExiting] = useState(false);

  // dnd-kit sortable
  const { attributes, listeners, setNodeRef, transform, transition: dndTransition, isDragging } = useSortable({
    id,
    disabled: !draggable,
  });

  const dndStyle = draggable ? {
    transform: CSS.Transform.toString(transform),
    transition: dndTransition,
    zIndex: isDragging ? 50 : undefined,
  } : {};

  // Bug fix: shorter animation, immediate DB call
  const handleAcquiredToggle = useCallback((checked: boolean) => {
    if (bulkMode || isExiting) return;
    if (checked) {
      setIsExiting(true);
      setTimeout(() => {
        onToggleAcquired(id, true);
      }, 800);
    } else {
      onToggleAcquired(id, false);
    }
  }, [id, bulkMode, isExiting, onToggleAcquired]);

  const classLabel = isRequired ? "REQUIRED" : "OPTIONAL";
  const classBorder = isRequired ? "border-amber-500/30" : "border-cyan-500/30";
  const classText = isRequired ? "text-amber-400" : "text-cyan-400";
  const classBg = isRequired ? "bg-amber-500/10" : "bg-cyan-500/10";

  const ringClass = selected
    ? "ring-2 ring-primary shadow-[0_0_25px_hsl(var(--primary)/0.25)]"
    : isDragging
      ? "ring-2 ring-cyan-400/50 shadow-[0_0_30px_rgba(0,200,255,0.2)]"
      : isExiting
        ? "ring-2 ring-emerald-500/50"
        : "";

  return (
    <motion.div
      ref={setNodeRef}
      style={dndStyle}
      {...(draggable ? { ...attributes } : {})}
      layout={!draggable}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.6 : isExiting ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
      whileHover={!bulkMode && !draggable ? { y: -3 } : undefined}
      onClick={() => bulkMode && onSelect?.(id)}
      className={`group relative flex flex-col bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/15 overflow-hidden shadow-2xl transition-all duration-500 ${bulkMode ? "cursor-pointer" : ""} ${ringClass}`}
      style={{
        ...dndStyle,
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
      }}
    >
      {/* Priority top strip */}
      <div className={`h-[3px] w-full ${prio.bgClass}`} style={{ boxShadow: `0 0 10px currentColor` }}>
        <div className={`h-full w-full ${prio.colorClass.replace('text-', 'bg-').replace('400', '500/60')}`} />
      </div>

      {/* Priority + Classification bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          {draggable && (
            <button {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-cyan-500/40 hover:text-cyan-400 transition-colors">
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm ${prio.bgClass} ${prio.borderClass} border`}>
            <PrioIcon className={`h-3 w-3 ${prio.colorClass}`} />
            <span className={`font-mono text-[9px] font-bold tracking-[0.15em] ${prio.colorClass}`}>
              {prio.label}
            </span>
          </div>
        </div>
        <Badge className={`font-mono text-[9px] font-bold tracking-[0.12em] uppercase border backdrop-blur-md px-2 py-0.5 ${classBg} ${classText} ${classBorder}`}>
          {classLabel}
        </Badge>
      </div>

      {/* Image zone */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-900/50">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
              isExiting ? "opacity-50 saturate-150 hue-rotate-[130deg]" : "opacity-90 group-hover:opacity-100"
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-950/50">
            <ImageIcon className="h-14 w-14 text-cyan-500/10" />
          </div>
        )}

        {/* Scanline + gradient overlays */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent pointer-events-none" />

        {/* Synced badge */}
        {isSynced && (
          <Badge className="absolute top-3 left-3 font-mono text-[8px] font-bold tracking-[0.15em] bg-amber-500/15 text-amber-400 border border-amber-500/30 backdrop-blur-md uppercase">
            ◈ SYNCED
          </Badge>
        )}

        {/* HUD actions or bulk checkbox */}
        {bulkMode ? (
          <div className="absolute top-3 right-3 z-40">
            <div className={`h-6 w-6 rounded-sm border-2 flex items-center justify-center transition-all duration-300 backdrop-blur-md ${
              selected
                ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,200,255,0.5)]"
                : "bg-slate-900/60 border-cyan-500/30 text-transparent hover:border-cyan-400/60"
            }`}>
              <Check className="h-3.5 w-3.5" />
            </div>
          </div>
        ) : (
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 translate-x-12 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="h-8 w-8 bg-slate-900/70 backdrop-blur-xl border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 rounded-sm"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onDelete(id); }}
              className="h-8 w-8 bg-slate-900/70 backdrop-blur-xl border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 rounded-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* SECURED exit overlay */}
        <AnimatePresence>
          {isExiting && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-950/90 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
                <ShieldCheck className="h-16 w-16 text-emerald-400" />
                <p className="font-mono font-bold text-emerald-400 text-lg tracking-[0.3em]">SECURED</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content zone */}
      <div className={`relative z-10 flex flex-col flex-grow p-4 ${bulkMode ? "pointer-events-none" : ""}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className={`font-rajdhani text-xl font-bold leading-tight break-words transition-colors ${isExiting ? "text-emerald-300" : "text-foreground"}`}>
            {name}
          </h3>
          {url && !bulkMode && (
            <a
              href={url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 p-1.5 bg-slate-800/50 hover:bg-cyan-500/10 border border-cyan-500/15 text-cyan-500/60 hover:text-cyan-400 transition-colors shrink-0 rounded-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {category && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/60 border border-slate-700/50 text-[11px] font-mono text-slate-400 rounded-sm">
              <Tag className="h-2.5 w-2.5 opacity-50" />
              {category}
            </div>
          )}
          {goal?.name && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/goals/${goal.id}`); }}
              className="flex items-center gap-1 px-2 py-0.5 bg-primary/5 border border-primary/20 text-[11px] font-mono text-primary/80 hover:bg-primary/10 transition-colors rounded-sm"
            >
              <Target className="h-2.5 w-2.5" />
              <span className="max-w-[120px] truncate">{goal.name}</span>
            </button>
          )}
        </div>

        {notes && (
          <p className="text-xs font-rajdhani text-muted-foreground/80 line-clamp-2 leading-relaxed mb-4 flex-grow">
            {notes}
          </p>
        )}

        {/* Data grid */}
        <div className="mt-auto grid grid-cols-2 gap-0 border border-cyan-500/10 bg-slate-900/50 overflow-hidden" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
          <div className="p-3 border-r border-cyan-500/10">
            <span className="text-[8px] font-mono text-cyan-500/50 tracking-[0.2em] uppercase block mb-1">
              EST.VALUE
            </span>
            <span className={`font-mono text-lg font-black tracking-tight ${isExiting ? "text-emerald-400" : classText}`}>
              {formatCurrency(Number(estimated_cost || 0), currency)}
            </span>
          </div>
          <div className="p-3 flex flex-col items-end justify-center">
            <span className={`text-[8px] font-mono tracking-[0.2em] uppercase mb-1.5 ${isExiting ? "text-emerald-400" : "text-cyan-500/50"}`}>
              {isExiting ? "SECURING…" : acquired ? "SECURED" : "PENDING"}
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor={`acq-${id}`} className="sr-only">Acquired</Label>
              <Switch
                id={`acq-${id}`}
                checked={isExiting || acquired}
                onCheckedChange={handleAcquiredToggle}
                className="scale-100 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-700"
                disabled={bulkMode || isExiting}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
