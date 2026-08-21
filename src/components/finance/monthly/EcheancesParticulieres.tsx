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
 * DEUX VUES, PARCE QU IL Y A DEUX QUESTIONS.
 *
 * La planche repond a « qui preleve » : une fiche par creancier, le
 * portrait en haut, et l annee en douze segments dessous. C est la
 * vue de travail — on y modifie, on y desactive, on y supprime.
 *
 * Le calendrier repond a « quand est-ce que ca va faire mal » : douze
 * baies, un jeton par prelevement dans le mois ou il tombe. Quatre
 * pics a huit cents euros et sept mois vides se voient avant qu un
 * chiffre n ait ete lu.
 *
 * Aucune des deux ne remplace l autre, et la premiere ne peut pas
 * dire ce que dit la seconde : une liste ne montre pas la forme d une
 * annee, meme si chaque ligne porte son propre calendrier. D ou la
 * bascule, et le fait qu elle se souvienne du choix.
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
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CalendarClock, LayoutGrid, CalendarRange, Plus, PiggyBank } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import type { FinancialItem } from '@/types/finance';
import { PlancheDesCreanciers } from './PlancheDesCreanciers';
import { AnneeDesEcheances } from './AnneeDesEcheances';
import { provisionMensuelle, totalDuMois } from '@/lib/finance/cadence';

interface Props {
  items: FinancialItem[];
  onAdd: () => void;
  onEdit: (item: FinancialItem) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}

type Vue = 'planche' | 'annee';
const CLE_VUE = 'vowpact.echeances.vue';

/* Le choix de vue se retient. Il ne vaut pas un aller-retour en base
   — c est une preference d affichage, pas une donnee du pacte — mais
   le reperdre a chaque rechargement en ferait un choix a refaire, et
   un choix a refaire n en est plus un. */
const lireVue = (): Vue => {
  try {
    return localStorage.getItem(CLE_VUE) === 'annee' ? 'annee' : 'planche';
  } catch {
    return 'planche';
  }
};

export function EcheancesParticulieres({ items, onAdd, onEdit, onDelete, onToggleActive }: Props) {
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  const moisCourant = useMemo(() => new Date(), []);

  const [vue, setVue] = useState<Vue>(lireVue);
  const [annee, setAnnee] = useState(() => moisCourant.getFullYear());

  const choisirVue = (v: Vue) => {
    setVue(v);
    try { localStorage.setItem(CLE_VUE, v); } catch { /* le refus du stockage ne doit pas empecher la bascule */ }
  };

  const poche = provisionMensuelle(items);
  const duMois = totalDuMois(items, moisCourant);

  const nommerMois = useMemo(() => {
    const f = new Intl.DateTimeFormat(i18n.language, { month: 'short', year: 'numeric' });
    return (d: Date) => f.format(d).replace('.', '');
  }, [i18n.language]);

  const VUES: { cle: Vue; icone: typeof LayoutGrid; libelle: string }[] = [
    { cle: 'planche', icone: LayoutGrid, libelle: t('finance.particulieres.vuePlanche', 'Créanciers') },
    { cle: 'annee', icone: CalendarRange, libelle: t('finance.particulieres.vueAnnee', 'Année') },
  ];

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

        {items.length > 0 && (
          <div className="cy-part-vues" role="radiogroup" aria-label={t('finance.particulieres.quelleVue', 'Affichage')}>
            {VUES.map(({ cle, icone: Icone, libelle }) => (
              <button
                key={cle}
                type="button"
                role="radio"
                aria-checked={vue === cle}
                onClick={() => choisirVue(cle)}
                title={libelle}
              >
                <Icone aria-hidden="true" />
                <span>{libelle}</span>
              </button>
            ))}
          </div>
        )}

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
          {vue === 'planche' ? (
            <PlancheDesCreanciers
              items={items}
              moisCourant={moisCourant}
              nommerMois={nommerMois}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ) : (
            <AnneeDesEcheances
              items={items}
              moisCourant={moisCourant}
              annee={annee}
              onAnnee={setAnnee}
              onEdit={onEdit}
            />
          )}

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
