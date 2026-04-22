
# Fix — Pages noires / blocage après changements d'onglets répétés

## Diagnostic

Quatre causes cumulées :

1. **`AnimatePresence mode="wait"` bloquant** dans `AppLayout.tsx` : impose qu'une animation `exit` finisse AVANT de monter la suivante. Si tu cliques vite, les exits s'empilent et la page apparaît noire (motion.div à `opacity: 0` jamais re-rendu).
2. **~20 `setInterval(1s)` simultanés** (NeuralBar, PrismHeadline, CountdownPanel, ActiveMissionCard, Journal clock, HealthVitalCoreHero, DayView, WeekView, etc.) qui tournent en arrière-plan → Chrome les throttle, puis les déclenche en burst au retour de l'onglet, saturant le main thread.
3. **`CyberBackground` + 689 usages de `backdrop-blur`** sur la même page → pression GPU énorme. Quand le navigateur perd le contexte de compositing (long task), le résultat est un écran noir le temps qu'il reconstruise.
4. **Effets non pausés sur `visibilityState=hidden`** : seul `SoundContext` réagit. Tous les RAF / intervals continuent → batterie + CPU à fond.

---

## Correctifs

### 1. AppLayout — Retirer `mode="wait"` (cause directe du black screen au switch rapide)

`src/components/layout/AppLayout.tsx` :
- Supprimer `mode="wait"` de `AnimatePresence` → permet aux pages de se chevaucher 150ms sans bloquer.
- Réduire la transition à `duration: 0.1` pour atténuer toute perception de lag.
- Alternative plus radicale (recommandée) : **supprimer complètement `AnimatePresence` + `motion.div` du layout** et garder juste `<Outlet />`. La transition de route 150ms est cosmétique et coûte cher en remount. Si on garde, mode non-wait obligatoire.

### 2. Hook centralisé `useVisibleInterval` — Pause les tickers quand l'onglet est caché

Créer `src/hooks/useVisibleInterval.ts` :
```ts
export function useVisibleInterval(callback: () => void, ms: number) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; });
  useEffect(() => {
    let id: number | undefined;
    const start = () => { stop(); id = window.setInterval(() => cbRef.current(), ms); };
    const stop = () => { if (id) { clearInterval(id); id = undefined; } };
    const onVis = () => document.visibilityState === "visible" ? start() : stop();
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [ms]);
}
```

Remplacer les `setInterval` 1s dans :
- `src/components/home/NeuralBar.tsx`
- `src/components/analytics/PrismHeadline.tsx`
- `src/components/home/CountdownPanel.tsx`
- `src/components/home/hero/ActiveMissionCard.tsx`
- `src/pages/Journal.tsx`
- `src/components/health/HealthVitalCoreHero.tsx`
- `src/components/calendar/views/DayView.tsx` + `WeekView.tsx` (60s, moins critique mais à inclure)

Bénéfice : zéro tick en arrière-plan, pas de burst au retour.

### 3. CyberBackground — Optimisation GPU

`src/components/CyberBackground.tsx` :
- Ajouter `will-change: transform` aux orbs animés (force la couche GPU)
- Ajouter `contain: strict` au wrapper (isolation rendering)
- Cacher les orbs quand l'onglet est caché via classe CSS (`html.tab-hidden .cyber-orb { display: none }`) gérée par un listener global dans `AppProviders`.

### 4. Cleanup queryClient au focus

`src/components/AppProviders.tsx` — Désactiver `refetchOnWindowFocus` pour éviter une vague de requêtes au retour d'onglet :
```ts
defaultOptions: {
  queries: {
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
}
```
(Actuellement le défaut React Query est `true` → chaque retour d'onglet relance toutes les queries actives = burst réseau + re-renders + black screen pendant le refetch).

### 5. Bonus — Erreur Supabase `update_achievement_tracking` (visible dans les logs)

Le 400 `COALESCE types text and date cannot be matched` arrive à chaque login. Ne cause pas le black screen mais pollue les logs et bloque le tracking. À corriger dans la fonction RPC : caster correctement `last_login_date` (colonne `date`) — actuellement reçoit string `"2026-04-22"` que COALESCE refuse de mixer avec un type `text`. Migration SQL séparée recommandée.

---

## Fichiers touchés

- `src/components/layout/AppLayout.tsx` — retrait `mode="wait"` (ou suppression complète d'AnimatePresence)
- `src/hooks/useVisibleInterval.ts` — création
- `src/components/home/NeuralBar.tsx`, `analytics/PrismHeadline.tsx`, `home/CountdownPanel.tsx`, `home/hero/ActiveMissionCard.tsx`, `pages/Journal.tsx`, `health/HealthVitalCoreHero.tsx`, `calendar/views/DayView.tsx`, `calendar/views/WeekView.tsx` — migration vers `useVisibleInterval`
- `src/components/CyberBackground.tsx` — `will-change` + `contain: strict`
- `src/components/AppProviders.tsx` — `refetchOnWindowFocus: false`

## Hors scope
- Refonte des autres `setInterval` non-1s (animation steppers, breathing exercise) qui sont déjà locaux à des écrans actifs
- Migration SQL pour le bug RPC achievement (à traiter séparément si tu veux)
- Réduction du nombre de `backdrop-blur` (chantier majeur, hors scope ici)

## Bénéfice attendu
- **Disparition du black screen** sur switch rapide d'onglets (cause #1 éliminée)
- **−90% de CPU en arrière-plan** (cause #2 éliminée)
- **Pas de burst de requêtes** au retour d'onglet (cause #4 éliminée)
- **Affichage instantané** au retour, sans temps de récupération
