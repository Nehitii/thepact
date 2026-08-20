import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { differenceInMonths, addMonths, format } from 'date-fns';

/* L HORIZON
 *
 * Combien de mois pour boucler, ou combien par mois pour tenir une
 * date. Une seule equation, dans les deux sens.
 *
 * Le panneau tenait 733 pixels sur les 1 190 de l ecran du pacte :
 * cinq blocs empiles, chacun avec sa carte, son icone et son titre,
 * pour un curseur et deux nombres. C est une bande.
 *
 * Deux choses ont saute en meme temps :
 *
 * — Il redemandait « l apport disponible » et l ecrivait dans le meme
 *   reglage que la fenetre des parametres, sous un autre nom. Une
 *   valeur, deux endroits, deux libelles.
 *
 * — Et il la soustrayait une SECONDE fois : « restant » sort deja du
 *   cartouche apport deduit. Le montant a financer etait donc minore
 *   des qu un apport etait declare. Le defaut ne se voyait pas tant
 *   que l apport valait zero.
 */

interface SmartFinancingPanelProps {
  /** Ce qui reste a trouver, apport deja deduit par le cartouche. */
  totalRemaining: number;
  projectEndDate: Date | null;
  currentMonthlyAllocation: number;
}

const MAX_MOIS = 60;

export function SmartFinancingPanel({
  totalRemaining, projectEndDate, currentMonthlyAllocation,
}: SmartFinancingPanelProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const [mois, setMois] = useState(12);
  const [parMois, setParMois] = useState(currentMonthlyAllocation);
  /* Les deux champs affichent la valeur, pas un indice grise : un
     nombre en « placeholder » se lit comme un champ vide. Tant qu on y
     tape, le texte est a l utilisateur ; des qu on en sort, il reprend
     ce que l equation a calcule. */
  const [edite, setEdite] = useState<"mois" | "montant" | null>(null);
  const [saisieMois, setSaisieMois] = useState('');
  const [saisieMontant, setSaisieMontant] = useState('');

  const aFinancer = Math.max(0, totalRemaining);
  const moisJusquAuTerme = projectEndDate ? differenceInMonths(projectEndDate, new Date()) : null;

  const depuisMois = useCallback((n: number) => {
    const borne = Math.max(1, Math.min(MAX_MOIS, n));
    setMois(borne);
    if (aFinancer > 0) setParMois(aFinancer / borne);
  }, [aFinancer]);

  const depuisMontant = useCallback((v: number) => {
    if (v <= 0) return;
    setParMois(v);
    if (aFinancer > 0) setMois(Math.max(1, Math.min(MAX_MOIS, Math.ceil(aFinancer / v))));
  }, [aFinancer]);

  /* Le point de depart : l allocation si elle existe, douze mois sinon. */
  useEffect(() => {
    if (aFinancer <= 0) return;
    if (currentMonthlyAllocation > 0) {
      setParMois(currentMonthlyAllocation);
      setMois(Math.max(1, Math.min(MAX_MOIS, Math.ceil(aFinancer / currentMonthlyAllocation))));
    } else {
      setMois(12);
      setParMois(aFinancer / 12);
    }
  }, [currentMonthlyAllocation, aFinancer]);

  const terme = useMemo(() => addMonths(new Date(), mois), [mois]);
  const dansLesTemps = moisJusquAuTerme === null ? true : mois <= moisJusquAuTerme;
  const moisEnTrop = moisJusquAuTerme === null ? 0 : Math.max(0, mois - moisJusquAuTerme);

  const validerMois = () => {
    const v = parseInt(saisieMois);
    if (!isNaN(v)) depuisMois(v);
    setEdite(null);
  };
  const validerMontant = () => {
    const v = parseFloat(saisieMontant.replace(',', '.'));
    if (!isNaN(v)) depuisMontant(v);
    setEdite(null);
  };

  const texteMois = edite === "mois" ? saisieMois : String(mois);
  const texteMontant = edite === "montant" ? saisieMontant : parMois.toFixed(0);

  return (
    <section className="cy-horizon" aria-label={t('finance.smartFinancing.title')}>
      <div className="cy-horizon-rang">
        <p className="cy-horizon-lect">
          <span>{t('finance.smartFinancing.amountToFinance')}</span>
          <b>{formatCurrency(aFinancer, currency)}</b>
        </p>

        <label className="cy-horizon-lect est-saisie">
          <span>{t('finance.smartFinancing.paymentDuration')}</span>
          <b>
            <input
              type="text"
                className="cy-saisie"
              inputMode="numeric"
              value={texteMois}
              onFocus={(e) => { setEdite("mois"); setSaisieMois(String(mois)); e.currentTarget.select(); }}
              onChange={(e) => setSaisieMois(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={validerMois}
              onKeyDown={(e) => { if (e.key === 'Enter') validerMois(); }}
              aria-label={t('finance.smartFinancing.paymentDuration')}
            />
            <u>{t('finance.smartFinancing.months')}</u>
          </b>
        </label>

        <label className="cy-horizon-lect est-saisie est-forte">
          <span>{t('finance.smartFinancing.monthlyPayment')}</span>
          <b>
            <input
              type="text"
                className="cy-saisie"
              inputMode="decimal"
              value={texteMontant}
              onFocus={(e) => { setEdite("montant"); setSaisieMontant(parMois.toFixed(0)); e.currentTarget.select(); }}
              onChange={(e) => setSaisieMontant(e.target.value.replace(/[^0-9.,]/g, ''))}
              onBlur={validerMontant}
              onKeyDown={(e) => { if (e.key === 'Enter') validerMontant(); }}
              aria-label={t('finance.smartFinancing.monthlyPayment')}
            />
            <u>{getCurrencySymbol(currency)}</u>
          </b>
        </label>
      </div>

      {/* Le curseur : la meme equation, tiree a la main. */}
      <input
        type="range"
        className="cy-horizon-curseur"
        min={1}
        max={MAX_MOIS}
        step={1}
        value={mois}
        onChange={(e) => depuisMois(Number(e.target.value))}
        aria-label={t('finance.smartFinancing.paymentDuration')}
        aria-valuetext={t('finance.smartFinancing.months', { count: mois }) as string}
      />

      <p className="cy-horizon-verdict" data-tenu={dansLesTemps ? '1' : '0'} role="status">
        {dansLesTemps ? <CheckCircle aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}
        <b>
          {dansLesTemps
            ? t('finance.smartFinancing.onTrack')
            : t('finance.smartFinancing.exceedsDeadline', { count: moisEnTrop })}
        </b>
        <span>{t('finance.smartFinancing.completion', { date: format(terme, 'MMM yyyy') })}</span>
      </p>
    </section>
  );
}
