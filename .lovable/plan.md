

# Audit 100% — Module /friends

## Etat actuel

Le module est fonctionnel avec 4 onglets (Friends, Requests, Guilds, Search), un systeme de statut en ligne, des amis mutuels, un drawer de profil, un systeme de block, et un systeme de guildes complet. La structure de donnees et les RLS sont en place.

---

## BUGS & CORRECTIONS

| # | Probleme | Detail | Priorite |
|---|----------|--------|----------|
| 1 | **Sent Requests affiche des UUID bruts** | `RequestsTab` ligne 132 : `{req.receiver_id.slice(0, 8)}…` — l'utilisateur voit un UUID au lieu du display_name du destinataire. Le hook `useFriends` ne fetch pas les profils des `sentRequests`. | 🔴 |
| 2 | **Cancel sent request ne rafraichit pas** | `handleCancelSent` dans `RequestsTab` fait un `supabase.delete()` direct sans invalider le cache React Query. La requete disparait visuellement seulement au prochain refetch (30s). | 🔴 |
| 3 | **BlockedUsersPanel en francais harde** | Les textes "DÉBLOQUER", "AUCUN UTILISATEUR BLOQUÉ", "Utilisateur inconnu" sont hardcodes en francais au lieu d'utiliser `t()`. Incohérent avec le reste de l'app qui est i18n. | 🟡 |
| 4 | **Block sans confirmation** | `handleBlock` dans `FriendsTab` bloque immediatement sans dialog de confirmation, contrairement a Remove qui a un `RemoveFriendDialog`. Action irreversible sans filet. | 🟡 |
| 5 | **Debounce manquant sur la recherche** | `SearchTab.handleSearch` est declenche a chaque Enter sans debounce. L'utilisateur peut spammer des requetes. Le `searchProfiles` dans `useFriends` fait 3 requetes Supabase par appel (blocked, blockedBy, profiles). | 🟡 |
| 6 | **Onglet tabs mobile — overflow** | A 375px, les 4 onglets (Friends, Requests, Guilds, Search) avec les icones et le tracking Orbitron debordent du conteneur. Pas de scroll horizontal ni de mode responsive. | 🟡 |

---

## MANQUES FONCTIONNELS

| # | Feature manquante | Detail | Priorite |
|---|-------------------|--------|----------|
| 7 | **Pas de notification pour les friend requests** | Le badge `PENDING` apparait dans le header mais aucune notification push/in-app n'est envoyee quand une demande est recue. L'utilisateur doit visiter /friends pour decouvrir les demandes. | 🟡 |
| 8 | **Pas de tri/sort sur la liste d'amis** | Les amis sont affiches dans l'ordre retourne par le RPC sans option de tri (alphabetique, dernier vu, date d'amitie). | 🟢 |
| 9 | **Pas de "Share profile link"** | Aucun moyen de partager un lien vers son profil pour que quelqu'un puisse nous ajouter. L'utilisateur doit connaitre le display_name exact. | 🟢 |
| 10 | **Pas de pagination search** | La recherche est limitee a 20 resultats (`.limit(20)`) sans moyen de charger plus. | 🟢 |
| 11 | **Pas de realtime sur les friend requests** | Le `pendingRequests` utilise `staleTime: 30_000` et pas de Supabase Realtime. Un utilisateur qui reste sur l'onglet Requests ne verra pas une nouvelle demande arriver pendant 30s. | 🟢 |
| 12 | **Guilds — pas de bouton "Join" sur les guildes publiques** | Le `GuildCard` dans la section Discover navigue vers `/guild/:id` mais ne propose pas de rejoindre directement depuis la liste. L'utilisateur doit entrer dans la guild pour la rejoindre. | 🟡 |

---

## UX/DESIGN

| # | Probleme | Detail | Priorite |
|---|----------|--------|----------|
| 13 | **Empty state "No friends" — CTA manquant** | L'empty state dit "Search for members and send friend requests to get started" mais n'a pas de bouton pour switcher sur l'onglet Search. | 🟡 |
| 14 | **Profile Drawer trop basique** | Le drawer montre uniquement : avatar, nom, date d'amitie, statut, amis mutuels. Pas d'activite recente, pas de goals partages, pas de badges, pas de pact en commun. | 🟡 |
| 15 | **Pas d'indicateur de chargement sur les boutons Accept/Decline** | Les boutons Accept/Decline dans `RequestsTab` n'ont pas de loading state — l'utilisateur peut double-cliquer. | 🟡 |
| 16 | **ModuleHeader prend beaucoup d'espace vertical** | Sur l'ecran actuel (962x584), le header + tabs occupent ~310px, ne laissant que ~270px pour le contenu. Le empty state est ecrase. | 🟢 |

---

## SECURITE

| # | Probleme | Detail | Priorite |
|---|----------|--------|----------|
| 17 | **Pas de self-request prevention cote client** | `searchProfiles` exclut `user.id` des resultats, mais `sendRequest` ne verifie pas que `receiverId !== user.id`. Si l'API est appelee directement, un utilisateur pourrait s'envoyer une demande a lui-meme. | 🟡 |
| 18 | **Duplicate request non geree** | `sendRequest` n'a pas de check unique cote client. Si l'utilisateur envoie 2 fois (race condition), Supabase retournera une erreur mais le message d'erreur sera generique. | 🟢 |

---

## PLAN D'IMPLEMENTATION

**Phase 1 — Bugs critiques**
1. Fetch les profils des `sentRequests` dans `useFriends` pour afficher les display_names au lieu des UUIDs
2. Invalider les queries apres `handleCancelSent` dans `RequestsTab`
3. Ajouter un loading state aux boutons Accept/Decline/Cancel

**Phase 2 — UX**
4. Ajouter un dialog de confirmation avant le block (reutiliser le pattern de `RemoveFriendDialog`)
5. Rendre les onglets responsive sur mobile (scroll horizontal ou icones-only sous `sm`)
6. Ajouter un CTA "Search" dans l'empty state "No friends"
7. Ajouter un bouton "Join" direct sur les GuildCards en mode Discover

**Phase 3 — i18n & cohérence**
8. Internationaliser `BlockedUsersPanel` (remplacer les textes FR hardcodes par des cles `t()`)

**Phase 4 — Améliorations**
9. Ajouter le tri des amis (A-Z, dernier vu, date)
10. Enrichir le ProfileDrawer (goals partages, badges, pact commun)
11. Ajouter un debounce de 300ms sur la recherche

---

## Fichiers impactes

| Fichier | Action |
|---------|--------|
| `src/hooks/useFriends.ts` | Fetch profils sentRequests, invalider cache cancel, guard self-request |
| `src/components/friends/RequestsTab.tsx` | Afficher display_name, loading states, invalider queries |
| `src/components/friends/FriendsTab.tsx` | Dialog confirmation block, CTA empty state |
| `src/components/friends/SearchTab.tsx` | Debounce |
| `src/components/friends/GuildsTab.tsx` | Bouton Join sur discover cards |
| `src/components/friends/GuildCard.tsx` | Variante "joinable" |
| `src/components/profile/BlockedUsersPanel.tsx` | i18n |
| `src/pages/Friends.tsx` | Tabs responsive mobile |
| `src/i18n/locales/en.json` | Nouvelles cles |
| `src/i18n/locales/fr.json` | Nouvelles cles |

