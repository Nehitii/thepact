# Vowpact

> Find The Light

Application web progressive (PWA) de suivi d'habitudes, d'objectifs et de bien-être,
avec coach IA conversationnel.

## Stack

| Couche | Technologie |
|---|---|
| Front | React 18 + TypeScript + Vite 5 |
| UI | Tailwind CSS + shadcn/ui (Radix) + framer-motion |
| État serveur | TanStack Query |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| IA | Edge Functions Deno appelant une API compatible OpenAI |
| PWA | vite-plugin-pwa (Workbox) |
| i18n | i18next / react-i18next |
| Monitoring | Sentry |

## Prérequis

- Node.js 20+
- Un projet Supabase
- La [Supabase CLI](https://supabase.com/docs/guides/cli) pour les migrations et les Edge Functions

## Démarrage

```sh
npm install
cp .env.example .env
npm run dev
```

L'application démarre sur http://localhost:8080.

## Variables d'environnement

Copier `.env.example` vers `.env` et renseigner les valeurs.

| Variable | Rôle |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé `anon` (publique, protégée par les RLS) |
| `VITE_SUPABASE_PROJECT_ID` | Identifiant du projet Supabase |
| `VITE_SENTRY_DSN` | DSN Sentry (optionnel — le monitoring est désactivé si absent) |

`.env` ne doit **jamais** être committé.

Les Edge Functions lisent leurs propres secrets côté Supabase
(`supabase secrets set`), jamais depuis ce fichier.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production dans `dist/` |
| `npm run build:dev` | Build en mode development |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | ESLint |

Analyse de la taille du bundle :

```sh
npx vite build --mode analyze
```

Le rapport est écrit dans `dist/stats.html`.

## Base de données

Les migrations vivent dans `supabase/migrations/` et s'appliquent dans l'ordre
chronologique.

```sh
supabase link --project-ref <project-ref>
supabase db push
```

## Edge Functions

Le code des fonctions est dans `supabase/functions/`. Leur configuration
d'authentification (`verify_jwt`) est dans `supabase/config.toml`.

```sh
supabase functions deploy <nom-de-la-fonction>
```

## Déploiement

Le front est une SPA statique : `npm run build` produit `dist/`, à servir
derrière un fallback SPA (toutes les routes inconnues renvoient `index.html`).

Les variables `VITE_*` sont injectées **au moment du build** — changer une valeur
nécessite un nouveau build, pas seulement un redémarrage.
