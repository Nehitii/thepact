import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { Trophy, Check, ImageIcon, Undo2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";

interface AcquisitionArchiveProps {
  items: PactWishlistItem[];
  currency: string;
  onToggleAcquired: (id: string, acquired: boolean) => void;
}

export function AcquisitionArchive({ items, currency, onToggleAcquired }: AcquisitionArchiveProps) {
  if (items.length === 0) return null;

  const totalCost = items.reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);

  return (
    <div className="space-y-5 mt-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-orbitron text-sm tracking-[0.15em] uppercase text-foreground">
              Acquisition Archive
            </h2>
            <p className="text-xs text-muted-foreground font-rajdhani">
              {items.length} item{items.length > 1 ? "s" : ""} acquired
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">Total spent</p>
          <p className="font-orbitron text-lg font-bold text-amber-400">
            {formatCurrency(totalCost, currency)}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="group relative rounded-xl border border-amber-500/15 bg-card/40 backdrop-blur-sm overflow-hidden opacity-80 hover:opacity-100 transition-all"
          >
            {/* Acquired stripe */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

            {/* Image */}
            <div className="aspect-[4/3] bg-muted/10 relative overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover grayscale-[30%]"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/15" />
                </div>
              )}

              {/* Checkmark overlay */}
              <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg">
                <Check className="h-3.5 w-3.5 text-background" />
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-1.5">
              <p className="font-rajdhani font-semibold text-sm text-muted-foreground line-through truncate">
                {item.name}
              </p>

              <div className="flex items-center justify-between">
                <p className="font-orbitron text-xs font-bold text-amber-400/80">
                  {formatCurrency(Number(item.estimated_cost || 0), currency)}
                </p>
                <button
                  onClick={() => onToggleAcquired(item.id, false)}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors"
                  title="Mark as not acquired"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {item.acquired_at && (
                <p className="text-[10px] text-muted-foreground/50 font-rajdhani">
                  {format(new Date(item.acquired_at), "dd MMM yyyy")}
                </p>
              )}

              {item.goal?.name && (
                <Badge variant="outline" className="text-[9px] font-rajdhani border-amber-500/20 text-amber-500/60 truncate max-w-full">
                  {item.goal.name}
                </Badge>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
