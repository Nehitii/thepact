import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface GoalsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function GoalsPagination({ currentPage, totalPages, onPageChange }: GoalsPaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  const btnBase =
    "px-4 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20 text-foreground/80 font-rajdhani text-sm font-medium transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-primary/20 disabled:hover:bg-card/80 disabled:hover:text-foreground/80 disabled:hover:shadow-none flex items-center gap-1.5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-2 pt-6"
    >
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className={btnBase}
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </button>

      <div className="flex items-center gap-1.5 px-2">
        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`w-9 h-9 rounded-xl font-rajdhani text-sm font-medium transition-all duration-300 flex items-center justify-center ${
              currentPage === num
                ? "bg-primary/15 border border-primary/50 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                : "bg-card/80 backdrop-blur-sm border border-primary/20 text-foreground/70 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={btnBase}
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
