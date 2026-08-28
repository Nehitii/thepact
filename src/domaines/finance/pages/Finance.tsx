import { useMemo, useState } from "react";
import "@/domaines/finance/finance.css";
import "@/domaines/finance/finance-cyber.css";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useFinanceSettings, useRecurringExpenses, useRecurringIncome } from "@/domaines/finance/hooks/useFinance";
import { usePactCostItems } from "@/hooks/useCostItems";
import { CartouchePacte } from "@/domaines/finance/composants/CartouchePacte";
import { calculerComptePacte } from "@/domaines/finance/logique/comptePacte";
import { ArbitragePanel } from "@/domaines/finance/composants/ArbitragePanel";
import { SmartFinancingPanel } from "@/domaines/finance/composants/SmartFinancingPanel";
import { MonthlyDashboard } from "@/domaines/finance/composants/mois/MonthlyDashboard";
import { FinanceSettingsModal } from "@/domaines/finance/composants/FinanceSettingsModal";
import { Navette, type Ecran } from "@/domaines/finance/composants/Navette";
import { DSPageShell } from "@/components/ds";
import { roundMoney } from "@/domaines/finance/logique/categories";
import { parseISO } from "date-fns";
import { totalDuMois, provisionMensuelle } from "@/domaines/finance/logique/cadence";
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

  /* DEUX CHIFFRES, ET ILS NE REPONDENT PAS A LA MEME QUESTION.
   *
   * Une seule somme a plat les servait tous les deux, et elle comptait
   * une charge trimestrielle de 554,61 comme si elle partait chaque
   * mois : l onglet annoncait +130,21 la ou le panneau lisait
   * +1 012,55. Deux chiffres qui se contredisent a un clic d intervalle
   * font douter des deux.
   *
   * Le solde du mois est la tresorerie : ce qui part reellement en
   * aout. C est lui que l onglet annonce, parce que c est lui que le
   * panneau montre juste en dessous — les deux doivent dire la meme
   * chose.
   *
   * Le net soutenable est ce qu on peut engager tous les mois sans se
   * mettre en defaut le mois ou la trimestrielle tombe : le solde
   * mensuel, moins la poche. C est lui qui va a l arbitrage, ou
   * promettre 1 012 par mois au pacte reviendrait a promettre l argent
   * de la copropriete.
   */
  const moisCourant = useMemo(() => new Date(), []);

  const soldeDuMois = useMemo(
    () => roundMoney(totalDuMois(recurringIncome, moisCourant) - totalDuMois(recurringExpenses, moisCourant)),
    [recurringExpenses, recurringIncome, moisCourant],
  );

  const netMensuel = useMemo(() => {
    const particulieres = recurringExpenses.filter((e) => (e.periode_mois ?? 1) !== 1 || e.echeances != null);
    return roundMoney(soldeDuMois - provisionMensuelle(particulieres));
  }, [recurringExpenses, soldeDuMois]);

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
      lecture: `${soldeDuMois >= 0 ? "+" : ""}${formatCurrency(soldeDuMois, currency)}`,
    },
  ];

  return (
    <DSPageShell width="lg" padding="tight">
      {/* « dark » decrit ce que la page EST : .cy-fond peint un sol
          noir fixe qui recouvre le viewport, quel que soit le theme du
          systeme. Sans cette classe, les utilitaires de signal y
          prendraient leur valeur claire et disparaitraient. */}
      <div className="cy dark">
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
