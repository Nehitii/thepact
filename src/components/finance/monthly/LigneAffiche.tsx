/**
 * LA LIGNE-AFFICHE.
 *
 * Les recurrentes se rangeaient dans des cartes de categorie. Six
 * categories sur huit ne contenaient qu une ligne, et leur en-tete
 * repetait donc le montant de cette ligne a dix pixels d ecart — deux
 * fois 16,10 € cote a cote, ce qui se lit comme un defaut d affichage
 * et non comme une information. Huit cadres identiques donnaient par
 * ailleurs le meme poids visuel a 760 € et a 6,99 €.
 *
 * TROIS CHOSES FONT CETTE LIGNE.
 *
 * LA PLAQUE, a gauche : chacune des quatorze lignes porte un logo,
 * cadre a la main, et il s affichait en seize pixels au bout d une
 * puce de couleur. Il en fait soixante-huit sur trente-huit.
 *
 * LE FILIGRANE : la meme marque deborde dans le fond de sa propre
 * ligne, a onze pour cent. C est la que se joue l identite sans couter
 * un pixel de hauteur — et c est ce qui donne de la profondeur la ou
 * il n y avait que du noir.
 *
 * LA BARRE DE POIDS, sous le montant, a l echelle de la plus lourde
 * ligne du bloc. Une liste de nombres devient une forme : le loyer
 * occupe la moitie du mois, et cela se voit avant d etre lu.
 */
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { getCategoryLabel, getExpenseCategory, getIncomeCategory } from '@/lib/financeCategories';
import { couleurDe } from '@/lib/finance/marque';
import { montantDuMois } from '@/lib/finance/cadence';
import type { FinancialItem } from '@/types/finance';
import { MarqueCreancier } from './MarqueCreancier';

interface Props {
  item: FinancialItem;
  isExpense: boolean;
  currency: string;
  moisCourant: Date;
  /** Le montant de la ligne la plus lourde du bloc : l echelle de la barre. */
  sommet: number;
  rang: number;
  onEdit: (item: FinancialItem) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}

/**
 * LES CENTIMES, DANS UNE COLONNE DE CHIFFRES.
 *
 * formatCurrency est regle sur zero decimale minimum, ce qui donne
 * « 16,1 € » a cote de « 90,83 € » — dans une colonne alignee a droite,
 * l oeil bute. On force donc deux decimales ICI et nulle part ailleurs :
 * les grands chiffres du haut de page restent sobres, et la liste
 * s aligne.
 */
const AVEC_CENTIMES = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const enChiffres = (montant: number, devise: string) =>
  `${AVEC_CENTIMES.format(montant)} ${devise.toUpperCase() === 'EUR' ? '€' : '$'}`;

export function LigneAffiche({
  item, isExpense, currency, moisCourant, sommet, rang,
  onEdit, onDelete, onToggleActive,
}: Props) {
  const { t } = useTranslation();

  const montant = montantDuMois(item, moisCourant);
  const couleur = couleurDe(item.category);
  const categorie = isExpense ? getExpenseCategory(item.category) : getIncomeCategory(item.category);
  const part = sommet > 0 ? Math.max(1, Math.round((montant / sommet) * 100)) : 0;

  return (
    <motion.li
      className="cy-aff"
      data-actif={item.is_active ? '1' : '0'}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: Math.min(rang * 0.035, 0.3) }}
    >
      {/* Le filigrane, pose avant tout le reste : il est le fond. */}
      <span className="cy-aff-filigrane" aria-hidden="true">
        <MarqueCreancier
          nom={item.name}
          iconUrl={item.icon_url}
          categorie={item.category}
          cadre={item.icon_cadre}
          taille={null}
          filigrane
        />
      </span>

      <span className="cy-aff-rail" style={{ background: couleur }} aria-hidden="true" />

      <MarqueCreancier
        nom={item.name}
        iconUrl={item.icon_url}
        categorie={item.category}
        cadre={item.icon_cadre}
        taille={null}
        className="cy-aff-plaque"
      />

      <span className="cy-aff-ident">
        <b className="cy-aff-nom" title={item.name}>{item.name}</b>
        <u className="cy-aff-cat">{getCategoryLabel(categorie, t)}</u>
      </span>

      <span className="cy-aff-chiffres">
        <b className={isExpense ? 'cy-aff-val cy-aff-moins' : 'cy-aff-val cy-aff-plus'}>
          {isExpense ? '−' : '+'}{enChiffres(montant, currency)}
        </b>
        <span className="cy-aff-poids" aria-hidden="true">
          <i style={{ width: `${part}%`, background: couleur }} />
        </span>
      </span>

      <span className="cy-aff-outils">
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
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          title={t('finance.ligne.supprimerNommee', { nom: item.name })}
          aria-label={t('finance.ligne.supprimerNommee', { nom: item.name })}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </span>
    </motion.li>
  );
}
