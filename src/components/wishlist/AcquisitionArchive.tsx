import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { Trophy, Check, ImageIcon, Undo2, Edit, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";

interface AcquisitionArchiveProps {
  items: PactWishlistItem[];
  currency: string;
  onToggleAcquired: (id: string, acquired: boolean) => void;
  onEdit?: (item: PactWishlistItem) => void;
}

export function AcquisitionArchive({ items, currency, onToggleAcquired, onEdit }: AcquisitionArchiveProps) {
  if (items.length === 0) return null;

  const totalCost = items.reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);
  const thisMonth = new Date();
  const thisMonthItems = items.filter((i) => {
    if (!i.acquired_at) return false;
    const d = new Date(i.acquired_at);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  });
  const thisMonthCost = thisMonthItems.reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);

  return (
    <div className="space-y-5 mt-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center bg-amber-500/10 border border-amber-500/20" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-mono text-sm tracking-[0.15em] uppercase text-foreground font-bold">
              Acquisition Archive
            </h2>
            <p className="text-xs text-muted-foreground font-rajdhani">
              {items.length} item{items.length > 1 ? "s" : ""} secured
              {thisMonthItems.length > 0 && (
                <span className="text-amber-400 ml-2">
                  • {thisMonthItems.length} this month ({formatCurrency(thisMonthCost, currency)})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-[0.2em]">Total spent</p>
          <p className="font-mono text-lg font-bold text-amber-400">
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
            className="group relative bg-slate-950/60 backdrop-blur-sm border border-amber-500/10 overflow-hidden opacity-75 hover:opacity-100 transition-all"
            style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
          >
            {/* Amber top strip */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            {/* Image */}
            <div className="aspect-[4/3] bg-slate-900/50 relative overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-slate-700" />
                </div>
              )}

              {/* Checkmark */}
              <div className="absolute top-2 right-2 h-5 w-5 rounded-sm bg-amber-500/90 flex items-center justify-center shadow-lg">
                <Check className="h-3 w-3 text-slate-950" />
              </div>

              {/* Edit/Undo overlay */}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {onEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(item)}
                    className="h-8 w-8 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-sm"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onToggleAcquired(item.id, false)}
                  className="h-8 w-8 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-sm"
                  title="Mark as not acquired"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 inline-flex items-center justify-center bg-slate-800/50 border border-slate-600/30 text-slate-400 hover:bg-slate-700/50 rounded-sm transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-1.5">
              <p className="font-rajdhani font-semibold text-sm text-muted-foreground truncate">
                {item.name}
              </p>

              <div className="flex items-center justify-between">
                <p className="font-mono text-xs font-bold text-amber-400/80">
                  {formatCurrency(Number(item.estimated_cost || 0), currency)}
                </p>
              </div>

              {item.acquired_at && (
                <p className="text-[10px] text-cyan-500/40 font-mono">
                  {format(new Date(item.acquired_at), "dd MMM yyyy")}
                </p>
              )}

              {item.goal?.name && (
                <Badge variant="outline" className="text-[9px] font-mono border-amber-500/20 text-amber-500/60 truncate max-w-full rounded-sm">
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
