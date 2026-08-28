/**
 * LA PLANCHE DE CONTACTS.
 *
 * Une fiche par creancier, et le portrait occupe le haut de la fiche.
 * C est la vue qui donne le plus de place a l image : Amazon Prime se
 * reconnait sans lire un mot, et un syndic sans logo porte sa plaque
 * d initiales — qui est un objet, pas un vide.
 *
 * Sous le portrait, l annee en douze segments. C est la meme lecture
 * que la grille de saisie, en plus court : quatre segments allumes
 * disent un trimestre avant que le mot ne soit lu.
 *
 * CE QU ON MONTRE ET CE QU ON TAIT.
 *
 * Le cout annuel ne parait que s il apprend quelque chose. Pour une
 * charge annuelle il vaut le montant, et deux fois 69,90 cote a cote
 * se lisent comme un defaut d affichage, pas comme une information.
 */
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useCurrency } from '@/socle/contextes/CurrencyContext';
import { formatCurrency } from '@/socle/outils/currency';
import type { FinancialItem } from '@/domaines/finance/types';
import { MarqueCreancier } from './MarqueCreancier';
import { couleurDe } from '@/domaines/finance/logique/marque';
import {
  cadenceDe, montantDuMois, tombeEn, prochaineEcheance,
  rangEcheance, tombeDansLAnnee,
} from '@/domaines/finance/logique/cadence';

interface Props {
  items: FinancialItem[];
  moisCourant: Date;
  nommerMois: (d: Date) => string;
  onEdit: (item: FinancialItem) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}

export function PlancheDesCreanciers({ items, moisCourant, nommerMois, onEdit, onDelete, onToggleActive }: Props) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const annee = moisCourant.getFullYear();

  const parAn = (item: FinancialItem) => {
    if (item.echeances != null) return item.montant_total ?? item.amount * item.echeances;
    return item.amount * (12 / (item.periode_mois || 1));
  };

  return (
    <div className="cy-planche">
      {items.map((item, i) => {
        const tombe = tombeEn(item, moisCourant);
        const suivante = prochaineEcheance(item, moisCourant);
        const rang = rangEcheance(item, moisCourant);
        const mois = new Set(tombeDansLAnnee(item, annee));
        const annuel = parAn(item);
        const annuelUtile = Math.abs(annuel - item.amount) >= 0.005;
        const couleur = couleurDe(item.category);

        return (
          <motion.article
            key={item.id}
            className="cy-fiche"
            data-actif={item.is_active ? '1' : '0'}
            data-tombe={tombe ? '1' : '0'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.24) }}
          >
            <div className="cy-fiche-portrait">
              <MarqueCreancier
                nom={item.name}
                iconUrl={item.icon_url}
                categorie={item.category}
                cadre={item.icon_cadre}
                taille={null}
              />
              <span className="cy-fiche-rail" style={{ background: couleur }} aria-hidden="true" />
            </div>

            <div className="cy-fiche-corps">
              <h4 className="cy-fiche-nom" title={item.name}>{item.name}</h4>

              {/* L ANNEE EN DOUZE SEGMENTS.
                  Le mois en cours se marque d un trait jaune sous le
                  segment plutot que de le colorer : le jaune est la
                  couleur de l appareil, il ne dit jamais une donnee —
                  et un mois qui tombe ET qui est le mois en cours doit
                  pouvoir dire les deux a la fois. */}
              <span
                className="cy-fiche-arc"
                role="img"
                aria-label={t(`finance.cadence.${cadenceDe(item)}`, cadenceDe(item))}
              >
                {Array.from({ length: 12 }, (_, m) => (
                  <i
                    key={m}
                    aria-hidden="true"
                    data-on={mois.has(m) ? '1' : '0'}
                    data-now={m === moisCourant.getMonth() ? '1' : '0'}
                  />
                ))}
              </span>

              <div className="cy-fiche-pied">
                <span className="cy-fiche-montant">
                  {formatCurrency(tombe ? montantDuMois(item, moisCourant) : item.amount, currency)}
                </span>
                <span className="cy-fiche-cadence">
                  {item.echeances != null
                    ? `${Math.max(rang, 1)}/${item.echeances}`
                    : t(`finance.cadence.${cadenceDe(item)}`, cadenceDe(item))}
                </span>
              </div>

              <p className="cy-fiche-note" data-ce-mois={tombe ? '1' : '0'}>
                {tombe
                  ? t('finance.particulieres.ceMois', 'ce mois-ci')
                  : annuelUtile
                    ? t(item.echeances != null ? 'finance.particulieres.puisTotal' : 'finance.particulieres.puisAn',
                        { montant: formatCurrency(annuel, currency) })
                    : suivante
                      ? t('finance.particulieres.prochaine', {
                          mois: nommerMois(suivante),
                          defaultValue: `prochaine : ${nommerMois(suivante)}`,
                        })
                      : t('finance.cadence.terminee', 'terminé')}
              </p>
            </div>

            {/* Les outils restent visibles plutot que de paraitre au
                survol : au doigt, il n y a pas de survol. */}
            <div className="cy-fiche-outils">
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
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
