
# Plan d'achèvement Pacte OS — Tout sauf les abonnements payants

Objectif : compléter intégralement le roadmap `.lovable/plan.md` en livrant les items restants. **Exclus** : Vague 1.2 (subscription tiers Paddle/paywall/pricing). Tout le reste est traité — y compris Finance avancée, connecteurs bancaires, intégrations OAuth, polish plateforme.

L'ordre suit les dépendances : V1 fondations → V2 réflexion/AI → V3 social → V4 capteurs → V5 profondeur → V6 polish.

---

## Vague 1 — Fondations restantes

### 1.1 Life Areas + Values
- Tables `life_areas` (user_id, name, icon, color, weight, parent_pact_id) et `user_values` (label, rank, statement) avec RLS owner-only.
- Migration douce : ajout `life_area_id` (nullable) sur `goals`, `habits`/`habit_logs`, `bank_transactions`.
- Onboarding : nouveau step "Workshop des Valeurs" (5 questions guidées + sélection 3-5 valeurs).
- Page Settings → Domaines & Valeurs (CRUD complet).
- Widget Home "Équilibre des domaines" (radar par area, pondéré par activité 30j).
- Hooks `useLifeAreas`, `useUserValues` (déjà partiellement présents — étendre).

### 1.2 Observabilité (compléter le partiel)
- Sentry front (`@sentry/react`) + edge functions (`@sentry/deno`).
- PostHog cloud auto-hébergé : `posthog-js` côté front, capture page-view + events clés (goal create, habit log, shop purchase, ritual complete).
- Secrets requis : `SENTRY_DSN`, `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`.

---

## Vague 2 — Réflexion & AI Coach

### 2.1 Rituels de revue structurés
- Table `reviews` (type daily/weekly/monthly/quarterly/annual, prompts JSONB, answers JSONB, score, mood, created_at) + RLS.
- Modaux séquentiels :
  - Daily Shutdown (5 min, 4 prompts).
  - Monthly Review (15 min, 8 prompts).
  - Quarterly Reset (alignement valeurs + life areas).
  - Annual Review.
- Hotkeys F7 (daily), F8 (monthly), F9 (quarterly).
- Page Archive `/reviews` filtrable par type + recherche full-text.
- Decision log dédié : table `decisions` (hypothèse, contexte, résultat, leçon, review_at) + modal réutilisable `DecisionLogModal` (déjà ébauché).

### 2.2 Cron AI Coach
- Activer `pg_cron` + secret `CRON_SECRET`.
- Job horaire `coach-index-memory` (réindex mémoire vectorielle).
- Job nocturne `coach-pattern-detect` (détection patterns → notifications).

---

## Vague 3 — Engagement social V2

### 3.1 Goal contracts V2
- Notification cascade : trigger Postgres sur `goal_contracts.insert` → insert `notifications` pour chaque témoin.
- Modal signature digitale HUD (témoin signe avec son nom + timestamp, animation hold-to-sign).
- Statut `pending_signatures` jusqu'à signature de tous les témoins, puis `active`.

### 3.2 Quêtes & Seasons
- Table `season_rewards` (cosmetic_id, season_id, unlock_rank).
- Drop Shop limité saisonnier (filtre `available_until`).
- Edge fn `season-reset` (cron trimestriel) : snapshot leaderboard → table `hall_of_fame`, attribue prestige (champ `prestige` sur profile), reset Seasons.
- Page `/hall-of-fame` consultable.

---

## Vague 4 — Capteurs & Intégrations

### 4.1 PWA finalisation
- Configurer secrets VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `VITE_VAPID_PUBLIC_KEY`).
- Offline-first : Workbox runtime cache `NetworkFirst` sur queries Supabase `goals`, `habits`, `journal`, `todos`. Sync queue IndexedDB pour mutations (replay au retour online).
- ⚠️ Respect strict des contraintes PWA Lovable (pas d'iframe register, NetworkFirst sur HTML).

### 4.2 Calendar 2-way sync (Google)
- Table `oauth_tokens` (user_id, provider, access_token chiffré, refresh_token, scope, expires_at) + RLS.
- Edge fn `oauth-google-init` + `oauth-google-callback` (per-user OAuth, scope `calendar.events`).
- Edge fn `calendar-sync` (delta via Google channels webhooks → table `calendar_events` étendue avec `external_id`/`source`).
- UI Calendar : bouton "Connect Google", chips de filtre par source, drag step → event Google bilatéral, conflict resolution simple (last-write-wins + log).

### 4.3 Wearables Health
- OAuth per-user Google Fit (scope fitness.activity.read, heart_rate, sleep).
- Apple Health via fichier export manuel (upload XML → parser edge fn) en MVP, vu que Health Connect natif requiert Capacitor.
- Edge fn `sync-health-data` cron horaire (Google Fit) + `import-apple-health` (one-shot).
- Mapping vers tables Health existantes (steps, heart_rate, sleep, hrv).

### 4.4 Bank aggregation
- Connecteur GoCardless Bank Account Data (gratuit Europe, alternative Bridge).
- Secrets : `GOCARDLESS_SECRET_ID`, `GOCARDLESS_SECRET_KEY`.
- Tables `bank_connections` (institution_id, requisition_id, status, expires_at), enrichissement `bank_transactions` (external_id, raw JSONB).
- Edge fn `bank-link-init` (génère agreement + requisition + redirect URL), `bank-callback` (échange contre accounts), `bank-sync` (cron quotidien : pull transactions delta).
- Table `categorization_rules` (user_id, pattern, category) + auto-apply au sync, fallback IA via lovable-ai sur transactions inconnues.

---

## Vague 5 — Profondeur par module

### 5.1 Goals & Habits
- Vue topologique globale `/goals/graph` : graphe DAG via `react-flow` (nœuds = goals, edges = `goal_dependencies`), zoom/pan, click → GoalDetail.
- Marketplace templates : extension table `goal_templates` (champs `is_public`, `author_id`, `rating_avg`, `usage_count`). Page `/templates/marketplace` avec filtres + page de détail + bouton "Use".
- Conditional habits : table `habit_skip_rules` (goal_id, condition_json) — ex. skip si jour de repos déclaré.
- Negative habits : flag `is_negative` sur goals — succès = ne PAS logger ce jour-là (inverse les rewards/streaks dans `useToggleHabitLog`).

### 5.2 Finance avancée
- Cashflow projeté 3/6/12 mois : RPC `compute_cashflow_projection(_months)` (récurrents `recurring_transactions` + budgets actifs + sinking funds). Composant `CashflowProjectionPanel` avec line chart + scenarios (worst/realistic/best).
- Sinking funds : table `sinking_funds` (goal_id facultatif, target_amount, target_date, monthly_contribution, current_balance) + virement simulé auto mensuel (cron). Vue dédiée onglet Finance.
- Cron mensuel `snapshot_net_worth` via `pg_cron`.
- Dette tracker : table `debts` (name, principal, interest_rate, monthly_payment, start_date, end_date) + RPC `compute_debt_schedule` (intérêts composés, échéancier). Onglet "Dettes" Finance.
- Import OFX/CSV : composant upload, parser côté front (lib `node-ofx-parser` + `papaparse`), preview + dédup par hash transaction.

### 5.3 Focus, Journal, Calendar
- Deep work sessions sans timer : variante de `focus_sessions` (mode `deep_work`, pas de durée fixe), capture distractions (table `focus_distractions` log timestamp + note rapide).
- Focus → attribution Goal : champ `goal_id` sur `focus_sessions` (déjà présent partiellement) + section Analytics "Heures par mission".
- Journal :
  - Prompts quotidiens rotatifs : table `journal_prompts` seedée (Stoïques/CBT/gratitude/visualisation), rotation par hash(date, user_id).
  - Search sémantique : extension `coach_embeddings` aux entries journal (déjà fait), UI search bar dans Journal.
  - Voice-to-entry : enregistrement Web Audio → upload Storage → edge fn `transcribe-journal` via lovable-ai Whisper proxy → insert entry.
- Calendar auto-scheduler IA : edge fn `calendar-autoschedule` (analyse trous + habits/steps non planifiés + travel time → propose blocs). Modal preview + confirm.

---

## Vague 6 — Polish & Plateforme

### 6.1 Sortie & preuve
- Edge fn `export-pdf-report` (pdfkit, période mensuelle/annuelle) : KPIs, graphes, valeurs, missions, rituels. Bouton "Exporter PDF" dans Profile.
- Public goal pages : table `public_goal_shares` (goal_id, slug, is_public, theme), route `/u/:handle/g/:slug` avec RLS public read sur opt-in. Toggle dans GoalDetail "Partager publiquement".
- Badges signés LinkedIn : edge fn `generate-badge` (canvas → PNG + Open Graph meta), page `/badges/:achievement_id`, bouton "Share to LinkedIn".

### 6.2 Plateforme
- Tests : Vitest sur hooks critiques (`useGoals`, `useShop`, `useHabitLogs`, RPCs Bonds). Playwright sur 4 flows (auth, goal CRUD, shop purchase, ritual complete).
- Storybook : setup `@storybook/react-vite`, vitrine DS Pacte OS (DSPanel/DSBadge/DSEmptyState/DSLoadingState + dialectes Nexus/PRISM/Aura).
- Mobile native Capacitor : config iOS/Android, splash, icons, widget "today's mission" (iOS WidgetKit / Android RemoteViews — code natif Swift/Kotlin minimal).
- I18n : ajout `locales/es.json`, `de.json`, `pt.json`, `it.json` (traduction des clés existantes via lovable-ai batch).
- Notifications avancées : table `notification_preferences` (user_id, category, quiet_hours_start, quiet_hours_end, digest_mode bool). Respect dans edge fn `push-send` + `smart-notifications`.

---

## Détails techniques transverses

### Secrets requis (à demander en cours de route)
- `CRON_SECRET` (V2.2, V5.2 cron)
- `VAPID_*` ×4 (V4.1)
- Google OAuth client (V4.2, V4.3) — secrets côté projet
- `GOCARDLESS_SECRET_ID` / `SECRET_KEY` (V4.4)
- `SENTRY_DSN` / `VITE_SENTRY_DSN` (V1.2)
- `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` (V1.2)

### Architecture (rappels mémoire)
- Toute mutation Bonds/Shop/Stats via RPC `SECURITY DEFINER`.
- Composants en DS Pacte OS (DSPanel/DSBadge/DSEmptyState/DSLoadingState).
- Data fetching exclusivement via `useQuery`.
- Edge functions : Zod validation + CORS + rate limiting.
- Type safety : extension manuelle des types Supabase, pas de `as any`.

### Ordre d'exécution recommandé
```text
V1.1 → V1.2 → V2.1 → V2.2 →
V3.1 ║ V3.2 ║ V4.1 (parallélisables)
→ V4.2 → V4.3 → V4.4
→ V5.1 → V5.2 → V5.3
→ V6.1 → V6.2
```

### Hors périmètre (confirmé par l'utilisateur)
- Vague 1.2 originelle : abonnements payants Paddle, page `/pricing`, paywall, `<PaywallGate />`, webhook Paddle. **Reste différé.**

### Risques principaux
- OAuth per-user Google : complexité, démarrer par Calendar comme proof of concept avant Health.
- GoCardless : limité Europe + sandbox requis pour tests.
- Capacitor + widgets natifs : nécessite tooling iOS/Android local — peut être livré en dernier ou scoped à la web app + manifest only si l'utilisateur préfère.
- Volume : ~12 sprints au total. Suggestion = livrer vague par vague avec validation entre chaque.
