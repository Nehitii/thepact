import { useMemo, useState } from "react";
import "@/styles/finance.css";
import "@/styles/finance-cyber.css";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
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
import { Navette, type Ecran } from "@/components/finance/Navette";
import { DSPageShell } from "@/components/ds";
import { roundMoney } from "@/lib/financeCategories";
import { parseISO } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { useCurrency } from "@/contexts/CurrencyContext";

/* FIN.SYS — L APPAREIL
 *
 * La page tenait 4 547 pixels — 5,2 ecrans — et les trois chiffres qui
 * en sont le sujet en occupaient 149. Trois surfaces de rythmes
 * differents y etaient empilees comme si elles se valaient : un
 * tableau qu on REGARDE, un outil ou l on DECIDE, une saisie qu on
 * ENTRETIENT.
 *
 * Elles ont maintenant chacune leur ecran, et la navette les porte.
 * Chaque bouton de la navette affiche la lecture de son ecran : on ne
 * perd jamais le pourcentage finance de vue, meme en arbitrant.
 *
 * Le jaune reste la couleur de l appareil et ne dit jamais une donnee.
 */

const CLES: Record<string, string> = { pacte: "1", arbitrage: "2", mois: "3" };
const DEPUIS_URL = (v: string | null) =>
  (Object.keys(CLES).find((k) => CLES[k] === v) ?? "pacte");

export default function Finance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [reglagesOuverts, setReglagesOuverts] = useState(false);

  /* L ecran vit dans l adresse : un rechargement en pleine saisie ne
     renvoie pas au tableau de bord. */
  const [params, setParams] = useSearchParams();
  const ecranActif = DEPUIS_URL(params.get("vue"));
  const allerA = (cle: string) => {
    const p = new URLSearchParams(params);
    if (cle === "pacte") p.delete("vue"); else p.set("vue", CLES[cle]);
    setParams(p, { replace: true });
  };

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
  const partFinancee = compte.total > 0 ? Math.round((compte.finance / compte.total) * 100) : 0;
  const piecesRestantes = pieces.filter((p) => !p.acquired_at).length;

  const ecrans: Ecran[] = [
    {
      cle: "pacte", index: "01", nom: t("finance.sections.pacte"),
      lecture: t("finance.terminal.lecturePacte", { pct: partFinancee }),
    },
    {
      cle: "arbitrage", index: "02", nom: t("finance.sections.arbitrage"),
      lecture: t("finance.terminal.lectureArbitrage", { count: piecesRestantes }),
    },
    {
      cle: "mois", index: "03", nom: t("finance.sections.mois"),
      lecture: `${netMensuel >= 0 ? "+" : ""}${formatCurrency(netMensuel, currency)}`,
    },
  ];

  return (
    <DSPageShell width="lg" padding="tight">
      <div className="cy">
        <div className="cy-fond" aria-hidden="true" />
        <div className="cy-balayage" aria-hidden="true" />

        <div className="cy-corps">
          <header className="cy-entete">
            <p className="cy-entete-sys">
              <i aria-hidden="true" />
              FIN.SYS // {pact?.name ? pact.name.toUpperCase() : "PACTE"}
            </p>
            <h1>
              FIN<em>ANCE</em>
            </h1>
            <p className="cy-entete-sous">{t("finance.terminal.sous")}</p>

            <div className="cy-entete-outils">
              <button
                type="button"
                className="cy-outil"
                onClick={() => setReglagesOuverts(true)}
                aria-label={t("finance.settings.title")}
                title={t("finance.settings.title")}
              >
                <Settings aria-hidden="true" />
              </button>
            </div>
          </header>

          <Navette
            ecrans={ecrans}
            actif={ecranActif}
            onChange={allerA}
            libelle={t("finance.terminal.navette")}
          />

          <div
            className="cy-baie cy-ecran"
            key={ecranActif}
            role="tabpanel"
            id={`cy-ecran-${ecranActif}`}
            aria-labelledby={`cy-onglet-${ecranActif}`}
            tabIndex={0}
          >
            <div className="cy-baie-corps">
              {ecranActif === "pacte" && (
                <>
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
                </>
              )}

              {ecranActif === "arbitrage" && (
                <>
                  <p className="cy-chapo">{t("finance.sections.arbitrageAide")}</p>
                  <ArbitragePanel
                    goals={goals}
                    netMensuel={Math.max(0, netMensuel)}
                    dejaFinance={reglages.already_funded}
                  />
                </>
              )}

              {ecranActif === "mois" && (
                <MonthlyDashboard
                  salaryPaymentDay={reglages.salary_payment_day}
                  restantPacte={compte.restant}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <FinanceSettingsModal
        open={reglagesOuverts}
        onOpenChange={setReglagesOuverts}
        currentSettings={reglages}
        totalObjectifs={goals.reduce((s, g) => s + (g.estimated_cost || 0), 0)}
      />
    </DSPageShell>
  );
}
