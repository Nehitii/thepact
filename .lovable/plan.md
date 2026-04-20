
# /analytics V2.2 — Cyber Decoration & Visual Hierarchy

Itération de polish ciblée : ajouter une couche décorative cyberpunk discrète mais signature, atténuer les scanlines envahissantes, et renforcer le contraste entre panels pour mieux hiérarchiser l'information.

## Diagnostic

- **Scanlines trop présentes** : `prism-scanline` sur chaque panel + `prism-scan-ray` plein écran = fatigue visuelle, sensation de "bruit"
- **Manque de contraste** : tous les panels ont le même fond `bg-black/40` → impossible de distinguer un panel critique d'un secondaire
- **Décoration pauvre** : fond uniforme avec juste constellation + grille hex, sans éléments graphiques signature (pas de "framing" cyber autour du canvas)
- **Headline plat** : zone narrative sans accent visuel latéral, tout au même niveau
- **Rail nu** : barre verticale entre rail et canvas inexistante, transition sèche

---

## 4 axes d'amélioration

### 1. Atténuer les scanlines (sobriété)
- **Supprimer** `prism-scanline` sur les `PrismPanel` standards (garder uniquement sur le panel actif au hover)
- **Supprimer** le `prism-scan-ray` plein écran de `PrismBackground` (trop envahissant)
- **Conserver** uniquement la sweep line dans `PrismSkeleton` (sémantiquement justifiée = chargement)
- **Remplacer** par un *flicker* très ponctuel (3-4s entre flicks) sur 1-2 panels random max → effet "écran CRT vivant" sans saturer

### 2. Système de hiérarchie visuelle (contraste)
Introduire 3 niveaux de panel via prop `tier`:
- **`primary`** (visualisation signature) : fond `bg-black/60`, bordure cyan/30 (au lieu de /15), corner brackets plus longs (16px), légère lueur intérieure cyan
- **`secondary`** (chart standard) : fond `bg-black/40`, bordure cyan/15, corner brackets standards (10px)
- **`muted`** (info/metadata) : fond `bg-black/20`, bordure white/8, pas de corner brackets, padding réduit

Application : OrbitDistribution / TagConstellation / VelocityRiver / HealthRadar = `primary` ; charts Recharts restylés = `secondary` ; footers stats = `muted`.

### 3. Décor cyber signature (assets nouveaux)

**a. `PrismFrame` — encadrement holographique du canvas**
Quatre éléments fixes en position absolue dans `Analytics.tsx` :
- Coin haut-gauche : "L bracket" 60×60 cyan/40 avec point lumineux pulse
- Coin haut-droit : barre horizontale 120px + tag mono `[ OBSERVATORY // ACTIVE ]`
- Coin bas-gauche : graduation verticale (5 ticks) avec labels mono `00 · 25 · 50 · 75 · 100`
- Coin bas-droit : "L bracket" inversé + chevron animé (slow blink 2s)

**b. `PrismDivider` — séparateur entre rail et canvas (desktop only)**
Ligne verticale 1px avec :
- Gradient cyan/0 → cyan/40 → cyan/0 (vertical)
- 3 nœuds lumineux espacés (top/middle/bottom) avec micro-pulse desync
- Cache sur mobile

**c. `PrismDataNoise` — bruit data ambiant (canvas background)**
Élément optionnel : 8-12 mini "data fragments" textuels mono très opacity-faible (`opacity-[0.04]`) flottants en background du canvas :
- Strings courtes : `0xFA42`, `SEQ.7B3`, `>EXEC`, `RDY`, `02:14:09`, `LOG.OK`
- Position aléatoire au mount, tailles variées (10-14px)
- Aucune animation (statiques pour ne pas distraire)
- Composant `<PrismDataNoise count={10} />` dans le canvas main

**d. `PrismHeadline` — accent latéral**
Ajouter à gauche du headline une barre verticale néon cyan (4px de large, hauteur du bloc) avec :
- Gradient vertical cyan/80 → cyan/30
- Petit indicateur point lumineux en haut (signal "live")
- Label vertical `OBS.MAIN` rotation -90deg en mono ultra-petit (8px) si espace

### 4. Background plus contrasté
Dans `PrismBackground` :
- **Fond** : passer de `hsl(var(--prism-bg))` (220 50% 4%) à un gradient subtil **radial** depuis le centre haut : centre `220 50% 6%` → bords `220 60% 2%` (vignette inversée légère, focalise l'œil)
- **Grille hex** : passer opacité de `0.04` à `0.06` mais grille plus large (100px au lieu de 80px) → moins dense, plus lisible
- **Constellation** : conserver mais réduire de 36 à 24 étoiles, augmenter taille moyenne pour celles restantes
- **Ajout** : 2 lignes diagonales fines cyan/[0.05] partant des coins opposés, créant un X très subtil derrière tout (sensation de "scope")

---

## Détails techniques

### Fichiers à créer
- `src/components/analytics/PrismFrame.tsx` — encadrement 4 coins du canvas
- `src/components/analytics/PrismDivider.tsx` — séparateur vertical rail/canvas
- `src/components/analytics/PrismDataNoise.tsx` — fragments data ambiants

### Fichiers à éditer
- `src/components/analytics/PrismPanel.tsx` — ajout prop `tier: 'primary' | 'secondary' | 'muted'` (default `secondary`), retrait `prism-scanline` permanent, ajout flicker conditionnel via prop `flicker?: boolean`
- `src/components/analytics/PrismBackground.tsx` — retrait `prism-scan-ray`, gradient radial, grille élargie, lignes diagonales X, constellation réduite
- `src/components/analytics/PrismHeadline.tsx` — accent latéral barre néon + indicateur live
- `src/pages/Analytics.tsx` — intégration `PrismFrame` (autour du canvas), `PrismDivider` (entre rail et canvas), `PrismDataNoise` (background canvas), application `tier="primary"` sur charts signatures
- `src/index.css` — keyframes `prism-flicker` (flash très court), retrait usage `prism-scan-ray`

### Tier mapping (application)
| Panel | Tier |
|-------|------|
| OrbitDistribution, TagConstellation, VelocityRiver, HealthRadar | `primary` |
| Tous Recharts restylés (Focus AreaChart, Health Score, Income/Expenses, etc.) | `secondary` |
| Footer stats panels, info légère | `muted` |

### CSS — flicker discret
```css
@keyframes prism-flicker {
  0%, 96%, 100% { opacity: 1; }
  97% { opacity: 0.85; }
  98% { opacity: 1; }
  99% { opacity: 0.92; }
}
```
Appliqué via classe `.prism-flicker` (animation `8s infinite`, désynchronisée avec `animation-delay` random par panel ciblé).

### Conservé intact
Hook `useAnalytics`, `analyticsInsights.ts`, structure rail (6 sections), tous les charts existants, `PrismRail`, `PrismIcons`, `PrismTooltip`, `PrismBadge`, `PrismSkeleton`, `PrismSparkline`, `InsightStrip`, `PeriodSelector`.

### Hors scope
- Pas de modif data layer
- Pas de nouvelles métriques
- Pas de refonte responsive (juste cacher PrismDivider sur mobile)
- Pas de modif i18n
