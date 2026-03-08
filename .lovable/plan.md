

# Audit complet du Shop — Résultats

## Architecture globale
Le Shop est bien structuré : page principale (`Shop.tsx`) avec 5 onglets (Cosmetics, Modules, Bonds, Wishlist, History), des hooks dédiés pour chaque domaine, et un système de transaction unifié (`useShopTransaction`).

---

## Problèmes identifiés

### 1. SÉCURITÉ — Achat de bundles non-atomique (CRITIQUE)
**Fichier** : `src/hooks/useBundles.ts` (lignes 63-100)
- `usePurchaseBundle` effectue l'achat **côté client** en plusieurs requêtes séparées : lecture du solde, déduction manuelle, insertion des items un par un.
- Cela permet du **price tampering** (le prix est envoyé par le client) et des **race conditions** (double-achat simultané).
- Contrairement aux cosmétiques/modules qui utilisent la RPC sécurisée `purchase_shop_item` (SECURITY DEFINER), les bundles contournent complètement cette protection.
- **Fix** : Créer une fonction SQL `purchase_bundle` atomique (SECURITY DEFINER) similaire à `purchase_shop_item`, qui valide le prix serveur-side et insère tous les items en une transaction.

### 2. SÉCURITÉ — Daily Deals : prix client-side (IMPORTANT)
**Fichier** : `src/components/shop/DailyDealsSection.tsx` (lignes 49-60)
- Le prix réduit (`discounted_price`) est calculé côté client dans `useDailyDeals.ts` puis envoyé à `purchaseCosmetic.mutate` / `purchaseModule.mutate`.
- La RPC `purchase_shop_item` reçoit `p_price` du client — si la RPC ne **re-valide pas** le prix du deal côté serveur, un attaquant peut envoyer un prix de 0.
- **Fix** : Vérifier que `purchase_shop_item` ignore le `p_price` client et recalcule depuis la table, OU créer une RPC `purchase_daily_deal` dédiée.

### 3. BUG — PurchaseConfirmModal : API props incohérente
**Fichier** : `src/components/shop/PurchaseConfirmModal.tsx`
- Le composant accepte **deux variantes de props** : `open`/`onOpenChange` (CosmeticShop) et `isOpen`/`onClose` (BundlesSection, DailyDealsSection).
- Cela fonctionne grâce à du code de compatibilité (ligne 91-96), mais c'est fragile et source de confusion.
- **Fix** : Standardiser sur une seule API (`open`/`onOpenChange`) et migrer tous les appelants.

### 4. BUG — ShopSpotlight : boutons Preview/Purchase non-câblés
**Fichier** : `src/components/shop/ShopSpotlight.tsx`
- Les props `onPreview` et `onPurchase` sont optionnelles et **jamais passées** depuis `Shop.tsx` (ligne 163 : `<ShopSpotlight />`).
- Résultat : le Featured item est en lecture seule — pas de bouton Preview ni Buy.
- **Fix** : Passer les handlers depuis `CosmeticShop` ou ajouter un achat inline dans le Spotlight.

### 5. BUG — Wishlist "Get" ne déclenche pas d'achat direct
**Fichier** : `src/components/shop/WishlistPanel.tsx` (ligne 170)
- Le bouton "Get" appelle `onPurchaseItem` qui **change simplement l'onglet actif** (Shop.tsx ligne 29-35) au lieu de déclencher un achat.
- L'utilisateur est redirigé vers l'onglet Cosmetics/Modules sans contexte — il doit retrouver l'item manuellement.
- **Fix** : Ouvrir directement le `PurchaseConfirmModal` avec l'item sélectionné.

### 6. BUG — BondsShop : boutons "Seize Pack" / "€X" non-fonctionnels
**Fichier** : `src/components/shop/BondsShop.tsx`
- Les boutons d'achat des packs (ligne 124, 196-205) n'ont **aucun `onClick` handler**.
- Aucune intégration de paiement réel (Stripe ou autre) n'est câblée.
- **Fix** : Soit intégrer un flow de paiement, soit afficher clairement que c'est un placeholder "Coming Soon".

### 7. PERFORMANCE — useDailyDeals : N+1 queries
**Fichier** : `src/hooks/useDailyDeals.ts` (lignes 40-75)
- Pour chaque deal, une requête séparée est faite (`for...of` loop) pour récupérer l'item associé.
- Avec 5 deals = 6 requêtes réseau.
- **Fix** : Grouper les item_ids par type et faire une seule requête `.in()` par type de table.

### 8. UX — CosmeticShop : layout sidebar non-responsive
**Fichier** : `src/components/shop/CosmeticShop.tsx` (ligne 152-154)
- La sidebar des catégories (w-48) est fixe et ne disparaît pas en mobile — elle pousse la grille hors écran.
- **Fix** : Transformer en tabs horizontaux ou menu déroulant sur mobile.

### 9. MINEUR — Duplicate key warning (Console)
- Warning React sur des clés dupliquées dans `Inbox.tsx` (AnimatePresence). Pas lié au Shop mais visible dans les logs.

### 10. MINEUR — useBondBalance : écriture en queryFn
**Fichier** : `src/hooks/useShop.ts` (lignes 107-115)
- Si le solde n'existe pas, il est **créé** dans la `queryFn` (INSERT). Mélanger lecture et écriture dans une query peut causer des re-créations en cas de retry automatique.
- **Fix** : Déplacer la création dans un trigger DB `ON INSERT` sur `auth.users` ou dans un hook séparé.

---

## Résumé des priorités

| # | Sévérité | Problème | Effort |
|---|----------|----------|--------|
| 1 | CRITIQUE | Bundle purchase non-atomique | Migration SQL + refactor hook |
| 2 | IMPORTANT | Daily Deal prix client-side | Vérif RPC ou nouvelle RPC |
| 4 | MOYEN | Spotlight boutons morts | Passage de props |
| 5 | MOYEN | Wishlist Get ne déclenche pas l'achat | Refactor modal |
| 6 | MOYEN | Bonds shop boutons non-fonctionnels | Handler ou placeholder |
| 7 | MOYEN | Daily Deals N+1 queries | Refactor fetch |
| 8 | MOYEN | Cosmetic sidebar non-responsive | CSS responsive |
| 3 | FAIBLE | Props PurchaseConfirmModal | Standardisation |
| 10 | FAIBLE | Balance création dans queryFn | Refactor |

---

## Plan d'implémentation proposé

1. **Sécuriser les bundles** — Créer une migration SQL `purchase_bundle(p_bundle_id uuid)` SECURITY DEFINER qui :
   - Vérifie le prix depuis `shop_bundles`
   - Déduit le solde atomiquement
   - Insère tous les items
   - Log la transaction
   - Refactorer `usePurchaseBundle` pour appeler cette RPC

2. **Auditer/sécuriser Daily Deals** — Vérifier la RPC `purchase_shop_item` ou créer `purchase_daily_deal`

3. **Câbler ShopSpotlight** — Passer `onPreview`/`onPurchase` depuis `CosmeticShop` ou intégrer `useShopTransaction` directement dans le Spotlight

4. **Fix Wishlist purchase flow** — Ouvrir le modal d'achat directement depuis WishlistPanel

5. **Fix BondsShop buttons** — Ajouter un toast "Coming Soon" ou intégrer Stripe

6. **Optimiser Daily Deals** — Requêtes groupées par `.in()`

7. **Responsive CosmeticShop** — Tabs horizontaux sur mobile

8. **Standardiser PurchaseConfirmModal API** — Une seule interface de props

