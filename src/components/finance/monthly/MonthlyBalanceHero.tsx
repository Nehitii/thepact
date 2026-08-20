import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AnimatedNumber } from '../widgets';

/* LE SOLDE DU MOIS
 *
 * Trois lectures dans la meme forme que le cartouche du pacte : ce
 * qui entre, ce qui sort, ce qui reste. Le solde porte le jaune de
 * l appareil, parce que c est lui qui commande l horizon de
 * financement — une lecture de la machine autant qu une donnee.
 *
 * L ancien bloc affichait un seul enorme nombre centre sans dire de
 * quoi il etait fait : on lisait le resultat sans voir les termes.
 */

interface MonthlyBalanceHeroProps {
  totalIncome: number;
  totalExpenses: number;
}

export function MonthlyBalanceHero({ totalIncome, totalExpenses }: MonthlyBalanceHeroProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const netBalance = totalIncome - totalExpenses;

  const partEntrees = useMemo(() => {
    const total = totalIncome + totalExpenses;
    return total > 0 ? (totalIncome / total) * 100 : 50;
  }, [totalIncome, totalExpenses]);

  const lectures = [
    { cle: 'entrees', icone: ArrowUpRight, valeur: totalIncome, libelle: t('finance.monthly.income') },
    { cle: 'sorties', icone: ArrowDownRight, valeur: totalExpenses, libelle: t('finance.monthly.expenses') },
    { cle: 'solde', icone: Scale, valeur: netBalance, libelle: t('finance.monthly.monthlyBalance') },
  ] as const;

  return (
    <div>
      <div className="cy-mois-hero">
        {lectures.map(({ cle, icone: Icone, valeur, libelle }, i) => (
          <motion.div
            key={cle}
            className="cy-lect"
            data-ton={cle}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="cy-lect-cran" aria-hidden="true">
              <u /><u /><u />
            </span>
            <span className="cy-lect-nom">
              <Icone aria-hidden="true" />
              {libelle}
            </span>
            <strong className="cy-lect-val">
              <AnimatedNumber
                value={valeur}
                currency={currency}
                isPositive={cle === 'solde' ? netBalance >= 0 : true}
                showSign={cle === 'solde'}
              />
            </strong>
          </motion.div>
        ))}
      </div>

      {/* La balance : ce qui entre contre ce qui sort, d un seul trait. */}
      {(totalIncome > 0 || totalExpenses > 0) && (
        <div
          className="cy-balance"
          role="img"
          aria-label={t('finance.monthly.ratio', { pct: Math.round(partEntrees) })}
        >
          <motion.i
            data-cote="entrees"
            initial={{ width: 0 }}
            animate={{ width: `${partEntrees}%` }}
            transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.i
            data-cote="sorties"
            initial={{ width: 0 }}
            animate={{ width: `${100 - partEntrees}%` }}
            transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}
    </div>
  );
}
