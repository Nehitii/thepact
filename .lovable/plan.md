
# /analytics → PRISM Observatory v3

Refonte premium de l'expérience Analytics. On garde le langage PRISM existant (HSL néon cyan/magenta/lime/violet/amber, corner brackets, font Orbitron + mono), mais on monte la barre sur **densité visuelle, interactivité, micro-animations et ergonomie**.

L'objectif n'est pas de reconstruire — c'est de transformer une page "tableau de bord" en **observatoire vivant** où chaque KPI respire, chaque chart répond au curseur, et chaque transition raconte quelque chose.

---

## 1. Hero "Cockpit" (remplace PrismHeadline)

```text
┌─[PRISM // OBSERVATORY v3]─────────────── T+14:32:08 · LIVE ●──┐
│  ▌                                                            │
│  ▌  ↑ +127% Goals completed                  [7D][30D][90D]   │
│  ▌  exceptional momentum                     [ALL]            │
│  ▌                                                            │
│  ▌  ▁▂▃▅▇█ data density 87%   ◐ 4 modules actifs              │
└────────────────────────────────────────────────────────────────┘
```

- Ticker animé (lettres qui se révèlent, à la "Mission Impossible") sur le titre d'insight au changement de période.
- **Compteur AnimatedNumber** sur le delta (interpolation 0 → valeur, 600ms easeOut).
- Mini barre de **data density** (8 segments qui s'allument séquentiellement).
- Indicateur "modules actifs" (orbes lumineux, un par module ayant des données).
- Background du hero : **scanline lente** (CSS keyframe, 4s loop) + **breath glow** sur le rail néon latéral.
- `prefers-reduced-motion` → désactive ticker, scanline, glow pulse ; conserve le contenu statique.

## 2. KPI Cards interactives (refonte InsightStrip)

Chaque carte VitalSign devient un **mini-écran tactique** :

- **Hover** → tilt 3D léger (`rotateX/Y` 4°), corner brackets s'étirent, sparkline s'épaissit, gradient s'intensifie.
- **Click** → ouvre un **PrismMicroDrawer** (slide-in depuis la droite, 320px) avec : valeur exacte, 30 derniers points, comparaison période précédente, bouton "voir plus" qui change la section du rail.
- AnimatedNumber sur les valeurs (interpolation à l'apparition + au changement de période).
- Sparkline : ajout d'un **dot tracker** qui suit le curseur sur hover avec tooltip flottant (X/Y).
- Ajout d'un **mini ring de progress** discret derrière l'icône pour les KPI avec target (Health %, Completion %).

## 3. Rail latéral magnétique (PrismRail v2)

- Indicateur actif déjà animé (`layoutId`) — **on ajoute** :
  - **Glow trail** qui suit le déplacement (gradient cyan qui fade derrière).
  - **Sound subtil** au survol (déjà câblé via `useSound("ui")` au click — ajout d'un "tick" très léger au hover, opt-in via SoundContext).
  - **Badge numérique** par section indiquant le nombre de panels avec données (ex: "Goals · 4").
  - **Section progress** : petit segment vertical à côté du label montrant le ratio de panels "live" vs "empty".
- **Keyboard nav** : flèches haut/bas pour naviguer, Enter pour activer, accessible.
- Mobile : chips horizontales conservent layoutId, on ajoute snap-scroll et auto-scroll vers actif.

## 4. Panels v3 (PrismPanel enrichi)

- **Header interactif** : icône ⓘ → tooltip avec définition du panel + source des données.
- **Toolbar discrète au hover** (en haut à droite, fade-in) :
  - Toggle "compare period" (overlay de la période précédente en pointillé sur les charts temporels).
  - Bouton "expand" → ouvre le panel en **modal pleine largeur** (Radix Dialog) avec chart agrandi + breakdown détaillé.
  - Bouton "export" → CSV/PNG.
- **Empty state amélioré** : au lieu du seul "NO SIGNAL DETECTED", proposer un **CTA contextuel** ("Logger ta première humeur" → /health) avec micro-illustration animée (radar qui scanne).
- **Loading state** : remplace le Skeleton plat par un **shimmer scanline** sur la silhouette du chart attendu (area / bar / radar).
- **Flicker** existant : on garde, mais respecte `prefers-reduced-motion`.

## 5. Charts plus vivants

- **Crosshair partagé** : sur les charts temporels d'une même section, le hover sur un X aligne tous les autres charts au même X (via un petit context React).
- **Animations d'entrée** : Recharts `isAnimationActive` à `true`, durée 800ms, `animationEasing="ease-out"`. Stagger entre charts (50ms par index).
- **Gradient fills** : on enrichit avec un **noise overlay** subtil (déjà via `PrismDataNoise`) sur les zones d'aire pour éviter l'aplat.
- **Tooltip** : repensé en card flottante avec icône, valeur, delta vs jour précédent, mini-trend 5 derniers points.
- **Annotations automatiques** : un point exceptionnel (>2σ) reçoit un marker pulsant + label discret ("PEAK" / "DIP").

## 6. Nouveaux composants visuels

- **PRISM HUD Footer** (sticky bas) : barre fine 32px de haut affichant en temps réel — date, période active, nb signaux live, raccourcis clavier visibles (`?` pour palette).
- **Cinematic transitions entre sections** : au lieu d'un simple fade, on fait un effet **"prism refract"** : l'ancien contenu se décale légèrement + blur 4px → fade out, le nouveau entre avec une scanline qui balaie. Durée 350ms total.
- **Particules ambiantes** très discrètes dans le PrismBackground (8-12 particules dérivantes, opacity 0.15) — désactivables via reduced motion.

## 7. Ergonomie & raccourcis

- **Command Palette dédiée** (extension de la palette globale) : `1-6` pour switcher de section, `←/→` pour changer de période, `e` pour exporter, `f` pour fullscreen le panel actif.
- **Deep linking** : `/analytics?section=goals&period=30d` — état synchronisé avec l'URL (search params).
- **Persistance** : dernière section + période vues stockées en localStorage (clé `pacte:analytics:state`).
- **Tap targets mobiles** ≥ 44px sur tous les chips/boutons (déjà `.touch-target` dispo).

## 8. Mode "Focus single panel"

Bouton dans la toolbar du panel → **mode plein écran** qui :
- Cache rail + hero, étend le panel à 100% du viewport.
- Affiche un mini-controlbar en haut (close, period, export).
- Animation : panel zoom-in 0.94 → 1.0, autres éléments fade out 200ms.
- Échap pour sortir.

---

## Fichiers impactés

**Nouveaux :**
- `src/components/analytics/PrismHero.tsx` (remplace PrismHeadline avec ticker, density bar, modules actifs)
- `src/components/analytics/PrismMicroDrawer.tsx` (drawer KPI)
- `src/components/analytics/PrismHUDFooter.tsx` (footer sticky)
- `src/components/analytics/PrismCrosshairContext.tsx` (sync hover X entre charts)
- `src/components/analytics/PrismPanelToolbar.tsx` (toolbar hover)
- `src/components/analytics/PrismFullscreenPanel.tsx` (mode focus)
- `src/components/analytics/PrismShimmer.tsx` (loading shimmer cinétique)
- `src/components/analytics/PrismEmptyCTA.tsx` (empty states avec CTA)
- `src/hooks/useAnalyticsState.ts` (URL + localStorage sync)
- `src/hooks/useReducedMotion.ts` (si pas déjà présent)

**Modifiés :**
- `src/pages/Analytics.tsx` — câblage des nouveaux composants, deep-link, raccourcis clavier.
- `src/components/analytics/InsightStrip.tsx` — tilt 3D, AnimatedNumber, click → drawer.
- `src/components/analytics/PrismRail.tsx` — badges, glow trail, keyboard nav.
- `src/components/analytics/PrismPanel.tsx` — toolbar hover, slot empty CTA, intégration shimmer.
- `src/components/analytics/PrismBackground.tsx` — particules ambiantes.
- `src/components/analytics/PrismTooltip.tsx` — refonte avec delta + mini-trend.
- `src/styles/design-tokens.css` ou `src/index.css` — keyframes `prism-scanline`, `prism-refract`, `prism-tilt`.

---

## Ce qu'on ne touche pas

- Architecture data (`useAnalytics` hook reste tel quel).
- Recharts (on l'enrichit, pas de remplacement).
- Système de tokens HSL `--prism-*` (on les réutilise, on n'invente pas de couleur).
- Sound design (on utilise `useSound` existant).

---

## Approche — 3 vagues

1. **Vague A — Hero + KPI Cards interactives + Rail v2** (impact visuel maximal, ~6 fichiers)
2. **Vague B — Panels v3 + Charts vivants + Crosshair** (interactivité chart, ~5 fichiers)
3. **Vague C — Fullscreen mode + HUD Footer + Shortcuts + Deep-link + Empty CTAs** (polish & ergonomie)

Confirme l'approche (et si tu veux les 3 vagues d'un coup ou séquentiellement) et je démarre par la Vague A.
