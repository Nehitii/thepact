import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Edit, ExternalLink, ImageIcon, Target, Trash2, Zap, CheckCircle2, ShieldCheck } from "lucide-react";
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

  // Configuration dynamique du thème "Cyber/HUD"
  const theme = {
    accent: isRequired ? "var(--destructive)" : "var(--primary)",
    glow: isRequired ? "shadow-[0_0_30px_hsl(var(--destructive)/0.15)]" : "shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
    borderGlow: isRequired ? "group-hover:border-destructive/50" : "group-hover:border-primary/50",
    textFocus: isRequired ? "text-destructive" : "text-primary",
    badgeBg: isRequired
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-primary/10 text-primary border-primary/30",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/5 transition-all duration-500 ${theme.borderGlow} ${acquired ? "ring-1 ring-emerald-500/30" : theme.glow}`}
    >
      {/* 1. EFFETS DE FOND & HUD */}
      {/* Ligne d'énergie supérieure */}
      <div
        className="absolute top-0 left-0 h-[2px] w-1/3 transition-all duration-700 ease-out group-hover:w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}
      />

      {/* Grille de fond (visible uniquement sur les zones sombres) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20" />

      {/* Animation d'acquisition (Hack/Sécurisation) */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950/80 backdrop-blur-sm"
            initial={{ opacity: 0, clipPath: "circle(0% at 50% 50%)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at 50% 50%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1.2, 1], opacity: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <ShieldCheck className="h-16 w-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
              <p className="font-orbitron font-bold tracking-widest text-emerald-400 text-xl">ACQUIRED</p>
            </motion.div>

            {/* Particules */}
            {CELEBRATION_PARTICLES.map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"
                initial={{ scale: 0, x: 0, y: 0, rotate: i * 30 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI) / 6) * 100,
                  y: Math.sin((i * Math.PI) / 6) * 100,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ZONE IMAGE AVEC MASQUE */}
      <div className="relative h-48 w-full overflow-hidden shrink-0">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            // Filtre sombre/désaturé par défaut, s'illumine au survol. Si acquis, teinte verte.
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
              acquired
                ? "opacity-40 sepia-[.5] hue-rotate-[-50deg] saturate-200"
                : "opacity-60 grayscale-[30%] group-hover:opacity-100 group-hover:grayscale-0"
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <ImageIcon className="h-12 w-12 text-white/10" />
          </div>
        )}

        {/* Effet Scanline sur l'image */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />

        {/* Dégradé profond pour lier l'image au contenu */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

        {/* Badges HUD */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge
            className={`font-orbitron text-[9px] font-bold tracking-widest backdrop-blur-md uppercase border ${theme.badgeBg}`}
          >
            <span className="mr-1 opacity-50">CLASS:</span> {isRequired ? "REQ" : "OPT"}
          </Badge>
          {isSynced && (
            <Badge className="font-orbitron text-[9px] font-bold tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/30 backdrop-blur-md uppercase">
              SYNC
            </Badge>
          )}
        </div>

        {/* Overlay "Acquis" permanent si coché */}
        {acquired && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 backdrop-blur-md px-2 py-1 rounded-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-orbitron text-[9px] font-bold tracking-widest">SECURED</span>
          </div>
        )}
      </div>

      {/* 3. ZONE CONTENU (Superposée grâce au fond transparent) */}
      <div className="relative z-10 flex flex-col flex-grow p-5 pt-0 -mt-8">
        {/* En-tête : Titre & Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {category && (
              <p className="text-[10px] font-rajdhani font-semibold tracking-widest text-muted-foreground/70 uppercase mb-1">
                // {category}
              </p>
            )}
            <h3
              className={`font-rajdhani text-xl font-bold leading-none truncate transition-colors duration-300 ${acquired ? "text-emerald-50" : "text-foreground group-hover:text-white"}`}
            >
              {name}
            </h3>

            {goal?.name && (
              <button
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary font-rajdhani transition-colors mt-2 text-left group/goal"
              >
                <Target className="h-3 w-3 transition-transform group-hover/goal:scale-110" />
                <span className="truncate max-w-[180px] border-b border-transparent group-hover/goal:border-primary/50">
                  {goal.name}
                </span>
              </button>
            )}
          </div>

          {/* Actions : Tiroir caché qui glisse au survol */}
          <div className="flex items-center gap-1 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 focus-within:opacity-100 focus-within:translate-x-0 bg-background/80 backdrop-blur-xl p-1 rounded-lg border border-white/10 shadow-xl">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                title="External Link"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 text-muted-foreground hover:text-white hover:bg-white/10 rounded-md transition-colors"
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <p className="text-[12px] font-rajdhani text-muted-foreground/80 line-clamp-2 leading-relaxed mb-4 flex-grow">
            {notes}
          </p>
        )}

        {/* Footer : Prix & Switch */}
        <div className="mt-auto pt-4 flex items-end justify-between border-t border-white/5 relative">
          {/* Ligne d'accentuation sur le border-t au survol */}
          <div className="absolute top-[-1px] left-0 w-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-500 group-hover:w-full" />

          <div>
            <p className="text-[9px] font-orbitron text-muted-foreground/50 tracking-widest uppercase mb-1">
              Estimated Value
            </p>
            <p
              className={`font-orbitron text-2xl font-black tracking-tight drop-shadow-lg ${acquired ? "text-emerald-400" : theme.textFocus}`}
            >
              {formatCurrency(Number(estimated_cost || 0), currency)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Label
              htmlFor={`acquired-${id}`}
              className={`text-[10px] font-orbitron font-bold tracking-widest uppercase cursor-pointer transition-colors ${acquired ? "text-emerald-400" : "text-muted-foreground"}`}
            >
              {acquired ? "Secured" : "Acquire"}
            </Label>
            {/* Le Switch est imbriqué dans une div pour lui donner un look de panneau de contrôle */}
            <div
              className={`p-1 rounded-full border transition-colors ${acquired ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-black/50"}`}
            >
              <Switch
                id={`acquired-${id}`}
                checked={acquired}
                onCheckedChange={handleAcquiredToggle}
                className={`scale-90 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted/30`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
