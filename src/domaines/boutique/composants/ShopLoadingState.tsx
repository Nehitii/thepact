import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ShopLoadingStateProps {
  type: "cosmetics" | "modules" | "bonds";
  count?: number;
}

export function ShopLoadingState({ type, count = 6 }: ShopLoadingStateProps) {
  if (type === "modules") {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
            <div className="w-4 h-4 rounded bg-primary/20 animate-pulse" />
            <div className="w-32 h-4 rounded bg-primary/20 animate-pulse" />
          </div>
          <div className="w-48 h-7 rounded bg-muted/20 animate-pulse mx-auto" />
          <div className="w-80 h-4 rounded bg-muted/10 animate-pulse mx-auto" />
        </div>

        {/* Module Cards Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border-2 border-primary/10 bg-card/30 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-5 mb-5">
                  {/* Icon Skeleton */}
                  <div className="w-20 h-20 rounded-2xl bg-muted/20 animate-pulse" />
                  
                  {/* Content Skeleton */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-6 rounded bg-muted/20 animate-pulse" />
                      <div className="w-16 h-5 rounded-full bg-muted/10 animate-pulse" />
                    </div>
                    <div className="w-20 h-4 rounded bg-muted/10 animate-pulse" />
                    <div className="w-full h-4 rounded bg-muted/10 animate-pulse" />
                    <div className="w-2/3 h-4 rounded bg-muted/10 animate-pulse" />
                  </div>
                  
                  {/* Price Skeleton */}
                  <div className="w-32 space-y-2">
                    <div className="w-24 h-8 rounded bg-muted/20 animate-pulse ml-auto" />
                    <div className="w-full h-10 rounded bg-muted/10 animate-pulse" />
                  </div>
                </div>
                
                {/* Features Skeleton */}
                <div className="pt-4 border-t border-primary/10">
                  <div className="w-28 h-4 rounded bg-muted/10 animate-pulse mb-3" />
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-4 rounded bg-muted/5 animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "bonds") {
    return (
      <div className="space-y-8">
        {/* Balance Skeleton */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
            <div className="space-y-2">
              <div className="w-20 h-3 rounded bg-muted/20 animate-pulse" />
              <div className="w-16 h-7 rounded bg-muted/30 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Packs Grid Skeleton */}
        <div className="space-y-4">
          <div className="w-24 h-5 rounded bg-muted/20 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border-2 border-primary/10 bg-card/30"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted/20 animate-pulse" />
                    <div className="w-16 h-7 rounded bg-muted/30 animate-pulse" />
                  </div>
                  <div className="w-24 h-4 rounded bg-muted/10 animate-pulse" />
                  <div className="w-full h-10 rounded bg-muted/10 animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Cosmetics grid skeleton
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative p-4 rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          
          {/* Preview Area */}
          <div className="h-24 rounded-lg bg-muted/10 animate-pulse mb-4 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-muted/30" />
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <div className="w-3/4 h-5 rounded bg-muted/20 animate-pulse" />
            <div className="w-1/2 h-4 rounded bg-muted/10 animate-pulse" />
            <div className="flex items-center justify-between mt-3">
              <div className="w-16 h-5 rounded bg-muted/10 animate-pulse" />
              <div className="w-14 h-8 rounded bg-muted/10 animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
