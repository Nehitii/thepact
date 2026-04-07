

# Audit Complet du Module Finance — Rapport et Plan de Transformation

## Rapport d'Audit Flash

### Architecture (Score: 7/10)
**Ce qui fonctionne bien :**
- Structure modulaire propre : 5 onglets (Dashboard, Budget, Transactions, Accounts, Planner) bien separees
- Hooks React Query standardises avec invalidation correcte
- Categories centralisees dans `financeCategories.ts` avec i18n
- RLS policies completes et correctes sur toutes les tables
- Auto-detection de categories par mots-cles (FR + EN)
- CSV import robuste (encoding, delimiteurs, formats de date)
- Balances de comptes calculees dynamiquement (initial + transactions)

**Problemes identifies :**

### 🔴 Critique

1. **Net Worth calcule avec `account.balance` brut au lieu du solde compute**
   - `FinanceDashboard.tsx` ligne 61 : `accounts.reduce((sum, a) => sum + a.balance, 0)` utilise la balance statique stockee en DB, pas la balance computee via transactions
   - Le KPI "Net Worth" du dashboard peut etre faux si des transactions existent
   - Impact : Donnee financiere incorrecte affichee en permanence

2. **Floating point silencieux dans les calculs monetaires**
   - Tous les calculs utilisent `+` / `-` directement sur des floats JS
   - `parseFloat()` sans arrondi = accumulation d'erreurs (ex: 0.1 + 0.2 = 0.30000000000000004)
   - Les montants affiches sont corrects grace a `formatCurrency`, mais les comparaisons et seuils (budget alerts) peuvent etre faux

3. **INSERT sans WITH CHECK sur certaines tables**
   - `bank_transactions` et `monthly_finance_validations` ont une policy INSERT avec `with_check` sur `auth.uid() = user_id`, mais `recurring_expenses` et `recurring_income` INSERT policies n'ont PAS de `with_check` — un utilisateur authentifie pourrait inserer des lignes avec un `user_id` different
   - Identique pour `category_budgets` et `savings_goals` (policy `*` couvre tout, mais la policy ALL utilise `user_id = auth.uid()` qui agit comme with_check — OK en fait)

### 🟡 Majeur

4. **TransactionsTab utilise `any` pour `editingTx`** (ligne 46, 102, 119) — pas de type safety sur les transactions editees

5. **Pas de validation Zod** sur les formulaires : AddTransactionModal, FinanceSettingsModal, BudgetProgressPanel acceptent n'importe quel input textuel converti via `parseFloat` sans validation de bornes

6. **Le `useAccountBalances` re-fetch TOUTES les transactions** a chaque render (pas de filtre par account, pas de pagination) — O(n) sur chaque compte avec n = total transactions

7. **Export CSV ignore les transactions** — `exportFullReport` exporte recurring items, validations et accounts mais pas les `bank_transactions`

8. **Budget progress compare recurring expenses aux budgets**, pas les transactions reelles — si un utilisateur depense 500€ en "food" via transactions mais n'a que 200€ en recurring expense "food", le budget affiche 200€/300€ au lieu de 500€/300€

9. **Pas de date range filter** sur les transactions — on charge les 500 derniers sans possibilite de filtrer par mois/periode

### 🟢 Mineur

10. **Projections chart cumule sans base** — commence a 0 au lieu du solde actuel reel

11. **Donut chart center label tronque** les montants longs avec `replace(/\.00$/, '')` — ne gere pas tous les formats de devise

12. **SmartFinancingPanel** fait un `updateSettings.mutate` sur `onBlur` de l'input "existing balance" — mutation silencieuse sans feedback, peut persister des valeurs intermediaires

13. **MonthlyHistory** non visible dans l'audit (composant manquant dans les fichiers lus) mais reference dans MonthlyDashboard

14. **Pas d'optimistic updates** — chaque mutation attend la reponse serveur avant de rafraichir l'UI

---

## Plan de Transformation — 4 Phases

### Phase 1 — Corrections Critiques de Precision

**1.1 Fix Net Worth computation**
- `FinanceDashboard.tsx` : utiliser `balancesMap` du hook `useAccountBalances` au lieu de `a.balance` brut
- Passer `balancesMap` en prop ou l'appeler dans le composant

**1.2 Arrondi monetaire**
- Creer un helper `roundMoney(n: number): number` → `Math.round(n * 100) / 100`
- L'appliquer dans : `calculateActiveTotal`, `getCategoryTotals`, running balance, budget comparisons
- Appliquer dans les mutations : arrondir le montant avant INSERT

**1.3 RLS INSERT hardening**
- Verifier que les policies INSERT sur `recurring_expenses` et `recurring_income` ont bien un `WITH CHECK (auth.uid() = user_id)` — les corriger si manquant via migration

### Phase 2 — Corrections Majeures (Logique + UX)

**2.1 Type safety transactions**
- Remplacer les `any` dans TransactionsTab par `BankTransaction` type de `types/finance.ts`

**2.2 Validation Zod sur les formulaires**
- AddTransactionModal : schema `{ description: z.string().min(1).max(100), amount: z.number().positive().max(999999999), ... }`
- FinanceSettingsModal : validation bornes salary_day (1-31), budget_alert (1-100)
- BudgetProgressPanel : monthly_limit > 0

**2.3 Budget vs transactions reelles**
- BudgetProgressPanel : au lieu de comparer aux `recurring expenses`, fetch les transactions du mois courant groupees par categorie et comparer aux limites de budget
- Ajouter une prop `transactions` ou un hook `useMonthlyTransactionsByCategory`

**2.4 Date range filter sur transactions**
- Ajouter un filtre mois/periode dans TransactionsTab (date picker "from" / "to")
- Modifier `useTransactions` pour accepter une range optionnelle et filtrer cote serveur

**2.5 Export transactions**
- Ajouter les `bank_transactions` dans `exportFullReport`
- Option d'export filtree (mois courant, periode custom)

**2.6 Optimiser `useAccountBalances`**
- Filtrer les transactions par `account_id IN (...)` cote Supabase au lieu de tout charger et filtrer en JS

### Phase 3 — Ameliorations UX/UI

**3.1 Dashboard intelligent — alertes et insights**
- Ajouter un "Alerts Panel" en haut du dashboard :
  - Alerte si un budget depasse le seuil configure (`finance_budget_alert_pct`)
  - Alerte si le solde net du mois est negatif
  - Alerte si une validation mensuelle est en retard
- Chaque alerte = card cliquable qui navigue vers l'onglet concerne

**3.2 Transaction auto-categorization**
- Reutiliser `detectCategoryFromName` dans AddTransactionModal pour pre-remplir la categorie quand l'utilisateur tape la description
- Ajouter un debounce de 300ms sur le champ description

**3.3 Projections chart avec base reelle**
- Demarrer la projection depuis le solde Net Worth actuel (compute) au lieu de 0
- Ajouter une ligne de reference pour le solde nul (break-even)

**3.4 Quick actions**
- Bouton "Quick expense" en FAB sur mobile dans l'onglet transactions
- Raccourci clavier `N` pour ouvrir le modal d'ajout

**3.5 Batch delete transactions**
- Ajouter des checkboxes sur les lignes de transactions
- Bulk bar en bas pour supprimer les selections

### Phase 4 — Fonctionnalites Avancees

**4.1 Recurring transactions automatiques**
- Option sur les recurring items : "auto-generate transaction on salary day"
- A la validation mensuelle, creer automatiquement les transactions correspondantes

**4.2 Budget carryover**
- Si un budget n'est pas depense entierement, option de reporter le surplus au mois suivant

**4.3 Financial health score**
- Score 0-100 base sur : savings rate, budget compliance, streak de validations, diversification des revenus
- Affiche en haut du dashboard avec gauge visuelle

**4.4 Category spending trends mini-chart par budget**
- Dans BudgetProgressPanel, ajouter un sparkline 3 mois pour chaque categorie budgetee

---

## Fichiers Impactes

| Action | Fichier |
|--------|---------|
| **Edit** | `src/components/finance/FinanceDashboard.tsx` — fix Net Worth, alertes |
| **Edit** | `src/components/finance/transactions/TransactionsTab.tsx` — type safety, date filter, batch |
| **Edit** | `src/components/finance/transactions/AddTransactionModal.tsx` — Zod, auto-category |
| **Edit** | `src/components/finance/budgets/BudgetProgressPanel.tsx` — real tx data |
| **Edit** | `src/components/finance/FinanceSettingsModal.tsx` — Zod validation |
| **Edit** | `src/components/finance/ProjectionsPanel.tsx` — base reelle |
| **Edit** | `src/hooks/useAccountBalances.ts` — query optimization |
| **Edit** | `src/hooks/useTransactions.ts` — date range filter |
| **Edit** | `src/lib/financeCategories.ts` — roundMoney helper |
| **Edit** | `src/lib/financeExport.ts` — include transactions |
| **New** | `src/hooks/useMonthlyTransactionTotals.ts` — aggregation par categorie |
| **Migration** | RLS INSERT hardening si necessaire |
| **Edit** | `src/i18n/locales/en.json`, `fr.json` — alertes, nouveaux labels |

Implementation par phase, chaque phase livrant des corrections independantes.

