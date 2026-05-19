# Vagues V3.2 + V4.1 + V4.2 livrées

## V3.2 — Digest hebdo & insights enrichis
- Edge function `coach-weekly-digest` : compare semaine N vs N-1 (étapes, habitudes, journal, todo), génère un insight Gemini 2.5 Flash, upsert `weekly_reviews`, insère un `coach_insight` (type='digest') + `notification` + push best-effort.
- Cron pg_cron : tous les dimanches 18:00 UTC, via `x-cron-secret`.
- Appelable aussi manuellement par un utilisateur authentifié pour son propre digest.

## V4.1 — Push notifications (Web Push / VAPID)
- Service worker `public/sw.js` (push + notificationclick), enregistré uniquement hors preview/iframe.
- Hook `usePushNotifications` : subscribe/unsubscribe + persistance dans `push_subscriptions` (clé publique VAPID hardcodée, surcharge possible via VITE_VAPID_PUBLIC_KEY).
- Panneau "WEB PUSH (PWA)" dans `/profile/notifications` : activer/désactiver + envoyer un push test (`supabase.functions.invoke('push-send')`).
- Secrets serveur ajoutés : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.

## V4.2 — Moteur d'automatisations & règles
- Table `user_automation_rules` (trigger_type/config + action_type/config + is_active + cooldown via last_run_at).
- Edge function `automation-evaluator` (cron toutes les 30 min, header `x-cron-secret`).
- Triggers : `streak_broken`, `goal_overdue`, `budget_exceeded`, `low_focus_week`, `daily_schedule`.
- Actions : `send_notification`, `coach_insight`, `grant_bonds` (≤500/jour).
- Page `/profile/automations` (liste, toggle, JSON config, supprimer) + entrée sidebar "Automations".

## Crons actifs
- `coach-weekly-digest` : `0 18 * * 0`
- `automation-evaluator` : `*/30 * * * *`

## Diagnostic

Dans `supabase/functions/ai-coach/index.ts` (tool `list_active_goals`, ligne ~205), le filtre est :

```ts
.eq("status", "active")
```

Or les vrais statuts en base sont `not_started`, `in_progress`, `fully_completed`, `paused`, `archived` (cf. `src/lib/goalConstants.ts` et données DB confirmées : 9 `in_progress`, 17 `not_started`, 13 `fully_completed`). Aucun goal n'a `status = 'active'` → le tool retourne toujours `[]`, donc le Coach affirme qu'il n'y a aucun goal actif.

## Correction

### 1. `list_active_goals` — élargir le filtre
Remplacer `.eq("status", "active")` par `.in("status", ["in_progress", "not_started"])`. Trier `in_progress` en premier (les goals "en cours" sont plus pertinents que ceux jamais démarrés).

### 2. Enrichir le payload retourné
Ajouter `pact_id` au select, et marquer chaque goal avec `is_active_pact: boolean` (comparaison avec `profiles.active_pact_id` du user) pour que le Coach puisse prioriser le pacte courant dans ses réponses.

### 3. Description du tool
Mettre à jour la description : « Liste les goals en cours et à démarrer du user (max 20, triés par statut puis focus). »

### 4. System prompt
Préciser dans le prompt système qu'un goal "actif" englobe `in_progress` + `not_started`, et que le Coach doit prioriser ceux du pacte actif quand pertinent.

## Vérification

- Tester via le Coach : « Quels sont mes goals actifs ? » → doit lister les 26 goals (9+17) au lieu de « aucun ».
- Tester « Crée-moi un goal X » → toujours fonctionnel (utilise `list_pacts`, pas affecté).

## Fichiers touchés

- `supabase/functions/ai-coach/index.ts` (tool definition + handler + prompt)
