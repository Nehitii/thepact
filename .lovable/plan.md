

# Alignement des coûts Finance / Wishlist

## Le problème

Les montants diffèrent car **Finance** et **Wishlist** comptent des données différentes :

| Module | Ce qui est compté | Source |
|--------|-------------------|--------|
| **Finance** | `SUM(goals.estimated_cost)` pour tous les goals | Table `goals` |
| **Wishlist** | `SUM(wishlist_items.estimated_cost)` pour les items actifs | Table `wishlist_items` |

Les deux ne sont pas censés être identiques par design. Un goal peut avoir un `estimated_cost` sans aucun cost item détaillé (ex: templates, anciens goals). Et la wishlist peut contenir des items manuels non liés à un goal.

## Solution proposée : Garantir la cohérence

### 1. Forcer `estimated_cost` = somme des cost items à tout moment

Actuellement, `useSaveCostItems` recalcule le total et met à jour `goals.estimated_cost`. Mais à la **création** d'un goal (`NewGoal.tsx`), le `estimated_cost` est inséré en dur puis les cost items sont insérés après. Si un goal n'a pas de cost items, son `estimated_cost` reste à la valeur saisie manuellement.

**Fix** : Après insertion des cost items dans `NewGoal.tsx`, recalculer et mettre à jour `goals.estimated_cost` pour garantir la synchronisation.

### 2. Ajouter un récap cross-module dans la Wishlist

Ajouter en header de la Wishlist un indicateur "Coût projet (Finance)" à côté du "Total Wishlist" pour que l'utilisateur voie clairement les deux chiffres et comprenne qu'ils mesurent des choses différentes.

### 3. (Optionnel) Unifier en rendant les cost items obligatoires

Si tu veux que les deux montants soient **toujours** identiques, il faut imposer que tout `estimated_cost` sur un goal soit toujours décomposé en cost items. Ça veut dire : si un utilisateur crée un goal avec un coût estimé mais sans détailler les items, on crée automatiquement un cost item générique "Coût estimé" du montant total.

---

## Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `src/pages/NewGoal.tsx` | Recalculer `estimated_cost` après insertion des cost items |
| `src/pages/Wishlist.tsx` | Ajouter indicateur "Coût projet total" depuis goals pour comparaison |

