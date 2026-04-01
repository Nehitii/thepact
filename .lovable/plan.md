

# Audit Complet — Module /friends

## État actuel

Le module comprend :
- **1 page monolithique** (`Friends.tsx`, 457 lignes) avec 4 sous-composants inline (`TabItem`, `UserAvatar`, `SkeletonList`, `EmptyState`) typés `any`
- **4 composants** dans `src/components/friends/` (GuildCard, GuildCreateModal, GuildDetailPanel, GuildInviteCard)
- **2 hooks** : `useFriends.ts`, `useGuilds.ts` + `usePendingFriendCount.ts`
- **Tables DB** : `friendships`, `guilds`, `guild_members`, `guild_invites`, `blocked_users`
- **RLS** correcte sur friendships (sender/receiver scoped)

---

## 🔴 Critical — Fix immédiat

**C1 — Mutations non protégées par try/catch**
`removeFriend.mutate()` (ligne 174), `acceptRequest.mutate()` (ligne 225), `declineRequest.mutate()` (ligne 233), et `respondToInvite.mutate()` (lignes 350-351) sont appelés directement sans gestion d'erreur. Si le réseau échoue → rejection silencieuse. Passer à `mutateAsync` + `try/catch` + `toast.error`.

**C2 — Aucune confirmation avant suppression d'ami**
Le bouton "Remove friend" (ligne 170-176) déclenche directement `removeFriend.mutate` sans dialogue de confirmation. Un clic accidentel supprime définitivement l'amitié.

**C3 — Blocked users ignorés dans la recherche et les requêtes**
`searchProfiles` (useFriends) ne filtre pas les utilisateurs bloqués. Un utilisateur bloqué apparaît dans la recherche et peut envoyer des friend requests. La table `blocked_users` existe mais n'est pas consultée dans `useFriends`.

**C4 — Pas de protection contre le spam de friend requests**
Aucun rate limit côté client ni DB trigger pour empêcher un utilisateur d'envoyer des centaines de requests. Ajouter un trigger DB limitant à N requests/heure (comme `enforce_post_rate_limit` pour les posts).

---

## 🟡 Major — Impact UX/maintenabilité

**M1 — Page monolithique (457 lignes)**
`Friends.tsx` contient toute la logique + 4 sous-composants inline typés `any`. Extraire :
- `FriendsTab.tsx` (liste d'amis)
- `RequestsTab.tsx` (demandes en attente)
- `SearchTab.tsx` (recherche de profils)
- `GuildsTab.tsx` (guildes + invites)
- Déplacer `TabItem`, `UserAvatar`, `SkeletonList` dans des fichiers partagés

**M2 — Aucune ARIA / accessibilité**
Zéro `aria-label` sur les boutons d'action (remove friend, accept, decline, search). Les boutons icon-only (MessageSquare, UserX) sont illisibles par les screen readers.

**M3 — Pas d'i18n**
Tous les textes sont hardcodés en anglais ("No friends yet", "Search members by name...", "Friend request sent!", etc.). Aucune clé dans `en.json`/`fr.json`.

**M4 — searchResults typé `any[]`**
`useState<any[]>([])` pour les résultats de recherche. Créer une interface `SearchProfile { id: string; display_name: string | null; avatar_url: string | null }`.

**M5 — Sous-composants inline typés `any`**
`TabItem`, `EmptyState` et `UserAvatar` ont des props typées `any`. Créer des interfaces propres.

**M6 — Pas de profil public cliquable**
Cliquer sur un ami ne montre rien. Il devrait y avoir un mini-profil (popup ou drawer) affichant les infos publiques, les stats, la possibilité de bloquer/débloquer.

**M7 — Pas de recherche/filtre dans la liste d'amis**
Avec 50+ amis, impossible de chercher. Ajouter un champ de recherche/filtre dans l'onglet Friends.

**M8 — Guild : pas de quitter une guilde**
Un membre non-owner ne peut pas quitter une guilde volontairement. Seul l'owner peut retirer des membres. Ajouter un bouton "Leave Guild".

**M9 — Pas d'indication online/offline**
Aucun statut de présence. Ajouter un indicateur en ligne basé sur `last_seen_at` (champ à ajouter au profil ou via Supabase Presence).

---

## 🟢 Minor — Qualité de vie

**m1 — Dynamic Tailwind classes ne fonctionnent pas**
`TabItem` utilise `border-${color}` et `bg-${color}` (ligne 405/414) qui ne sont pas compilés par Tailwind (classes dynamiques). Passer à un mapping explicite de classes.

**m2 — EmptyState local vs CyberEmpty global**
Le composant `EmptyState` inline (ligne 445) duplique `CyberEmpty` de `cyber-states.tsx` créé en Phase 2. Utiliser `CyberEmpty` partout.

**m3 — SkeletonList local vs CyberLoader global**
Même chose : remplacer `SkeletonList` par `CyberLoader`.

**m4 — Pas de compteur de demandes envoyées**
Les sent requests existent dans le hook mais ne sont affichées nulle part. Ajouter un sous-onglet ou une section "Sent requests" dans l'onglet Requests.

**m5 — Guild colors Tailwind dynamiques**
`GuildCard` utilise un mapping de couleurs explicite (bon), mais les combinaisons possibles sont limitées à 5. Permettre des couleurs CSS variables pour plus de flexibilité.

**m6 — Pas d'animation/feedback sur accept/decline**
Quand on accepte une request, la carte disparaît sans feedback visuel. Ajouter une animation de sortie (framer-motion `exit`).

---

## Fonctionnalités à ajouter

**F1 — Profil public / mini-profil (drawer)**
Cliquer sur un ami/membre ouvre un drawer avec : avatar, nom, date d'amitié, goals partagés, pact partagé, boutons Message/Block/Remove.

**F2 — Block user depuis Friends**
Bouton "Bloquer" dans le mini-profil ou via un menu contextuel (three dots). Insère dans `blocked_users` et supprime automatiquement la friendship.

**F3 — Sent Requests panel**
Section dans l'onglet Requests montrant les demandes envoyées avec option d'annuler (delete la row).

**F4 — Friend activity feed**
Mini-feed dans l'onglet Friends : "X completed a goal", "Y started a new pact". Lecture seule, basé sur les événements publics des amis.

**F5 — Guild chat basique**
Channel de discussion simple dans chaque guilde (réutiliser la structure Inbox/messages). Table `guild_messages` + realtime.

**F6 — Guild roles management**
Permettre au owner de promouvoir un membre en "officer" ou de transférer l'ownership.

**F7 — Mutual friends indicator**
Dans la recherche, afficher "X ami(s) en commun" pour aider à identifier les profils.

---

## Plan d'implémentation

### Phase 1 — Critiques + Majeurs structurels
1. Ajouter try/catch + toast sur toutes les mutations (C1)
2. Ajouter confirmation dialog avant remove friend (C2)
3. Filtrer blocked users dans searchProfiles (C3)
4. Ajouter rate limit trigger DB pour friend requests (C4)
5. Splitter Friends.tsx en sous-composants typés (M1, M4, M5)
6. Remplacer EmptyState/SkeletonList locaux par CyberEmpty/CyberLoader (m2, m3)
7. Fixer les classes Tailwind dynamiques dans TabItem (m1)
8. Ajouter aria-labels sur tous les boutons (M2)

### Phase 2 — Fonctionnalités majeures
9. Mini-profil drawer (F1, M6)
10. Block user depuis Friends (F2)
11. Filtre/recherche dans la liste d'amis (M7)
12. Leave Guild pour les membres (M8)
13. Sent requests panel (F3, m4)
14. Animation exit sur accept/decline (m6)

### Phase 3 — Social avancé
15. i18n complète du module (M3)
16. Mutual friends indicator (F7)
17. Guild role management (F6)
18. Online status indicator (M9)

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| **Split** | `src/pages/Friends.tsx` → fichier allégé + tabs extraits |
| **New** | `src/components/friends/FriendsTab.tsx` |
| **New** | `src/components/friends/RequestsTab.tsx` |
| **New** | `src/components/friends/SearchTab.tsx` |
| **New** | `src/components/friends/GuildsTab.tsx` |
| **New** | `src/components/friends/FriendProfileDrawer.tsx` |
| **New** | `src/components/friends/RemoveFriendDialog.tsx` |
| **Edit** | `src/hooks/useFriends.ts` (filter blocked, types) |
| **Edit** | `src/hooks/useGuilds.ts` (leave guild mutation) |
| **Migration** | Rate limit trigger sur friendships |
| **Edit** | `src/i18n/locales/en.json`, `fr.json` (friends.* keys) |

