
# /analytics V2 — "PRISM" Data Observatory

Refonte radicale d'`/analytics` vers une esthétique **observatoire de données cyberpunk** — un cockpit holographique où chaque métrique respire, où les charts sont des instruments d'analyse, et où la navigation suit un fil narratif clair.

## Diagnostic actuel

- 2 onglets génériques (Pact & Goals / Modules) → flat, manque de hiérarchie
- ModuleHeader + Hero KPI redondants visuellement
- TrendStatCards et ChartCards = même style neutre que partout, **0 identité analytics**
- 12+ charts empilés verticalement → fatigue visuelle, scroll infini
- Aucun storytelling : tout au même niveau, pas de "headline insight"
- Pas de feedback visuel sur la **densité de données** (sparse vs riche)
- Absence totale d'élément signature (pas de hero distinct, pas de visualisation hors-norme)

---

## Vision PRISM

**Un observatoire**. Fond noir profond avec **constellation de données** subtile. Une **HeadlineInsight** qui change selon la période ("Tu as complété 3× plus de goals ce mois-ci"). Des charts en **panneaux holographiques** avec scanlines discrètes, glow néon par catégorie, et rings/orbites pour les distributions. Navigation par **rail vertical** (timeline-like) au lieu de tabs horizontales.

Palette : `cyan #00E5FF` (data primary) · `magenta #FF00AA` (deltas négatifs) · `lime #B6FF00` (progress) · `violet #9D5BFF` (focus/time) · fond `#05070C`.

---

## Nouvelle architecture

```
┌─ PrismBackground (constellation + scan ray lent) ────────────────────┐
│                                                                       │
│  ╔═ PRISM // OBSERVATORY ═══════════════════════════ [period chip] ╗ │
│  ║  HEADLINE INSIGHT (narratif AI-style)                           ║ │
│  ║  "↑ +247% goals completed vs last period"                       ║ │
│  ║  [ pulse indicator · live timestamp · session id ]              ║ │
│  ╚════════════════════════════════════════════════════════════════╝ │
│                                                                       │
│  ┌─ Vertical Rail ─┐  ┌─ Main canvas ─────────────────────────────┐ │
│  │ ◉ OVERVIEW      │  │                                            │ │
│  │ ○ GOALS         │  │   [ Section streamée selon rail actif ]   │ │
│  │ ○ FOCUS         │  │                                            │ │
│  │ ○ HEALTH        │  │                                            │ │
│  │ ○ FINANCE       │  │                                            │ │
│  │ ○ HABITS        │  │                                            │ │
│  └─────────────────┘  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

Rail vertical sticky à gauche (desktop) / chips horizontales (mobile). 6 sections au lieu de 2 onglets vagues.

---

## 6 Piliers de la refonte

### 1. `PrismBackground`
Fond `#05070C` + grille hexagonale très subtile + 30-40 points lumineux statiques (constellation) + 1 rayon scan vertical lent (15s). Aucune particule lourde. `motion-reduce` safe.

### 2. `PrismHeadline` (signature)
Bandeau horizontal sticky en haut remplaçant ModuleHeader + AnalyticsHero :
- Titre `PRISM // OBSERVATORY` en Orbitron muted
- **HeadlineInsight** auto-généré : choisit la métrique avec le plus gros delta et formule une phrase ("Focus time +180% — your best streak yet")
- Fallback neutre si pas de delta : "Tracking 24 active signals across 6 modules"
- Pulse vert/rouge selon trend dominant
- Period chip à droite (réutilise PeriodSelector existant, restylé)
- Live timestamp + session ID muted

### 3. `PrismRail` (navigation verticale)
Rail 64px sticky à gauche, 6 items :
- ◉ **Overview** (synthèse multi-modules)
- **Goals** (difficulté, tags, velocity, completion)
- **Focus** (pomodoro, sessions, time)
- **Health** (score trend, métriques)
- **Finance** (income/expenses/savings, burn rate)
- **Habits** (streak, completion rate)

Indicateur actif : barre verticale néon cyan à gauche du label + glow. Numéro 01-06 en muted. Label vertical possible sur mobile collapse.

### 4. `PrismPanel` (chart card refonte)
Remplace ChartCard. Chaque panneau :
- Fond `bg-black/40 backdrop-blur-xl`
- Bordure 1px cyan/[0.15] avec **corner brackets** (4 coins L-shaped) façon HUD
- Header : label HUD `[ID] · TITLE · UNIT` en mono
- Scanline horizontale très discrète animée (5s)
- Footer optionnel avec mini-stats : MIN · MAX · AVG · TREND
- Hover : intensification du glow, lift 2px

### 5. Visualisations signatures (remplacent les pies plats)

**a. `OrbitDistribution`** (remplace Difficulty pie)
Distribution par difficulté en orbites concentriques. Chaque difficulté = un anneau, chaque goal = un point lumineux orbitant. Couleur = couleur de difficulté. Rotation très lente.

**b. `TagConstellation`** (remplace Tag pie)
Distribution par tag en constellation 2D : chaque tag = un nœud, taille proportionnelle au count, lignes de connexion fines entre tags partageant des goals (si data dispo, sinon juste nœuds positionnés en cercle). Hover nœud → highlight + label.

**c. `VelocityRiver`** (remplace Goal Velocity line)
Aire fluide bidirectionnelle : axe horizontal = mois, courbe au-dessus = goals créés, courbe en miroir en-dessous = goals complétés, gradient cyan→lime.

**d. Reste des charts** (Health, Finance, Pomodoro, Todo)
Conservés Recharts mais **restylés PRISM** : grids dashed cyan/[0.1], axis labels mono uppercase, gradients plus saturés, dots réduits.

### 6. `InsightStrip` (par section)
En haut de chaque section, une rangée de 3-4 micro-cartes "vital signs" remplaçant TrendStatCard :
- Format ultra-compact horizontal
- Valeur grosse mono · label HUD · sparkline 7 points · delta arrow
- Hover : expansion détail + tooltip

---

## Restructure par section du rail

| Section | Contenu |
|---------|---------|
| **Overview** | Vital signs cross-module (4 cards : completion %, total XP, focus h, health avg) + VelocityRiver + 2 panels résumé Health/Finance |
| **Goals** | OrbitDistribution + TagConstellation + VelocityRiver + GoalsCreatedVsCompleted (BarChart restylé) + cost breakdown panel |
| **Focus** | Vital signs (focus h, sessions, avg session, best day) + Focus Time AreaChart restylé + heatmap journalière (réutilise `HabitHeatmap` adapté) |
| **Health** | Vital signs (avg score, best/worst day, sleep avg, stress) + Health Score AreaChart full-width restylé + breakdown radar chart 6 axes (sleep, mood, activity, hydration, meals, stress) |
| **Finance** | Vital signs (saved, burn rate, income avg, expenses avg) + Income vs Expenses LineChart restylé + savings cumul AreaChart |
| **Habits** | Vital signs (streak, completion %, total logs, best week) + heatmap 12 semaines + completion rate par habit |

---

## Détails techniques

### Fichiers à créer
- `src/components/analytics/PrismBackground.tsx`
- `src/components/analytics/PrismHeadline.tsx` — bandeau + insight auto
- `src/components/analytics/PrismRail.tsx` — nav verticale + responsive chips
- `src/components/analytics/PrismPanel.tsx` — remplace ChartCard
- `src/components/analytics/InsightStrip.tsx` — vital signs row
- `src/components/analytics/charts/OrbitDistribution.tsx` — SVG anneaux orbitaux
- `src/components/analytics/charts/TagConstellation.tsx` — SVG nœuds
- `src/components/analytics/charts/VelocityRiver.tsx` — Recharts AreaChart bidirectionnel
- `src/components/analytics/charts/HealthRadar.tsx` — Recharts RadarChart 6 axes
- `src/lib/analyticsInsights.ts` — générateur HeadlineInsight (analyse trends pour produire phrase)

### Fichiers à éditer
- `src/pages/Analytics.tsx` — refonte complète layout (rail + sections)
- `src/components/analytics/index.ts` — exports
- `src/components/analytics/PeriodSelector.tsx` — léger restyle PRISM
- `src/index.css` — keyframes `prism-scanline`, `prism-orbit-spin`, `prism-pulse-cyan`, classe `.prism-corner-bracket`
- `src/i18n/locales/{en,fr}.json` — clés rail (Overview, Goals, Focus, Health, Finance, Habits) + insight templates

### Fichiers à retirer
- `src/components/analytics/AnalyticsHero.tsx` (remplacé par PrismHeadline + InsightStrip)
- `src/components/analytics/TrendStatCard.tsx` (remplacé par InsightStrip)
- `src/components/analytics/ChartCard.tsx` (remplacé par PrismPanel)

### Logique HeadlineInsight (`analyticsInsights.ts`)
- Reçoit `summary` + `trends`
- Calcule le delta absolu max parmi 4 trends (goalsCompleted, stepsCompleted, healthScore, focusMinutes)
- Choisit template selon signe + magnitude :
  - delta > 100% : "↑ +X% [metric] vs last period — exceptional"
  - delta 20-100% : "↑ +X% [metric] vs last period — strong momentum"
  - delta -20 à 20% : "[metric] stable at [value]"
  - delta < -20% : "↓ -X% [metric] vs last period — needs attention"
- Period === "all" : message statique "Tracking [N] signals across 6 modules"

### Animations CSS
```css
@keyframes prism-scanline { /* horizontal sweep on panels */ }
@keyframes prism-orbit-spin { /* slow rotation 60s */ }
@keyframes prism-pulse-cyan { /* breathing glow */ }
@keyframes prism-scan-ray { /* full-page vertical scan */ }
```
Tous wrappés `motion-reduce:animate-none`.

### Tokens design (CSS vars)
```css
--prism-bg: 220 50% 4%;
--prism-cyan: 188 100% 50%;
--prism-magenta: 320 100% 55%;
--prism-lime: 75 100% 50%;
--prism-violet: 265 100% 70%;
--prism-panel-bg: 220 30% 6% / 0.6;
--prism-panel-border: 188 100% 50% / 0.15;
```

### Conservé intact
Hook `useAnalytics` (zéro changement, déjà solide), `PeriodSelector` (léger restyle uniquement), toute la data layer, recharts comme moteur principal pour les charts non-signatures.

### Responsive
- Desktop ≥1024px : Rail vertical 180px + canvas
- Tablet 768-1024px : Rail collapse à 64px (icônes only)
- Mobile <768px : Rail devient barre horizontale scrollable au-dessus du canvas, sticky
