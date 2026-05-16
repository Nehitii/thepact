# V2.2 — Cron AI Coach

Objectif : faire tourner le coach IA en arrière-plan pour générer des insights proactifs (patterns détectés, mémoire indexée, nudge contextuel) sans attendre que l'utilisateur ouvre la page Coach.

## Ce qu'on construit

### 1. Nouvelle edge function `coach-cron-runner`
Point d'entrée unique appelé par `pg_cron`. Elle :
- Vérifie l'en-tête `x-cron-secret` contre `CRON_SECRET`. Sinon → 401.
- Itère sur les utilisateurs actifs (ceux ayant une activité dans les 14 derniers jours via `goals`, `habit_logs`, ou `journal_entries`).
- Pour chaque user, déclenche en parallèle (avec un cap de concurrence ~5) :
  - `coach-index-memory` → indexe les nouveaux contenus dans `coach_memory`.
  - `coach-pattern-detect` → détecte patterns (procrastination, momentum, rupture de streak, etc.).
- Écrit un log d'exécution dans `coach_cron_runs` (durée, users traités, erreurs).
- Sortie JSON : `{ users_processed, duration_ms, errors }`.

### 2. Schéma DB (migration)
- **`coach_insights`** : insights générés (user_id, type, title, body, severity, source, dismissed_at, expires_at). RLS owner-only read + dismiss.
- **`coach_cron_runs`** : journal d'exécution (started_at, finished_at, users_processed, errors jsonb). RLS admin-only.
- **`coach_user_prefs`** (étend si absent) : `coach_cron_enabled boolean default true` pour permettre l'opt-out.

### 3. Planification (pg_cron + pg_net)
SQL inséré via `supabase--insert` (pas migration, car contient clés) :
- `coach-cron-runner` toutes les **4h** (`0 */4 * * *`).
- Header `x-cron-secret: <CRON_SECRET>` via `net.http_post`.

### 4. UI — Panneau insights proactifs
- Étend `src/components/coach/CoachPanel.tsx` avec une section "Insights" en haut listant les `coach_insights` non dismiss.
- Chaque insight = carte DSPanel avec icône severity, titre, body, bouton "Dismiss" + lien vers la ressource concernée (goal, habit, journal).
- Hook `useCoachInsights()` avec `useQuery` sur `coach_insights` filtré `dismissed_at IS NULL AND (expires_at IS NULL OR expires_at > now())`.
- Realtime optionnel sur la table.

### 5. Paramètre utilisateur
Toggle dans `src/pages/profile/NotificationSettings.tsx` → "Coach proactif" (active/désactive le cron pour ce user via `coach_user_prefs.coach_cron_enabled`).

## Sécurité
- `CRON_SECRET` jamais exposé client-side (utilisé uniquement dans le SQL cron + edge function).
- Edge function rejette tout appel sans le bon header → 401.
- RLS strict : un user ne voit que ses insights, jamais ceux des autres.
- `coach-cron-runner` utilise `SERVICE_ROLE_KEY` côté serveur uniquement pour invoquer les sous-fonctions.

## Détails techniques

### Structure `coach_insights`
```text
id uuid pk
user_id uuid (RLS auth.uid())
type text       — 'pattern' | 'momentum' | 'risk' | 'celebration'
severity text   — 'info' | 'warning' | 'critical'
title text
body text
source jsonb    — { module: 'goals', ref_id: 'uuid' }
created_at, dismissed_at, expires_at timestamptz
```

### Flow d'une exécution cron
```text
pg_cron (4h)
  └─> net.http_post → coach-cron-runner (header secret)
        ├─ list_active_users()
        └─ for each user (parallel, cap 5):
              ├─ invoke coach-index-memory
              └─ invoke coach-pattern-detect
                    └─ writes rows in coach_insights
        └─ log run in coach_cron_runs
```

### Fichiers impactés
- **Nouveau** : `supabase/functions/coach-cron-runner/index.ts`
- **Nouveau** : `src/hooks/useCoachInsights.ts`
- **Nouveau** : migration `coach_insights` + `coach_cron_runs` + extension `coach_user_prefs`
- **Modifié** : `src/components/coach/CoachPanel.tsx`, `src/pages/profile/NotificationSettings.tsx`, `.lovable/plan.md`
- **SQL d'insertion** (via `supabase--insert`) : planification cron toutes les 4h

## Hors scope (volontaire)
- Pas d'envoi de push notifications (ça reste V4.1 / VAPID).
- Pas de génération IA "lourde" type weekly review (déjà couvert par V2.x précédent).
- Pas de digest email (peut venir dans V4.2 si désiré).
