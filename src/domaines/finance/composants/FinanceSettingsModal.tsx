import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Target, Wallet, HandCoins, X } from 'lucide-react';
import { useCurrency } from '@/socle/contextes/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/socle/outils/currency';
import { Dialog, DialogContent, DialogTitle } from '@/socle/ui/dialog';
import { useUpdateFinanceSettings } from '@/domaines/finance/hooks/useFinance';
import { toast } from 'sonner';
import type { FinanceSettings } from '@/domaines/finance/types';

/* LES REGLAGES DE L APPAREIL
 *
 * Quatre valeurs, et rien d autre. Ce qui a saute :
 *
 * — « Ajouter aux depenses recurrentes », une case qui creait en
 *   sous-main une ligne nommee « Project Allocation » — en anglais, non
 *   traduite — dans le mois de l utilisateur. C est la baie du mois qui
 *   tient les lignes recurrentes ; une fenetre de reglages n a pas a en
 *   fabriquer une dans le dos.
 *
 * — La mise a zero de l apport des qu on passait en cible manuelle. Le
 *   calcul du cartouche compte l apport dans les DEUX cas : enregistrer
 *   en mode manuel effacait donc une valeur qui servait encore.
 *
 * Et « Deja finance » se disait de deux choses a la fois : le total
 * calcule du cartouche, et cette saisie qui n en est qu une part. Elle
 * s appelle desormais l apport declare.
 */

interface FinanceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: FinanceSettings;
  /** La somme des couts des objectifs : ce que la cible manuelle remplace. */
  totalObjectifs: number;
}

export function FinanceSettingsModal({
  open, onOpenChange, currentSettings, totalObjectifs,
}: FinanceSettingsModalProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const updateSettings = useUpdateFinanceSettings();

  const [salaryDay, setSalaryDay] = useState(currentSettings.salary_payment_day.toString());
  const [cibleManuelle, setCibleManuelle] = useState(currentSettings.project_funding_target > 0);
  const [fundingTarget, setFundingTarget] = useState(currentSettings.project_funding_target.toString());
  const [monthlyAllocation, setMonthlyAllocation] = useState(currentSettings.project_monthly_allocation.toString());
  const [apport, setApport] = useState(currentSettings.already_funded.toString());

  useEffect(() => {
    if (!open) return;
    setSalaryDay(currentSettings.salary_payment_day.toString());
    setCibleManuelle(currentSettings.project_funding_target > 0);
    setFundingTarget(currentSettings.project_funding_target.toString());
    setMonthlyAllocation(currentSettings.project_monthly_allocation.toString());
    setApport(currentSettings.already_funded.toString());
  }, [open, currentSettings]);

  const symbole = getCurrencySymbol(currency);
  const nombre = (v: string) => v.replace(/[^0-9.,]/g, '').replace(',', '.');

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        salary_payment_day: Math.max(1, Math.min(31, parseInt(salaryDay) || 1)),
        project_funding_target: cibleManuelle ? Math.max(0, parseFloat(fundingTarget) || 0) : 0,
        project_monthly_allocation: Math.max(0, parseFloat(monthlyAllocation) || 0),
        /* L apport vaut dans les deux modes de cible. */
        already_funded: Math.max(0, parseFloat(apport) || 0),
      });
      toast.success(t('finance.settings.saved'));
      onOpenChange(false);
    } catch {
      toast.error(t('finance.settings.saveFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cy-reg [&>button]:hidden">
        <DialogTitle className="sr-only">{t('finance.settings.title')}</DialogTitle>

        <header className="cy-reg-tete">
          <span className="cy-index" aria-hidden="true">SET</span>
          <h2 className="cy-nom">{t('finance.settings.title')}</h2>
          <span className="cy-conduite" aria-hidden="true" />
          <button
            type="button"
            className="cy-outil"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.cancel')}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="cy-reg-corps">
          {/* ── Le jour de paie ─────────────────────────── */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">
              <Calendar aria-hidden="true" />
              {t('finance.settings.paymentDay')}
            </span>
            <label className="cy-reg-champ est-court">
              <input
                type="text"
                className="cy-saisie"
                inputMode="numeric"
                value={salaryDay}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  const n = parseInt(v);
                  if (v === '' || (n >= 1 && n <= 31)) setSalaryDay(v);
                }}
                aria-label={t('finance.settings.paymentDay')}
                placeholder="1"
              />
            </label>
            <p className="cy-reg-aide">{t('finance.settings.paymentDayHint')}</p>
          </div>

          {/* ── La cible ────────────────────────────────── */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">
              <Target aria-hidden="true" />
              {t('finance.settings.fundingTarget')}
            </span>
            <div className="cy-reg-bascule" role="group" aria-label={t('finance.settings.fundingTarget')}>
              <button type="button" aria-pressed={!cibleManuelle} onClick={() => setCibleManuelle(false)}>
                {t('finance.settings.cibleAuto')}
                <b>{formatCurrency(totalObjectifs, currency)}</b>
              </button>
              <button type="button" aria-pressed={cibleManuelle} onClick={() => setCibleManuelle(true)}>
                {t('finance.settings.cibleManuelle')}
              </button>
            </div>
            {cibleManuelle && (
              <label className="cy-reg-champ">
                <input
                  type="text"
                className="cy-saisie"
                  inputMode="decimal"
                  value={fundingTarget}
                  onChange={(e) => setFundingTarget(nombre(e.target.value))}
                  aria-label={t('finance.settings.cibleManuelle')}
                  placeholder="0"
                />
                <b>{symbole}</b>
              </label>
            )}
            <p className="cy-reg-aide">
              {cibleManuelle
                ? t('finance.settings.fundingTargetHint')
                : t('finance.settings.fundingTargetDefault')}
            </p>
          </div>

          {/* ── L allocation ────────────────────────────── */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">
              <Wallet aria-hidden="true" />
              {t('finance.settings.monthlyAllocation')}
            </span>
            <label className="cy-reg-champ">
              <input
                type="text"
                className="cy-saisie"
                inputMode="decimal"
                value={monthlyAllocation}
                onChange={(e) => setMonthlyAllocation(nombre(e.target.value))}
                aria-label={t('finance.settings.monthlyAllocation')}
                placeholder="0"
              />
              <b>{symbole}</b>
            </label>
            <p className="cy-reg-aide">{t('finance.settings.allocationAide')}</p>
          </div>

          {/* ── L apport ────────────────────────────────── */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">
              <HandCoins aria-hidden="true" />
              {t('finance.settings.apport')}
            </span>
            <label className="cy-reg-champ">
              <input
                type="text"
                className="cy-saisie"
                inputMode="decimal"
                value={apport}
                onChange={(e) => setApport(nombre(e.target.value))}
                aria-label={t('finance.settings.apport')}
                placeholder="0"
              />
              <b>{symbole}</b>
            </label>
            <p className="cy-reg-aide">{t('finance.settings.apportAide')}</p>
          </div>
        </div>

        <footer className="cy-reg-pied">
          <button type="button" className="cy-reg-annuler" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="cy-valider"
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? '…' : t('finance.settings.saveSettings')}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
