# Fix : le Coach ne détecte pas les goals actifs

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
