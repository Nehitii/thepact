

# Audit Design Global — VowPact

## Vue d'ensemble

VowPact est une application ambitieuse avec un theme cyberpunk/HUD coherent, ~20 modules, un design system riche (Nexus panels, HUD frames, corner brackets, clip-paths). L'identite visuelle est forte et reconnaissable. Cependant, l'application souffre de plusieurs problemes systemiques qui impactent la coherence, la lisibilite et l'experience utilisateur globale.

---

## 1. INCOHERENCES DE DESIGN SYSTEM

### 1.1 Trois systemes de panneaux concurrents
L'application utilise au moins 3 systemes de conteneurs differents sans regles claires :
- **NeuralPanel** (Home) — variables `--nexus-*`, border-radius 4px, separateurs horizontaux
- **HUDFrame** (Health) — rounded-2xl, noise texture, scan lines, variantes hero/metric/chart
- **CyberPanel** (Settings) — clip-path angulaires, sans border-radius

**Probleme** : Chaque module reinvente ses propres conteneurs. Goals utilise des cards avec `goal-card-bg/border`, Finance utilise des Tabs standard, Friends utilise `bg-card/80 border-border/50`, Leaderboard utilise `bg-card/50`. Il n'y a pas de composant "panel" unifie.

**Proposition** : Harmoniser autour de 2 variantes maximum (NeuralPanel pour les modules standards, HUDFrame pour les modules immersifs comme Health/Focus/TheCall). Deprecier CyberPanel partout sauf Settings.

### 1.2 Headers de page inconsistants
- **Home** : NeuralBar + NexusHeroBanner (custom, pas de ModuleHeader)
- **Goals, Analytics, Finance, Health, Todo, Calendar, Wishlist, Focus** : ModuleHeader (rotating rings, orbe, system label)
- **Friends** : Header custom (gradient icon + titre inline)
- **Community** : LiveTicker custom + onglets textuels
- **Leaderboard** : Header minimal (titre + icone inline)
- **Shop** : Titre custom avec ShopBondDisplay
- **Journal** : Header custom avec RotatingRings + HexBadges + horloge live

**Proposition** : Standardiser — tous les modules dans AppLayout utilisent ModuleHeader. Friends, Community, Leaderboard, Shop et Journal doivent etre alignes.

### 1.3 Backgrounds de page divergents
- **Home** : Background fixe avec radial gradients + scanlines globales (z-9999)
- **Goals** : CyberBackground component
- **Friends** : Blurred circles + noise SVG externe
- **Community** : CyberBackground
- **Health** : Ambient glow reactif au score
- **Focus** : FocusAmbientEffects (particules)
- **Analytics, Finance, Todo, Calendar** : Aucun background decoratif

**Proposition** : Definir 2 niveaux : "immersif" (CyberBackground pour Goals/Community/Wishlist) et "standard" (fond neutre pour Analytics/Finance/Todo/Calendar). Retirer le noise SVG externe de Friends (charge une URL tierce).

---

## 2. TYPOGRAPHIE & LISIBILITE

### 2.1 Force globale d'Orbitron
Le CSS base (`h1-h6`) force `font-family: 'Orbitron'` + `text-transform: uppercase` + `letter-spacing: 0.1em` sur TOUS les titres et labels. Cela pose probleme pour :
- Les contenus textuels longs (Journal, Community posts)
- Les formulaires (labels en uppercase sont plus difficiles a lire)
- Les titres de goals qui sont des phrases naturelles

**Proposition** : Limiter Orbitron aux headers de module et labels de navigation. Utiliser Rajdhani (deja declare) pour les titres de contenu et les formulaires.

### 2.2 Textes trop petits et trop dim
Pattern recurrent dans toute l'app :
- `text-[9px]` avec `opacity: 0.3` (TheCall, Home, Sidebar)
- `text-[10px]` avec tracking tres large (NeuralBar, section labels)
- `text-muted-foreground/40` ou `text-primary/40`

Ces textes sont physiquement illisibles sur mobile. Minimum recommande : `text-[11px]` avec opacite >= 0.5.

---

## 3. RESPONSIVITE MOBILE

### 3.1 Sidebar mobile
Le bouton toggle sidebar (`>>`) est fixe a `top-14 left-4` et peut chevaucher le contenu de certaines pages (TheCall, Focus). Sur mobile, la sidebar fait 280px fixe — correct, mais le backdrop `bg-black/90` est tres opaque.

### 3.2 Grilles non adaptatives
- **Home** : `grid-cols-1 md:grid-cols-12` — OK
- **Analytics** : `grid-cols-2 md:grid-cols-4` — les 2 colonnes sur 375px sont trop petites pour les TrendStatCards
- **Health** : Grilles de metriques sans breakpoint intermediaire

**Proposition** : Les grilles de stats/KPI doivent etre `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` pour garantir la lisibilite sur petit ecran.

### 3.3 ModuleHeader trop volumineux sur mobile
Le ModuleHeader avec `pt-10 pb-8`, rotating rings et orbe central consomme ~200px verticaux. Sur mobile, c'est excessif pour chaque module.

**Proposition** : Variante mobile du ModuleHeader : masquer les rotating rings, reduire les paddings (`pt-4 pb-3`), conserver uniquement titre + badges.

---

## 4. ACCESSIBILITE

### 4.1 Contraste
- Mode light : `--primary: 200 100% 67%` (cyan vif) sur fond blanc — ratio de contraste insuffisant pour du texte (~3.2:1, minimum WCAG AA = 4.5:1)
- Les labels `text-primary/50` ou `text-primary/40` en light mode sont sous le seuil
- Les badges hexagonaux du ModuleHeader utilisent des couleurs saturees sur fond colore

### 4.2 Animations sans `prefers-reduced-motion`
Seul TheCall respecte `prefers-reduced-motion`. Les composants suivants ne le font pas :
- CyberBackground (particules animees)
- ParticleEffect (explosions au clic)
- NeuralBar (scanline infinie)
- Home scanlines globales (z-9999)
- RotatingRings dans ModuleHeader et Journal
- FocusAmbientEffects

**Proposition** : Wrapper global `prefers-reduced-motion` — desactiver toutes les animations decoratives quand active.

### 4.3 Focus states
Les `clip-path` sur les boutons de la sidebar et le bouton mobile coupent les outlines de focus. Le `focus-visible:ring-2` du bouton standard est parfois invisible derriere le clip-path.

---

## 5. PERFORMANCE

### 5.1 CSS bloat
Le fichier `index.css` fait **2466 lignes**. Il contient :
- Des keyframes dupliques (glow-pulse defini 2 fois, float defini 2 fois)
- Des classes jamais utilisees (`.double-border`, `.bevel-edge`, `.scan-line` — probablement des vestiges)
- Des keyframes inline dans TheCall, Journal, et potentiellement d'autres composants

### 5.2 Animations permanentes
- **Home** : Scanlines globales en `z-[9999]` sur toute l'app (pas seulement Home)
- **NeuralBar** : Scanline animee en boucle infinie
- **Sidebar** : `animate-ping` permanent sur le status dot

Ces animations consomment du GPU en permanence meme quand non visibles.

### 5.3 Lazy loading
Bien implemente — toutes les pages sont lazy-loaded. Bon point.

---

## 6. DETAILS PAR MODULE

| Module | Etat | Problemes principaux |
|--------|------|---------------------|
| **Home** | Bon | Scanlines z-9999 globales, "Advanced Monitoring" cache par defaut (utilisateurs ne le decouvrent jamais) |
| **Goals** | Bon | CyberBackground + ModuleHeader = lourd sur mobile |
| **Analytics** | Correct | Grille 2-col trop serree sur mobile, pas de background decoratif (decalage visuel vs autres pages) |
| **Finance** | Correct | 7 onglets — surcharge cognitive. Les TabsTrigger sont trop petits en mobile |
| **Health** | Bon | HUDFrame coherent, bon systeme de variantes |
| **Focus** | Bon | Recemment audite |
| **TheCall** | Bon | Recemment audite |
| **Journal** | Correct | Header custom non aligne, horloge live = re-render chaque seconde |
| **Todo** | Bon | Bonne structure, DnD integre |
| **Friends** | Moyen | Header non aligne, noise SVG externe, `h-screen overflow-hidden` force |
| **Community** | Correct | LiveTicker custom, CyberBackground |
| **Leaderboard** | Faible | Header minimal, pas de ModuleHeader, pas de background — visuellement pauvre vs le reste |
| **Shop** | Correct | Pas de ModuleHeader, header custom |
| **Achievements** | Correct | Bon systeme de filtres, mais pas de ModuleHeader |
| **Calendar** | Correct | ModuleHeader present, page simple |
| **Wishlist** | Correct | 753 lignes — composant trop gros, devrait etre split |
| **Auth** | Bon | Design terminal coherent et immersif |
| **Onboarding** | Correct | Simple et fonctionnel |
| **Settings** | Bon | CyberPanel unifie, bien standardise |

---

## 7. RECOMMANDATIONS PRIORITAIRES

### Phase 1 — Coherence critique
1. **Standardiser les headers** : Friends, Leaderboard, Shop, Achievements, Journal → adopter ModuleHeader
2. **Retirer les scanlines z-9999 de Home** (elles s'appliquent globalement a toute l'app)
3. **Fixer les grilles mobile** : TrendStatCards en `grid-cols-1 sm:grid-cols-2`
4. **Variante mobile de ModuleHeader** : cacher rotating rings, reduire padding

### Phase 2 — Accessibilite
5. **`prefers-reduced-motion` global** : desactiver CyberBackground, ParticleEffect, RotatingRings, scanlines
6. **Contraste light mode** : ajuster `--primary` ou utiliser une variante plus sombre pour le texte
7. **Focus states** : s'assurer que les clip-path ne coupent pas les ring de focus

### Phase 3 — Nettoyage
8. **Purger index.css** : supprimer les keyframes dupliques et les classes inutilisees
9. **Deplacer les keyframes inline** (TheCall, Journal) vers index.css
10. **Journal** : remplacer l'horloge live (re-render/s) par une ref ou un composant isole memo
11. **Friends** : retirer le chargement du noise SVG externe

### Phase 4 — Harmonisation avancee
12. **Unifier les backgrounds** : 2 niveaux (immersif / standard)
13. **Limiter Orbitron** aux headers, utiliser Rajdhani pour le contenu
14. **Finance** : regrouper les 7 onglets en sections logiques

---

## Fichiers principalement impactes

| Fichier | Action |
|---------|--------|
| `src/index.css` | Purge, reduced-motion, contraste, dedup keyframes |
| `src/components/layout/ModuleHeader.tsx` | Variante mobile |
| `src/pages/Home.tsx` | Retirer scanlines globales |
| `src/pages/Friends.tsx` | Adopter ModuleHeader, retirer noise externe |
| `src/pages/Leaderboard.tsx` | Adopter ModuleHeader |
| `src/pages/Shop.tsx` | Adopter ModuleHeader |
| `src/pages/Achievements.tsx` | Adopter ModuleHeader |
| `src/pages/Journal.tsx` | Adopter ModuleHeader, optimiser horloge |
| `src/pages/Analytics.tsx` | Fix grille mobile |
| `src/pages/Finance.tsx` | Fix tabs mobile |
| `src/components/CyberBackground.tsx` | prefers-reduced-motion |
| `src/components/ParticleEffect.tsx` | prefers-reduced-motion |
| `src/components/journal/JournalDecorations.tsx` | prefers-reduced-motion |

