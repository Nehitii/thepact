import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { totalDuMois, montantDuMois } from '@/lib/finance/cadence';
import {
  type FinanceCategory,
  getItemCategory,
  groupItemsByCategory,
} from '@/lib/financeCategories';
import type { FinancialItem } from '@/types/finance';
import { LigneAffiche } from './LigneAffiche';
import { LigneRecurrente, type ValeursLigne } from './LigneRecurrente';

interface FinancialBlockProps {
  title: string;
  type: 'expense' | 'income';
  items: FinancialItem[];
  categories: FinanceCategory[];
  isLoading: boolean;
  onAdd: (v: ValeursLigne) => Promise<void>;
  onUpdate: (id: string, v: ValeursLigne) => Promise<void>;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  isPending?: boolean;
}

export function FinancialBlock({
  title,
  type,
  items,
  categories,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActive,
  isPending,
}: FinancialBlockProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  /* Une seule fenetre pour l ajout et la modification : la colonne
     est trop etroite pour un formulaire en ligne, qui en debordait. */
  const [fenetre, setFenetre] = useState(false);
  const [ligneEditee, setLigneEditee] = useState<FinancialItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const moisCourant = useMemo(() => new Date(), []);
  const totalAmount = totalDuMois(items, moisCourant);
  const isExpense = type === 'expense';

  /* RANGEES PAR CE QU ELLES PESENT CE MOIS-CI.
   *
   * Les lignes se groupaient par categorie, dans une carte chacune.
   * Six categories sur huit ne contenaient qu une ligne, et leur
   * en-tete repetait donc le montant de cette ligne a dix pixels
   * d ecart. Huit cadres identiques donnaient par ailleurs le meme
   * poids visuel a 760 euros et a 6,99.
   *
   * Une seule liste, du plus lourd au plus leger. La categorie ne
   * disparait pas : elle passe en filet de couleur sur la tranche et
   * en libelle sous le nom — elle qualifie la ligne au lieu de
   * l enfermer.
   *
   * Trier sur le montant du mois et non sur amount : une charge qui ne
   * tombe pas ce mois-ci vaut zero, et n a rien a faire en tete. */
  const rangees = useMemo(
    () => [...items].sort((a, b) => montantDuMois(b, moisCourant) - montantDuMois(a, moisCourant)),
    [items, moisCourant],
  );

  /* L echelle des barres : la plus lourde ligne du bloc. Chaque bloc a
     la sienne — sans quoi trois revenus ecraseraient onze depenses, ou
     l inverse, selon le cote le plus riche. */
  const sommet = useMemo(
    () => rangees.reduce((m, i) => Math.max(m, montantDuMois(i, moisCourant)), 0),
    [rangees, moisCourant],
  );

  const ouvrirAjout = () => { setLigneEditee(null); setFenetre(true); };
  const ouvrirEdition = (item: FinancialItem) => { setLigneEditee(item); setFenetre(true); };

  const enregistrer = async (v: ValeursLigne) => {
    if (ligneEditee) {
      await onUpdate(ligneEditee.id, v);
    } else {
      await onAdd(v);
    }
  };

  const DefaultIcon = categories[0]?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="neu-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        /* Les deux blocs se font face : leurs en-tetes doivent
           s aligner. Le calage se fait sur le titre — voir
           .cy-bloc-tete h3 dans finance-cyber.css. */
        className="cy-bloc-tete w-full flex items-center justify-between gap-4 p-6 hover:bg-muted/30 dark:hover:bg-white/[0.01] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: isExpense
                ? 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
              border: `1px solid ${isExpense ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
              boxShadow: isExpense ? '0 0 30px rgba(244,63,94,0.15)' : '0 0 30px rgba(16,185,129,0.15)',
            }}
          >
            {DefaultIcon && <DefaultIcon className={`w-5 h-5 ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`} />}
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-lg font-bold text-foreground leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {t('finance.recurring.compteLignes', { count: items.length, defaultValue: `${items.length} lignes` })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span
            className={`text-2xl font-bold tabular-nums ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}
            style={{ textShadow: isExpense ? '0 0 30px rgba(244,63,94,0.3)' : '0 0 30px rgba(16,185,129,0.3)' }}
          >
            {isExpense ? '-' : '+'}{formatCurrency(totalAmount, currency)}
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="w-8 h-8 rounded-lg neu-inset flex items-center justify-center">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-6 pb-6 space-y-4">
              <button type="button" className="cy-ajouter" onClick={ouvrirAjout}>
                <Plus aria-hidden="true" />
                {t(`finance.ligne.titreAjout.${type}`)}
              </button>

              {/* PLUS D ASCENSEUR DANS LA CARTE.
                  Le bloc portait son propre defilement, borne a 450px :
                  la liste paraissait tronquee, et l on ne pouvait pas
                  comparer les deux colonnes d un coup d oeil. La page
                  defile, le bloc non. */}
              <div className="cy-affiches">
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : rangees.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isExpense ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                      {DefaultIcon && <DefaultIcon className={`w-8 h-8 ${isExpense ? 'text-rose-400/50' : 'text-emerald-400/50'}`} />}
                    </div>
                    <p className="text-muted-foreground text-sm">{t('finance.recurring.emptyTitle', { type: t(`finance.recurring.${type}Single`) })}</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">{t('finance.recurring.emptyHint')}</p>
                  </div>
                ) : (
                  <ul className="cy-affiches-liste">
                    {rangees.map((item, i) => (
                      <LigneAffiche
                        key={item.id}
                        item={item}
                        rang={i}
                        isExpense={isExpense}
                        currency={currency}
                        moisCourant={moisCourant}
                        sommet={sommet}
                        onEdit={ouvrirEdition}
                        onDelete={onDelete}
                        onToggleActive={onToggleActive}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LigneRecurrente
        ouvert={fenetre}
        onOuvert={setFenetre}
        type={type}
        categories={categories}
        ligne={ligneEditee}
        onEnregistrer={enregistrer}
        enCours={isPending}
      />
    </motion.div>
  );
}