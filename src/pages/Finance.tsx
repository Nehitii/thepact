import { useState, useMemo } from "react";
import "@/styles/finance.css";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useFinanceSettings, useRecurringExpenses, useRecurringIncome } from "@/hooks/useFinance";
import { usePactCostItems } from "@/hooks/useCostItems";
import { CartouchePacte } from "@/components/finance/CartouchePacte";
import { calculerComptePacte } from "@/components/finance/comptePacte";
import { ArbitragePanel } from "@/components/finance/ArbitragePanel";
import { SmartFinancingPanel } from "@/components/finance/SmartFinancingPanel";
import { MonthlyDashboard } from "@/components/finance/monthly/MonthlyDashboard";
import { FinanceSettingsModal } from "@/components/finance/FinanceSettingsModal";
import { DSPageShell, DSBackground, DSPageHeader, DSPanel } from "@/components/ds";
import { roundMoney } from "@/lib/financeCategories";
import { parseISO } from "date-fns";

/* FIN.SYS — LE PACTE, EN ARGENT
 *
 * Cet onglet tenait des comptes bancaires : soldes, transactions,
 * import CSV, dettes, budgets par categorie. Rien de tout cela ne
 * parlait du pacte, et l ensemble avait fini par ne plus rien dire.
 *
 * Il ne reste que ce qui touche au pacte : un cartouche de trois
 * chiffres — ce qu il coute, ce qui est paye, ce qui reste — et deux
 * outils. Le premier arbitre une somme entre les pieces a acheter. Le
 * second tient les flux du mois, dont le solde alimente l horizon de
 * financement.
 */

export default function Finance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reglagesOuverts, setReglagesOuverts] = useState(false);

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);

  const idsObjectifs = useMemo(() => goals.map((g) => g.id), [goals]);
  const { data: pieces = [] } = usePactCostItems(idsObjectifs);

  const reglages = {
    salary_payment_day: financeSettings?.salary_payment_day ?? 1,
    project_funding_target: financeSettings?.project_funding_target ?? 0,
    project_monthly_allocation: financeSettings?.project_monthly_allocation ?? 0,
    already_funded: financeSettings?.already_funded ?? 0,
  };

  const compte = useMemo(
    () => calculerComptePacte(goals, pieces, reglages.project_funding_target, reglages.already_funded),
    [goals, pieces, reglages.project_funding_target, reglages.already_funded],
  );

  /* Ce qui reste chaque mois : c est lui qui donne l horizon, plutot
     qu une allocation posee au doigt mouille. */
  const netMensuel = useMemo(() => {
    const depenses = recurringExpenses.filter((e) => e.is_active).reduce((s, e) => s + e.amount, 0);
    const revenus = recurringIncome.filter((i) => i.is_active).reduce((s, i) => s + i.amount, 0);
    return roundMoney(revenus - depenses);
  }, [recurringExpenses, recurringIncome]);

  const finDeProjet = pact?.project_end_date ? parseISO(pact.project_end_date) : null;

  const actions = (
    <button
      type="button"
      className="fin-action"
      onClick={() => setReglagesOuverts(true)}
      aria-label={t("finance.settings.title")}
      title={t("finance.settings.title")}
    >
      <Settings aria-hidden="true" />
    </button>
  );

  return (
    <DSPageShell width="lg">
      <DSBackground variant="aura" />

      <DSPageHeader
        variant="hud"
        systemLabel="FIN.SYS // PACTE"
        title="FIN"
        titleAccent="ANCE"
        actions={actions}
      />

      <div className="space-y-6">
        <DSPanel title={t("finance.sections.pacte")} tier="primary" accent="primary">
          <CartouchePacte compte={compte} />
          <div className="mt-6">
            <SmartFinancingPanel
              totalRemaining={compte.restant}
              projectEndDate={finDeProjet}
              currentMonthlyAllocation={
                reglages.project_monthly_allocation > 0
                  ? reglages.project_monthly_allocation
                  : Math.max(0, netMensuel)
              }
            />
          </div>
        </DSPanel>

        <DSPanel title={t("finance.sections.arbitrage")}>
          <p className="fin-chapo">{t("finance.sections.arbitrageAide")}</p>
          <ArbitragePanel
            goals={goals}
            netMensuel={Math.max(0, netMensuel)}
            dejaFinance={reglages.already_funded}
          />
        </DSPanel>

        <DSPanel title={t("finance.sections.mois")}>
          <MonthlyDashboard salaryPaymentDay={reglages.salary_payment_day} />
        </DSPanel>
      </div>

      <FinanceSettingsModal
        open={reglagesOuverts}
        onOpenChange={setReglagesOuverts}
        currentSettings={reglages}
      />
    </DSPageShell>
  );
}
