import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, ChevronRight, EyeOff, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/currency';
import { type FinanceCategory, getCategoryLabel } from '@/lib/financeCategories';
import type { FinancialItem } from '@/types/finance';

export interface CategoryGroupProps {
  category: FinanceCategory;
  items: FinancialItem[];
  allCategories: FinanceCategory[];
  isExpense: boolean;
  currency: string;
  /** Ouvre la fenetre de modification : l edition en ligne debordait. */
  onEdit: (item: FinancialItem) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}

export function CategoryGroup({
  category,
  items,
  allCategories,
  isExpense,
  currency,
  onEdit,
  onDelete,
  onToggleActive,
}: CategoryGroupProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const categoryTotal = items.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
  const Icon = category.icon;
  const hexColor = category.hexColor;

  return (
    <motion.div
      className="category-pill overflow-hidden"
      style={{ '--category-color': hexColor } as React.CSSProperties}
      layout
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 dark:hover:bg-white/[0.02] transition-all duration-200"
      >
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }} className="text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ backgroundColor: `${hexColor}15`, boxShadow: `0 0 20px ${hexColor}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: hexColor }} />
        </div>
        <span className="flex-1 text-left text-sm font-semibold text-foreground/90">
          {getCategoryLabel(category, t)}
        </span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted/40 dark:bg-white/[0.03]">
          {items.length}
        </span>
        <span className={`text-sm font-bold tabular-nums ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isExpense ? '-' : '+'}{formatCurrency(categoryTotal, currency)}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cy-lignes">
              {items.map((item) => (
                <div key={item.id} className="cy-ligne" data-type={isExpense ? "expense" : "income"} data-actif={item.is_active ? "1" : "0"}>
                  {item.icon_url ? (
                    <img src={item.icon_url} alt="" className="cy-ligne-vignette" loading="lazy" decoding="async" />
                  ) : item.icon_emoji ? (
                    <span aria-hidden="true">{item.icon_emoji}</span>
                  ) : null}

                  <span className="cy-ligne-nom">{item.name}</span>
                  <span className="cy-ligne-montant">
                    {isExpense ? "-" : "+"}{formatCurrency(item.amount, currency)}
                  </span>

                  {/* Les actions ne se cachent plus derriere le survol :
                      au doigt, elles n existaient pas. */}
                  <span className="cy-ligne-actions">
                    {onToggleActive && (
                      <button
                        type="button"
                        onClick={() => onToggleActive(item.id, !item.is_active)}
                        title={item.is_active ? t("finance.recurring.deactivate") : t("finance.recurring.activate")}
                        aria-label={item.is_active ? t("finance.recurring.deactivate") : t("finance.recurring.activate")}
                      >
                        {item.is_active ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title={t("finance.ligne.titreEdition")}
                      aria-label={t("finance.ligne.modifierNommee", { nom: item.name })}
                    >
                      <Edit2 aria-hidden="true" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button type="button" className="est-rouge" aria-label={t("finance.ligne.supprimerNommee", { nom: item.name })}>
                          <Trash2 aria-hidden="true" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="cy-reg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("finance.deleteConfirm.title")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("finance.deleteConfirm.description", { name: item.name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="cy-reg-annuler">{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(item.id)} className="cy-valider est-rouge">
                            {t("finance.deleteConfirm.confirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}