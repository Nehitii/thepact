import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PactSettingsCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  /** Anchor id for scroll-to navigation */
  sectionId?: string;
  /** Whether the section starts collapsed. Default false */
  defaultCollapsed?: boolean;
}

export function PactSettingsCard({
  icon,
  title,
  description,
  children,
  sectionId,
  defaultCollapsed = false,
}: PactSettingsCardProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  return (
    <div className="relative" id={sectionId}>
      <Card variant="clean" className={cn("shop-card bg-card/70 border-primary/20 overflow-hidden")}>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className={cn(
            "w-full px-5 py-4 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-transparent to-primary/5",
            "flex items-center gap-3 text-left cursor-pointer select-none",
            "hover:from-primary/10 hover:to-primary/10 transition-colors"
          )}
        >
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-orbitron uppercase tracking-wider text-sm text-primary">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground font-rajdhani mt-0.5 truncate">
              {description}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-primary/50 flex-shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
