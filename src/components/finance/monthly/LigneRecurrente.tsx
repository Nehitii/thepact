import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Tag, Type, Coins, X, Repeat, CalendarClock, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
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
  /** Ce qui part a chaque echeance. Pour un echeancier, c est la part. */
  amount: number;
  category?: string;
  iconEmoji?: string;
  iconUrl?: string;
  /* LA CADENCE. Un abonnement trimestriel et un paiement en plusieurs
     fois sont la meme mecanique : une charge qui ne tombe pas tous les
     mois. Voir src/lib/finance/cadence.ts. */
  periodeMois?: number;
  moisAncre?: string | null;
  echeances?: number | null;
  montantTotal?: number | null;
}

/** Les cinq cadences offertes, dans l ordre ou on les rencontre. */
const CADENCES = [
  { cle: "mensuel", periode: 1, echeancier: false },
  { cle: "trimestriel", periode: 3, echeancier: false },
  { cle: "semestriel", periode: 6, echeancier: false },
  { cle: "annuel", periode: 12, echeancier: false },
  { cle: "echeancier", periode: 1, echeancier: true },
] as const;

const moisCourantISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

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
  const [cadence, setCadence] = useState<typeof CADENCES[number]['cle']>('mensuel');
  const [ancre, setAncre] = useState(moisCourantISO());
  const [nbEcheances, setNbEcheances] = useState('4');

  useEffect(() => {
    if (!ouvert) return;
    setNom(ligne?.name ?? '');
    setMontant(ligne ? String(ligne.amount) : '');
    setCategorie(ligne?.category ?? categories[0]?.value ?? '');
    setUrlIcone(ligne?.icon_url ?? '');

    /* La cadence se relit de ce qui est enregistre : un echeancier se
       reconnait a son nombre d echeances, une cadence longue a sa
       periode. */
    const periode = ligne?.periode_mois ?? 1;
    const n = ligne?.echeances ?? null;
    setCadence(n != null ? 'echeancier' : periode === 3 ? 'trimestriel' : periode === 6 ? 'semestriel' : periode === 12 ? 'annuel' : 'mensuel');
    setAncre(ligne?.mois_ancre ? String(ligne.mois_ancre).slice(0, 7) : moisCourantISO());
    setNbEcheances(n != null ? String(n) : '4');
    /* Pour un echeancier, le champ du montant porte le prix paye et
       non la part : c est ainsi qu on achete, donc ainsi qu on s en
       souvient. */
    if (n != null && ligne?.montant_total != null) setMontant(String(ligne.montant_total));
  }, [ouvert, ligne, categories]);

  const estEcheancier = cadence === 'echeancier';
  const periodeChoisie = CADENCES.find((c) => c.cle === cadence)?.periode ?? 1;
  const nEcheances = Math.max(2, Math.min(60, parseInt(nbEcheances, 10) || 2));

  const valeur = parseFloat(montant.replace(',', '.'));
  const valide = nom.trim().length > 0 && Number.isFinite(valeur) && valeur > 0;

  /* L apercu de l echeancier : ce qui sera reellement preleve, mois
     par mois. Deux cents euros en trois fois ne tombent pas juste — la
     derniere echeance absorbe le reste, et on le montre plutot que de
     laisser la surprise au releve bancaire. */
  const partsEcheancier = (() => {
    if (!estEcheancier || !Number.isFinite(valeur) || valeur <= 0) return [];
    const total = Math.round(valeur * 100);
    const part = Math.floor(total / nEcheances);
    return Array.from({ length: nEcheances }, (_, i) =>
      (i < nEcheances - 1 ? part : total - part * (nEcheances - 1)) / 100);
  })();

  const enregistrer = async () => {
    if (!valide || enCours) return;
    await onEnregistrer({
      name: nom.trim(),
      /* Ce qu on enregistre dans « amount », c est toujours ce qui part
         a une echeance : pour un echeancier, la part et non le total. */
      amount: estEcheancier ? partsEcheancier[0] : valeur,
      category: categorie || undefined,
      iconUrl: urlIcone || undefined,
      periodeMois: periodeChoisie,
      /* Une cadence mensuelle sans fin n a pas besoin d ancre : elle
         tombe de toute facon, et l exiger serait demander une
         information que personne n a envie de saisir. */
      moisAncre: cadence === 'mensuel' ? null : `${ancre}-01`,
      echeances: estEcheancier ? nEcheances : null,
      montantTotal: estEcheancier ? valeur : null,
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
            <p className="cy-reg-aide">
              {estEcheancier
                ? t('finance.ligne.montantTotalAide', "Le prix payé — l'app répartit sur les échéances.")
                : t('finance.ligne.montantAide')}
            </p>
          </div>

          {/* ── LA CADENCE ─────────────────────────────────
              Tout etait implicitement mensuel, ce qui obligeait a
              saisir une assurance annuelle lissee a la main — et a
              perdre a la fois le vrai montant et le mois ou il part.
              Les cinq cadences tiennent sur une rangee : quatre
              periodes, plus le paiement en plusieurs fois, qui est la
              meme mecanique avec une fin. */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">
              <Repeat aria-hidden="true" />
              {t('finance.ligne.cadence', 'Cadence')}
            </span>
            <div className="cy-cadences" role="radiogroup" aria-label={t('finance.ligne.cadence', 'Cadence')}>
              {CADENCES.map((c) => (
                <button
                  key={c.cle}
                  type="button"
                  role="radio"
                  aria-checked={cadence === c.cle}
                  className="cy-cadence"
                  onClick={() => setCadence(c.cle)}
                >
                  {t(`finance.cadence.${c.cle}`, c.cle)}
                </button>
              ))}
            </div>
          </div>

          {/* Une cadence qui n est pas mensuelle a besoin de son
              premier mois : sans lui, « tous les trois mois » ne
              designe aucun mois en particulier. */}
          {cadence !== 'mensuel' && (
            <div className="cy-reg-rang">
              <label className="cy-reg-nom" htmlFor="ligne-ancre">
                <CalendarClock aria-hidden="true" />
                {estEcheancier
                  ? t('finance.ligne.premiereEcheance', 'Première échéance')
                  : t('finance.ligne.premierMois', 'Premier mois')}
              </label>
              <div className="cy-reg-champ">
                <input
                  id="ligne-ancre"
                  type="month"
                  className="cy-saisie"
                  value={ancre}
                  onChange={(e) => setAncre(e.target.value)}
                />
              </div>
            </div>
          )}

          {estEcheancier && (
            <div className="cy-reg-rang">
              <label className="cy-reg-nom" htmlFor="ligne-echeances">
                <Layers aria-hidden="true" />
                {t('finance.ligne.enCombienDeFois', 'En combien de fois')}
              </label>
              <div className="cy-reg-champ">
                <input
                  id="ligne-echeances"
                  type="number"
                  min={2}
                  max={60}
                  className="cy-saisie"
                  value={nbEcheances}
                  onChange={(e) => setNbEcheances(e.target.value)}
                />
                <b>×</b>
              </div>
              {/* Ce qui sera reellement preleve. La derniere echeance
                  absorbe le reste de la division ; on le montre ici
                  plutot que de laisser la surprise au releve. */}
              {partsEcheancier.length > 0 && (
                <p className="cy-echeancier-apercu">
                  {partsEcheancier.map((part, i) => (
                    <span key={i}>
                      {formatCurrency(part, currency)}
                      {i < partsEcheancier.length - 1 && <u aria-hidden="true">·</u>}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}

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
