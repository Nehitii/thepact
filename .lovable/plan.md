# Audit Mobile Complet — Vowpact

Viewport cible : **360–414px** (iPhone SE → 14 Pro Max). Étape de référence : 390×701 (viewport actuel).

## Diagnostic global

L'app a déjà des fondations correctes : `AppLayout` gère `overflow-x-hidden`, `AppSidebar` détecte `useIsMobile` et bascule en off-canvas, `ModuleHeader` adapte ses paddings, et `useIsMobile` est largement disponible. **Mais** la majorité des pages ont été pensées desktop-first et présentent des problèmes récurrents :

### Problèmes structurels identifiés

1. **Paddings & marges trop généreux** — `px-6`, `py-8`, `py-16`, `mb-24`, `gap-10`, `p-8` sans variantes responsive (Achievements, TodoList, Wishlist, NewGoal, StepDetail, Inbox, Admin*).
2. **Typographies hero trop grosses** — `text-3xl`/`text-4xl` + `tracking-widest`/`tracking-[0.5em]` débordent en 360px (Inbox, Achievements, Onboarding, Legal).
3. **Toolbars de page non-collapsibles** — Boutons "BULK / IMPORT / ADD ITEM" alignés en flex-row sans `flex-wrap` dans Wishlist, Goals, Shop. Idem chips et filtres dans Achievements.
4. **Dialogs au bord de l'écran** — `DialogContent` n'a pas de `w-[calc(100%-2rem)]`, donc les modales touchent les bords sur mobile, et `p-6` interne est trop dense pour les formulaires longs.
5. **Pas de navigation mobile rapide** — Le seul accès aux modules sur mobile passe par le burger top-left. Aucune bottom nav ni rail rapide pour les 3-4 modules les plus fréquents.
6. **Grilles 2-col forcées sur petit écran** — `grid-cols-2 gap-4` dans Profile/Notifications, Profile/DataPortability, Admin* devient illisible <360px.
7. **Headers de page trop riches** — Inbox, Goals, Wishlist combinent orb + titre + sous-titre + actions sur la même ligne, ce qui force des wraps disgracieux ou écrase le titre.
8. **Tap targets sub-44px** — Plusieurs boutons icon-only à `h-7 w-7` ou `h-8 w-8` (FriendNode compact, AllianceTabs, Goals filtres) sont sous le minimum tactile recommandé (44×44 iOS / 48×48 Android).

## Plan de remédiation — 4 vagues

Plutôt que tout casser en une seule passe, je propose un découpage incrémental où chaque vague est livrable indépendamment, avec une amélioration mesurable du UX mobile.

### Vague 1 — Fondations globales (impact maximal, risque minimal)

Objectif : corriger ce qui touche **toutes les pages** d'un coup via des composants partagés et tokens.

**Actions :**
- `DialogContent` : ajouter `w-[calc(100%-2rem)] sm:w-full`, `p-4 sm:p-6`, `max-h-[calc(100vh-2rem)]` pour respirer sur mobile.
- Créer un utilitaire Tailwind pour padding de page : `.page-px` = `px-4 sm:px-6 md:px-8`, `.page-py` = `py-6 sm:py-8`.
- Forcer `min-w-0` sur tous les `flex-1` enfants critiques (déjà partiellement fait dans `AppLayout`).
- Audit `tap-target` : créer une classe `touch-target` (`min-h-[44px] min-w-[44px]`) et l'appliquer aux boutons icon-only critiques.
- Classe utilitaire `truncate-fluid` pour les titres orbitron longs.

### Vague 2 — Navigation mobile (UX gain énorme)

**Actions :**
- **Bottom Tab Bar mobile** (`md:hidden`, position `fixed bottom-0`) avec les 5 destinations critiques : Home, Goals, Friends, Inbox, Profile (configurable). Gère `safe-area-inset-bottom` pour iPhone X+.
- Le burger reste pour accéder à la liste complète (admin, settings profonds, etc.).
- Ajout d'un padding-bottom global mobile (`pb-20 md:pb-0`) sur `<main>` pour ne pas masquer le contenu.
- Indicateur actif synchronisé avec `useLocation`.

### Vague 3 — Pages prioritaires (refonte responsive ciblée)

Refonte mobile des 8 pages les plus utilisées, dans cet ordre :

1. **Home** — réduire `gap-4` → `gap-3`, empiler `md:grid-cols-12` proprement, alléger `NexusHeroBanner` sur mobile.
2. **Goals** — `GoalsToolbar` en `flex-wrap gap-2`, filtres collapsibles dans un Sheet sur mobile, cards goals déjà OK.
3. **Friends** — déjà fait en Sprints 1-3, juste vérifier le `AllianceInsightStrip` qui passe à 2-col sur xs (déjà géré).
4. **Inbox** — header mobile compact (orb 40px, `text-xl`, action settings dans menu), retirer `tracking-widest` sur xs.
5. **Wishlist** — toolbar BULK/IMPORT/ADD : grouper IMPORT+BULK dans un menu kebab, garder ADD ITEM visible. Cards en 1-col strict <640px.
6. **Achievements** — `px-6 py-16` → `px-4 py-8 sm:py-16`, `mb-24` → `mb-12 sm:mb-24`, stats `gap-10` → `gap-4 sm:gap-10`, hero `text-4xl` → `text-3xl`, filter bar verticale sur mobile.
7. **Shop** — vérifier ShopCategoryView `grid-cols-2 gap-4` qui peut rester (cards conçues pour ça), mais alléger headers.
8. **Profile (settings)** — déjà refait en CyberPanel, mais `grid-cols-2 gap-4` dans NotificationSettings/DataPortability passer à `grid-cols-1 sm:grid-cols-2`.

### Vague 4 — Pages secondaires + polish final

- TodoList : `p-6` → `p-4 sm:p-6`, dialogs `max-w-4xl` n'a pas d'effet sur mobile mais `p-6` interne à ajuster.
- Calendar : revue des vues Day/Week/Month sur 360px (scroll horizontal contrôlé).
- Focus : déjà compact, vérifier le timer ring qui ne dépasse pas.
- Legal, Onboarding, NewGoal, StepDetail : titres et paddings.
- Admin* : `grid-cols-2 gap-4` → `grid-cols-1 sm:grid-cols-2`.
- Audit tap-targets final + screenshots de validation à 360, 390, 414px.

## Ce qu'il faut décider maintenant

Cette refonte représente ~30–40 fichiers touchés au total. Je propose d'**enchaîner uniquement les Vagues 1 + 2** dans cette session (fondations + bottom nav mobile) car elles donnent ~70% du gain UX perçu pour ~20% du travail. Les Vagues 3 et 4 seront livrables en sessions dédiées (1 vague = 1 message).

**Confirme** : j'attaque Vagues 1 + 2 maintenant ?
