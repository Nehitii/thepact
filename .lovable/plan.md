

# Guilds Ultra-Deep + Email 2FA sans Resend

## Partie 1 — Guilds : Diagnostic et Corrections

### Pourquoi ça ne fonctionne pas

**Bug critique : RLS empêche de rejoindre une guilde.**
La policy INSERT sur `guild_members` exige que l'utilisateur soit déjà `owner` ou `officer` de la guilde. Quand un invité accepte une invitation, `respondToInvite` essaie d'INSERT dans `guild_members` mais l'invité n'est pas encore membre → RLS bloque silencieusement → l'utilisateur ne rejoint jamais la guilde.

**Fix** : Créer une fonction `SECURITY DEFINER` `accept_guild_invite(p_invite_id uuid)` qui vérifie l'invite, la met à jour, et insère le membre atomiquement, contournant la RLS de manière sécurisée.

De même, la création de guilde échoue car `createGuild` insère d'abord dans `guilds` (OK, policy owner), puis dans `guild_members` (FAIL — l'utilisateur n'est pas encore member). **Fix** : Créer une fonction `SECURITY DEFINER` `create_guild_with_owner(...)` qui fait les deux en une transaction.

### Nouvelles fonctionnalités Guilds

1. **Guild Settings / Edit** — Le owner peut modifier nom, description, icône, couleur, max members
2. **Guild Announcements** — Le owner/officer peut poster des annonces visibles par tous les membres (table `guild_announcements`)
3. **Guild Activity Feed** — Mini-feed montrant les actions récentes (membre rejoint, promu, annonce postée)
4. **Guild Goals** — Objectifs communs de guilde avec progression collective (table `guild_goals` + `guild_goal_contributions`)
5. **Guild Leaderboard** — Classement interne des membres par XP/points
6. **Guild Badges** — Badges spéciaux débloqués collectivement
7. **Guild Max Members** — Limite configurable (défaut 25)
8. **Guild Banner/Image** — Upload d'une image de guilde
9. **Invite par lien/code** — Générer un code d'invitation partageable (table `guild_invite_codes`)
10. **Guild Search** — Recherche publique de guildes (guildes marquées `is_public`)
11. **Guild Stats Dashboard** — Vue d'ensemble : membres actifs, goals complétés, streaks collectifs
12. **Notification on invite** — Notification push quand on reçoit une invite

### Architecture DB

```text
Nouvelles tables :
- guild_announcements (id, guild_id, author_id, content, pinned, created_at)
- guild_goals (id, guild_id, title, description, target_value, current_value, deadline, created_by, status, created_at)
- guild_goal_contributions (id, guild_goal_id, user_id, amount, note, created_at)
- guild_invite_codes (id, guild_id, code, created_by, max_uses, current_uses, expires_at, is_active)
- guild_activity_log (id, guild_id, user_id, action_type, metadata, created_at)

Modifications existantes :
- guilds: ajouter max_members (int, default 25), is_public (bool, default false), banner_url (text), total_xp (int, default 0)
```

### Plan de fichiers

| Action | Fichier |
|--------|---------|
| **Migration** | Nouvelles tables + colonnes + RLS + fonctions SECURITY DEFINER |
| **Edit** | `src/hooks/useGuilds.ts` — refactor mutations pour utiliser les RPC, ajouter hooks pour announcements, goals, invite codes, activity |
| **Edit** | `src/components/friends/GuildDetailPanel.tsx` — refonte complète en panels : Members, Announcements, Goals, Activity, Settings |
| **Edit** | `src/components/friends/GuildCreateModal.tsx` — ajouter is_public, max_members |
| **Edit** | `src/components/friends/GuildCard.tsx` — afficher badge public, progression goal, plus d'icônes |
| **Edit** | `src/components/friends/GuildsTab.tsx` — ajouter section "Discover Public Guilds" + recherche |
| **New** | `src/components/friends/GuildSettingsPanel.tsx` |
| **New** | `src/components/friends/GuildAnnouncementsPanel.tsx` |
| **New** | `src/components/friends/GuildGoalsPanel.tsx` |
| **New** | `src/components/friends/GuildActivityFeed.tsx` |
| **New** | `src/components/friends/GuildLeaderboard.tsx` |
| **New** | `src/components/friends/GuildInviteCodePanel.tsx` |
| **Edit** | `src/i18n/locales/en.json`, `fr.json` — clés guild.* |

---

## Partie 2 — Email 2FA sans Resend

### Situation actuelle

L'edge function `two-factor` utilise `sendEmailViaResend()` qui appelle l'API Resend avec une clé API. Le problème est que Resend en mode sandbox ne peut envoyer qu'à l'email du propriétaire du compte.

### Solution : Email natif Lovable

Pour envoyer des emails 2FA sans Resend, il faut d'abord configurer un domaine email via Lovable Cloud. **Sans domaine email configuré, aucun email ne peut être envoyé nativement.**

Je vais te proposer de configurer ton domaine email. Une fois configuré, je remplacerai `sendEmailViaResend` dans l'edge function par l'envoi via l'infrastructure email de Lovable Cloud (queue pgmq + dispatcher).

### Étapes

1. **Configurer le domaine email** — Tu devras ajouter un domaine d'envoi via les paramètres email
2. **Setup email infrastructure** — Création automatique des queues pgmq, tables de log, cron job
3. **Modifier `two-factor/index.ts`** — Remplacer `sendEmailViaResend()` par un enqueue dans la queue `auth_emails` via `supabase.rpc('enqueue_email', ...)`
4. **Redéployer** l'edge function

### Plan de fichiers

| Action | Fichier |
|--------|---------|
| **Prerequisite** | Configurer domaine email via Cloud → Emails |
| **Edit** | `supabase/functions/two-factor/index.ts` — remplacer Resend par enqueue natif |
| **Deploy** | Redéployer `two-factor` |

**Note** : Cette partie nécessite que tu configures d'abord un domaine email. Je te montrerai le bouton pour le faire après approbation.

---

## Résumé des priorités

1. Fix RLS guilds (SECURITY DEFINER functions) — **critique, la feature est cassée**
2. Nouvelles tables + RLS pour announcements, goals, invite codes, activity
3. Refonte UI GuildDetailPanel en panels multiples
4. Guild public search + invite codes
5. Setup email domain + migration 2FA vers email natif

