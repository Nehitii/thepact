/**
 * LE CALENDRIER DE L ANNEE.
 *
 * La planche repond a « qui preleve ». Celle-ci repond a l autre
 * question, que la liste ne savait pas poser : QUAND EST-CE QUE CA VA
 * FAIRE MAL.
 *
 * Douze baies, et chaque prelevement se pose comme un jeton dans le
 * mois ou il tombe. Janvier, avril, juillet et octobre deviennent
 * visiblement lourds ; fevrier et mars visiblement vides. La forme de
 * l annee se lit avant qu un seul chiffre n ait ete lu — et la poche
 * cesse d etre un montant abstrait, puisqu on voit ce qu elle absorbe.
 *
 * L ANNEE EST DATEE, ET C EST POURQUOI ON PEUT LA CHANGER.
 *
 * Un echeancier n existe que dans les annees qu il traverse : un
 * paiement en quatre fois commence en novembre deborde sur l annee
 * suivante, et regarder 2027 est la seule facon de voir ou il finit.
 * Les fleches ne sont donc pas un ornement — sans elles, la moitie
 * d un echeancier serait invisible.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import type { FinancialItem } from '@/types/finance';
import { MarqueCreancier } from './MarqueCreancier';
import { couleurDe } from '@/lib/finance/marque';
import { montantDuMois, tombeDansLAnnee } from '@/lib/finance/cadence';

interface Props {
  items: FinancialItem[];
  moisCourant: Date;
  annee: number;
  onAnnee: (a: number) => void;
  onEdit: (item: FinancialItem) => void;
}

export function AnneeDesEcheances({ items, moisCourant, annee, onAnnee, onEdit }: Props) {
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();

  const noms = useMemo(() => {
    const f = new Intl.DateTimeFormat(i18n.language, { month: 'short' });
    return Array.from({ length: 12 }, (_, m) => f.format(new Date(2026, m, 1)).replace('.', ''));
  }, [i18n.language]);

  /* Les douze mois garnis en une passe : chaque ligne dit dans quels
     mois elle tombe, on la depose dans chacun. */
  const baies = useMemo(() => {
    const vides: { item: FinancialItem; montant: number }[][] = Array.from({ length: 12 }, () => []);
    for (const item of items) {
      if (!item.is_active) continue;
      for (const m of tombeDansLAnnee(item, annee)) {
        vides[m].push({ item, montant: montantDuMois(item, new Date(annee, m, 1)) });
      }
    }
    return vides.map((jetons) => ({
      jetons,
      total: Math.round(jetons.reduce((s, j) => s + j.montant * 100, 0)) / 100,
    }));
  }, [items, annee]);

  /* Le mois le plus lourd donne l echelle : un pic se juge par
     rapport aux autres, pas dans l absolu. */
  const sommet = Math.max(...baies.map((b) => b.total), 0);
  const moisIci = moisCourant.getFullYear() === annee ? moisCourant.getMonth() : -1;

  return (
    <motion.div
      className="cy-annee"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="cy-annee-barre">
        <button
          type="button"
          onClick={() => onAnnee(annee - 1)}
          aria-label={t('finance.annee.precedente', { annee: annee - 1, defaultValue: `${annee - 1}` })}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <b>{annee}</b>
        <button
          type="button"
          onClick={() => onAnnee(annee + 1)}
          aria-label={t('finance.annee.suivante', { annee: annee + 1, defaultValue: `${annee + 1}` })}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="cy-annee-baies">
        {baies.map((baie, m) => (
          <div key={m} className="cy-baie-mois" data-maintenant={m === moisIci ? '1' : '0'} data-vide={baie.jetons.length === 0 ? '1' : '0'}>
            <div className="cy-baie-nom">{noms[m]}</div>

            <div className="cy-baie-pile">
              {baie.jetons.map(({ item, montant }) => (
                <button
                  key={item.id}
                  type="button"
                  className="cy-jeton"
                  style={{ borderLeftColor: couleurDe(item.category) }}
                  onClick={() => onEdit(item)}
                  title={`${item.name} · ${formatCurrency(montant, currency)}`}
                >
                  <MarqueCreancier nom={item.name} iconUrl={item.icon_url} categorie={item.category} taille={18} />
                  {/* Les centimes n apprennent rien a cette taille et
                      font deborder la baie : on arrondit a l euro, et
                      le total du mois juste dessous reste exact. */}
                  <b>{Math.round(montant)}</b>
                </button>
              ))}
            </div>

            {/* La barre d echelle : elle dit le poids relatif du mois
                d un coup d oeil, la ou trois chiffres demandent d etre
                compares un a un. */}
            <span className="cy-baie-jauge" aria-hidden="true">
              <i style={{ height: sommet > 0 ? `${Math.round((baie.total / sommet) * 100)}%` : '0%' }} />
            </span>

            <div className="cy-baie-total">
              {baie.total > 0 ? formatCurrency(baie.total, currency) : '—'}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
