

# Guilds MMO — Page Dedicace et Refonte Profonde

## Diagnostic

Les guildes sont actuellement confinees dans un **Dialog modal** (`GuildDetailPanel`) de 500px de large, avec 6 onglets comprimes en icones minuscules. Tout est fonctionnel mais superficiel : pas de page dediee, pas de chat, pas de XP/niveaux, pas d'evenements, pas de roles granulaires, pas de banniere visuelle, pas de MOTD editable. L'experience ressemble a un panneau d'administration, pas a une guilde MMO.

## Vision

Transformer les guildes en une experience de type **WoW/FFXIV Guild Hall** : une page dediee `/guild/:id` avec sidebar de navigation, hall d'entree visuel, systeme de rangs personnalisables, chat en temps reel, evenements planifies, coffre de guilde (XP/Bonds), et tableau de bord d'officier.

---

## Phase 1 — Page Dediee et Navigation (Priorite critique)

### 1.1 Route `/guild/:id`
- Nouvelle page `src/pages/GuildPage.tsx` avec layout propre
- Sidebar gauche avec navigation : Overview, Members, Chat, Goals, Events, Leaderboard, Settings
- Header hero avec banniere, icone, nom, description, XP bar, nombre de membres
- Le `GuildCard` dans `/friends` devient un lien vers `/guild/:id` au lieu d'ouvrir un Dialog

### 1.2 Guild Overview (Hall d'entree)
- Banniere full-width avec gradient selon la couleur de guilde
- MOTD (Message of the Day) editable par officers/owner
- Stats rapides : membres en ligne, XP total, rang guilde, objectifs actifs
- Activite recente (5 dernieres actions)
- Annonces epinglees en haut

### 1.3 Refactoring existant
- `GuildDetailPanel` (Dialog) → supprime ou reduit a un mini-preview
- Deplacer toute la logique vers des sous-pages de `/guild/:id`

---

## Phase 2 — Systeme de Rangs et Permissions MMO

### 2.1 Migration DB : `guild_ranks` table
```
guild_ranks: id, guild_id, name, color, icon, position (int), permissions (jsonb), is_default, created_at
```
- Permissions granulaires : `invite_members`, `kick_members`, `manage_announcements`, `manage_goals`, `manage_events`, `manage_ranks`, `manage_settings`, `manage_codes`
- Rangs par defaut a la creation : Owner (all), Officer (most), Member (basic)
- `guild_members.role` → `guild_members.rank_id` (FK vers guild_ranks)

### 2.2 UI Rank Editor
- Page Settings > Ranks : drag-and-drop pour reordonner
- Creer/editer/supprimer des rangs custom (nom, couleur, icone, permissions checkboxes)
- Assigner un rang a chaque membre depuis la liste Members

---

## Phase 3 — Chat de Guilde en Temps Reel

### 3.1 Migration DB : `guild_messages` table
```
guild_messages: id, guild_id, user_id, content, reply_to_id, created_at
```
- RLS : membres uniquement (is_guild_member)
- Realtime via `ALTER PUBLICATION supabase_realtime ADD TABLE guild_messages`

### 3.2 UI Chat
- `GuildChat.tsx` : feed de messages en temps reel, input en bas
- Avatar + nom + rang affiche
- Reply threading basique (reply_to)
- Auto-scroll, indicateur "X new messages"
- Limite 200 chars par message

---

## Phase 4 — Evenements de Guilde

### 4.1 Migration DB : `guild_events` table
```
guild_events: id, guild_id, title, description, event_date, duration_minutes, created_by, max_participants, created_at
guild_event_rsvps: id, event_id, user_id, status (going/maybe/declined), created_at
```

### 4.2 UI Events
- Liste d'evenements a venir avec RSVP (Going/Maybe/Decline)
- Creation par officers : titre, description, date, duree, max participants
- Integration auto avec le calendrier (`/calendar`) comme source "guild"

---

## Phase 5 — XP et Progression de Guilde

### 5.1 Logique XP
- Actions qui donnent du XP guilde : membre rejoint (+10), objectif complete (+50), contribution (+amount), evenement organise (+20)
- Niveaux de guilde : Level = floor(sqrt(total_xp / 100))
- Affichage XP bar dans le header de guilde
- Badges de niveau de guilde (bronze/silver/gold/diamond)

### 5.2 Migration
- Ajouter `guild_level` computed ou trigger sur `guilds.total_xp`
- Fonction `add_guild_xp(p_guild_id, p_amount, p_reason)` SECURITY DEFINER

---

## Phase 6 — Ameliorations Members Panel

### 6.1 Filtres et tri
- Recherche par nom
- Filtre par rang
- Tri : date d'arrivee, rang, nom
- Badge "en ligne" (reutiliser `useOnlineStatus`)

### 6.2 Profil membre dans la guilde
- Click sur un membre → mini drawer avec : avatar, rang, date d'arrivee, contributions, actions (promote/demote/kick si permission)

---

## Phase 7 — Settings Avances

- Onglets dans Settings : General, Ranks, Moderation, Danger Zone
- General : nom, description, icone, couleur, banniere upload, MOTD, visibilite
- Moderation : logs d'audit filtres, bannir un membre (pas juste kick)
- Danger Zone : transfert ownership, suppression guilde (double confirm)

---

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| **New** | `src/pages/GuildPage.tsx` — page dediee |
| **New** | `src/components/guild/GuildOverview.tsx` — hall d'entree |
| **New** | `src/components/guild/GuildSidebar.tsx` — navigation laterale |
| **New** | `src/components/guild/GuildHeader.tsx` — hero banniere |
| **New** | `src/components/guild/GuildMembersPanel.tsx` — liste membres amelioree |
| **New** | `src/components/guild/GuildChat.tsx` — chat temps reel |
| **New** | `src/components/guild/GuildEventsPanel.tsx` — evenements + RSVP |
| **New** | `src/components/guild/GuildRankEditor.tsx` — editeur de rangs |
| **New** | `src/components/guild/GuildSettingsPage.tsx` — settings avances |
| **New** | `src/components/guild/GuildXPBar.tsx` — barre XP/niveau |
| **Edit** | `src/components/friends/GuildCard.tsx` — lien vers `/guild/:id` |
| **Edit** | `src/components/friends/GuildsTab.tsx` — navigation au lieu de dialog |
| **Edit** | `src/hooks/useGuilds.ts` — chat mutations, events, ranks |
| **Edit** | `src/App.tsx` — route `/guild/:id` |
| **Migration** | `guild_messages` table + realtime |
| **Migration** | `guild_events` + `guild_event_rsvps` tables |
| **Migration** | `guild_ranks` table + migration `guild_members.rank_id` |
| **Migration** | `add_guild_xp` SECURITY DEFINER function |
| **Edit** | `src/i18n/locales/en.json`, `fr.json` — guild.* keys |

Implementation en 7 phases sequentielles, chaque phase livrant une fonctionnalite utilisable independamment.

