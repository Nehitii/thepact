

# Audit Code Global — VowPact

## 1. FICHIERS ORPHELINS (jamais importes)

| Fichier | Statut |
|---------|--------|
| `src/components/home/ProgressByDifficultyModule.tsx` | Jamais importe nulle part — composant mort |
| `src/components/PactTimeline.tsx` | Jamais importe dans aucune page — composant mort |
| `src/components/health/HealthDataExport.tsx` | Exporte dans le barrel `health/index.ts` mais jamais importe par `Health.tsx` — mort |
| `tmp/ref.html` | Fichier de reference HTML de 1457 lignes — vestige de design, ne fait pas partie de l'app |
| `src/lib/index.ts` | Barrel export jamais utilise — aucun fichier n'importe `from "@/lib"` |
| `src/contexts/index.ts` | Barrel export jamais utilise — aucun fichier n'importe `from "@/contexts"` |

## 2. CLES i18n MANQUANTES (erreurs console)

Les cles suivantes sont utilisees dans `PeriodSelector.tsx` mais absentes de `en.json` et `fr.json` :
- `analytics.period.30d`
- `analytics.period.90d`
- `analytics.period.6m`
- `analytics.period.all`

Les fallbacks fonctionnent (ex: "Last 30 days") mais genere des warnings console a chaque visite de `/analytics`.

## 3. TODO NON RESOLU

`src/hooks/useHealthChallenges.ts` ligne 214 :
```
// TODO: Award bonds to user
```
Le toast affiche "+X Bonds" mais les bonds ne sont jamais reellement credites. Bug fonctionnel silencieux.

## 4. ERREUR RUNTIME — Edge Function `two-factor`

L'erreur `401: Invalid or expired token` dans les logs indique que l'edge function `two-factor` rejette des tokens expires lors du refresh de session. C'est un probleme connu de timing Supabase — le token expire entre le moment ou le client le lit et ou l'edge function le valide. Pas un bug de code a proprement parler mais merite un guard cote client pour retry avec un token frais.

## 5. BARREL EXPORTS INUTILES

Les barrels suivants sont declares mais jamais utilises via leur index :
- `src/components/goals/index.ts` — 0 import via `from "@/components/goals"`
- `src/components/finance/index.ts` — 0 import via `from "@/components/finance"`
- `src/components/health/index.ts` — 0 import (Health.tsx importe chaque composant directement)
- `src/components/layout/index.ts` — 1 seul import (Calendar.tsx), tous les autres importent directement

Ces barrels ne cassent rien mais ajoutent du code mort et de la confusion.

## 6. ORGANISATION LOGIQUE

### Correct
- Pages dans `src/pages/` — bien organise, 1 fichier par route
- Hooks dans `src/hooks/` — 1 hook par feature, nommage coherent
- Composants groupes par module (`friends/`, `goals/`, `health/`, etc.)
- Edge functions dans `supabase/functions/` — bien separees

### A reorganiser
- `src/components/PactTimeline.tsx`, `src/components/PactVisual.tsx`, `src/components/WeeklyReviewModal.tsx`, `src/components/GoalImageUpload.tsx`, `src/components/ParticleEffect.tsx`, `src/components/CyberBackground.tsx` — composants "loose" a la racine de `components/`. Devraient etre dans des sous-dossiers logiques (`pact/`, `shared/`, `effects/`).
- `src/pages/GoalDetail_handlers.tsx` — pattern inhabituel (fichier `_handlers` dans pages). Devrait etre dans `src/hooks/` ou `src/lib/`.

## 7. CONSOLE.LOG RESTANTS

Un seul `console.log` conditionnel dans `TheCall.tsx` (gate par `import.meta.env.DEV`) — acceptable, pas de fuite en production.

## PLAN D'IMPLEMENTATION

### Phase 1 — Nettoyage code mort
1. Supprimer `src/components/home/ProgressByDifficultyModule.tsx`
2. Supprimer `src/components/PactTimeline.tsx`
3. Supprimer `tmp/ref.html`
4. Supprimer `src/lib/index.ts` et `src/contexts/index.ts`
5. Retirer `HealthDataExport` du barrel `health/index.ts` (garder le composant pour usage futur ou le supprimer)

### Phase 2 — i18n manquant
6. Ajouter les cles `analytics.period.*` dans `en.json` et `fr.json`

### Phase 3 — Bug fonctionnel
7. Implementer le credit de bonds dans `useHealthChallenges.ts` (appeler le RPC `award_bonds` ou equivalent) et retirer le TODO

### Phase 4 — Organisation
8. Deplacer `GoalDetail_handlers.tsx` vers `src/lib/goalDetailHandlers.ts`
9. Optionnel : reorganiser les composants loose dans des sous-dossiers

## Fichiers impactes

| Fichier | Action |
|---------|--------|
| `src/components/home/ProgressByDifficultyModule.tsx` | Supprimer |
| `src/components/PactTimeline.tsx` | Supprimer |
| `tmp/ref.html` | Supprimer |
| `src/lib/index.ts` | Supprimer |
| `src/contexts/index.ts` | Supprimer |
| `src/components/health/index.ts` | Retirer export HealthDataExport |
| `src/i18n/locales/en.json` | Ajouter cles `analytics.period.*` |
| `src/i18n/locales/fr.json` | Ajouter cles `analytics.period.*` |
| `src/hooks/useHealthChallenges.ts` | Implementer bond reward |
| `src/pages/GoalDetail_handlers.tsx` | Deplacer vers `src/lib/` |
| `src/pages/GoalDetail.tsx` | Mettre a jour l'import |

