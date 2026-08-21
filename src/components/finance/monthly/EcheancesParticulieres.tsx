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
 * CE QU ON MONTRE, ET CE QU ON A CESSE DE MONTRER.
 *
 * La premiere version alignait quatre colonnes de texte. Le mois de
 * chute — « juin » — flottait seul au milieu d une colonne vide, et
 * une ligne annuelle affichait deux fois le meme chiffre a dix pixels
 * d intervalle : son montant, puis son cout annuel, qui pour elle est
 * le meme nombre. Deux fois 69,90 cote a cote se lisent comme un
 * defaut d affichage, pas comme une information.
 *
 * « juin » devient donc l annee entiere en douze cases, dont une
 * allumee : c est la meme grille que celle ou on l a reglee, et la
 * cadence se voit avant d etre lue. Et le cout annuel ne parait que
 * lorsqu il apprend quelque chose — soit quand il differe du montant.
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
import { BandeDesMois } from './SelecteurDeMois';
import {
  cadenceDe, montantDuMois, tombeEn, prochaineEcheance,
  rangEcheance, provisionMensuelle, totalDuMois, moisDeChute,
} from '@/lib/finance/cadence';

interface Props {
  items: FinancialItem[];
  onAdd: () => void;
  onEdit: (item: FinancialItem) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}

export function EcheancesParticulieres({ items, onAdd, onEdit, onDelete, onToggleActive }: Props) {
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  const moisCourant = useMemo(() => new Date(), []);

  const poche = provisionMensuelle(items);
  const duMois = totalDuMois(items, moisCourant);

  const nommerMois = useMemo(() => {
    const f = new Intl.DateTimeFormat(i18n.language, { month: 'short', year: 'numeric' });
    return (d: Date) => f.format(d).replace('.', '');
  }, [i18n.language]);

  /* Ce qu une charge coute a l annee : c est le chiffre qui permet de
     comparer une trimestrielle a une mensuelle. */
  const parAn = (item: FinancialItem) => {
    if (item.echeances != null) return item.montant_total ?? item.amount * item.echeances;
    return item.amount * (12 / (item.periode_mois || 1));
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
              const mois = moisDeChute(item);
              const annuel = parAn(item);
              /* Le cout annuel ne parait que s il apprend quelque
                 chose. Pour une charge annuelle il vaut le montant, et
                 le repeter donnerait a lire deux fois le meme nombre. */
              const annuelUtile = Math.abs(annuel - item.amount) >= 0.005;

              return (
                <li key={item.id} className="cy-part-ligne" data-actif={item.is_active ? '1' : '0'} data-tombe={tombe ? '1' : '0'}>
                  <span className="cy-part-nom">
                    {item.name}
                    <b>{item.echeances != null
                      ? `${Math.max(rang, 1)}/${item.echeances}`
                      : t(`finance.cadence.${cadenceDe(item)}`, cadenceDe(item))}</b>
                  </span>

                  {/* L ANNEE, EN DOUZE CASES.
                      La meme grille que celle ou on l a reglee : ce
                      qu on coche est ce qu on relit. Un echeancier n a
                      pas de motif annuel — ses echeances se suivent et
                      franchissent le 31 decembre — il montre donc son
                      avancement, qui est ce qui le concerne. */}
                  <span className="cy-part-quand">
                    {item.echeances != null ? (
                      <span className="cy-part-jauge" role="img" aria-label={`${Math.max(rang, 1)}/${item.echeances}`}>
                        {Array.from({ length: item.echeances }, (_, i) => (
                          <i key={i} aria-hidden="true" data-passe={i < Math.max(rang, 1) ? '1' : '0'} />
                        ))}
                      </span>
                    ) : (
                      <BandeDesMois
                        mois={mois}
                        moisCourant={moisCourant.getMonth()}
                        titre={t(`finance.cadence.${cadenceDe(item)}`, cadenceDe(item))}
                      />
                    )}
                    <u>
                      {tombe
                        ? t('finance.particulieres.ceMois', 'ce mois-ci')
                        : suivante
                          ? t('finance.particulieres.prochaine', {
                              mois: nommerMois(suivante),
                              defaultValue: `prochaine : ${nommerMois(suivante)}`,
                            })
                          : t('finance.cadence.terminee', 'terminé')}
                    </u>
                  </span>

                  <span className="cy-part-montant" data-ce-mois={tombe ? '1' : '0'}>
                    {formatCurrency(tombe ? montantDuMois(item, moisCourant) : item.amount, currency)}
                    <u>
                      {annuelUtile
                        ? t(item.echeances != null ? 'finance.particulieres.puisTotal' : 'finance.particulieres.puisAn',
                            { montant: formatCurrency(annuel, currency) })
                        : item.echeances != null
                          ? t('finance.particulieres.auTotal', 'au total')
                          : t('finance.particulieres.parAn', 'par an')}
                    </u>
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
