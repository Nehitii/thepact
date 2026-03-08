

# Refonte du module Wishlist — Images, Import Web, Redesign Premium + Archive enrichie

## Audit actuel

**Structure DB** : `wishlist_items` contient name, estimated_cost, item_type, category, url, notes, goal_id, acquired, source_type. Pas de colonne `image_url`.

**UI** : Liste plate de cartes horizontales simples. Pas d'images. Pas d'import externe. L'archive des items acquis est un accordion minimaliste sans coût total.

**Hooks** : `usePactWishlist.ts` (CRUD), `useWishlistGoalSync.ts` (sync goal costs). Pas de scraping/import.

---

## Changements requis

### 1. Migration DB — Ajouter `image_url` à `wishlist_items`
```sql
ALTER TABLE public.wishlist_items ADD COLUMN image_url text;
```

### 2. Edge Function — Import depuis URL externe
Nouvelle edge function `scrape-product` qui :
- Reçoit une URL de produit
- Utilise Firecrawl (si connecteur dispo) ou un fetch simple + parsing des meta tags OpenGraph (`og:title`, `og:image`, `og:price`)
- Retourne `{ name, image_url, price, currency }` au client
- Fallback : extraction basique des balises `<meta>` avec regex si pas de Firecrawl

### 3. Refonte graphique complète — Style Neo-Gaming Premium

**Page shell** :
- Header immersif avec stats en direct (total items, total cost, acquired count + acquired cost)
- Barre de filtres compacte inline (search + type + sort sur une ligne)

**WishlistItemCard redesign** :
- Layout en grille de cartes verticales (2 cols mobile, 3 cols desktop) au lieu de la liste plate
- Chaque carte : image en haut (aspect 4/3, placeholder gradient si pas d'image), infos en bas
- Bande colorée gauche pour required/optional conservée mais en haut de la carte
- Prix visible en gros, badges rarity-style pour required/optional
- Hover : scale + glow (cohérent avec le shop redesign)

**NeedVsWantChart** : conservé tel quel (déjà bien fait), ajout d'une 3e stat "Acquired Total"

**Acquisition Archive enrichie** :
- Affichage en grille (pas accordion plat)
- Chaque item acquis montre son image, son nom, son coût
- **Total acquis** affiché en header de la section avec compteur animé
- Badge date d'acquisition si `acquired_at` existe

### 4. Modal "Import from URL"
- Nouveau bouton "IMPORT FROM URL" à côté de "ADD ITEM"
- Dialog avec un champ URL unique
- Bouton "Fetch" qui appelle l'edge function
- Preview des données extraites (image, nom, prix) que l'utilisateur peut modifier avant d'ajouter
- Remplissage auto des champs du formulaire de création

### 5. Support image dans les formulaires Add/Edit
- Champ image_url dans les deux modals (Add + Edit)
- Preview thumbnail inline
- L'image s'affiche dans la carte

---

## Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter `image_url` à `wishlist_items` |
| `supabase/functions/scrape-product/index.ts` | Nouvelle edge function d'extraction de meta tags |
| `supabase/config.toml` | Ajouter config pour `scrape-product` (verify_jwt=false) |
| `src/hooks/usePactWishlist.ts` | Ajouter `image_url` au select, insert, update |
| `src/pages/Wishlist.tsx` | Refonte complète : header stats, grille, import modal, image fields, archive enrichie |
| `src/components/wishlist/WishlistItemCard.tsx` | Redesign carte verticale avec image |
| `src/components/wishlist/NeedVsWantChart.tsx` | Ajout stat "Acquired" |
| `src/components/wishlist/ImportFromUrlModal.tsx` | Nouveau composant modal d'import |
| `src/components/wishlist/AcquisitionArchive.tsx` | Nouveau composant archive enrichie |

