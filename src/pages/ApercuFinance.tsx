import { useState, useMemo } from "react";
import "@/styles/finance.css";
import "@/styles/finance-cyber.css";
import "@/styles/apercu-finance.css";
import { useTranslation } from "react-i18next";
import { Coins, CalendarRange, ChevronDown, X } from "lucide-react";
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
import { Baie } from "@/components/finance/Baie";
import { DSPageShell } from "@/components/ds";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { roundMoney } from "@/lib/financeCategories";
import { parseISO } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { useCurrency } from "@/contexts/CurrencyContext";

/* APERCU JETABLE — cinq facons de tenir la page
 *
 * La page fait 4 547 pixels, soit 5,2 ecrans, et les trois chiffres
 * qui en sont le sujet en occupent 149. Le probleme n est pas la
 * quantite : c est que trois surfaces de rythmes differents — un
 * tableau qu on REGARDE, un outil ou l on DECIDE, une saisie qu on
 * ENTRETIENT — sont empilees comme si elles se valaient.
 *
 * Ce fichier ne sert qu a choisir. Il part apres.
 */

type Lettre = "A" | "B" | "C" | "D" | "E";

const OPTIONS: { lettre: Lettre; nom: string; note: string }[] = [
  { lettre: "A", nom: "Cartouche fixe + onglets", note: "Les trois chiffres restent au mur ; les deux outils se partagent la meme place." },
  { lettre: "B", nom: "Trois ecrans", note: "Une navette en haut. Chaque surface a son ecran, rien ne deborde." },
  { lettre: "C", nom: "Tiroirs", note: "Tout reste sur une page, mais un seul outil est ouvert a la fois." },
  { lettre: "D", nom: "Deux colonnes", note: "Le pacte tient a gauche, les outils defilent a droite. Les 1400px enfin utilises." },
  { lettre: "E", nom: "Poste de commande", note: "Le tableau EST la page. Chaque outil s ouvre en plein ecran." },
];

export default function ApercuFinance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [lettre, setLettre] = useState<Lettre>("A");

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
  const netMensuel = useMemo(() => {
    const d = recurringExpenses.filter((e) => e.is_active).reduce((s, e) => s + e.amount, 0);
    const r = recurringIncome.filter((i) => i.is_active).reduce((s, i) => s + i.amount, 0);
    return roundMoney(r - d);
  }, [recurringExpenses, recurringIncome]);
  const finDeProjet = pact?.project_end_date ? parseISO(pact.project_end_date) : null;
  const allocation = reglages.project_monthly_allocation > 0
    ? reglages.project_monthly_allocation
    : Math.max(0, netMensuel);

  const Pacte = <CartouchePacte compte={compte} />;
  const Horizon = (
    <SmartFinancingPanel
      totalRemaining={compte.restant}
      projectEndDate={finDeProjet}
      currentMonthlyAllocation={allocation}
    />
  );
  const Arbitre = (
    <ArbitragePanel goals={goals} netMensuel={Math.max(0, netMensuel)} dejaFinance={reglages.already_funded} />
  );
  const Mois = <MonthlyDashboard salaryPaymentDay={reglages.salary_payment_day} />;

  return (
    <DSPageShell width="lg" padding="tight">
      <div className="cy ap">
        <div className="cy-fond" aria-hidden="true" />

        <div className="cy-corps">
          {/* ── Le selecteur d apercu ─────────────────────── */}
          <div className="ap-barre">
            <span className="ap-titre">APERCU · DISPOSITION</span>
            {OPTIONS.map((o) => (
              <button
                key={o.lettre}
                type="button"
                className="ap-choix"
                aria-pressed={lettre === o.lettre}
                onClick={() => setLettre(o.lettre)}
              >
                <b>{o.lettre}</b> {o.nom}
              </button>
            ))}
          </div>
          <p className="ap-note">{OPTIONS.find((o) => o.lettre === lettre)?.note}</p>

          {lettre === "A" && <DispoA pacte={Pacte} horizon={Horizon} arbitre={Arbitre} mois={Mois} t={t} />}
          {lettre === "B" && <DispoB pacte={Pacte} horizon={Horizon} arbitre={Arbitre} mois={Mois} t={t} />}
          {lettre === "C" && <DispoC pacte={Pacte} horizon={Horizon} arbitre={Arbitre} mois={Mois} t={t} />}
          {lettre === "D" && <DispoD pacte={Pacte} horizon={Horizon} arbitre={Arbitre} mois={Mois} t={t} />}
          {lettre === "E" && (
            <DispoE
              pacte={Pacte} horizon={Horizon} arbitre={Arbitre} mois={Mois} t={t}
              net={netMensuel} currency={currency}
              piecesRestantes={pieces.filter((p) => !p.acquired_at).length}
            />
          )}
        </div>
      </div>
    </DSPageShell>
  );
}

type Bloc = { pacte: React.ReactNode; horizon: React.ReactNode; arbitre: React.ReactNode; mois: React.ReactNode; t: (k: string) => string };

/* A — Le cartouche reste au mur, les outils se partagent la place. */
function DispoA({ pacte, horizon, arbitre, mois, t }: Bloc) {
  const [onglet, setOnglet] = useState<"arb" | "mois">("arb");
  return (
    <>
      <div className="ap-mur">
        <Baie index="01" nom={t("finance.sections.pacte")} vivant>
          {pacte}
        </Baie>
      </div>
      <div className="ap-onglets">
        <button type="button" aria-pressed={onglet === "arb"} onClick={() => setOnglet("arb")}>
          <b>02</b> {t("finance.sections.arbitrage")}
        </button>
        <button type="button" aria-pressed={onglet === "mois"} onClick={() => setOnglet("mois")}>
          <b>03</b> {t("finance.sections.mois")}
        </button>
        <span className="ap-onglets-fin" aria-hidden="true" />
      </div>
      <div className="cy-baie ap-scene">
        <div className="cy-baie-corps">{onglet === "arb" ? arbitre : mois}</div>
      </div>
      <details className="ap-repli">
        <summary>{t("finance.sections.pacte")} · horizon</summary>
        <div className="ap-repli-corps">{horizon}</div>
      </details>
    </>
  );
}

/* B — Une navette, trois ecrans. */
function DispoB({ pacte, horizon, arbitre, mois, t }: Bloc) {
  const [vue, setVue] = useState<"pacte" | "arb" | "mois">("pacte");
  const vues = [
    { cle: "pacte" as const, index: "01", nom: t("finance.sections.pacte") },
    { cle: "arb" as const, index: "02", nom: t("finance.sections.arbitrage") },
    { cle: "mois" as const, index: "03", nom: t("finance.sections.mois") },
  ];
  return (
    <>
      <div className="ap-navette">
        {vues.map((v) => (
          <button key={v.cle} type="button" aria-pressed={vue === v.cle} onClick={() => setVue(v.cle)}>
            <b>{v.index}</b>
            <span>{v.nom}</span>
          </button>
        ))}
      </div>
      <div className="cy-baie ap-scene">
        <div className="cy-baie-corps">
          {vue === "pacte" && <>{pacte}<div className="mt-6">{horizon}</div></>}
          {vue === "arb" && arbitre}
          {vue === "mois" && mois}
        </div>
      </div>
    </>
  );
}

/* C — Tout sur une page, un seul tiroir ouvert. */
function DispoC({ pacte, horizon, arbitre, mois, t }: Bloc) {
  const [ouvert, setOuvert] = useState<string | null>("arb");
  const tiroir = (cle: string, index: string, nom: string, corps: React.ReactNode) => (
    <div className="cy-baie" key={cle}>
      <button
        type="button"
        className="cy-tete ap-tiroir-tete"
        aria-expanded={ouvert === cle}
        onClick={() => setOuvert(ouvert === cle ? null : cle)}
      >
        <span className="cy-index" aria-hidden="true">{index}</span>
        <span className="cy-nom">{nom}</span>
        <span className="cy-conduite" aria-hidden="true" />
        <span className="cy-lecture"><ChevronDown aria-hidden="true" /></span>
      </button>
      {ouvert === cle && <div className="cy-baie-corps">{corps}</div>}
    </div>
  );
  return (
    <div className="space-y-4">
      <Baie index="01" nom={t("finance.sections.pacte")} vivant>{pacte}</Baie>
      {tiroir("horizon", "01+", "Horizon", horizon)}
      {tiroir("arb", "02", t("finance.sections.arbitrage"), arbitre)}
      {tiroir("mois", "03", t("finance.sections.mois"), mois)}
    </div>
  );
}

/* D — Le pacte tient a gauche, les outils defilent a droite. */
function DispoD({ pacte, horizon, arbitre, mois, t }: Bloc) {
  return (
    <div className="ap-colonnes">
      <aside className="ap-col-gauche">
        <Baie index="01" nom={t("finance.sections.pacte")} vivant>
          {pacte}
          <div className="mt-5">{horizon}</div>
        </Baie>
      </aside>
      <div className="ap-col-droite space-y-4">
        <Baie index="02" nom={t("finance.sections.arbitrage")}>{arbitre}</Baie>
        <Baie index="03" nom={t("finance.sections.mois")}>{mois}</Baie>
      </div>
    </div>
  );
}

/* E — Le tableau EST la page ; les outils sont des modes. */
function DispoE({
  pacte, horizon, arbitre, mois, t, net, currency, piecesRestantes,
}: Bloc & { net: number; currency: string; piecesRestantes: number }) {
  const [mode, setMode] = useState<"arb" | "mois" | null>(null);
  return (
    <>
      <Baie index="01" nom={t("finance.sections.pacte")} vivant>
        {pacte}
        <div className="mt-6">{horizon}</div>
      </Baie>

      <div className="ap-modes">
        <button type="button" className="ap-mode" onClick={() => setMode("arb")}>
          <Coins aria-hidden="true" />
          <b>{t("finance.sections.arbitrage")}</b>
          <span>{piecesRestantes} pieces en attente</span>
        </button>
        <button type="button" className="ap-mode" onClick={() => setMode("mois")}>
          <CalendarRange aria-hidden="true" />
          <b>{t("finance.sections.mois")}</b>
          <span>{net >= 0 ? "+" : ""}{formatCurrency(net, currency)} / mois</span>
        </button>
      </div>

      <Dialog open={!!mode} onOpenChange={(o) => { if (!o) setMode(null); }}>
        <DialogContent className="cy ap-plein" data-mode={mode ?? ""}>
          <DialogTitle className="sr-only">
            {mode === "arb" ? t("finance.sections.arbitrage") : t("finance.sections.mois")}
          </DialogTitle>
          <header className="ap-plein-tete">
            <span className="cy-index">{mode === "arb" ? "02" : "03"}</span>
            <h2 className="cy-nom">
              {mode === "arb" ? t("finance.sections.arbitrage") : t("finance.sections.mois")}
            </h2>
            <span className="cy-conduite" aria-hidden="true" />
            <button type="button" className="cy-outil" onClick={() => setMode(null)} aria-label="Fermer">
              <X aria-hidden="true" />
            </button>
          </header>
          <div className="ap-plein-corps">{mode === "arb" ? arbitre : mois}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
