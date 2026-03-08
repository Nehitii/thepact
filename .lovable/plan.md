

# Refonte totale du Shop — Style Néo-Gaming Premium

Direction : Boutique style Fortnite/Valorant avec cartes larges, rareté hyper-visible, animations fluides, layout immersif en grille.

---

## Problèmes actuels

- **Incohérence visuelle** : chaque section (Spotlight, Daily Deals, Bundles, Cosmetics, Modules, Bonds, Wishlist, History) a son propre design language — bordures, spacings, couleurs, typographies différents.
- **Cards trop petites** pour les cosmétiques (grille 2-3 colonnes serrées).
- **Header** sobre mais pas assez impactant pour un shop gaming.
- **Tabs** trop classiques, manque de punch visuel.
- **ModuleCard** utilise un système CSS custom complètement disjoint du reste (hover blanc qui contraste avec le thème sombre).
- **Wishlist/History** sous-exploitées visuellement.

---

## Design System Unifié

### Palette de rareté (partout identique)
```text
Common    → slate-400, aucun glow
Rare      → blue-500, glow subtil
Epic      → purple-500, glow moyen + particules
Legendary → amber-500, glow fort + conic border + particules dorées
```

### Carte universelle ("ShopCard")
Un seul composant de carte réutilisé partout (cosmetics, modules, deals, bundles, wishlist). Structure :
```text
┌─────────────────────────────┐
│  [Image/Preview] plein-cadre│  ← aspect-[3/4], fond avec gradient rareté
│                             │
│  ┌─ Rarity badge (top-left) │
│  └─ Wishlist btn (top-right)│
│                             │
├─────────────────────────────┤
│  Nom (orbitron bold)        │
│  Prix  •  [BUY] btn         │  ← Bouton coloré par rareté
└─────────────────────────────┘
```

Taille fixe par colonne, hover = scale 1.05 + glow intensifié + border rareté. Legendary cards ont une bordure animée conic-gradient.

---

## Plan par composant

### 1. Shop.tsx — Page shell
- Supprimer le hexagon SVG pattern de fond (trop subtil, inutile).
- **Nouveau header** : plus grand, avec un titre "SHOP" stylisé en gradient + badge animé "NEW ITEMS" si des items récents existent. Background gradient sombre avec des light leaks de rareté.
- **Tabs** redessinés : plus grands, avec icônes proéminentes + underline animée épaisse (3px) + glow sous l'onglet actif. Style pill plutôt que plat.
- Conserver la structure AnimatePresence + motion.div pour les transitions.

### 2. ShopTabs.tsx — Refonte complète
- Passer d'un style "bar plate" à des **pills distinctes** avec séparation visuelle.
- Onglet actif : fond solide `primary/15`, border-bottom 3px primary, icône avec drop-shadow.
- Desktop : espacement large. Mobile : scroll horizontal avec snap.

### 3. ShopBondDisplay.tsx — Raffinement
- Garder le compteur animé mais agrandir légèrement, ajouter un badge "LOW" pulsant rouge si < 500.
- Simplifier (retirer les corner brackets décoratifs).

### 4. ShopSpotlight.tsx — Redesign "Hero Banner"
- Prendre toute la largeur, aspect-ratio ~21/9.
- Image/preview à gauche (40%) avec parallax maintenu.
- Info à droite : rarity badge XXL, nom en gros (2xl), prix en gros, boutons "Preview" et "Buy Now" stylisés selon la rareté.
- Fond : gradient diagonal de la couleur de rareté, watermark "FEATURED" maintenu mais plus subtil.

### 5. DailyDealsSection.tsx + DailyDealCard.tsx — Carousel premium
- Garder le carousel horizontal mais cartes plus grandes (min-w-[320px]).
- **DailyDealCard** : layout vertical (image en haut, info en bas) plutôt qu'horizontal. Timer flip-digit en bas. Badge discount en haut-gauche avec animation pulse. Bordure rouge pulsante conservée.
- Utiliser la palette de rareté unifiée.

### 6. BundlesSection.tsx + BundleCard.tsx — Crate immersive
- **BundleCard** : layout horizontal maintenu mais avec un "crate" visual plus grand (80x80). Items affichés en grille 2x2 mini-thumbnails au lieu de text pills.
- Badge "SAVE X" plus proéminent (starburst ou ribbon style).
- Bouton "Get Bundle" plein-largeur en bas.

### 7. CosmeticShop.tsx — Grid restructurée
- **Sidebar catégories** (desktop) : style vertical pills avec icône + count. Active = filled pill avec glow.
- **Mobile** : tabs horizontaux scrollables (déjà fait, raffiner le style).
- **Grille** : passer à `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` pour des cartes plus compactes mais plus nombreuses.
- **ShopFilters** : intégrer dans une toolbar compacte (search + sort + filter sur une ligne).

### 8. CyberItemCard.tsx — Le "ShopCard" unifié
- **Refonte majeure** : aspect-ratio 3/4, preview plein-cadre (pas de padding excessif).
- Rarity : bande colorée en haut de la carte (3px) au lieu d'un badge texte.
- Preview area : fond gradient subtil basé sur la rareté.
- Info zone plus compacte : nom + prix + bouton sur 2 lignes.
- Hover : border s'illumine de la couleur de rareté, scale 1.04, shadow glow.
- Legendary : particules dorées (conserver), conic border (conserver mais raffiner).
- Owned : overlay sombre avec checkmark hexagonal (conserver, c'est bon).
- **Supprimer le 3D tilt** (trop coûteux en perf, pas gaming enough — remplacer par un simple scale + glow).

### 9. ModulesShop.tsx + ModuleCard.tsx — Uniformiser
- **Supprimer** tout le CSS custom `.module-card*` de `index.css`.
- Réécrire `ModuleCard` avec le même design system : carte sombre, border rareté, features list intégrée, bouton "Purchase" style unifié.
- Supprimer l'effet hover blanc (contradictoire avec le thème sombre).
- Garder la grille 1-2-3 colonnes.

### 10. BondsShop.tsx — Vitrine premium
- **Header section** : conserver mais raffiner (retirer les bordures excessives).
- **Pack cards** : redesign en grille uniforme. Chaque pack = carte verticale avec icône Bond grande, montant en gros, prix EUR en bouton CTA en bas. Bonus badge ("+20% BONUS") en ruban diagonal.
- **PromoCode** : intégrer en bas dans un bandeau discret.
- **Trust footer** : simplifier en une ligne horizontale.

### 11. WishlistPanel.tsx — Grid améliorée
- Utiliser le ShopCard unifié en mode compact (grille 2-3 colonnes).
- Ajouter un bouton "Buy All Affordable" en haut si des items sont achetables.
- Summary bar en sticky bottom.

### 12. PurchaseHistory.tsx — Terminal propre
- Conserver le style terminal/ledger (c'est cohérent et bien fait).
- Raffiner les spacings et la typographie pour matcher le nouveau design system.
- Ajouter des icônes de rareté colorées à chaque transaction.

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/pages/Shop.tsx` | Refonte header + fond + layout |
| `src/components/shop/ShopTabs.tsx` | Redesign pills |
| `src/components/shop/ShopBondDisplay.tsx` | Simplification + polish |
| `src/components/shop/ShopSpotlight.tsx` | Hero banner pleine largeur |
| `src/components/shop/DailyDealsSection.tsx` | Layout vertical cards |
| `src/components/shop/DailyDealCard.tsx` | Redesign vertical + palette unifiée |
| `src/components/shop/BundlesSection.tsx` | Crate visual amélioré |
| `src/components/shop/BundleCard.tsx` | Layout + thumbnails |
| `src/components/shop/CosmeticShop.tsx` | Grid 4 colonnes + sidebar pills |
| `src/components/shop/CyberItemCard.tsx` | Refonte card aspect 3/4 |
| `src/components/shop/ModulesShop.tsx` | Suppression header redondant |
| `src/components/shop/ModuleCard.tsx` | Réécriture Tailwind (supprimer CSS custom) |
| `src/components/shop/BondsShop.tsx` | Pack cards uniformisés |
| `src/components/shop/WishlistPanel.tsx` | ShopCard compact + Buy All |
| `src/components/shop/PurchaseHistory.tsx` | Polish mineur |
| `src/components/shop/ShopFilters.tsx` | Toolbar compacte inline |
| `src/index.css` | Supprimer les `.module-card*` rules |

Aucune migration DB ou changement backend requis. Purement visuel/UI.

