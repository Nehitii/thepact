

## Audit de la Sidebar

### Etat actuel

La sidebar est un composant custom (`<aside>`) qui ne s'appuie PAS sur les composants Shadcn `Sidebar`/`SidebarContent`/`SidebarMenu` malgre l'import de `SidebarProvider`/`SidebarInset` dans `AppLayout`. C'est un hybride : le layout utilise le systeme Shadcn, mais la sidebar elle-meme est entierement manuelle.

---

### Problemes identifies

**1. Architecture -- Pas de mode collapsed/icon**
- La sidebar fait toujours 288px (`w-72`). Aucun moyen de la replier en mode icone sur desktop.
- Le `SidebarTrigger` n'existe que dans le header mobile — sur desktop, la sidebar est permanente et non-collapsible.
- Impact : perte d'espace ecran sur les ecrans moyens (1280-1366px).

**2. Mobile -- Sidebar ouverte par defaut, pas de fermeture au clic**
- Sur mobile, la sidebar s'affiche en overlay mais ne se ferme pas quand on clique sur un lien de navigation. L'utilisateur doit manuellement fermer.
- Le screenshot mobile montre que la sidebar couvre le contenu sans backdrop sombre pour indiquer qu'elle est en overlay.

**3. Active state -- Double calcul redondant**
- `isActive` est calcule manuellement (ligne 127) ET via le callback `className` de `NavLink` (ligne 133). Les deux coexistent et peuvent diverger. Le `isActive` manuel est utilise pour l'indicateur lateral (ligne 142), tandis que le callback NavLink gere les classes CSS.

**4. Dropdown footer -- Actions trop limitees**
- Le dropdown ne contient que "Inbox" et "Disconnect". Pas d'acces rapide aux Notifications, pas de lien vers le profil, pas de theme switcher.

**5. Icones Community vs Friends -- Confusion visuelle**
- `Community` utilise `Users` et `Friends` utilise `UserCheck`. Les deux icones sont tres proches visuellement. A taille 20px, difficile de les distinguer rapidement.

**6. Pas de lien Achievements / Leaderboard dans la nav**
- Ces pages existent (`/achievements`, `/leaderboard`) mais ne sont accessibles que via d'autres pages. La sidebar ne les mentionne pas.
- L'Achievements est suppose etre dans la section Navigation selon la memoire du projet.

**7. Notification badge uniquement dans le dropdown**
- Le badge `totalUnread` (notifs + messages + friend requests) n'est visible que sur l'avatar en bas. Pas de badge individuel sur chaque item concerne (ex: badge sur Community pour les notifs community, badge sur Inbox si c'etait dans la nav).

**8. Section "Active_Modules" invisible si rien n'est achete**
- Correct en soi, mais l'utilisateur ne sait meme pas que des modules existent s'il ne va pas au Shop. Aucun teaser ou indication.

**9. CSS -- Pas de smooth scroll sur les sections depliees**
- Le toggle Modules/Settings utilise `max-h` + `opacity` pour l'animation, mais pas de `transition` sur le `max-h` natif qui serait plus fluide. L'animation est correcte mais peut saccader avec beaucoup d'items.

**10. Performance -- useFriends appele globalement**
- `useFriends()` est appele dans chaque render de la sidebar juste pour `pendingCount`. Ce hook fait potentiellement 3 queries Supabase (friends, pending, sent). Devrait etre un hook leger dedie `useFriendRequestCount()`.

---

### Propositions d'ameliorations

**Phase 1 -- Ergonomie critique**
- Ajouter un mode collapsed (icones seules) sur desktop avec toggle, en utilisant un state local + `w-72`/`w-16` transition
- Fermer automatiquement la sidebar sur mobile apres un clic sur un lien
- Ajouter un backdrop sombre sur mobile quand la sidebar est ouverte

**Phase 2 -- Navigation manquante**
- Ajouter `Achievements` (Trophy) et `Leaderboard` (Trophy/Crown) dans Main_Interface
- Ajouter un lien direct `Inbox` dans la nav principale (avec badge unread) au lieu de le cacher dans le dropdown
- Differencier les icones : `Users` pour Community, `UserPlus` ou `HandshakeIcon` pour Friends

**Phase 3 -- Footer & Quick Actions**
- Enrichir le dropdown : ajouter Notifications (avec badge), Profile, Theme toggle
- Ajouter un mini-teaser "Explore modules" dans la section Modules quand elle est vide

**Phase 4 -- Performance & Code**
- Creer un hook `usePendingFriendCount()` leger (une seule query count)
- Unifier le calcul d'active state : supprimer le calcul manuel, utiliser uniquement le callback NavLink
- Extraire les items de navigation dans un fichier de config separe

**Phase 5 -- Polish visuel**
- Ajouter une subtle animation de "pulse" sur le badge notification quand il change
- Ajouter un tooltip sur chaque icone en mode collapsed
- Micro-interaction : icon scale on hover (deja partiellement present)

---

### Fichiers impactes

| Phase | Fichiers | Type |
|-------|----------|------|
| 1 | `AppSidebar.tsx`, `AppLayout.tsx` | Edit |
| 2 | `AppSidebar.tsx` | Edit |
| 3 | `AppSidebar.tsx` | Edit |
| 4 | `useFriends.ts` (ou nouveau `usePendingFriendCount.ts`) | Edit/Create |
| 5 | `AppSidebar.tsx` | Edit |

