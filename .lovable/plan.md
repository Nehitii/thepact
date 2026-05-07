
# Roadmap Pacte OS — Intégration progressive des manques

Plan structuré en **6 vagues** ordonnées par dépendances et ROI. Chaque vague est livrable indépendamment et débloque la suivante. Estimation indicative en sprints (1 sprint = ~1 semaine de focus).

---

## Vague 1 — Fondations & couche "Sens" (2 sprints)

Prérequis pour tout le reste : sans Life Areas + Values, l'IA et les analytics futurs n'ont pas de pivot.

### 1.1 Life Areas + Values (1 sprint)
- Table `life_areas` (id, user_id, name, icon, color, weight 0-100, parent_pact_id).
- Table `user_values` (id, user_id, label, rank, statement).
- Onboarding step "Workshop des Valeurs" (5 questions guidées + sélection 3-5 valeurs).
- Champs `life_area_id` ajoutés à `goals`, `habits`, `transactions` (nullable, migration douce).
- Widget Home "Équilibre des domaines" (radar chart par area).
- Settings → Domaines & Valeurs (CRUD).

### 1.2 Subscription tiers (1 sprint)
### 1.2 Subscription tiers — **DIFFÉRÉE** (décision user)
Décisions verrouillées (à appliquer quand on reprend) :
- **Provider :** Paddle (Seamless, MoR, 5%+0,50€) — éligibilité validée.
- **Matrice :**
  - **Free (généreux)** : Goals, Habits, Health, Finance manuel, Community, Achievements core.
  - **Pro (~7€/mois)** : AI Coach, connecteurs banque + santé, exports PDF, calendrier 2-way.
  - **Sovereign (~19€/mois)** : tout Pro + sessions humaines 1:1 + early access.
- Tables `subscription_plans`, `user_subscriptions`, `feature_entitlements` + RPC `has_entitlement`.
- Hook `useEntitlements()`, composant `<PaywallGate />`, page `/pricing`.
- Webhook edge function Paddle (`subscription.created/updated/canceled`).
- Mode admin contourne tous les gates.

> Voir `mem://monetization/subscription-tiers-deferred` pour le détail figé.

### 1.3 Observabilité & feature flags — **PARTIEL**
- ✅ Tables `feature_flags` + `user_feature_overrides` (RLS lecture publique, écriture admin).
- ✅ Hook `useFeatureFlag(key)` avec override per-user.
- ✅ 3 flags seedés : `coach_write_tools`, `goal_contracts`, `goal_decompose_ai`.
- ⏳ Sentry (front + edge functions).
- ⏳ PostHog ou équivalent self-hosted.

---

## Vague 2 — Boucle Réflexion & IA Coach (3 sprints)

### 2.1 Rituels de revue structurés (1 sprint)
- Table `reviews` (type: daily/weekly/monthly/quarterly/annual, prompts, answers, score, mood).
- Modaux séquentiels (Daily Shutdown 5min, Monthly Review 15min, Quarterly Reset).
- Mapping hotkeys F7/F8/F9.
- Archive consultable filtrée par type + recherche.
- Decision log dédié (table `decisions` : hypothèse, contexte, résultat, leçon, date révision).

### 2.2 AI Coach conversationnel — **QUASI BOUCLÉE**
- ✅ Edge function `ai-coach` streaming (lovable-ai gateway, Gemini 2.5 Flash par défaut).
- ✅ Tables `coach_conversations`, `coach_messages`, `coach_embeddings` (pgvector + RPC `match_coach_memory`).
- ✅ UI : panneau latéral global Cmd+J + bouton flottant.
- ✅ Tool-calling lecture : `list_active_goals`, `list_recent_habits`, `list_recent_transactions`, `list_recent_journal`, `list_user_values`, `search_memory` (loop max 3 hops, puis stream final).
- ✅ Mémoire vectorielle : edge function `coach-index-memory` (per-user via JWT, ou cron via `CRON_SECRET`) — embeds `openai/text-embedding-3-small`, sources : journal, reviews, decisions. Bouton 🧠 dans le panneau Coach.
- ✅ Tool-calling write : `create_todo`, `create_journal_entry`, `create_decision` (gated derrière flag `coach_write_tools`).
- ✅ Goal decomposition assistée (`goal-decompose` edge fn + bouton "AI Decompose" dans NewGoal, gated `goal_decompose_ai`).
- ⏳ Cron horaire `coach-index-memory` (à brancher via `pg_cron` quand le secret CRON_SECRET sera défini).
- ✅ Pattern detection edge fn `coach-pattern-detect` (Gemini 2.5 Flash, JSON insights → table `notifications`, mode cron via `CRON_SECRET`). Reste à brancher `pg_cron` nocturne.

---

## Vague 3 — Engagement & Social profond (2 sprints)

### 3.1 Goal contracts sociaux — **BOUCLÉE (MVP)**
- ✅ Table `goal_contracts` (witnesses[], stake_bonds, deadline, status, signed_at, settled_at) + RLS owner+witnesses.
- ✅ Hooks `useGoalContracts`, `useCreateGoalContract`, `useUpdateContractStatus` (gated `goal_contracts`).
- ✅ RPC atomique `settle_contract` (succès → refund owner ; échec → split equal aux témoins, reste au 1er).
- ✅ UI `GoalContractsPanel` dans `GoalDetail` : sélection des témoins (amis), mise en Bonds, échéance, notes, settle ✓/✗.
- ⏳ Notification cascade aux témoins + modal de signature digitale HUD (V2).

### 3.2 Quêtes dynamiques & Seasons — **EN COURS**
- ✅ Tables `seasons` (slug, theme, starts_at/ends_at, leaderboard_snapshot) et `daily_quests` (kind, target, progress, reward, status) + RLS user-scoped.
- ✅ RPC atomique `claim_quest` (vérifie progress ≥ target, crédite Bonds, marque claimed).
- ✅ Edge fn `generate-daily-quests` (3 quêtes basées sur goals/habits actifs, cron-ready).
- ✅ Hooks `useDailyQuests`, `useGenerateDailyQuests`, `useClaimQuest` + panneau `DailyQuestsPanel` accroché au Home.
- ⏳ Auto-incrément `progress` (triggers sur step completion / habit_log / journal_entries / focus_sessions).
- ⏳ Récompenses cosmétiques saisonnières + drop Shop limité.
- ⏳ Reset trimestriel automatique + hall of fame archivé + prestige post-rank.

---

## Vague 4 — Capteurs & Intégrations (3 sprints)

### 4.1 PWA + push web (0.5 sprint)
- Service worker (vite-plugin-pwa), manifest, install prompt.
- Push notifications web (VAPID), table `push_subscriptions`.
- Offline-first sur Todo / Habits / Journal (cache + sync queue).

### 4.2 Calendar 2-way sync (1 sprint)
- Connector Google Calendar (workspace-level OAuth = limité au dev) → bascule vers per-user OAuth (table `oauth_tokens`).
- Sync delta (webhooks Google channels), conflict resolution.
- Time-blocking : drag d'un step vers Calendar → event créé bilatéral.

### 4.3 Wearables Health (1 sprint)
- Apple Health / Google Fit via per-user OAuth + Health Connect API.
- Edge function `sync-health-data` cron horaire.
- Mapping vers HUD biométrique existant (steps, HR, sleep, HRV).
- Mode manuel conservé en fallback.

### 4.4 Bank aggregation (0.5 sprint MVP)
- Connecteur Bridge API ou GoCardless (Europe) — clé propre via `add_secret`.
- Table `bank_connections` + `synced_transactions`.
- Auto-catégorisation par règles (table `categorization_rules`) + apprentissage simple.

---

## Vague 5 — Profondeur par module (3 sprints)

### 5.1 Goals & Habits (1 sprint)
- DAG dépendances goals (table `goal_dependencies`, vue topologique).
- Marketplace templates (publication communautaire, ratings).
- Habit stacking (`prerequisite_habit_id`), conditional habits (skip rules), negative habits.
- Streak freezes monétisés en Bonds.

### 5.2 Finance avancé (1 sprint)
- Cashflow projeté 3/6/12 mois (algo récurrents + budgets).
- Sinking funds (goals d'épargne avec virements simulés auto).
- Net worth historique (snapshot mensuel).
- Dette tracker (loans, échéanciers, intérêts composés).
- Import OFX/CSV manuel.

### 5.3 Focus, Journal, Calendar (1 sprint)
- Deep work sessions sans timer + capture distractions.
- Focus → attribution Goal (heures par mission dans Analytics).
- Journal : prompts quotidiens rotatifs (Stoïques/CBT/gratitude), search sémantique (vecteurs), voice-to-entry (Whisper via lovable-ai).
- Calendar : auto-scheduler IA des habits/steps dans les trous, conflict + travel time.

---

## Vague 6 — Polish & Plateforme (2 sprints)

### 6.1 Sortie & preuve (1 sprint)
- Export PDF "Rapport Pacte" mensuel/annuel (pdfkit edge function).
- Public goal pages `/u/:handle/g/:slug` (RLS public read sur opt-in).
- Badges signés exportables LinkedIn (image + open graph).

### 6.2 Plateforme (1 sprint)
- Tests : Vitest + Playwright sur flux critiques (auth, goal CRUD, shop purchase, RPC bonds).
- Storybook DS Pacte OS (vitrine primitives + dialectes).
- Mobile native wrapper Capacitor (iOS/Android) + widgets (today's mission, habit check).
- I18n : ajout ES/DE/PT/IT (fichiers `locales/`).
- Notifications : quiet hours par catégorie, digest mode matinal.

---

## Détails techniques transverses

### Architecture
- Toute nouvelle mutation passe par RPC `SECURITY DEFINER` (mémoire Core).
- Tous nouveaux composants utilisent DS Pacte OS (DSPanel/DSBadge/DSEmptyState/DSLoadingState).
- Hooks data via `useQuery` exclusivement (mémoire React Query Standard).
- Edge functions : Zod validation, CORS, rate limiting (table `rate_limits` partagée).

### Schéma BDD nouveau (résumé)
```text
life_areas, user_values
subscription_plans, user_subscriptions, feature_flags
reviews, decisions
coach_conversations, coach_messages, coach_embeddings (pgvector)
goal_contracts, seasons, daily_quests
push_subscriptions, oauth_tokens, bank_connections, synced_transactions, categorization_rules
goal_dependencies, public_goal_shares
```

### Connectors à activer (au moment de chaque vague)
- Vague 4.2 : per-user OAuth Google (pas le connector workspace).
- Vague 4.4 : secret manuel Bridge/GoCardless (`add_secret`).
- Vague 6.1 : aucun (pdfkit local).

### Risques & mitigations
- **OAuth per-user** complexe → commencer par 1 provider (Google Calendar) comme proof of concept.
- **AI Coach coût** → cache embeddings, limiter contexte (last 20 msgs + RAG), throttle Free tier.
- **Migrations lourdes** (life_area_id sur 3 tables) → faire en nullable + backfill async.
- **Subscription gates** : ne jamais bloquer rétroactivement les data existantes des users free.

---

## Ordre & dépendances

```text
V1 Foundations ──┬── V2 IA Coach ──┐
                 ├── V3 Engagement ─┤
                 │                  ├── V5 Profondeur module ── V6 Polish
                 └── V4 Intégrations┘
```

V2/V3/V4 peuvent être parallélisés après V1. V5 dépend de V1 (life_areas) et bénéficie de V2 (IA). V6 ferme la boucle.

---

## Première action recommandée

Démarrer par **Vague 1.1 (Life Areas + Values)** : c'est le pivot conceptuel qui donne du sens à toutes les vagues suivantes, faible risque technique, livrable en ~5 jours.

Souhaites-tu que j'attaque directement la Vague 1.1, ou préfères-tu ajuster l'ordre/le périmètre avant ?
