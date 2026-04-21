
# Pacte OS — Plan d'Uniformisation Graphique

Audit constaté : l'application possède déjà des fondations cyber solides (Orbitron + Rajdhani, cyan néon `#5BB4FF`, 6 modules signature : Nexus / PRISM / Aura / HUD-Health / Journal / Shop) **mais ces systèmes coexistent en silos** avec leurs propres tokens, surfaces et conventions. Résultat : incohérence d'une page à l'autre, redondance de variables CSS (~200+), poids visuel inégal.

Le plan ci-dessous **consolide ces dialectes en un Design System canonique unique : "Pacte OS"** — épuré par défaut, cyber par accent.

---

## 1. Direction Artistique — "Calm Tech, Loud Signal"

**Principe directeur** : 80% surface neutre, 20% signal cyber. Le néon n'est jamais décoratif — il signale toujours **un état actif, une donnée live ou une action critique**.

| Règle | Application |
|---|---|
| **Décor < Donnée** | Pas plus de 2 effets animés simultanés par viewport (scanline, pulse, glow). Tout reste optionnel via `prefers-reduced-motion`. |
| **Brackets > Bordures pleines** | Les coins en L (10-16px) remplacent les bordures continues lourdes — économie visuelle, lecture HUD instantanée. |
| **Mono pour la métadonnée** | IDs (`OVR.01`), timestamps, deltas → `font-mono`. Le reste reste Rajdhani. Crée une hiérarchie sans alourdir. |
| **Glassmorphism contrôlé** | `backdrop-blur-md` réservé aux overlays (modals, popovers, headlines sticky). Jamais sur les cards en grille (perf + lisibilité). |
| **Vide = Information** | Empty states custom par module avec micro-animation et phrase HUD (`AWAITING SIGNAL`). |

Anti-cliché : on bannit les hexagones décoratifs gratuits, les particules denses, les gradients arc-en-ciel cyberpunk.

---

## 2. Palette Chromatique Canonique

Renommage des tokens redondants (`--prism-*`, `--nexus-*`, `--journal-*`, `--hud-*`) vers une convention unique `--ds-*` (Design System) :

### Surfaces (dark mode signature)
```css
--ds-bg-base:      220 50% 4%;    /* Fond app */
--ds-bg-canvas:    220 40% 6%;    /* Zone contenu */
--ds-surface-1:    220 30% 8%;    /* Card secondaire */
--ds-surface-2:    220 25% 11%;   /* Card primaire / élevée */
--ds-surface-3:    220 20% 14%;   /* Modal, popover */
--ds-overlay:      220 30% 4% / 0.85; /* Backdrop */
```

### Bordures (3 niveaux)
```css
--ds-border-subtle:  200 50% 75% / 0.08;  /* Séparateur */
--ds-border-default: 200 50% 75% / 0.18;  /* Card standard */
--ds-border-strong:  200 50% 75% / 0.35;  /* Card primaire / focus */
```

### Accents néon (5 sémantiques fixes)
| Token | Hex | Usage exclusif |
|---|---|---|
| `--ds-accent-primary` (cyan) | `#5BB4FF` | Navigation active, données neutres, focus |
| `--ds-accent-success` (lime) | `#B6FF6A` | Progression, complétion, gains |
| `--ds-accent-warning` (amber) | `#FFB454` | Attention, deadlines proches |
| `--ds-accent-critical` (magenta) | `#FF4D8F` | Erreur, perte, destruction |
| `--ds-accent-special` (violet) | `#9D5BFF` | Premium, focus mode, AI |

### Texte (échelle lisibilité AAA-grade)
```css
--ds-text-primary:   210 30% 96%;  /* contrast 16.4:1 sur surface-1 */
--ds-text-secondary: 210 20% 75%;  /* 9.2:1 */
--ds-text-muted:     210 15% 55%;  /* 5.1:1 — minimum AA */
--ds-text-disabled:  210 10% 35%;  /* décoratif uniquement */
```

**Light mode** : conservé comme miroir tonal (220 50% 96% base), **mais le contrat néon reste identique** (mêmes 5 accents, même rôle sémantique).

---

## 3. Typographie

Conservation de l'existant + clarification des rôles :

| Famille | Rôle | Tailles & casing |
|---|---|---|
| **Orbitron** (700, 800) | Titres HUD, labels système, tags de section | 11-14px UPPERCASE tracking-[0.2em] |
| **Rajdhani** (400, 500, 600) | Body, paragraphes, formulaires, narration | 14-16px sentence case |
| **JetBrains Mono** (à ajouter, 400/500) | IDs, timestamps, deltas, valeurs numériques tabulaires | 9-12px — `tabular-nums` obligatoire |

Bénéfice : Mono = signal "donnée machine", Orbitron = signal "système", Rajdhani = signal "humain". Le cerveau distingue les 3 rôles sans effort.

Échelle modulaire (ratio 1.25) :
```
xs 11 · sm 13 · base 16 · lg 20 · xl 25 · 2xl 32 · 3xl 40
```

---

## 4. UI Kit Canonique

### Card (3 tiers, le standard du module Analytics V2.2 généralisé)
```
┌─ tier="primary"   ─ surface-2 + border-strong  + corner-brackets 16px + inner glow
├─ tier="secondary" ─ surface-1 + border-default + corner-brackets 10px
└─ tier="muted"     ─ surface-1 + border-subtle  + sans brackets, padding réduit
```
Composant unique `<DSPanel tier="...">` — remplace `PrismPanel`, `Card`, `NexusPanel`, `JournalCard`, `AuraWidget`.

### Button (5 variants, 3 sizes)
- **default** : cyan plein, glow 15px (CTA primaire)
- **hud** (existant) : transparent + bordure cyan/40 (action HUD)
- **outline** : bordure cyan/30 + bg transparent
- **ghost** : aucun fond, hover bg accent/10
- **destructive** : magenta plein, glow magenta

Toutes intègrent déjà le sound feedback (`useSound`) — comportement conservé.

### Input / Textarea
- Fond `surface-1`, bordure `border-default`
- Focus : bordure `accent-primary/60` + ring 1px externe + glow 8px
- Label flottant Orbitron 11px UPPERCASE
- Erreur : bordure magenta + texte mono 11px en bas

### Modal / Sheet / Drawer
- Backdrop : `overlay` + `backdrop-blur-sm`
- Contenu : `surface-3` + corner brackets 16px sur les 4 coins
- Header sticky : Orbitron 14px + bouton close hud
- Animation : `scale-in 200ms` + fade backdrop 150ms
- Tous les overlays utilisent `isolate` + `[contain:paint]` (règle existante respectée)

### Tooltip / Popover
- Style PRISM tooltip généralisé : `surface-3 + border-strong + brackets micro 6px`
- Header mono 9px `[ DATAPOINT ]`, valeur Orbitron 14px

### Badge (statut système universel)
- `LIVE` (lime pulse) · `STALE` (amber) · `OFFLINE` (magenta) · `LOCKED` (gris) · `NEW` (cyan)
- Format mono 9px UPPERCASE + dot 6px latéral

### Skeleton / Loader
- `DSSkeleton` (basé sur `PrismSkeleton`) : surface-1 + scan sweep 1.2s + texte `[ ACQUIRING SIGNAL... ]`
- `CyberLoader` (existant, plein écran) conservé pour route transitions

### Sparkline / Mini-chart
- `DSSparkline` (basé sur `PrismSparkline`) : SVG pur 60×16, gradient accent + endpoint glow
- Standard pour toutes les micro-stats partout dans l'app

---

## 5. Iconographie & Éléments Graphiques

### Système 3-couches
1. **Lucide React** (existant) — actions universelles (Save, Edit, Trash, Search). Stroke 1.5px, 16-24px.
2. **PrismIcons** (existant, à étendre) — pictogrammes de section/module signature. Style "instrument scientifique" filaire 1.5px.
3. **PactVisual** (existant) — symboles narratifs (rangs, pacts, achievements). Réservé aux moments rituels.

**Règle** : ne jamais mélanger les 3 layers dans un même composant. Lucide pour les actions, PrismIcons pour les sections, PactVisual pour les hero/identity.

### Éléments graphiques signature (réutilisables)
- **Corner brackets** (`.ds-corner-bracket`) — déjà dans PRISM, à promouvoir au niveau global
- **DSDivider** (vertical/horizontal) — gradient transparent → accent → transparent + 3 nœuds pulse desync
- **DSDataNoise** (background ambiant) — fragments mono opacity-[0.04] (existant PRISM, à généraliser sur Home/Profile)
- **DSScanRay** (optionnel par page) — UN scan vertical lent par page max, désactivable

### À supprimer (cliché ou redondant)
- Hexagones de fond gratuits (sauf grille hex Analytics)
- Particules denses non justifiées (CyberBackground à audit)
- Gradients arc-en-ciel
- Animations `glow-pulse` superposées (max 1 par card)

---

## 6. Hiérarchie & Layout

### Grille canonique (12 colonnes desktop)
- Container : `max-w-7xl` centré, padding `px-6 lg:px-8`
- Gap standard : `gap-4` (16px) intra-section, `gap-8` (32px) inter-section
- Mobile : stack vertical, padding `px-4`, gap réduit `gap-3`

### Anatomie de page standard
```
┌─ ModuleHeader (sticky 64px) ─────────────────────────┐
│  [Icon] MODULE.ID · Title             [actions HUD] │
├─ InsightStrip (4 vital signs ≈ 80px)────────────────┤
│  [stat 1]  [stat 2]  [stat 3]  [stat 4]             │
├─ Main canvas (grid 12 cols) ────────────────────────┤
│  ┌─ tier=primary 8col ─┐ ┌─ tier=secondary 4col ─┐ │
│  │                     │ │                        │ │
│  └─────────────────────┘ └────────────────────────┘ │
│  ┌─ tier=secondary 6col┐ ┌─ tier=secondary 6col ─┐ │
│  └─────────────────────┘ └────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Densité (rule of thirds)
- **1/3 espace négatif minimum** par viewport (anti-cliché "trop chargé")
- Padding interne card : `p-5` (primary), `p-4` (secondary), `p-3` (muted)
- Line-height body : `1.6` minimum
- Pas plus de **6 cards visibles simultanément** sans scroll

### Sticky strategy
- ModuleHeader : `top-0`
- InsightStrip : `top-16` (sous header)
- Section nav (rail/tabs) : `top-32`
- Backdrop blur uniquement sur sticky elements (pas sur cards inline)

---

## Plan d'exécution (3 phases)

### Phase 1 — Tokens canoniques (foundation)
- Créer `src/styles/design-tokens.css` avec les variables `--ds-*`
- Mapper les anciens tokens (`--prism-*`, `--nexus-*`, `--journal-*`, `--hud-*`) en alias vers `--ds-*` (zéro breaking change initial)
- Étendre `tailwind.config.ts` avec les nouvelles couleurs sémantiques (`accent-success`, `accent-critical`, etc.) et la famille `mono`
- Charger JetBrains Mono via Google Fonts

### Phase 2 — Composants canoniques (UI Kit)
Créer `src/components/ds/` :
- `DSPanel.tsx` (généralisation de PrismPanel)
- `DSBadge.tsx` (généralisation de PrismBadge)
- `DSSkeleton.tsx`, `DSSparkline.tsx`, `DSTooltip.tsx`, `DSDivider.tsx`, `DSDataNoise.tsx`
- `DSCornerBrackets.tsx` (utilitaire absolu)
- Documenter chaque composant avec props + tier mapping

### Phase 3 — Migration progressive (page par page)
Ordre de priorité (impact visuel décroissant) :
1. **Home** (NeuralBar + panels) → DSPanel tier system
2. **Profile / Settings** → unifier sur DSPanel
3. **Goals listing + detail** → cards en tier=secondary, hero en tier=primary
4. **Finance Aura** → mapper Aura tokens vers ds-*
5. **Health HUD** → mapper hud-* vers ds-*
6. **Journal Chronolog** → mapper journal-* vers ds-*
7. **Friends / Guilds / Community / Shop / Calendar / Todo / Focus / Wishlist** → audit + remplacement Card par DSPanel

À chaque étape : suppression des tokens dupliqués, conservation des couleurs spécifiques (difficulty, achievement rarity — non-touchés).

---

## Hors scope (volontaire)

- Refonte fonctionnelle (zéro changement métier)
- Modification des couleurs Difficulty / Achievement / Rank (chartes narratives sacrées)
- Suppression du light mode
- Refonte de la sidebar (NEXUS OS) — déjà canonique
- Modification du système de sons, du système de frames d'avatar, du PactVisual

## Bénéfices mesurables attendus

- **−60% de tokens CSS** (de ~200 à ~80)
- **Cohérence visuelle 1:1** entre les 12 modules principaux
- **Temps de création d'une nouvelle page divisé par 3** (composants prêts à l'emploi)
- **Réduction du payload CSS** de ~25KB (deduplication)
- **A11y AA garantie** (contrastes documentés et testés sur les 4 niveaux de texte)
