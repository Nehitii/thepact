
# /analytics V2.1 — Polish & Asset Layer

Le squelette PRISM est en place. Cette itération ajoute la **couche d'identité visuelle propriétaire** : assets SVG signature, micro-interactions raffinées, et cohérence des détails. Pas de refonte structurelle — on enrichit ce qui existe.

## Diagnostic actuel (post-PRISM)

En lisant `Analytics.tsx`, `PrismPanel`, `PrismRail`, `PrismHeadline` :
- Rail vertical fonctionnel mais **icônes Lucide génériques** (BarChart3, Target, Timer…) → manque d'identité
- Panels HUD propres mais **fond uniforme** → pas de hiérarchie visuelle entre panels critiques vs secondaires
- HeadlineInsight textuelle mais **pas d'élément visuel d'amorce** (pas de badge, pas de spectre)
- InsightStrip = cards plates, **sparklines absentes** alors que prévues au plan
- Charts Recharts restylés mais **tooltip générique** Recharts (pas d'identité PRISM)
- Aucun **état "no data"** custom par chart (fallback EmptyState générique)
- Period chip discret, **pas de feedback de chargement** (skeleton trop neutre)
- Transitions entre sections du rail = changement instantané, **pas de respiration**

---

## 7 axes d'amélioration concrets

### 1. Pictogrammes signature PRISM (assets propriétaires)
Remplacer les 6 icônes Lucide du rail par un set SVG inline custom : style "instrument scientifique" filaire, 1.5px stroke, 24×24, cohérence géométrique.

- **Overview** → cercle + 4 traits cardinaux (radar sweep)
- **Goals** → cible concentrique 3 anneaux + croix
- **Focus** → sablier hexagonal stylisé
- **Health** → ECG mini-courbe
- **Finance** → courbe ascendante + barre seuil
- **Habits** → grille 3×3 partiellement remplie

Fichier : `src/components/analytics/PrismIcons.tsx` exportant `<OverviewIcon />`, etc. Hover = trait passe de cyan/60 à cyan/100 + léger glow.

### 2. PrismTooltip custom (charts)
Recharts accepte un composant custom via `<Tooltip content={<PrismTooltip />} />`. Crée un tooltip HUD :
- Fond `bg-black/80 backdrop-blur-md`
- Bordure 1px cyan/30 + corner brackets micro
- Header mono uppercase `[ DATAPOINT ]`
- Valeur grosse mono · label muted
- Petit accent latéral coloré selon série

Appliqué à VelocityRiver, HealthRadar, et tous les Recharts restylés.

### 3. InsightStrip enrichie
Le plan prévoyait sparkline 7 points par card mais semble absent. Ajouter :
- Mini-sparkline SVG 60×16 pure (pas Recharts, trop lourd)
- Trend arrow inline avec couleur sémantique
- Hover : élévation 2px + glow accent + tooltip détail
- État "first datapoint" : afficher pulse au lieu de sparkline si <2 points

### 4. PrismBadge & ID tags système
Convention HUD partout :
- Chaque PrismPanel reçoit un ID 3-lettres (`OVR.01`, `GLS.03`, `FCS.02`) en mono
- Badge statut latéral : `LIVE` (pulse vert), `STALE` (ambre), `OFFLINE` (rouge)
- Composant `<PrismBadge variant="live|stale|empty" />` réutilisable

### 5. PrismSkeleton (loader signature)
Remplacer le `<Skeleton />` shadcn par un loader PRISM :
- Fond panel identique
- Ligne scan horizontale animée (sweep 1.2s)
- Texte mono `[ ACQUIRING SIGNAL... ]` au centre, opacity pulse
- Corner brackets visibles dès le loading (continuité visuelle)

Fichier : `src/components/analytics/PrismSkeleton.tsx`.

### 6. Empty states par chart
Chaque chart signature doit avoir son empty state custom (pas le générique) :
- **OrbitDistribution vide** : un seul anneau pulse + "AWAITING TARGETS"
- **TagConstellation vide** : 3 nœuds gris fantômes connectés + "NO TAGS DETECTED"
- **VelocityRiver vide** : ligne plate cyan/20 + "FLOW INACTIVE"
- **HealthRadar vide** : hexagone vide + "BIOMETRICS OFFLINE"

### 7. Transitions inter-sections du rail
Quand on switch Overview → Goals, actuellement instantané. Ajouter :
- Fade-out 120ms du contenu actuel
- Fade-in + slide-up 8px du nouveau contenu (200ms)
- Indicateur rail : barre néon glisse verticalement entre items (Framer Motion `layoutId`)
- Subtle scan ray traverse le canvas une fois au switch

---

## Bonus polish (si temps)

**Period chip → Time scrubber**
Le PeriodSelector reste une dropdown. Le transformer en pill segmentée horizontale avec underline glissant (layoutId) entre 7D / 30D / 90D / ALL.

**Live timestamp réel**
Dans PrismHeadline, le timestamp doit ticker chaque seconde (pas figé au mount). Petit `useEffect` setInterval 1000ms.

**Session ID**
Generate stable hash `SID-A8F2-C3D1` basé sur user.id (slice md5 ou simple `user.id.slice(0,4)+'-'+user.id.slice(-4)`) — ajoute crédibilité tactique.

**Sound feedback**
Sur switch de section du rail, jouer le `ui-click` sound existant (déjà dispo via `useSoundContext`).

---

## Fichiers à créer
- `src/components/analytics/PrismIcons.tsx` — 6 icônes SVG signature
- `src/components/analytics/PrismTooltip.tsx` — tooltip HUD pour Recharts
- `src/components/analytics/PrismBadge.tsx` — badges LIVE/STALE/OFFLINE
- `src/components/analytics/PrismSkeleton.tsx` — loader signature
- `src/components/analytics/PrismSparkline.tsx` — mini-SVG 60×16

## Fichiers à éditer
- `src/components/analytics/PrismRail.tsx` — remplace Lucide par PrismIcons + indicateur Framer layoutId
- `src/components/analytics/PrismPanel.tsx` — accepte `idTag`, `status`, intègre PrismBadge + PrismSkeleton
- `src/components/analytics/PrismHeadline.tsx` — live timestamp ticker + session ID
- `src/components/analytics/InsightStrip.tsx` — intègre PrismSparkline + hover lift
- `src/components/analytics/PeriodSelector.tsx` — segmented pill avec layoutId
- `src/components/analytics/charts/*.tsx` (4 fichiers) — empty states custom + PrismTooltip
- `src/pages/Analytics.tsx` — wrapper `motion.div` AnimatePresence pour transitions sections
- `src/index.css` — keyframe `prism-skeleton-sweep`, `prism-badge-pulse`

## Conservé intact
Hook `useAnalytics`, `analyticsInsights.ts`, structure du rail (6 sections), tous les calculs, AppLayout, navigation globale.

## Hors scope (volontairement)
- Pas de nouvelles métriques (couche data inchangée)
- Pas de refonte du layout principal
- Pas de nouveaux charts (juste enrichissement des 4 signatures + 8 Recharts existants)
- Pas de modif i18n (textes HUD restent EN, technique)
