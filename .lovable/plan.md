

# Audit Complet VowPact — Plan d'Amélioration Ultra-Poussé

## Architecture de l'application

VowPact est une app de productivité gamifiée cyberpunk avec 20+ modules : Dashboard, Goals, Finance, Health, Todo, Journal, Focus, Wishlist, Community, Friends, Leaderboard, Achievements, Shop, Analytics, Inbox, et un panneau Admin. Backend sur Lovable Cloud (Supabase).

---

## 🔴 BUGS CRITIQUES & SÉCURITÉ

### 1. Privilege Escalation — `user_roles` sans INSERT policy
Le scan de sécurité confirme : la table `user_roles` a RLS activé mais aucune policy INSERT/UPDATE/DELETE. N'importe quel utilisateur authentifié peut s'auto-attribuer le rôle `admin`.

**Fix** : Migration SQL ajoutant des policies restrictives — seuls les admins existants peuvent insérer/supprimer des rôles.

### 2. Vue `user_2fa_settings_safe` accessible sans authentification
Pas de RLS → toute personne peut lire si un utilisateur a le 2FA activé + user_id.

**Fix** : Ajouter une policy SELECT `auth.uid() = user_id`.

### 3. 263 utilisations de `as any` dans le codebase
Perte totale de type-safety. Les plus critiques :
- `NewGoal.tsx` : insertion Supabase avec `as any` — masque des erreurs de schéma
- `GoalDetail.tsx` : accès à `(goal as any).deadline` — le type Goal devrait inclure `deadline`
- `ProfileDisplaySounds.tsx` : `{ theme_preference: next } as any` pour les mutations profil
- `HealthDailyCheckin.tsx` : `(settings as any)?.checkin_mode`

**Fix** : Étendre les types `ProfileSettings`, `Goal`, `HealthSettings` avec les champs réels. Supprimer progressivement les `as any`.

### 4. `console.log("DEV MODE...")` dans TheCall.tsx (production)
Un `console.log` de debug reste en production + le mode auto-play/fast-forward semble accessible.

**Fix** : Supprimer ou conditionner avec `import.meta.env.DEV`.

---

## 🟡 PROBLÈMES UX/UI

### 5. Suspense sans fallback UI
`<Suspense>` dans `SuspensePage` n'a pas de `fallback` — écran blanc pendant le chargement des chunks lazy.

**Fix** : Ajouter un skeleton/spinner global comme fallback.

### 6. Page 404 non-stylée
`NotFound.tsx` utilise un style minimal basique, complètement hors du design cyberpunk du reste de l'app.

**Fix** : Redesign en style HUD cohérent avec le reste.

### 7. Sidebar — labels hardcodés en anglais
Navigation items (`"Dashboard"`, `"Goals"`, `"Finance"`) ne passent pas par `t()` → non traduits en français.

**Fix** : Passer tous les labels sidebar par i18n.

### 8. Onboarding non traduit
`Onboarding.tsx` utilise des chaînes hardcodées en anglais (`"Welcome"`, `"Choose your symbol"`, etc.)

**Fix** : Extraire vers i18n.

### 9. Auth page — HexDataStream performance
Le composant `HexDataStream` génère 30 lignes × 40 chars et met à jour toutes les 150ms → potentiellement lourd sur mobile.

**Fix** : Réduire la fréquence ou désactiver sur mobile via `useIsMobile()`.

### 10. Leaderboard — aucune traduction i18n
Textes comme "Anonymous Agent", "(YOU)", tous hardcodés.

### 11. Achievements — pas de React Query
`Achievements.tsx` utilise `useState` + `useEffect` manuel au lieu de React Query, ce qui casse le pattern du reste de l'app (pas de cache, pas de refetch).

**Fix** : Migrer vers `useQuery`.

---

## 🟠 DETTE TECHNIQUE

### 12. GoalDetail.tsx — 437 lignes, 20+ états locaux
Ce fichier est un monolithe avec trop d'états (`useState` x20+). Difficile à maintenir.

**Fix** : Extraire la logique vers un hook `useGoalDetailState` et des sous-composants.

### 13. AppSidebar.tsx — 648 lignes
Fichier massif combinant config, UI, état, mobile drawer.

**Fix** : Séparer en `SidebarConfig.ts`, `SidebarDesktop`, `SidebarMobile`.

### 14. Wishlist.tsx — 745 lignes
Même problème — trop de logique dans un seul fichier.

### 15. `index.css` — 2418 lignes
CSS monolithique. Devrait être découpé en fichiers thématiques ou utiliser davantage Tailwind.

### 16. Profile.tsx — requête Supabase directe au lieu de `useProfile`
Le composant `Profile` fait un `supabase.from("profiles").select("*")` manuellement au lieu d'utiliser le hook `useProfile` existant, créant une requête dupliquée.

### 17. Goals.tsx — requête directe pour `goal_unlock_code`
Même pattern : `supabase.from("profiles").select("goal_unlock_code")` au lieu d'étendre `useProfile`.

---

## 📊 PROPOSITIONS D'AMÉLIORATION

### A. Cross-Module Intelligence
- **Smart Dashboard Widgets** : Le Home affiche déjà beaucoup d'info, mais manque de corrélations cross-module (ex: "Tes sessions Focus ont augmenté de 30% cette semaine, tes goals avancent 2x plus vite").
- **Weekly Review enrichi** : Intégrer automatiquement les données Finance (solde, dépenses) dans le résumé hebdo.

### B. Mobile Experience
- **Bottom navigation mobile** : La sidebar se transforme en drawer sur mobile, mais un bottom tab bar serait plus natif (Dashboard/Goals/Finance/Profile).
- **Pull-to-refresh** : Aucune page ne supporte le geste natif.
- **Swipe actions** : Sur les listes Todo/Transactions, swipe-left pour supprimer, swipe-right pour compléter.

### C. Onboarding 2.0
- L'onboarding actuel (4 étapes) ne guide pas l'utilisateur vers les modules. Ajouter un **tutorial interactif** post-onboarding avec des tooltips guidés (style product tour) qui montrent Dashboard → Goals → First Goal.

### D. Data Integrity & Offline
- **Optimistic updates partout** : Seul Goals utilise l'optimistic update. Todo, Finance, Health devraient aussi.
- **Error boundaries par module** : Un crash dans Finance ne devrait pas casser toute l'app. Ajouter des `ErrorBoundary` par route.

### E. Performance
- **Virtual scrolling** : Les listes longues (Transactions 500 items, Goals, Todo) devraient utiliser `react-virtuoso` ou `tanstack-virtual`.
- **Image lazy loading** : Les images de comptes/goals ne sont pas lazy-loaded.
- **Bundle splitting** : Déjà en place avec `lazy()`, mais certains imports lourds (recharts, dnd-kit, framer-motion) sont importés dans beaucoup de pages.

### F. Accessibilité
- **Contraste** : Beaucoup de textes `text-primary/40` ou `text-muted-foreground/50` qui risquent de ne pas passer WCAG AA.
- **Keyboard navigation** : Les custom buttons dans la sidebar (`<button>` avec `clipPath`) n'ont pas de `focus-visible` styling.
- **Screen reader** : Les décorations cyberpunk (scan lines, hex stream, particle effects) n'ont pas toutes `aria-hidden="true"`.

### G. Nouvelles Fonctionnalités à Fort Impact
1. **Mode hors-ligne** avec Service Worker pour les données critiques (todo, checkin)
2. **Notifications push** (PWA) — le champ `push_enabled` existe déjà dans la table
3. **Calendrier unifié** fusionnant deadlines Goals + Todo + rendez-vous + dépenses récurrentes
4. **Export PDF** du bilan mensuel Finance
5. **Dark/Light mode preview** dans les settings (preview live avant de changer)
6. **Raccourcis clavier globaux** — CommandPalette existe déjà mais pourrait être étendue avec plus d'actions (new goal, new todo, start focus)
7. **Widget "Streak" global** visible partout — combiner check-in streak, habit streaks, health streak en un seul indicateur motivant
8. **Templates de budget** prédéfinis (étudiant, freelance, famille) dans Finance

---

## ORDRE DE PRIORITÉ D'IMPLÉMENTATION

| Phase | Catégorie | Items |
|-------|-----------|-------|
| **Phase 1** | Sécurité critique | #1 user_roles policies, #2 2FA view RLS |
| **Phase 2** | Bugs UX | #5 Suspense fallback, #7-8-10 i18n manquant, #4 console.log |
| **Phase 3** | Type-safety | #3 supprimer les `as any` critiques (NewGoal, GoalDetail, Profile) |
| **Phase 4** | Performance | #9 HexStream mobile, #E virtual scrolling, lazy images |
| **Phase 5** | Refactoring | #12-14 split gros fichiers, #16-17 centraliser requêtes |
| **Phase 6** | UX polish | #6 NotFound redesign, #F accessibilité, #B mobile bottom nav |
| **Phase 7** | Features | #G calendrier unifié, notifications push, export PDF, templates budget |

---

## RÉSUMÉ TECHNIQUE

| Métrique | Valeur |
|----------|--------|
| **Pages** | 28 routes |
| **Composants** | 180+ fichiers .tsx |
| **Hooks** | 50+ hooks custom |
| **Edge Functions** | 8 |
| **Tables DB** | 30+ |
| **Vulnérabilités sécurité** | 2 critiques |
| **`as any` count** | 263 |
| **Fichiers > 400 lignes** | 8 (GoalDetail, Wishlist, AppSidebar, Auth, TheCall, Focus, Friends, Analytics) |
| **i18n coverage** | ~70% (sidebar, onboarding, leaderboard, achievements non traduits) |

