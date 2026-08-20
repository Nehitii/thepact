import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Tag, Type, Coins, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbol } from '@/lib/currency';
import { getCategoryLabel, type FinanceCategory } from '@/lib/financeCategories';
import { FinanceImageUpload } from '../FinanceImageUpload';
import type { FinancialItem } from '@/types/finance';

/* UNE LIGNE RECURRENTE
 *
 * L ajout et la modification se faisaient EN LIGNE, dans une colonne
 * de quatre cents pixels : une vignette, un menu deroulant de cent
 * trente pixels, deux champs et deux boutons sur une seule rangee.
 * Le formulaire debordait de son cadre, les libelles disparaissaient
 * derriere des indices grises, et le menu de categorie ne montrait
 * qu une valeur a la fois.
 *
 * Les deux gestes passent dans une fenetre, ou il y a la place de
 * nommer les choses. Les categories deviennent une grille : on les
 * voit toutes, avec leur nom, d un coup d oeil — c est un choix, pas
 * une liste a derouler.
 */

export interface ValeursLigne {
  name: string;
  amount: number;
  category?: string;
  iconEmoji?: string;
  iconUrl?: string;
}

interface LigneRecurrenteProps {
  ouvert: boolean;
  onOuvert: (v: boolean) => void;
  type: 'expense' | 'income';
  categories: FinanceCategory[];
  /** Nulle pour une creation. */
  ligne: FinancialItem | null;
  onEnregistrer: (v: ValeursLigne) => Promise<void>;
  enCours?: boolean;
}

export function LigneRecurrente({
  ouvert, onOuvert, type, categories, ligne, onEnregistrer, enCours,
}: LigneRecurrenteProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState(categories[0]?.value ?? '');
  const [urlIcone, setUrlIcone] = useState('');

  useEffect(() => {
    if (!ouvert) return;
    setNom(ligne?.name ?? '');
    setMontant(ligne ? String(ligne.amount) : '');
    setCategorie(ligne?.category ?? categories[0]?.value ?? '');
    setUrlIcone(ligne?.icon_url ?? '');
  }, [ouvert, ligne, categories]);

  const valeur = parseFloat(montant.replace(',', '.'));
  const valide = nom.trim().length > 0 && Number.isFinite(valeur) && valeur > 0;

  const enregistrer = async () => {
    if (!valide || enCours) return;
    await onEnregistrer({
      name: nom.trim(),
      amount: valeur,
      category: categorie || undefined,
      iconUrl: urlIcone || undefined,
    });
    onOuvert(false);
  };

  return (
    <Dialog open={ouvert} onOpenChange={onOuvert}>
      <DialogContent className="cy-reg [&>button]:hidden">
        <DialogTitle className="sr-only">
          {ligne ? t('finance.ligne.titreEdition') : t(`finance.ligne.titreAjout.${type}`)}
        </DialogTitle>

        <header className="cy-reg-tete">
          <span className="cy-index" aria-hidden="true">{type === 'expense' ? '−' : '+'}</span>
          <h2 className="cy-nom">
            {ligne ? t('finance.ligne.titreEdition') : t(`finance.ligne.titreAjout.${type}`)}
          </h2>
          <span className="cy-conduite" aria-hidden="true" />
          <button
            type="button"
            className="cy-outil"
            onClick={() => onOuvert(false)}
            aria-label={t('common.cancel')}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="cy-reg-corps">
          {/* ── La categorie : toutes visibles, avec leur nom ── */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">
              <Tag aria-hidden="true" />
              {t('finance.recurring.category')}
            </span>
            <div className="cy-cats" role="radiogroup" aria-label={t('finance.recurring.category')}>
              {categories.map((c) => {
                const Icone = c.icon;
                const choisie = categorie === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={choisie}
                    className="cy-cat"
                    style={{ ['--cy-cat' as string]: c.hexColor }}
                    onClick={() => setCategorie(c.value)}
                  >
                    <Icone aria-hidden="true" />
                    <span>{getCategoryLabel(c, t)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Le libelle ─────────────────────────────────── */}
          <div className="cy-reg-rang">
            <label className="cy-reg-nom" htmlFor="ligne-nom">
              <Type aria-hidden="true" />
              {t('finance.ligne.libelle')}
            </label>
            <div className="cy-reg-champ">
              <input
                id="ligne-nom"
                type="text"
                className="cy-saisie"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder={t('finance.recurring.namePlaceholder')}
                autoComplete="off"
              />
            </div>
          </div>

          {/* ── Le montant ─────────────────────────────────── */}
          <div className="cy-reg-rang">
            <label className="cy-reg-nom" htmlFor="ligne-montant">
              <Coins aria-hidden="true" />
              {t('finance.ligne.montant')}
            </label>
            <div className="cy-reg-champ">
              <input
                id="ligne-montant"
                type="text"
                className="cy-saisie"
                inputMode="decimal"
                value={montant}
                onChange={(e) => setMontant(e.target.value.replace(/[^0-9.,]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') enregistrer(); }}
                placeholder="0"
              />
              <b>{getCurrencySymbol(currency)}</b>
            </div>
            <p className="cy-reg-aide">{t('finance.ligne.montantAide')}</p>
          </div>

          {/* ── L icone, facultative ───────────────────────── */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">{t('finance.ligne.icone')}</span>
            <FinanceImageUpload
              size="sm"
              currentUrl={urlIcone || null}
              onUpload={(url) => setUrlIcone(url)}
              onClear={() => setUrlIcone('')}
            />
          </div>
        </div>

        <footer className="cy-reg-pied">
          <button type="button" className="cy-reg-annuler" onClick={() => onOuvert(false)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="cy-valider" onClick={enregistrer} disabled={!valide || enCours}>
            <Check aria-hidden="true" />
            {enCours ? '…' : ligne ? t('finance.ligne.enregistrer') : t('finance.ligne.ajouter')}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
