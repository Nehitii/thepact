## Plan — Bar View "Holographic Slab"

Rework complet de `BarViewGoalCard.tsx` + styles dans `src/styles/goals.css` (section `.bar-card-*`). Pas de touche aux autres composants ni à `goals.css` hors section dédiée.

### Anatomie de la nouvelle carte (hauteur ~120px, full width)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ╔═══════╗  [DIFF CHIP border-flow]              ┌──────────────┐    │
│ ║ IMG   ║   Goal Name (Orbitron 18px)           │     78%      │    │
│ ║ 96x96 ║   ● status · 12d left · 7/9 steps     │  PROGRESS    │    │
│ ║   ◔78%║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  └──────────────┘    │
│ ╚═══════╝                                                            │
└──────────────────────────────────────────────────────────────────────┘
  ↑ ring overlay         ↑ progress bar intégrée fond gradient mask    ↑ KPI XL
```

### Spécifications visuelles

**Carte (`.bar-card-root`)**
- Hauteur 120px (108px mobile), rounded-2xl, `isolate` + `contain:paint`
- Fond : `linear-gradient(135deg, hsl(var(--card)/0.6), hsl(var(--card)/0.3))` + backdrop-blur léger
- Border 1px `hsl(var(--accent)/0.25)` → hover `0.6`
- Progress fill **intégré au fond** : pseudo-élément `::before` avec `background: linear-gradient(90deg, hsl(var(--accent)/0.12) var(--percent), transparent var(--percent))` masqué pour ne pas couvrir le texte (mask radial doux). Donne l'impression que la carte se remplit.
- Hover : `transform: translateY(-2px) perspective(900px) rotateX(1deg)`, shadow accent, scanline horizontale qui traverse (1.5s keyframe)
- Focus state (`is_focus`) : border 2px accent + glow extérieur permanent doux

**Image (`.bar-card-visual`)**
- 96x96 (80 mobile), rounded-xl, frame avec coins coupés HUD (clip-path)
- Glow halo derrière selon difficulté (`rarity-halo` existant gardé)
- **Mini-ring de progression** overlay bas-droite : 28px, conic-gradient + inner dot (trophy si completed, icône status sinon)
- Placeholder Target icon si pas d'image, fond gradient accent

**Bloc central (`.bar-card-info`)**
- Chip difficulté en haut : pill outline avec `border-flow` animé (keyframe rotation gradient stops), dot pulsant + label uppercase Rajdhani 11px tracking-wider
- Nom : Orbitron 18px (16 mobile), `font-weight: 600`, truncate 1 ligne avec mask gradient en bout
- Ligne méta inline (Rajdhani 12px, `text-muted-foreground`) : icône status + label · deadline countdown (couleur dynamique) · steps `X/Y`
- SharedBadge inline si applicable
- Progress bar en bas : 3px, full width du bloc info, `bg-foreground/5`, fill accent avec shine animé (gardé du système actuel)

**KPI à droite (`.bar-card-kpi`) — NOUVEAU**
- Bloc 100px de large, séparateur vertical fin gauche (`border-l border-accent/15`)
- Si progress > 0 : `progressPercent + "%"` en Orbitron 28px tabular-nums + label "PROGRESS" 10px tracking-widest
- Si pas de steps mais deadline : `daysLeft + "d"` + label "REMAINING"
- Si completed : icône Trophy 28px + label "DONE"
- Sinon : `intensity` (1-5) en étoiles + label difficulté
- Couleur : accent de difficulté
- Mobile (< 640px) : KPI caché, méta enrichie à la place

**Focus star (`.bar-card-focus-btn`)**
- Repositionné top-right (au-dessus du KPI), 24x24, transparent → hover halo accent
- aria-label dynamique

### CSS — refactor `goals.css`

- Supprimer les 9 trackers `.tr-*` actuels (overkill, complexité visuelle)
- Supprimer `.bar-card-canvas`, `.bar-card-inner`, `.bar-card-noise` → simplification flat à 1 niveau
- Garder `.bar-card-root`, `.bar-card-container` (flex root), `.bar-card-visual`, `.bar-card-info`, `.bar-card-progress`, `.bar-card-fill`, `.bar-card-shine`
- Ajouter `.bar-card-kpi`, `.bar-card-kpi-value`, `.bar-card-kpi-label`, `.bar-card-diff-chip` (refonte avec border-flow), `.bar-card-scanline`
- Toutes les couleurs via `hsl(var(--accent))` (variable CSS injectée via `--accent` style) ou `hsl(var(--ds-accent-*))`
- `prefers-reduced-motion` : disable scanline + border-flow + tilt
- `@media (max-width: 640px)` : carte 108px, image 80x80, KPI hidden, nom 16px

### Composant — refactor `BarViewGoalCard.tsx`

- Garder l'interface props identique (zéro impact appelants)
- Garder `useMemo`, lock overlay, focus toggle, shared badge
- Calculer un `kpi` dérivé : `{ value, label, color }` basé sur status/progress/deadline/completed (helper local)
- Garder `getDifficultyTheme` mais migrer vers tokens HSL si possible (sinon laisser hex car déjà cohérent avec le système existant `getDifficultyTheme` partout)
- JSX simplifié à 3 colonnes (`visual | info | kpi`)
- Pas de changement data layer, pas de changement i18n

### Hors scope

- GridViewGoalCard intact
- GoalsToolbar intact  
- Logique data, focus, lock, navigation intactes
- Pas de migration DB

### Vérification

- `npx tsc --noEmit` doit passer
- Visual check via browser--screenshot après build (créer un goal de test si besoin, ou comparer en navigant sur un compte qui en a)
- Vérifier `prefers-reduced-motion`
- Vérifier responsive < 640px

### Budget

~1 fichier TSX réécrit (~180 LOC), ~250 lignes CSS modifiées dans `goals.css` (section bar-card uniquement). 2-3 crédits.
