

# Full French Localization Audit & Action Plan

## Executive Summary

After a comprehensive audit of the application's codebase, the translation coverage is classified as **Partially Localized (Systemic Gaps)**. The i18n infrastructure is properly configured with react-i18next, but only **4 modules** out of **25+ pages** are actively using the translation system.

---

## Step 1: Localization Audit Results

### Current Translation Coverage

| Status | Module | Component Count |
|--------|--------|-----------------|
| ✅ Fully Localized | Auth, TwoFactor, Profile (Account Info), TodoList | ~15 components |
| ⚠️ Sidebar Labels | AppSidebar, MobileSidebar | Intentionally hardcoded per memory rule |
| ❌ Not Localized | Goals, Finance, Health, Shop, Community, Wishlist, Inbox, Admin, Journal, Achievements, Onboarding, Home widgets, All sub-pages | ~100+ components |

### Untranslated Strings by Module

#### Goals Module (`src/pages/Goals.tsx`, `NewGoal.tsx`, `GoalDetail.tsx`)
| Component | Current English | Expected French |
|-----------|-----------------|-----------------|
| Page Header | "GOALS" | "OBJECTIFS" |
| Button | "Create Goal" | "Créer un objectif" |
| Filter | "Active", "Completed", "All" | "Actifs", "Terminés", "Tous" |
| Sorting | "Sort by...", "Difficulty", "Created", "Status" | "Trier par...", "Difficulté", "Créé", "Statut" |
| Labels | "Goal Name", "Estimated Cost", "Tags", "Difficulty" | "Nom de l'objectif", "Coût estimé", "Catégories", "Difficulté" |
| Difficulties | "Easy", "Medium", "Hard", "Extreme", "Impossible" | "Facile", "Moyen", "Difficile", "Extrême", "Impossible" |
| Statuses | "Not Started", "In Progress", "Validated", "Completed" | "Non commencé", "En cours", "Validé", "Terminé" |

#### Finance Module (`src/pages/Finance.tsx`, `src/components/finance/*`)
| Component | Current English | Expected French |
|-----------|-----------------|-----------------|
| Page Header | "TRACK FINANCE" | "SUIVI FINANCIER" |
| Tabs | "Overview", "Monthly", "Projections" | "Vue d'ensemble", "Mensuel", "Projections" |
| Labels | "Project Financing", "Budget overview", "Total Target" | "Financement du projet", "Aperçu du budget", "Objectif total" |
| Actions | "Validate Month", "Add Expense", "Add Income" | "Valider le mois", "Ajouter une dépense", "Ajouter un revenu" |
| Categories | "Housing", "Food", "Transport", "Entertainment" | "Logement", "Alimentation", "Transport", "Divertissement" |

#### Health Module (`src/pages/Health.tsx`, `src/components/health/*`)
| Component | Current English | Expected French |
|-----------|-----------------|-----------------|
| Page Header | "Health & Balance" | "Santé & Équilibre" |
| Labels | "Loading Health Dashboard...", "Daily Check-in", "Weekly Chart" | "Chargement du tableau de bord...", "Bilan quotidien", "Graphique hebdomadaire" |
| Metrics | "Sleep Quality", "Energy Level", "Mood", "Hydration" | "Qualité du sommeil", "Niveau d'énergie", "Humeur", "Hydratation" |

#### Shop Module (`src/pages/Shop.tsx`, `src/components/shop/*`)
| Component | Current English | Expected French |
|-----------|-----------------|-----------------|
| Page Header | "SHOP", "Expand your experience" | "BOUTIQUE", "Étends ton expérience" |
| Tabs | "Cosmetics", "Modules", "Bonds", "Wishlist", "History" | "Cosmétiques", "Modules", "Bonds", "Liste de souhaits", "Historique" |
| Labels | "Daily Deals", "Bundles", "Purchase" | "Offres du jour", "Packs", "Acheter" |

#### Community Module (`src/pages/Community.tsx`, `src/components/community/*`)
| Component | Current English | Expected French |
|-----------|-----------------|-----------------|
| Page Header | "COMMUNITY", "Where discipline becomes visible" | "COMMUNAUTÉ", "Là où la discipline devient visible" |
| Tabs | "Community Feed", "Victory Reels" | "Fil de la communauté", "Vidéos de victoire" |
| Actions | "Create Post", "Like", "Comment" | "Créer une publication", "J'aime", "Commenter" |

#### Profile Sub-Pages (5 pages)
| Page | Current English | Expected French |
|------|-----------------|-----------------|
| `PrivacyControl.tsx` | "Privacy & Control", "Community Visibility", "Profile Discoverable" | "Confidentialité", "Visibilité communautaire", "Profil découvrable" |
| `NotificationSettings.tsx` | "Notifications", "System Notifications", "Progress & Engagement" | "Notifications", "Notifications système", "Progrès & Engagement" |
| `DisplaySound.tsx` | "Display & Sound", "Visual Settings", "Theme" | "Affichage & Son", "Paramètres visuels", "Thème" |
| `DataPortability.tsx` | "Data & Portability", "Export", "Import" | "Données & Portabilité", "Exporter", "Importer" |
| `BoundedProfile.tsx` | "Bounded Profile", "Avatar", "Display Name" | "Profil lié", "Avatar", "Nom d'affichage" |

#### Home Dashboard (`src/pages/Home.tsx`, `src/components/home/*`)
| Component | Current English | Expected French |
|-----------|-----------------|-----------------|
| Widgets | "Focus Goals", "Your starred priorities", "View All" | "Objectifs prioritaires", "Tes priorités marquées", "Voir tout" |
| Empty states | "Star some goals...", "Mark goals as focus..." | "Marque des objectifs...", "Définis des objectifs prioritaires..." |
| Buttons | "Customize", "Save Layout", "Reset" | "Personnaliser", "Enregistrer", "Réinitialiser" |

#### Inbox (`src/pages/Inbox.tsx`)
| Component | Current English | Expected French |
|-----------|-----------------|-----------------|
| Header | "Inbox", "Notifications & Messages" | "Boîte de réception", "Notifications & Messages" |
| Tabs | "Notifications", "Messages" | "Notifications", "Messages" |
| Actions | "Mark all as read", "Clear all" | "Tout marquer comme lu", "Tout effacer" |

#### Admin Pages (7 pages)
All admin pages are fully hardcoded in English. Since admin panels are typically internal-only, localization priority is lower.

---

## Step 2: Translation Coverage Assessment

### Classification: **Partially Localized (Systemic Gaps)**

### Patterns of Failure Identified

1. **Hard-coded strings in JSX** (80% of issues)
   - Direct text in components: `<h1>GOALS</h1>` instead of `<h1>{t('goals.title')}</h1>`
   - Inline labels: `placeholder="Enter your goal name..."` instead of using translation keys

2. **Missing i18n keys** (15% of issues)
   - Translation files only cover 4 modules: `common`, `auth`, `twoFactor`, `profile`, `todo`
   - No keys exist for: `goals`, `finance`, `health`, `shop`, `community`, `wishlist`, `inbox`, `admin`

3. **Components not connected to translation system** (5% of issues)
   - Many components don't import `useTranslation`
   - Only 15 files out of 100+ use `useTranslation()`

4. **Constants files with hardcoded labels**
   - `src/lib/goalConstants.ts` has English labels for tags, difficulties, and statuses
   - `src/lib/financeCategories.ts` likely has hardcoded category names

### Intentionally Hardcoded Elements (Per Memory Rule)
The sidebar navigation labels (Home, Goals, Shop, Community, Profile, etc.) are **intentionally** hardcoded in English per the project's localization rule documented in memory: *"The main sidebar navigation labels are strictly hardcoded in English and must NEVER be translated."*

---

## Step 3: Action Plan for Full French Localization

### Phase 1: Infrastructure Setup

#### 1.1 Expand Translation Files Structure
Create organized translation keys in both `en.json` and `fr.json`:

```json
{
  "common": { ... },
  "auth": { ... },
  "twoFactor": { ... },
  "profile": { ... },
  "todo": { ... },
  
  "goals": {
    "title": "Goals",
    "subtitle": "Your journey to greatness",
    "createGoal": "Create Goal",
    "filters": { ... },
    "difficulties": { ... },
    "statuses": { ... },
    "tags": { ... },
    "form": { ... },
    "emptyStates": { ... }
  },
  "finance": {
    "title": "Track Finance",
    "tabs": { ... },
    "overview": { ... },
    "monthly": { ... },
    "categories": { ... }
  },
  "health": { ... },
  "shop": { ... },
  "community": { ... },
  "wishlist": { ... },
  "inbox": { ... },
  "home": { ... },
  "settings": { ... }
}
```

#### 1.2 Update Constants Files
Modify `src/lib/goalConstants.ts` to use translation keys:

```typescript
// Before:
export const GOAL_TAGS = [
  { value: "personal", label: "Personal", color: "..." },
];

// After:
export const GOAL_TAGS = [
  { value: "personal", labelKey: "goals.tags.personal", color: "..." },
];

// Helper function:
export function getTagLabel(type: string, t: TFunction): string {
  const found = GOAL_TAGS.find(t => t.value === type);
  return found ? t(found.labelKey) : type;
}
```

### Phase 2: Module-by-Module Translation

Priority order based on user-facing importance:

| Priority | Module | Estimated Keys | Files to Modify |
|----------|--------|----------------|-----------------|
| 1 | Goals | ~80 keys | Goals.tsx, NewGoal.tsx, GoalDetail.tsx, goalConstants.ts, 3 card components |
| 2 | Profile Sub-Pages | ~50 keys | 5 profile pages, ProfileDisplaySounds.tsx |
| 3 | Home Dashboard | ~40 keys | Home.tsx, 10+ widget components |
| 4 | Finance | ~60 keys | Finance.tsx, 15+ finance components |
| 5 | Shop | ~40 keys | Shop.tsx, 12+ shop components |
| 6 | Health | ~30 keys | Health.tsx, 6 health components |
| 7 | Community | ~25 keys | Community.tsx, 6 community components |
| 8 | Wishlist | ~20 keys | Wishlist.tsx |
| 9 | Inbox | ~15 keys | Inbox.tsx, NotificationCard.tsx |
| 10 | Admin | ~50 keys | 7 admin pages (lower priority) |

**Total Estimated Keys: ~410 new translation keys**

### Phase 3: Translation Workflow

#### 3.1 French Translation Standards

| Element | Rule | Example |
|---------|------|---------|
| Tone | Informal "tu" form | "Crée ton objectif" not "Créez votre objectif" |
| Numbers | French formatting | "1 000,50 €" not "€1,000.50" |
| Dates | French format | "29 janv. 2026" not "Jan 29, 2026" |
| Plurals | Use i18next plural syntax | `{{count}} objectif_one / {{count}} objectifs_other` |

#### 3.2 Terminology Consistency

| English | French | Context |
|---------|--------|---------|
| Goal | Objectif | Main entity |
| Quest | Quête | Todo tasks (gamified) |
| Step | Étape | Goal sub-tasks |
| Pact | Pacte | User's commitment |
| Bond | Bond | Virtual currency (keep English) |
| Difficulty | Difficulté | Goal complexity |
| Focus | Prioritaire | Starred goals |

#### 3.3 Date/Number Formatting
The app already uses `date-fns` with locale support via `useDateFnsLocale()`. Ensure all date formatting uses this hook.

### Phase 4: Implementation Per File

#### Step-by-Step for Each File:

1. **Add import:**
   ```typescript
   import { useTranslation } from "react-i18next";
   ```

2. **Get translation function:**
   ```typescript
   const { t } = useTranslation();
   ```

3. **Replace hardcoded strings:**
   ```typescript
   // Before:
   <h1>GOALS</h1>
   
   // After:
   <h1>{t("goals.title")}</h1>
   ```

4. **Add keys to en.json and fr.json**

### Phase 5: Quality Assurance

#### 5.1 Manual Review Checklist
- [ ] All visible text translated when switching to FR
- [ ] Modals and dialogs display correct translations
- [ ] Form placeholders and validation messages in French
- [ ] Empty states show French text
- [ ] Toast notifications display in selected language
- [ ] Date formats change based on locale
- [ ] Currency displays correctly (€ vs $)
- [ ] Pluralization works correctly

#### 5.2 Edge Cases to Test
- Error states ("Something went wrong" messages)
- Loading states ("Loading...", "Saving...")
- Confirmation dialogs ("Are you sure?")
- Permission-based UI ("Access denied")
- Dynamic content (user-generated text remains unchanged)

### Phase 6: Regression Prevention

#### 6.1 Development Guidelines

Create a `LOCALIZATION.md` file documenting:
1. **Rule: Use `t()` for all user-facing text**
2. **Exception: Sidebar navigation labels stay in English**
3. **Where to add keys:** `src/i18n/locales/en.json` and `fr.json`
4. **Naming convention:** `{module}.{section}.{element}` (e.g., `goals.form.nameLabel`)
5. **How to test:** Switch language in Profile → Account Information → Language

#### 6.2 Missing Key Detection
The i18n configuration already includes `saveMissing: true` and `missingKeyHandler` that logs warnings to console. This helps catch missing translations during development.

---

## Summary

| Metric | Before | After Implementation |
|--------|--------|---------------------|
| Localized Pages | 4/25 (16%) | 25/25 (100%) |
| Translation Keys | ~260 | ~670 |
| Components using `t()` | 15 | 100+ |
| Coverage Classification | Partial | Complete |

### Estimated Effort
- **Phase 1 (Infrastructure):** 2 hours
- **Phase 2 (Translation):** 6-8 hours (across all modules)
- **Phase 3 (QA):** 2 hours
- **Total:** 10-12 hours of implementation work

### Files to Create
- None (use existing i18n structure)

### Files to Modify (Primary)
| File Category | Count |
|--------------|-------|
| Translation files (en.json, fr.json) | 2 |
| Page components (Goals, Finance, etc.) | 20+ |
| Widget/card components | 40+ |
| Constants files (goalConstants.ts) | 2-3 |
| Profile sub-pages | 5 |

