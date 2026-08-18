import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface GoalsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function GoalsPagination({ currentPage, totalPages, onPageChange }: GoalsPaginationProps) {
  // Le hook doit preceder tout retour anticipe : appele apres le
  // `return null`, il ne s'executerait plus des que le nombre de pages
  // retombe a un, et React lance alors une erreur d'ordre des hooks.
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  /* Le backdrop-blur-sm qui etait ici moyennait le champ d'etoiles en
     gris — le meme defaut retire de onze panneaux du tableau de bord
     puis de toute la page Statistiques. */
  const btnBase = "gl-page-btn";

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
        <span>{t("common.previous", "Précédent")}</span>
      </button>

      <div className="flex items-center gap-1.5 px-2">
        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className="gl-page-num"
            data-actif={currentPage === num}
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
        <span>{t("common.next", "Suivant")}</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
