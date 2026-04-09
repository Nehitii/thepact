

# Audit UX "Confort et Retention" — VowPact

## Rapport visuel base sur l'inspection de 10 ecrans (Desktop 991px + Mobile 375px)

---

## Tableau Recapitulatif

| # | Zone | Probleme | Impact Utilisateur | Solution Suggeree | Priorite |
|---|------|----------|-------------------|-------------------|----------|
| **A11Y** |
| 1 | Sidebar | Pas de `role="navigation"`, pas de `aria-current="page"` sur le lien actif, pas de `aria-label` sur le nav | Lecteurs d'ecran ne distinguent pas la nav du contenu | Ajouter `<nav role="navigation" aria-label="Main navigation">`, `aria-current="page"` sur NavLink active | 🔴 |
| 2 | QuickAccessPanel (Dashboard) | Les 6 boutons d'acces rapide sont des `<div>` avec `onClick` au lieu de `<button>` | Non focusable au clavier, invisible aux technologies d'assistance | Remplacer par `<button>` semantique avec `aria-label` descriptif | 🔴 |
| 3 | Todo task cards | Le swipe-to-complete (PanInfo) n'a pas d'alternative clavier | Utilisateurs clavier/a11y ne peuvent pas completer de taches via swipe | Ajouter un bouton "Complete" visible ou accessible via `Tab` + `Enter` | 🟡 |
| 4 | Sidebar collapse button | Le chevron `<<` n'a pas d'`aria-label` | Pas d'indication de l'action pour les lecteurs d'ecran | `aria-label="Collapse sidebar"` / `"Expand sidebar"` selon l'etat | 🟢 |
| 5 | Category filter chips (Achievements, Journal, Todo) | Pas de `role="tablist"` / `role="tab"` sur les groupes de chips de filtre | Navigation clavier non structuree entre les filtres | Envelopper dans `role="tablist"`, chaque chip = `role="tab"` + `aria-selected` | 🟡 |
| 6 | Contraste texte | Les labels "PROGRESSION", "RANG", "MISSIONS", "JOURS ACTIFS" sur le dashboard utilisent des couleurs tres attenuees (~30% opacite) sur fond sombre | Ratio de contraste < 3:1, illisible pour les utilisateurs avec deficience visuelle | Monter l'opacite a 0.6 minimum, ou utiliser `text-muted-foreground` au lieu de couleurs custom ultra-dim | 🟡 |
| 7 | Cibles de clic | Les icones de la toolbar Todo (clock, calendar, chart, history) font ~16x16px sans padding | Cibles < 44x44px minimum recommande WCAG | Ajouter `p-2` ou `min-w-[44px] min-h-[44px]` sur ces boutons-icones | 🟡 |
| **CHARGE COGNITIVE** |
| 8 | Dashboard Home | 8+ modules visibles d'emblee (Hero, Rank, Quick Access, Countdown, Mission, Monitoring, Difficulty, Locked Modules) sans hierarchie claire | L'utilisateur est submerge au premier regard, ne sait pas ou regarder | Appliquer Progressive Disclosure : masquer Monitoring + Difficulty dans un panneau "Advanced" collapsible. Reduire a 4-5 blocs visibles par defaut | 🟡 |
| 9 | Todo toolbar | 3 niveaux de controles empiles : input + sort/view toggles + type filters + mini-icones toolbar + bouton NEW — 5 lignes d'outils avant le contenu | L'utilisateur doit scroller 200px avant de voir sa premiere tache | Fusionner sort/view et type filters sur une seule ligne. Deplacer les icones toolbar dans un menu "..." | 🟡 |
| 10 | Goals toolbar | Sort + search + hide super goals + per page + status tabs = 3 lignes de controles | Meme friction : trop de controles avant le contenu | Regrouper dans un seul bandeau horizontal avec un bouton "Filters" expandable | 🟢 |
| 11 | Finance Dashboard | 5 onglets + alerte + 4 KPIs + Project Financing + progress — beaucoup d'info pour un utilisateur sans donnees (tout a 0) | Empty state deprimant : mur de zeros sans guidance | Ajouter un onboarding contextuel "Add your first account" quand tout est vide, masquer les KPIs a 0 | 🟡 |
| **AFFORDANCE & FEEDBACK** |
| 12 | Shop "BUY NOW" button | Le bouton "BUY NOW" dans la spotlight n'a pas d'etat loading visible lors de l'achat | L'utilisateur peut cliquer plusieurs fois pensant que rien ne s'est passe | Ajouter un spinner + desactiver le bouton pendant la transaction (`isPending`) | 🟡 |
| 13 | Guild badge "1" sur Friends tab | Le badge "1" sur "Guilds" n'est pas assez contraste (petit texte blanc sur fond bleu sombre) | L'utilisateur peut ne pas voir qu'il a une notification | Utiliser un badge rouge/orange type notification standard, plus gros | 🟢 |
| 14 | Empty states uniformes | Friends "No friends yet", Shop "No Signal" — le texte est informatif mais aucun CTA fort (bouton) | L'utilisateur ne sait pas quoi faire ensuite | Ajouter un bouton primaire dans chaque empty state ("Search for members", "Browse cosmetics") | 🟡 |
| 15 | Hover states sidebar | Les items de la sidebar changent subtilement de couleur au hover mais sans transition de fond | Feedback trop subtil, l'element ne "semble" pas cliquable au survol | Ajouter un `bg-primary/10` avec transition 150ms au hover | 🟢 |
| **CONFORT & DELIGHT** |
| 16 | Mobile Dashboard | Le SYS bar en haut (time, date, CUSTOMIZE) se chevauche avec le bouton sidebar expand `>>` | Chevauchement visuel, confusion sur les zones cliquables | Repositionner le bouton sidebar sous la bar ou integrer dans le header | 🟡 |
| 17 | Espacement vertical | Les pages Goals, Todo, Finance ont des gaps irreguliers entre les sections (gap-6 ici, gap-8 la, space-y-4 ailleurs) | Inconsistance visuelle subconsciente, manque de rythme | Standardiser a `gap-6` partout entre les sections de premier niveau | 🟢 |
| 18 | Transitions de page | Aucune transition entre les routes (changement instantane) | Sentiment de "saccade" lors de la navigation | Ajouter un `<AnimatePresence>` au niveau du `<Outlet>` avec un fade 150ms | 🟢 |
| 19 | Font Orbitron overuse | Presque tout le texte est en Orbitron/uppercase/tracking-wide — titres, labels, badges, boutons | Fatigue oculaire, tout se ressemble, perte de hierarchie typographique | Reserver Orbitron aux titres de pages et KPIs. Utiliser Rajdhani pour les labels, descriptions et body text | 🟡 |
| **FLUX & FRICTIONS** |
| 20 | Creation de goal | Le bouton "+ Add Goal" navigue vers `/goals/new` (page entiere) au lieu d'un modal | Perte de contexte : l'utilisateur quitte sa liste de goals | Proposer un QuickAdd modal (titre + difficulte) avec option "Advanced" vers la page complete | 🟡 |
| 21 | Todo Quick Input | L'input "Type task... !high #work @today" est puissant mais zero decouverte | Les nouveaux utilisateurs ne connaissent pas la syntaxe des raccourcis | Ajouter un tooltip/popover "Shortcuts" a cote de l'input avec la syntaxe (!high, #tag, @date) | 🟡 |
| 22 | Retour depuis les sous-pages | Pas de breadcrumb ni de bouton "Back" visible sur `/goals/:id`, `/guild/:id`, etc. | L'utilisateur doit utiliser la sidebar pour revenir, friction inutile | Ajouter un breadcrumb ou un bouton "← Back to Goals" en haut de chaque page de detail | 🟡 |
| 23 | Command Palette (Ctrl+K) | Le Terminal button en bas a droite est visible mais sa fonction n'est pas evidente ("TERMINAL") | Les utilisateurs pensent que c'est un terminal de debug, pas un raccourci de recherche | Renommer en "Search" ou utiliser un icone loupe + label "Search or jump to..." | 🟢 |
| 24 | Finance onboarding | Pour utiliser le module Finance, l'utilisateur doit : configurer settings → creer un account → ajouter des recurring → ajouter des transactions = 4 etapes non guidees | Abandon eleve : l'utilisateur ne sait pas par ou commencer | Ajouter un wizard onboarding en 3 etapes (currency/salary day → premier compte → premier recurring) | 🟡 |

---

## Synthese par priorite

**🔴 Critique (2)** : Accessibilite sidebar + QuickAccessPanel (elements non-semantiques)

**🟡 Majeur (14)** : Charge cognitive dashboard, contraste labels, cibles de clic insuffisantes, empty states sans CTA, mobile overlap, font Orbitron excessif, todo shortcuts non-decouverts, manque de breadcrumbs, onboarding Finance

**🟢 Mineur (8)** : Hover states, espacement vertical, transitions de page, rename Terminal, guild badge contraste, goals toolbar, sidebar aria-label collapse

---

## Plan d'implementation propose

**Phase 1 — Accessibilite critique**
1. Refactorer sidebar avec `<nav>`, `aria-current`, `aria-label`
2. Remplacer les `<div onClick>` du QuickAccessPanel par des `<button>` semantiques
3. Ajouter `role="tablist"` sur les groupes de filtres (Achievements, Todo, Journal)
4. Augmenter la taille minimum des cibles de clic a 44px

**Phase 2 — Charge cognitive et affordance**
5. Progressive Disclosure sur le Dashboard (collapsible "Advanced" pour Monitoring/Difficulty)
6. Fusionner la toolbar Todo sur 2 lignes max
7. Ajouter des CTA dans tous les empty states
8. Reduire l'utilisation de Orbitron (labels → Rajdhani)
9. Monter le contraste des labels dim a 0.6+ opacite

**Phase 3 — Confort et flux**
10. Ajouter breadcrumbs sur les pages de detail
11. Ajouter un tooltip shortcuts sur le Todo Quick Input
12. Fix overlap mobile (SYS bar vs sidebar button)
13. Standardiser les gaps entre sections
14. Ajouter page transitions (AnimatePresence fade)
15. Wizard onboarding Finance

