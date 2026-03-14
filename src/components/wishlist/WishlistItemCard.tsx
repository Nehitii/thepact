import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Edit, ExternalLink, ImageIcon, Target, Trash2, Zap, CheckCircle2, ShieldCheck, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";

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

const CELEBRATION_PARTICLES = Array.from({ length: 12 });

export function WishlistItemCard({ item, currency, onEdit, onDelete, onToggleAcquired }: WishlistItemCardProps) {
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
      className={`group relative flex flex-col rounded-[24px] bg-black/60 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ${acquired ? "ring-2 ring-emerald-500/40" : `hover:border-${isRequired ? "destructive" : "primary"}/50`}`}
    >
      {/* ==================== 1. ZONE IMAGE SPECTACULAIRE ==================== */}
      <div className="relative h-64 w-full shrink-0 overflow-hidden bg-white/5">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            // L'image est 100% visible par défaut. Teinte verte si acquis.
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

        {/* Dégradé doux uniquement en bas pour lier l'image au contenu */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* HUD: Ligne de scanline subtile */}
        <div className="absolute inset-0 bg-[url('/scanline-pattern.png')] opacity-10 mix-blend-overlay pointer-events-none" />

        {/* Badges de classification */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
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

        {/* Actions Rapides (Flottantes au survol) */}
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

        {/* Overlay d'Acquisition (Hack animation) */}
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

      {/* ==================== 2. ZONE CONTENU DÉTAILLÉE ==================== */}
      <div className="relative z-10 flex flex-col flex-grow p-6 pt-2">
        {/* Titre & Lien Externe */}
        <div className="flex items-start justify-between gap-4 mb-3">
          {/* Titre qui peut prendre jusqu'à 2-3 lignes sans être coupé */}
          <h3
            className={`font-rajdhani text-2xl font-bold leading-tight break-words transition-colors duration-300 ${acquired ? "text-emerald-50" : "text-white"}`}
          >
            {name}
          </h3>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-muted-foreground hover:text-white transition-colors shrink-0"
              title="Accéder au lien"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Tags : Catégorie & Objectif Lié */}
        <div className="flex flex-wrap gap-2 mb-4">
          {category && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-rajdhani text-white/70">
              <Tag className="h-3 w-3 opacity-50" />
              {category}
            </div>
          )}
          {goal?.name && (
            <button
              onClick={() => navigate(`/goals/${goal.id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-rajdhani text-primary/90 hover:bg-primary/20 transition-colors text-left"
            >
              <Target className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{goal.name}</span>
            </button>
          )}
        </div>

        {/* Notes (Plus d'espace pour lire) */}
        {notes && (
          <p className="text-sm font-rajdhani text-muted-foreground/90 line-clamp-3 leading-relaxed mb-6 flex-grow">
            {notes}
          </p>
        )}

        {/* ==================== 3. TABLEAU DE BORD (DATA GRID) ==================== */}
        <div className="mt-auto grid grid-cols-2 gap-3 p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
          {/* Bloc Prix */}
          <div className="flex flex-col justify-center">
            <span className="text-[9px] font-orbitron text-muted-foreground/60 tracking-widest uppercase mb-1">
              Estimated Value
            </span>
            <span
              className={`font-orbitron text-2xl font-black tracking-tight ${acquired ? "text-emerald-400" : theme.textClass}`}
            >
              {formatCurrency(Number(estimated_cost || 0), currency)}
            </span>
          </div>

          {/* Bloc Statut / Switch */}
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
