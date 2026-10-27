# Overwrite

> Find The Light

Application web progressive (PWA) de suivi d'habitudes, d'objectifs et de bien-être,
avec M.I.A, son intelligence conversationnelle.

> **L'application s'est appelée Vowpact jusqu'au 27 août 2026.** Le nom a été
> abandonné après un dépôt de marque par un tiers. Le dossier du dépôt porte
> encore l'ancien nom sur le disque ; le renommer casserait les chemins des
> outils locaux, et il n'apparaît nulle part dans ce qui est livré.

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
| `npm run typecheck` | Vérification des types, sans émettre |
| `npm run i18n:check` | Vérifie les clés de traduction |
| `npm run tableau` | Régénère le tableau de bord du projet |

Analyse de la taille du bundle :

```sh
npx vite build --mode analyze
```

Le rapport est écrit dans `dist/stats.html`.

## Tableau de bord du projet

```sh
npm run tableau
```

Écrit `docs/tableau-de-bord.html` — une page autonome qui s'ouvre au
double-clic, sans serveur ni base de données. Elle rassemble l'identité du
projet, ses modules, sa direction artistique, ses visuels, sa stack et l'état
du code.

**Deux sources, une seule vérité par donnée.** Le dépôt dit ce qui EST :
versions, fichiers, lignes, historique git, visuels, palette, dépendances,
marqueurs. Rien de tout cela ne se recopie à la main, donc rien ne peut
diverger. `projet.manifeste.json` porte ce que le dépôt ne peut pas savoir :
le pitch, le public, le statut de chaque module, les licences, l'outil et le
prompt d'un visuel. Un champ vide s'affiche « à compléter » — jamais deviné.

**Ce que l'analyse exclut**, et c'est écrit dans la page elle-même :

| Exclu | Pourquoi |
|---|---|
| `node_modules`, `dist` | déjà ignorés par git |
| `src/integrations/supabase/types.ts` | généré par Supabase — 5 700 lignes qui écraseraient tout classement |
| `public/sw.js` | généré par Workbox |
| `.claude` | compétences installées, pas le produit |
| `docs/instantanes` | les instantanés de cette page |

**Instantanés.** Chaque exécution dépose `docs/instantanes/<date>.json` et les
vingt derniers sont conservés : la page affiche alors l'évolution entre deux
régénérations plutôt qu'une simple photo.

**Ouvrir la page.** Double-clic sur le fichier. Les vignettes et les
échantillons de police pointent vers `../public/` : le chemin vaut depuis le
disque, pas depuis le serveur de développement.

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
