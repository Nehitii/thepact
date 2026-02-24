

# Audit complet du module /finance

## Architecture actuelle

Le module Finance est organise en 3 onglets (Overview, Monthly, Projections) avec un design neumorphique premium. Il repose sur des donnees stockees dans 3 tables backend (`recurring_expenses`, `recurring_income`, `monthly_finance_validations`) plus des champs dans `profiles` pour les settings.

---

## 1. Points forts

- **Architecture bien structuree** : hooks dedies (`useFinance.ts`), types partages (`types/finance.ts`), categories centralisees (`financeCategories.ts`)
- **Systeme de categories robuste** : detection automatique par mots-cles (FR + EN), groupement par categorie, support i18n
- **Validation mensuelle guidee** : flow en 4 etapes (Expenses > Income > Extras > Confirm) avec modal dedié
- **Composants modulaires** : `FinancialBlock`, `MonthlyBalanceHero`, `MonthlyHistory` bien decouplés
- **Projections visuelles** : graphiques Area/Pie via Recharts avec tooltips personnalisés
- **Limite de securite** : max 30 recurring expenses pour eviter les abus
- **RLS correctement appliquee** sur toutes les tables

---

## 2. Problemes identifies

### 2.1 Code mort / duplication

- **`MonthlySection.tsx`** (~476 lignes) : composant legacy qui redefinit ses propres `EXPENSE_CATEGORIES` et `INCOME_CATEGORIES` en dur, sans utiliser le systeme centralise de `financeCategories.ts`. Il est exporte dans `index.ts` mais n'est utilise nulle part dans le flow actuel (remplace par `MonthlyDashboard`). **A supprimer.**
- **`ProjectionsChart.tsx`** (~267 lignes) : composant legacy avec un style "Orbitron/Rajdhani" qui ne correspond plus au design neumorphique actuel. Il est exporte dans `index.ts` mais remplace par `ProjectionsPanel.tsx`. **A supprimer.**
- **Types dupliques** : `RecurringExpense`, `RecurringIncome`, `MonthlyValidation`, `FinanceSettings` sont definis a la fois dans `useFinance.ts` ET dans `types/finance.ts`. Le hook devrait importer depuis les types partages.

### 2.2 Internationalisation incomplete

- La page `Finance.tsx` a de nombreuses chaines en dur : "Finance Dashboard", "Back", "Track your project financing...", "Settings", "Overview", "Monthly", "Projections"
- `FinanceOverviewCard.tsx` : "Project Financing", "Budget overview", "Custom Target", "Total Target", "Financed", "Remaining", "Progress" -- tous en dur
- `SmartFinancingPanel.tsx` : "Smart Financing", "Amount to Finance", "Existing Balance Available", "Payment Duration", "Monthly Payment", "On track to meet your goal" -- en dur
- `ProjectionsPanel.tsx` : "Savings Rate", "Monthly Net", "Yearly", "To Goal", "Balance Evolution", "Expenses", "By category" -- en dur
- `MonthlyValidationPanel.tsx` : "Expenses Paid", "Income Received", "Validate This Month" -- en dur
- `MonthlyHistory.tsx` : "Monthly History", "No history yet" -- en dur
- `ValidationFlowModal.tsx` : "Monthly Validation", "Review Recurring Expenses", "All expenses paid correctly" -- en dur
- Les cles i18n existent dans `en.json` mais ne sont **jamais utilisees** par les composants actuels

### 2.3 Design & UX

- **Aucune traduction FR** : les labels du module Finance ne sont pas traduits dans `fr.json`
- **Le bouton "Edit this month"** dans `MonthlyHistory` est un `<button>` qui ne fait rien (pas de `onClick` handler)
- **Pas de confirmation de suppression** pour les recurring items (expenses/income) -- un tap accidentel supprime sans undo
- **Pas d'etat vide** sur l'onglet Overview quand aucun objectif n'a de cout estime et aucun custom target n'est defini
- **`already_funded`** est cast avec `(data as any)` dans `useFinanceSettings` -- indicateur que le type genere ne reconnait pas ce champ

### 2.4 Logique metier

- **Projection cumulative incorrecte** : dans `ProjectionsPanel`, la projection est `monthlyNetBalance * (i+1)` ce qui est un calcul purement lineaire sans tenir compte des variations historiques validees
- **Sparkline avec valeurs 0** pour les mois passes non valides : affiche des donnees trompeuses au lieu de `null`
- **`existingBalance`** dans `SmartFinancingPanel` est un etat local non persiste -- si l'utilisateur quitte et revient, la valeur est perdue
- **Pas de limite sur recurring income** (contrairement aux 30 pour expenses)

---

## 3. Axes d'amelioration proposes

### Priorite haute -- Nettoyage technique

| Action | Impact |
|--------|--------|
| Supprimer `MonthlySection.tsx` et `ProjectionsChart.tsx` | -740 lignes de code mort |
| Deduplicar les types : faire importer `useFinance.ts` depuis `types/finance.ts` | Coherence, maintenance |
| Supprimer le re-export de ces composants dans `index.ts` | Proprete |
| Corriger le cast `(data as any).already_funded` | Type safety |

### Priorite haute -- i18n

| Action | Impact |
|--------|--------|
| Connecter tous les composants Finance aux cles `t('finance.xxx')` existantes | App bilingue coherente |
| Ajouter les traductions FR manquantes dans `fr.json` | Experience francophone |

### Priorite moyenne -- UX

| Action | Impact |
|--------|--------|
| Ajouter un dialog de confirmation avant suppression d'un recurring item | Eviter les pertes accidentelles |
| Ajouter un etat vide (empty state) sur l'onglet Overview | Orientation utilisateur |
| Rendre le bouton "Edit this month" dans MonthlyHistory fonctionnel | Feature broken |
| Persister `existingBalance` du SmartFinancingPanel dans les settings profil | Persistance |

### Priorite basse -- Ameliorations fonctionnelles

| Action | Impact |
|--------|--------|
| Ajouter une limite de 30 sur recurring income (parite avec expenses) | Consistance |
| Ameliorer les projections en integrant les donnees validees passees dans le calcul | Precision |
| Remplacer les `balance: 0` par `null` pour les mois non valides dans le sparkline | Honnetete des donnees |
| Ajouter un export CSV/PDF des donnees financieres | Portabilite |
| Ajouter des alertes/notifications quand le budget depasse un seuil | Proactivite |

---

## 4. Detail technique pour implementation

### Suppression du code mort

Fichiers a supprimer :
- `src/components/finance/MonthlySection.tsx`
- `src/components/finance/ProjectionsChart.tsx`
- `src/components/finance/MonthlyValidationForm.tsx` (si existant et non utilise)

Mise a jour de `src/components/finance/index.ts` pour retirer les exports correspondants.

### Deduplication des types

Dans `src/hooks/useFinance.ts`, remplacer les 4 interfaces locales par :

```text
import type { RecurringExpense, RecurringIncome, MonthlyValidation, FinanceSettings } from '@/types/finance';
```

### i18n

Ajouter `useTranslation()` dans chaque composant Finance et remplacer les chaines en dur par les cles deja definies dans `en.json` (section `finance.*`). Ajouter les equivalents dans `fr.json`.

### Dialog de confirmation de suppression

Utiliser le composant `AlertDialog` de Radix deja installe pour wrapper les boutons de suppression dans `FinancialBlock.tsx`.

