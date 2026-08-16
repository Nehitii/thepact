# Sortie de Lovable — procédure

Ce document décrit ce qui a changé, ce qu'il reste à faire côté infrastructure,
et dans quel ordre.

## 1. Ce qui a été retiré du code

| Élément | Statut |
|---|---|
| `lovable-tagger` (package.json + vite.config.ts) | supprimé |
| `bun.lock` / `bun.lockb` | supprimés — trois lockfiles, Cloudflare aurait choisi bun et réinstallé `lovable-tagger` |
| Images OG signées sur le bucket `gpt-engineer` | remplacées par `/og-image.png` (l'URL signée avait expiré le 2026-03-15) |
| Détection d'hôte `lovableproject.com` / `lovable.app` / `id-preview--` | supprimée de `src/main.tsx` |
| `.lovable/plan.md` | supprimé |
| `.env` suivi par git | retiré du suivi (le fichier local est conservé) |
| `LovableBot/1.0` (User-Agent de `scrape-product`) | → `VowpactBot/1.0` |
| Passerelle `ai.gateway.lovable.dev` | remplacée — voir §2 |

## 2. Passerelle IA

Sept Edge Functions appelaient `https://ai.gateway.lovable.dev` avec le secret
`LOVABLE_API_KEY` :

`ai-coach` · `coach-index-memory` · `coach-pattern-detect` · `coach-weekly-digest`
· `goal-decompose` · `health-insights` · `weekly-review`

Toutes passent désormais par `supabase/functions/_shared/ai.ts`, qui cible par
défaut l'API Gemini de Google.

Le chat utilise la couche compatible OpenAI (`/v1beta/openai/chat/completions`),
ce qui préserve le streaming et le tool-calling sans changer la forme des appels.

Les embeddings utilisent l'endpoint **natif** (`:embedContent` / `:batchEmbedContents`) :
la couche compatible OpenAI n'expose aucun contrôle de dimension, or il faut
exactement 1536 pour correspondre aux colonnes `vector(1536)` de `coach_embeddings`.
`gemini-embedding-001` ne normalise pas ses dimensions tronquées, donc `ai.ts`
applique une normalisation L2 explicite.

### Secrets à configurer

```sh
supabase secrets set AI_API_KEY=<clé Google AI Studio>
supabase secrets unset LOVABLE_API_KEY
```

Variables optionnelles, avec valeurs par défaut dans `_shared/ai.ts` :
`AI_GATEWAY_URL`, `AI_CHAT_MODEL`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_URL`.

Changer de fournisseur revient à surcharger `AI_GATEWAY_URL` et `AI_API_KEY`,
sans toucher au code — tant que le fournisseur est compatible OpenAI.

### Ré-indexation obligatoire de la mémoire du coach

Les vecteurs existants viennent de `text-embedding-3-small`. Deux modèles
d'embedding différents ne vivent pas dans le même espace vectoriel : les
mélanger rendrait `match_coach_memory` incohérent — le coach citerait des
souvenirs sans rapport avec la question.

Il faut donc **purger et reconstruire** l'index, après avoir déployé les
fonctions et configuré `AI_API_KEY` :

```sql
-- A executer une seule fois, apres deploiement.
TRUNCATE public.coach_embeddings;
```

Puis relancer l'indexation (`coach-index-memory` ré-indexe tout ce qui n'est pas
déjà présent) :

```sh
supabase functions deploy coach-index-memory
curl -X POST "https://<project-ref>.functions.supabase.co/coach-index-memory" \
  -H "Authorization: Bearer <jwt-utilisateur>"
```

Le contenu source (journal, reviews, décisions) n'est pas touché — seuls les
vecteurs dérivés sont reconstruits.

## 3. Déploiement Cloudflare Workers

Cloudflare oriente désormais vers Workers plutôt que Pages. Le déploiement est
« assets-only » : aucun code Worker, seulement le build Vite servi tel quel.

| Réglage | Valeur |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | 20, épinglée par `.nvmrc` |

La configuration vit dans `wrangler.jsonc`. Son `not_found_handling` en mode
`single-page-application` renvoie `index.html` avec un 200 sur toute route
inconnue — sans quoi un rechargement sur une route profonde donnerait un 404.

Ne pas ajouter de `public/_redirects` : Workers le lit aussi, et une règle
`/* /index.html 200` y est rejetée comme boucle infinie (code 100324). Les deux
mécanismes se contredisent ; `not_found_handling` suffit.

Variables d'environnement à saisir dans Cloudflare (onglet Settings →
Environment variables). Elles sont injectées **au build**, donc tout changement
impose un nouveau déploiement :

```
VITE_SUPABASE_URL
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SENTRY_DSN
```

## 4. Ordre de bascule

1. Déployer les 7 Edge Functions et configurer `AI_API_KEY`
2. Vérifier que le coach répond (`ai-coach`) avant de toucher à l'index
3. `TRUNCATE coach_embeddings` puis relancer `coach-index-memory`
4. Déployer le front sur Cloudflare Pages, valider sur l'URL `*.pages.dev`
5. Basculer le domaine custom
6. Seulement ensuite : déconnecter puis supprimer le projet Lovable

## 5. Points restants (hors périmètre de la sortie)

- `public/og-image.png` n'existe pas encore — à fournir en 1200×630
- Les icônes du manifeste PWA pointent sur `/placeholder.svg` : l'installation
  de l'app affichera un placeholder au lieu d'une icône
- `vite.config.ts` expose le serveur de dev sur `0.0.0.0` (accessible depuis le
  réseau local) — volontaire pour tester sur mobile, à connaître
- Le repo est public et la clé `anon` est donc visible : ce n'est sûr que si les
  RLS couvrent bien toutes les tables. À auditer séparément.
