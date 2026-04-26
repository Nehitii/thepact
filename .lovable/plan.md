
# /friends — Global Professional Design Review

**Auditeur** : Senior Product Designer (15+ ans)
**Périmètre** : Page `/friends` (4 onglets : Friends, Requests, Search, Guilds) — état actuel après les passes "Alliance Grid" et "Premium minimaliste"
**Méthode** : Audit code (DOM/tokens/spacing) + capture preview viewport 1053×584 + heuristique Nielsen + WCAG 2.2

---

## 🎯 Synthèse exécutive (TL;DR)

Le module a une **direction artistique forte et signature** (HUD tactique cyberpunk, Pacte OS) mais souffre de **9 défauts de finition** qui empêchent la perception "premium" : KPI vides illisibles, hiérarchie titre faible, contraste muted insuffisant pour AA, micro-leaks de bg-noise, scrollbar parasite, mélange Orbitron/Mono/Rajdhani non hiérarchisé, et CTAs primaires noyés dans le visuel. Aucun problème structurel — **8 fixes ciblés suffisent à atteindre un standard agence**.

---

## 1 — Visual Hierarchy & Typography 🟠

### Current state
- 3 typos actives : **Orbitron** (titre + KPI + tabs), **JetBrains Mono / mono fallback** (system tags, labels, IDs, statuts), **Rajdhani** (texte courant — peu présent ici)
- Hero title `FRIENDS` : `text-3xl sm:text-4xl font-light` avec accent `font-black` sur "DS"
- KPI : Orbitron 28px `font-light tabular-nums`
- Labels micro : mono 8–10px tracking 0.18–0.30em
- Section dividers : mono 10px

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 1 | Le **hero** `FRIENDS` se fait visuellement écraser par les KPI strip juste en dessous (28px Orbitron × 4) → le titre n'est plus le focal point | Hiérarchie cassée |
| 2 | Le contraste `light` (300) pour le titre + tracking 0.16em rend le mot **lisible mais fade** sur fond très sombre | Manque de présence |
| 3 | **3 niveaux mono différents** (8px/9px/10px) avec 3 trackings différents (.18 / .22 / .28 / .30em) → cacophonie typographique | Manque de système |
| 4 | Le pattern `[ LABEL ]` est utilisé partout mais avec des couleurs et tailles inconsistantes (cyan, special, success, muted selon la zone) | Pollution visuelle |
| 5 | Aucune utilisation de Rajdhani sur cette page → la typo "body" du DS n'est pas honorée, tout est mono ou Orbitron | Texte courant absent |

### Recommendations
- **Hero** : passer à `text-5xl font-extralight` desktop + `tracking-[0.12em]` (resserrer) + ajouter un kicker mono au-dessus (`AGT.NETWORK`) plus discret
- **Système typo réduit à 4 rôles** documentés :
  - `display` Orbitron 48/56 weight 200 → titres modules
  - `metric` Orbitron 28/32 weight 300 tabular-nums → KPI uniquement
  - `label` mono 10px tracking 0.22em uppercase → tous les `[ LABEL ]`, system tags, status pills (figer 1 seule taille)
  - `body` Rajdhani 14px → descriptions, names, hints
- **Couleur des `[ LABEL ]`** : par défaut `text-muted/0.7`. L'accent (cyan/violet/lime) **uniquement** sur les états actifs ou critiques (incoming signal en violet, KO/critical en magenta). Sortir de l'usage décoratif.
- **Priorité 🟠 High** — tout est mesurable et codable en 1 passe.

---

## 2 — Color System & Theming 🟡

### Current state
- 5 accents sémantiques DS : primary (cyan #5BB4FF), success (lime), warning (amber), critical (magenta), special (violet)
- Surfaces 1/2/3 + 3 bordures (subtle/default/strong) avec alpha
- Text : primary / secondary / muted / disabled
- Page utilise les 5 accents simultanément (cyan tabs+KPI, lime KPI+success, magenta KPI+request, amber KPI+guild, violet request+special)

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 6 | **Tous les 5 accents sont visibles d'emblée** sur la KPI strip → pas de hiérarchie sémantique, le cerveau ne sait pas où regarder | Saturation chromatique |
| 7 | `text-muted/0.5–0.6` sur surface-1 (#0a0e14) = **contraste ~3.1:1** → en dessous de WCAG AA (4.5:1) pour le corps de texte | Accessibilité ❌ |
| 8 | L'accent special (violet) est utilisé pour Requests ET pour le hover Message dans FriendNode → double sémantique | Confusion |
| 9 | Pas de "neutral / informational" ton — tout est sémantique ou décoratif | Manque pour les états intermédiaires |

### Recommendations
- **Règle d'usage des accents** (à graver dans le DS doc) :
  - cyan = navigation active + data live (par défaut)
  - lime = success uniquement (validation, online, gain)
  - magenta = critical / destructive uniquement (jamais "info")
  - amber = warning uniquement (deadline, capacity)
  - violet = premium / AI / focus mode (réserver)
- **InsightStrip** : passer 3 KPIs sur 4 en `text-primary` neutre, **un seul** en accent (le plus actionnable, ex. SIGNALS si > 0). Les 3 autres en cyan **uniquement à la valeur**, pas au label.
- **Augmenter `--ds-text-muted`** de `210 15% 55%` à `210 18% 65%` → contraste 4.7:1 sur surface-1 = AA conforme
- **Priorité 🟠 High** — Issue #7 est un blocker légal/éthique.

---

## 3 — Spacing, Layout & Grid 🟡

### Current state
- Container `max-w-5xl mx-auto px-4 md:px-8`
- Header `pt-8 pb-6`, InsightStrip `py-5 gap-x-8 gap-y-4`, Tabs `py-4`, content `p-4 sm:p-6`
- Listings `space-y-2 / 2.5`
- Friend list : continu (border-b interne, pas de gap)

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 10 | `space-y-2.5` (10px) pour les cards Request/Search vs **0px** pour FriendNode (continu) → 2 patterns de listing différents sans raison sémantique | Inconsistance |
| 11 | Padding horizontal interne des sections varie : 12px (`p-3`) / 16px (`p-4`) / 24px (`p-6`) → pas un système 4/8 strict | Rythme cassé |
| 12 | InsightStrip a un `gap-x-8` (32px) sur desktop → trop d'air sur 4 cols étroites, les chiffres flottent | Composition vide |
| 13 | Le **viewport 1053×584 actuel coupe le bouton primaire** "SEARCH" du CyberEmpty (visible mais collé en bas) → testing oublié sur petit desktop / tablet portrait | Responsive failure |

### Recommendations
- **Unifier listing pattern** : tous les onglets en mode "list continue" (Friends actuel) avec border-b internes. Cards = pour les `discover guilds` (grille 2 cols) seulement.
- **Spacing scale strict 4-pt** : 4 / 8 / 12 / 16 / 24 / 32. Bannir 10px, 14px, 20px. Cards padding = 16 (sm) / 20 (md). Listing gap = 0 (continu) ou 8 (séparé).
- **InsightStrip** : `gap-x-6` + `divide-x` cyan/0.1 entre KPIs (visuelle de séparation au lieu d'air vide)
- **Empty states** : ajouter `min-h-[40vh]` au lieu de centrage absolu pour éviter le crop sur petits viewports
- **Priorité 🟡 Medium**

---

## 4 — Component Design & Consistency 🟠

### Current state
- Boutons : 7 variants codés inline (`color/background/border` style props) au lieu d'utiliser shadcn `Button` variants
- Cards : 3 styles (DSPanel primary/secondary/muted + border-l accent)
- AvatarPing : 3 sizes, ring rotatif optionnel, badge optionnel
- FriendNode : pas de DSPanel (continu), RequestNode/GuildNodeCard/SearchResults : DSPanel

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 14 | **Boutons primaires inline-style** dans Search/Guilds/Requests → impossible à maintenir, aucun token reconnaissable | Dette technique |
| 15 | Le bouton SCAN (cyan) et le bouton ADD (cyan) et le bouton Discover (cyan) ont 3 styles inline légèrement différents (alpha, padding) | Inconsistance |
| 16 | Le **CyberEmpty** "SEARCH" dans FriendsTab utilise un Button shadcn **default** (cyan plein) tandis que tous les autres CTA sont en variant outline/HUD → CTA primaire de la page = solid, mais reste seul de son espèce | Mismatch |
| 17 | RequestNode `incoming` a un `border-l-2 violet` mais c'est le seul DSPanel qui override `border-l` → règle implicite, non documentée dans le DS | Hack |

### Recommendations
- **Créer 3 Button variants HUD** dans `src/components/ui/button.tsx` :
  - `hud-primary` : cyan outline + glow + Orbitron 11px
  - `hud-success` / `hud-critical` : variantes accent
  - `hud-ghost` : juste accent text + hover bg accent/0.08
- Migrer **tous** les boutons inline-style de Search/Guilds/Requests/CyberEmpty vers ces variants
- **Formaliser** le `accent-rail` (border-l-2 colored) comme prop officielle de `DSPanel` : `<DSPanel rail="special" />` → évite le className override
- **Priorité 🟠 High** — c'est le levier #1 pour passer "agréable" → "système"

---

## 5 — Navigation & Information Architecture 🟢

### Current state
- 4 tabs horizontaux (Friends/Requests/Guilds/Search) en bas hairline
- InsightStrip pré-tabs : duplique partiellement l'info (counts en KPI + counts en tabs)
- Pas de breadcrumb (entrée racine)

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 18 | Les **counts apparaissent 2× sur la page** : 1× dans la KPI strip et 1× dans les tabs en suffixe `02` → redondance | Bruit informationnel |
| 19 | Tab "Search" n'a pas de count → la grid des tabs est inconsistante visuellement | Asymétrie mineure |
| 20 | Une **scrollbar verticale parasite** apparaît sur la TabsList (visible dans la capture) → côté droit a un scroll alors que la TabsList est `flex-nowrap` mais le `overflow-x-auto` permet aussi un Y | Bug visuel |

### Recommendations
- **Supprimer les counts dans les tabs** → garder uniquement dans la KPI strip (source unique de vérité). Tab = label + icône, point.
- Ou inverse : **supprimer la KPI strip** et la transformer en mini-vital (1 ligne, à droite du header). À discuter selon ambition data-density.
- Fixer la scrollbar : `overflow-x-auto overflow-y-hidden` sur `AllianceTabs` container
- **Priorité 🟢 Nice-to-have** sauf scrollbar (🟠 High visuel)

---

## 6 — Micro-interactions & Feedback States 🟡

### Current state
- Loaders : `CyberLoader` (rows skeleton) — bon
- Empty : `CyberEmpty` avec icon + title + subtitle + CTA optionnel — bon
- Hover : opacity 0→100 sur actions FriendNode (Message/Remove) — élégant
- Animations : framer-motion fade+y stagger 30ms — fluide
- Pulse dot lime sur ONLINE — présent
- Aucun focus-visible explicite custom

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 21 | KPI affiche `00` quand value=0 → **visuellement vide et déstabilisant** ("est-ce un bug ?") | UX confuse |
| 22 | **Aucun focus-visible HUD** sur les TabsTrigger ou FriendNode (`role=button`) → utilisateur clavier perdu | Accessibilité ❌ |
| 23 | Pas de **success toast visuel** custom — fallback shadcn Sonner par défaut, pas tactique | Cohérence rompue à l'action |
| 24 | Hover FriendNode = `bg-surface-2/0.4` + actions apparaissent → ok mais **pas de glow / pas de bracket reveal** alors que c'est promis dans le pitch "tactical" | Promesse non tenue |

### Recommendations
- **KPI** : afficher `—` (em-dash muted) au lieu de `00` quand value=0 → état vide assumé, pas confondu avec data
- **Focus ring HUD** : ajouter dans `index.css` une règle `*:focus-visible { outline: 1px solid hsl(var(--ds-accent-primary)); outline-offset: 2px; }` ou plus tactique : 2 brackets corner cyan animés sur focus
- **FriendNode hover** : ajouter un fin trait cyan animé bottom (1px → 100% width, 200ms) + brackets corner micro
- **Sonner skin** : créer `src/components/ui/hud-toast.tsx` wrapping Sonner avec `[ TX OK ]` style mono + accent border
- **Priorité 🟠 High** pour focus-visible (a11y), 🟡 pour le reste

---

## 7 — Imagery, Icons & Illustration 🟢

### Current state
- Lucide React partout — taille mixte 12px (h-3) à 20px (h-5), strokeWidth par défaut 2
- Avatars : URL Supabase + fallback Orbitron initiale
- Aucune illustration custom (CyberEmpty utilise un icon Lucide en grand)

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 25 | **Tailles d'icônes hétéroclites** : 10px (h-2.5), 12, 14, 16, 18, 20 → pas de système | Inconsistance |
| 26 | Le **`UserCheck`** (tab Friends) et le **`Shield`** (tab Guilds) ont des poids visuels différents à 14px alors qu'ils servent le même rôle | Visuel inégal |
| 27 | Avatar fallback : `text-sm` Orbitron sur surface-3 = **contraste limite** (~3.8:1) avec accent-primary cyan | A11y faible |

### Recommendations
- **3 tailles d'icônes seulement** : 12 (micro inline), 16 (default UI), 24 (hero/empty)
- **Icon weight uniformization** : `strokeWidth={1.5}` partout pour un look plus tactique/fin (Lucide default = 2 = trop épais pour HUD)
- Avatar fallback : passer en `text-foreground` blanc (vs accent cyan) pour AA conforme
- **Priorité 🟢 Nice-to-have**

---

## 8 — Responsiveness & Adaptive Design 🟠

### Current state
- `max-w-5xl` + `px-4 md:px-8`
- InsightStrip : `grid-cols-2 sm:grid-cols-4` ✅
- Tabs : labels `hidden sm:inline` (icons-only mobile) ✅
- AllianceModuleHeader : `flex-wrap` chips
- Listings : `max-w-3xl mx-auto` interne (375px → 768px) ✅

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 28 | Sur viewport 1053 (capture) : le **bouton SEARCH du CyberEmpty est crop bottom** → la zone scroll est mal calculée | Bug responsive |
| 29 | Tabs mobile : icons-only avec count en suffixe `02` → **icone seule + count** = peu compréhensible (pas de label) | UX dégradée |
| 30 | Pas de **breakpoint `lg`** de différencié sur InsightStrip → reste 4 cols même à 600px ce qui squeeze les chiffres | Squeeze |
| 31 | FriendNode : actions Message/Remove cachées tant que pas hover → **inutilisable au touch** (pas de hover sur tactile) | Mobile cassé |

### Recommendations
- **FriendNode tactile** : au-delà de `md`, garder hover-reveal. En `< md`, afficher en permanence à droite (h-7 w-7) ou un seul bouton "kebab" avec menu
- **InsightStrip** : `grid-cols-2 sm:grid-cols-2 md:grid-cols-4` (forcer 2 cols jusqu'à md)
- **Empty state** : enlever le centrage flex absolu, mettre `py-16 md:py-24` (push vers le haut)
- **Mobile tabs** : afficher label + count en mobile aussi, scroll horizontal natif (déjà implémenté), juste réduire padding `px-3`
- **Priorité 🟠 High** — touch + crop bug

---

## 9 — Accessibility (Visual A11y) 🔴

### Current state
- `aria-label` présents sur boutons icon-only ✅
- `aria-hidden` sur dividers décoratifs ✅
- `role="button"` + `onKeyDown` Enter sur FriendNode ✅
- Reduced-motion respecté pour le ring rotatif ✅

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 32 | **Contraste muted/0.5–0.6 sur surface-1** = ratio ~2.8 à 3.5:1 → échec AA pour body text (4.5 requis), échec AA Large (3:1 limite) pour les labels | Blocker a11y 🔴 |
| 33 | **Aucun `:focus-visible` style** custom → les utilisateurs clavier voient le ring shadcn par défaut, qui sur HUD très sombre est presque invisible | Blocker a11y 🔴 |
| 34 | FriendNode `role="button"` mais pas `aria-pressed` ni `aria-expanded` → user attend un état | Sémantique incomplète |
| 35 | KPI `00` annoncés "zero zero" par les screen readers (deux chiffres) → ajouter aria-label `"Allies: 0"` au composant entier | Screen reader weird |
| 36 | Le `[ TARGET QUERY ]` micro-label en cyan/0.5 sur fond sombre = ratio 3.1:1 → label de formulaire AA requiert 4.5 | A11y |

### Recommendations
- **Token bump** : `--ds-text-muted: 210 18% 68%` (de 55%) → 4.7:1 conforme
- **Token bump** : `--ds-text-disabled: 210 12% 50%` (de 35%) → 3.5:1 (AA Large)
- **Focus universel** :
  ```css
  :focus-visible { 
    outline: 1px solid hsl(var(--ds-accent-primary));
    outline-offset: 2px;
    box-shadow: 0 0 0 3px hsl(var(--ds-accent-primary) / 0.15);
  }
  ```
- **Form labels** : passer les `[ TARGET QUERY ]` en text-secondary (AAA), garder cyan que sur le SCAN button
- **VitalSign** : envelopper dans un `<dl><dt><dd>` sémantique avec `aria-label="Allies: 0 active"`
- **Priorité 🔴 Critical** — engagement Pacte sur AAA, modules Health/Track ont déjà la conformité

---

## 10 — Brand Personality & Emotional Design 🟡

### Current state
- Direction : "Console tactique cyberpunk" (XCOM × Death Stranding × Edgerunners)
- Promesse : surveillance d'alliés, présence vivante, densité d'information
- Tonalité actuelle : **élégante, sobre, premium minimaliste**

### Issues identified
| # | Problème | Impact |
|---|---|---|
| 37 | La page tient la promesse "premium minimaliste" mais **perd l'aspect "tactical command center"** : pas de scan-line, pas de bracket reveal au hover, pas de bracket sur le DSPanel principal, pas de "datamoshing" subtil | Sous-promesse |
| 38 | Le `DSDataNoise` actif (count=6) fait des fragments mono `BYT.…` qui **leak en haut de la zone Friends listing** (visible dans la capture en superposition derrière "NO FRIENDS YET") → décor parasite, pas signature | Bug perçu |
| 39 | **Aucun moment "wow"** : pas d'event animé (ex. nouveau friend → mini scan beam), pas de "système qui vit" | Émotion plate |
| 40 | Le hero `FRIENDS` light avec accent black = **crée un contraste joli mais arbitraire** (pourquoi DS en gras ? aucun sens narratif). En l'état c'est un effet de style sans info | Style cosmétique |

### Recommendations
- **Re-injecter signature tactique** sans casser le minimalisme :
  - 1 scan-line cyan vertical lent (16s) **uniquement quand un onglet vient d'être chargé** (200ms après mount, dispar. après 1s)
  - Brackets corner cyan **uniquement au focus/hover du DSPanel principal** (pas en permanence)
  - Sound cue subtil (déjà géré globalement) sur tab switch
- **DSDataNoise** : limiter à `position: fixed` derrière la sidebar, ou retirer complètement de cette page (gain de clarté)
- **Hero** : retirer l'accent gras arbitraire → tout en `font-extralight`. Mettre l'accent gras uniquement sur **la valeur signifiante** (ex. nombre d'allies en gros à droite du titre)
- **Moment "wow"** : quand `pendingCount` passe de 0→N (realtime), faire pulser la KPI SIGNALS 3× + son ping. Vraie sensation de "système vivant"
- **Priorité 🟡 Medium** — pour passer "bon" → "mémorable"

---

## 📊 Global Design Score

| Dimension | Score | Note |
|---|---|---|
| Visual Polish | **6.5 / 10** | Direction forte, finitions inégales |
| Consistency | **5.5 / 10** | Patterns multiples non documentés (boutons inline, listing styles, tracking values) |
| UX Clarity | **7 / 10** | Navigation claire mais redondance counts + KPI vides confus |
| Accessibility | **4 / 10** | Échecs AA contrast + focus-visible absent = blockers |
| Brand Alignment | **7.5 / 10** | Identité présente, sous-exploitée sur les micro-moments |
| **GLOBAL** | **6.1 / 10** | **Bon module avec finition à 60%. 2 jours de polish atteint 8.5/10.** |

---

## ⚡ Top 5 Quick Wins (impact / effort élevé)

| # | Action | Effort | Impact |
|---|---|---|---|
| **1** | **Bump `--ds-text-muted` à 65–68% lightness** + ajouter règle `:focus-visible` cyan globale | 30 min | Déblocque AA + conforme a11y immédiatement |
| **2** | **KPI `0` → `—`** au lieu de `00` (em-dash muted) | 5 min | Supprime la sensation "vide/cassé" instantanément |
| **3** | **Supprimer les counts dans les TabsTrigger** (gardés en KPI strip) + fix `overflow-y-hidden` sur tabs container | 15 min | Élimine la redondance + scrollbar parasite |
| **4** | **Créer 3 variants Button HUD** (`hud-primary` / `hud-success` / `hud-critical`) et migrer Search/Guilds/Requests | 1h30 | Tue la dette inline-style + cohérence boutons à 100% |
| **5** | **Retirer `<DSDataNoise count={6} />` de Friends.tsx** → pollution visuelle nette en haut du listing | 2 min | Clarifie immédiatement la zone de contenu |

**Total Quick Wins : ~2h30 → score passe de 6.1 → 7.4**

---

## 🚀 Strategic Redesign Recommendations

### A — "Living Network" : passer de stat statique à présence temps réel
**Problème** : la KPI strip est statique, le module ressemble à un dashboard d'admin. Il devrait sentir le pouls du réseau social.

**Proposition** :
- Sub à la table `friends` + `friend_requests` en realtime (déjà supporté)
- Quand un allié passe online, faire pulser sa ligne dans le listing (lime glow 2s, fade out)
- Quand un nouveau request arrive : KPI SIGNALS pulse 3× + slide-in animation de la card sur l'onglet Requests
- Mini "ticker" mono en bas du listing : `[ NETWORK · 3 events in 24h · last: AGT.A4F joined ]`
- **Coût** : 1 jour
- **Impact** : transforme `/friends` en page "vivante", incite à revenir

### B — "Tactical Command Mode" : un mode dense optionnel
**Problème** : le mode actuel est minimaliste premium, mais ne sert que les power-users marginalement (3 fonctions seulement).

**Proposition** :
- Toggle en haut à droite : `[ COMPACT ]` / `[ EXPANDED ]`
- Mode EXPANDED : ajoute par allié un mini-stripe de stats (level, last goal completed, mutual XP, last activity) en grid 4 cols
- Mode COMPACT (actuel par défaut) : préservé
- État sauvé en `user_preferences.friends_density`
- **Coût** : 1.5 jour (UI + persistence + 4 nouvelles queries)
- **Impact** : densité d'information maximale pour les fans, sans casser la version épurée

### C — "Alliance Identity" : différencier visuellement /friends de /goals/journal/etc.
**Problème** : `/friends` partage 100% de la coquille avec les autres modules (header, KPI, tabs). Aucune signature mémorable propre au social.

**Proposition** :
- **Backdrop animé custom** : grille de points cyan/0.05 qui "respire" lentement (8s opacity 0.05↔0.15) — exclusif à /friends
- **Avatar grid en arrière-plan** du header : 5–7 avatars d'amis affichés en très faible opacité (10%) en pattern hexagonal flou derrière le titre `FRIENDS` → identité immédiate "réseau humain"
- Couleur d'accent secondaire **violet** plus présente (network = special) au lieu de tout cyan/lime
- **Coût** : 1 jour (backdrop SVG component + perf check)
- **Impact** : `/friends` devient instantanément reconnaissable au premier coup d'œil, hors-frame

---

## 📌 Roadmap d'implémentation suggérée

| Sprint | Contenu | Score visé |
|---|---|---|
| **Sprint 1 — Polish (3h)** | Top 5 Quick Wins | 6.1 → 7.4 |
| **Sprint 2 — A11y + Système (1 jour)** | Issues 7, 14–17, 22, 32–36 + variants HUD | 7.4 → 8.3 |
| **Sprint 3 — Identity (1 jour)** | Strategic recommendation C (Alliance Identity backdrop + avatars hex) | 8.3 → 8.8 |
| **Sprint 4 — Living (1 jour)** | Strategic recommendation A (Living Network realtime) | 8.8 → 9.3 |
| **Sprint 5 — Density (optionnel, 1.5 jour)** | Strategic recommendation B (Compact/Expanded toggle) | 9.3 → 9.6 |

---

## 🎤 Verdict final

> **Le module `/friends` est aujourd'hui à 6.1/10 — un bon produit avec une direction artistique forte mais une finition à mi-parcours.**
>
> Les défauts ne sont **jamais structurels** : aucune refonte architecturale n'est requise. Ce qui manque, c'est un cycle de **polish discipliné** sur 5 axes (a11y, système boutons, hiérarchie typo, micro-interactions, identité backdrop).
>
> **Avec 3h de Quick Wins**, le module passe à 7.4/10 (perception "agréable").
> **Avec 3 jours de roadmap complète**, il atteint 9.3/10 — niveau **agence top 10 SaaS** (Linear, Vercel, Raycast).
>
> Recommandation : démarrer **Sprint 1 + 2** immédiatement. Sprint 3–4 ensuite selon ambition produit.
