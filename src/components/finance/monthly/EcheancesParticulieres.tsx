/**
 * LES ECHEANCES PARTICULIERES.
 *
 * Les charges mensuelles se ressemblent : meme montant, tous les mois,
 * on les lit comme un bloc. Celles qui ne tombent pas tous les mois ne
 * se lisent pas ainsi. Un impot foncier de cinq cent cinquante-quatre
 * euros preleve quatre fois par an n a rien a faire au milieu d un
 * abonnement a sept euros — il ecrase la liste onze mois sur douze
 * sans y peser, et le douzieme il la fait mentir.
 *
 * Elles ont donc leur panneau. Chacune y montre ce qu on veut savoir
 * d elle et qui n a aucun sens pour une mensuelle : quand elle tombe,
 * combien de fois il reste, ce qu elle coute a l annee.
 *
 * ET SURTOUT LA POCHE.
 *
 * Une charge trimestrielle ne pese que le mois ou elle tombe, mais
 * elle vient. La poche de securite est ce qu il faudrait mettre de
 * cote chaque mois pour l absorber sans a-coup : huit cent douze euros
 * par trimestre font deux cent soixante-dix euros par mois. Ce n est
 * pas une depense — c est une somme qu on garde — et c est pourquoi
 * elle ne se melange pas au total du mois, et pourquoi le solde offre
 * de la deduire plutot que de le faire d office.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CalendarClock, Eye, EyeOff, Pencil, Plus, Trash2, PiggyBank } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import type { FinancialItem } from '@/types/finance';
import {
  cadenceDe, montantDuMois, tombeEn, prochaineEcheance, moisEntre,
  rangEcheance, provisionMensuelle, totalDuMois,
} from '@/lib/finance/cadence';

interface Props {
  items: FinancialItem[];
  onAdd: () => void;
  onEdit: (item: FinancialItem) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}

const MOIS_COURTS = [
  'janv', 'févr', 'mars', 'avr', 'mai', 'juin',
  'juil', 'août', 'sept', 'oct', 'nov', 'déc',
];

export function EcheancesParticulieres({ items, onAdd, onEdit, onDelete, onToggleActive }: Props) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const moisCourant = useMemo(() => new Date(), []);

  const poche = provisionMensuelle(items);
  const duMois = totalDuMois(items, moisCourant);

  /* Ce qu une charge coute a l annee : c est le chiffre qui permet de
     comparer une trimestrielle a une mensuelle, et il n apparait nulle
     part ailleurs. */
  const parAn = (item: FinancialItem) => {
    if (item.echeances != null) return item.montant_total ?? item.amount * item.echeances;
    return item.amount * (12 / (item.periode_mois || 1));
  };

  /* Les mois de l annee ou la charge tombe, dits en clair. « janv ·
     avr · juil · oct » vaut mieux que « tous les trois mois », qui
     oblige a compter. */
  const moisDeChute = (item: FinancialItem) => {
    if (item.echeances != null || !item.mois_ancre) return null;
    const periode = item.periode_mois || 1;
    if (periode <= 1) return null;
    const depart = new Date(String(item.mois_ancre).slice(0, 7) + '-01T00:00:00').getMonth();
    const mois: string[] = [];
    for (let i = 0; i < 12 / periode; i++) mois.push(MOIS_COURTS[(depart + i * periode) % 12]);
    return mois.join(' · ');
  };

  return (
    <motion.div
      className="cy-part"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <header className="cy-part-tete">
        <CalendarClock aria-hidden="true" />
        <h3>{t('finance.particulieres.titre', 'Échéances particulières')}</h3>
        <span className="cy-part-compte">
          {t('finance.particulieres.compte', { count: items.length, defaultValue: `${items.length} lignes` })}
        </span>
        <button type="button" className="cy-part-ajout" onClick={onAdd}>
          <Plus aria-hidden="true" />
          {t('finance.particulieres.ajouter', 'Ajouter')}
        </button>
      </header>

      {items.length === 0 ? (
        <p className="cy-part-vide">
          {t('finance.particulieres.vide',
            'Rien ici. Une charge trimestrielle, annuelle ou payée en plusieurs fois se saisit comme une autre — c’est sa cadence qui l’amène dans ce panneau.')}
        </p>
      ) : (
        <>
          <ul className="cy-part-liste">
            {items.map((item) => {
              const tombe = tombeEn(item, moisCourant);
              const suivante = prochaineEcheance(item, moisCourant);
              const rang = rangEcheance(item, moisCourant);
              const calendrier = moisDeChute(item);
              return (
                <li key={item.id} className="cy-part-ligne" data-actif={item.is_active ? '1' : '0'} data-tombe={tombe ? '1' : '0'}>
                  <span className="cy-part-nom">
                    {item.name}
                    <b>{item.echeances != null
                      ? `${Math.max(rang, 1)}/${item.echeances}`
                      : t(`finance.cadence.${cadenceDe(item)}`, cadenceDe(item))}</b>
                  </span>

                  <span className="cy-part-quand">
                    {calendrier ?? (suivante
                      ? t('finance.particulieres.prochaine', {
                          mois: `${MOIS_COURTS[suivante.getMonth()]} ${suivante.getFullYear()}`,
                          defaultValue: `prochaine : ${MOIS_COURTS[suivante.getMonth()]} ${suivante.getFullYear()}`,
                        })
                      : t('finance.cadence.terminee', 'terminé'))}
                  </span>

                  <span className="cy-part-montant" data-ce-mois={tombe ? '1' : '0'}>
                    {formatCurrency(tombe ? montantDuMois(item, moisCourant) : item.amount, currency)}
                    {tombe && <u>{t('finance.particulieres.ceMois', 'ce mois-ci')}</u>}
                  </span>

                  <span className="cy-part-an">
                    {formatCurrency(parAn(item), currency)}
                    <u>{item.echeances != null
                      ? t('finance.particulieres.auTotal', 'au total')
                      : t('finance.particulieres.parAn', 'par an')}</u>
                  </span>

                  <span className="cy-part-actions">
                    {onToggleActive && (
                      <button
                        type="button"
                        onClick={() => onToggleActive(item.id, !item.is_active)}
                        title={item.is_active ? t('finance.recurring.deactivate') : t('finance.recurring.activate')}
                        aria-label={item.is_active ? t('finance.recurring.deactivate') : t('finance.recurring.activate')}
                      >
                        {item.is_active ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                      </button>
                    )}
                    <button type="button" onClick={() => onEdit(item)} title={t('finance.ligne.titreEdition')} aria-label={t('finance.ligne.titreEdition')}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => onDelete(item.id)} title={t('common.delete')} aria-label={t('common.delete')}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>

          <footer className="cy-part-pied">
            <span className="cy-part-poche">
              <PiggyBank aria-hidden="true" />
              {t('finance.particulieres.poche', 'Poche de sécurité')}
              <strong>{formatCurrency(poche, currency)}</strong>
              <u>{t('finance.particulieres.parMois', 'par mois')}</u>
            </span>
            {duMois > 0 && (
              <span className="cy-part-dumois">
                {t('finance.particulieres.duMois', 'dont ce mois-ci')}
                <strong>{formatCurrency(duMois, currency)}</strong>
              </span>
            )}
          </footer>
        </>
      )}
    </motion.div>
  );
}
