
# /finance V3 — "VAULT OS" Bio-Banking HUD (révisé)

Refonte complète du module finance combinant esthétique bancaire premium (Revolut/N26 dark) et HUD cyberpunk tactique, **avec vocabulaire clair et compréhensible**.

## Changement clé vs plan précédent

Les noms d'onglets et catégories restent **explicites et bancaires standards**, sans jargon cyber forcé. La couche "tactique" se joue sur le visuel (LED, sparklines, typo monospace, ticker), pas sur le renommage.

### Onglets — noms conservés
- `Dashboard` (au lieu de "01 OVERVIEW")
- `Budget` (au lieu de "02 BUDGET")
- `Transactions` (au lieu de "03 LEDGER")
- `Accounts` (au lieu de "04 VAULTS")
- `Planner` (au lieu de "05 FORECAST")

Numérotation discrète `01–05` possible en préfixe muted optionnel, mais le nom principal reste lisible.

---

## 5 Piliers

### 1. `FinanceVaultHero` — signature module
Hero pleine largeur avec :
- Net Worth en grand (Orbitron + AnimatedNumber)
- Sparkline cash flow 30 jours intégrée
- Delta vs mois précédent (flèche colorée + %)
- Bottom strip : Liquidity months • Burn rate • Health score (LED tactical)
- Header tactique discret : `FINANCE` • compte ID • statut LIVE • horloge

### 2. `FinanceTickerBar` — bandeau live
Sticky sous le hero, style ticker bancaire :
```
EUR ●LIVE  │  ▲ Income +€3,200  ▼ Expenses -€1,840  ● Net +€1,360  │  Budget 67%  │  ⚠ 1 alert
```

### 3. Tabs en barre tactique (noms clairs)
Pills minces avec underline animé sur l'onglet actif. Numéro `01`–`05` en muted très subtil à gauche du label, label principal lisible (`Dashboard`, `Budget`, `Transactions`, `Accounts`, `Planner`).

### 4. `BankCellCard` — KPI premium
Remplace les 4 KPI plats actuels :
- LED status (vert/ambre/rouge) selon santé
- Grosse valeur tabulaire monospace
- Delta MoM (Month-over-Month) avec flèche
- Micro-sparkline 6 mois en bas

4 cards : Savings Rate • Monthly Net • Net Worth • Months to Goal

### 5. `VaultMeshBackground` — atmosphère
- Grille fine 80px (gardée)
- Lignes diagonales très subtiles style ledger papier
- Pulse radial bleu-cyan raffiné
- 3-4 particules "data flow" verticales lentes (motion-reduce safe)

---

## Restructure par onglet

| Onglet | Changement |
|--------|------------|
| Dashboard | Hero + Ticker + 4 BankCells + widgets existants conservés |
| Budget | MonthlyBalanceHero upgradé avec barre ratio in/out, blocks gardés |
| Transactions | Header table type "transaction log" : DATE • DESC • CAT • AMOUNT • BALANCE, hover row highlight, filtres en chips compacts |
| Accounts | Hero "Total Assets" centré, cards comptes avec mini-trend par compte, transfer simulator gardé |
| Planner | Polish typographique tabulaire, header "Projection Horizon" discret |

---

## Détails techniques

### Fichiers à créer
- `src/components/finance/FinanceVaultHero.tsx`
- `src/components/finance/FinanceTickerBar.tsx`
- `src/components/finance/widgets/BankCellCard.tsx`
- `src/components/finance/VaultMeshBackground.tsx`

### Fichiers à éditer
- `src/pages/Finance.tsx` — hero + tabs + bg
- `src/components/finance/FinanceDashboard.tsx` — intégrer Hero + BankCells (remplacer KPI row actuel)
- `src/components/finance/monthly/MonthlyBalanceHero.tsx` — barre ratio in/out
- `src/index.css` — keyframes ticker scroll, vault pulse, bank cell glow (tous wrappés `motion-reduce:animate-none`)
- `src/i18n/locales/{en,fr}.json` — clés pour Liquidity months, Burn rate, MoM, ticker labels

### Logique calculs ajoutés
- **Liquidity months** = netWorth / monthlyExpenses (si expenses > 0)
- **Burn rate** = totalExpenses
- **Delta MoM par KPI** = (current − prev) / prev × 100, source `validations`
- **Cash flow 30j sparkline** = somme journalière des transactions du mois courant

### Conservé intact
Tous les hooks (useFinance, useTransactions, useAccounts, useBudgets), tous les widgets (CategoryDonut, SavingsRateRing, FinancialHealthScore, MonthComparisonWidget, TopCategoriesBar, CategoryTrendsChart), toute la logique de validation mensuelle.

### Palette tactique
Vert `emerald-400` (positif) • Rouge `rose-400` (négatif) • Ambre `amber-400` (warning) • Cyan `primary` (data neutre) • `font-mono tabular-nums` partout sur les chiffres
