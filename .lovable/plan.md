
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
- Tables `subscription_plans` (free / pro / sovereign) et `user_subscriptions`.
- Hook `useEntitlements()` avec gates fonctionnels (IA coach, intégrations, exports, slots illimités).
- UI paywall premium (DSPanel + CTA Shop).
- Activation Stripe via `payments--enable_stripe_payments`.
- Mode admin contourne tous les gates.

### 1.3 Observabilité & feature flags (transverse, 0.5 sprint)
- Sentry (front + edge functions).
- Table `feature_flags` simple + hook `useFlag(key)`.
- PostHog ou équivalent self-hosted pour analytics produit.

---

## Vague 2 — Boucle Réflexion & IA Coach (3 sprints)

### 2.1 Rituels de revue structurés (1 sprint)
- Table `reviews` (type: daily/weekly/monthly/quarterly/annual, prompts, answers, score, mood).
- Modaux séquentiels (Daily Shutdown 5min, Monthly Review 15min, Quarterly Reset).
- Mapping hotkeys F7/F8/F9.
- Archive consultable filtrée par type + recherche.
- Decision log dédié (table `decisions` : hypothèse, contexte, résultat, leçon, date révision).

### 2.2 AI Coach conversationnel (2 sprints)
- Edge function `ai-coach` streaming (lovable-ai gateway, gpt-5/gemini-2.5-pro).
- Table `coach_conversations` + `coach_messages` (full history sent à chaque tour).
- Tool-calling : lecture goals/habits/transactions/journal, création de tâches, planification.
- Mémoire vectorielle (embeddings via lovable-ai, pgvector) sur journal + reviews.
- UI : panneau latéral persistant (slide-in droite), accessible depuis n'importe quelle page (Cmd+J).
- Pattern detection nightly cron (insights pushés en notifications).
- Goal decomposition assistée (bouton dans NewGoal → suggestion steps + habits).

---

## Vague 3 — Engagement & Social profond (2 sprints)

### 3.1 Goal contracts sociaux (1 sprint)
- Table `goal_contracts` (goal_id, witnesses[], stake_bonds, deadline, status).
- RPC `accept_contract`, `settle_contract` (atomic, redistribue les Bonds).
- UI : depuis GoalDetail, "Engager un témoin" → recherche Friend, négociation stake.
- Notification cascade aux témoins, signature digitale (modal HUD).

### 3.2 Quêtes dynamiques & Seasons (1 sprint)
- Table `seasons` (id, start, end, theme, leaderboard_snapshot).
- Table `daily_quests` générées par cron (basées sur goals/habits actifs).
- Récompenses cosmétiques saisonnières (drop limité dans Shop).
- Reset trimestriel avec hall of fame archivé.
- Prestige post-rank max (boucle de rejouabilité).

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
