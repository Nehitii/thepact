

## Plan: Uniformiser les headers de tous les modules sur le style "Chronolog"

### Référence: Le header Journal (Chronolog)
Le Journal utilise un header centré avec:
- Un orbe central décoratif (cercle + point pulsant)
- Une ligne système `NEURAL_JOURNAL // SYS.ACTIVE` entre deux lignes dégradées
- Un titre en `font-orbitron font-black` avec gradient `from-foreground/95 to-foreground/50` et un mot accentué en `text-primary`
- Des badges hexagonaux (HexBadge) avec des stats contextuelles

### Approche
Créer un composant partagé `ModuleHeader` dans `src/components/layout/ModuleHeader.tsx` qui reproduit le pattern Chronolog, puis l'utiliser dans les 5 modules. Chaque module gardera 1-2 détails rappelant son identité.

### Composant `ModuleHeader`
```
Props:
- systemLabel: string (ex: "NEURAL_FINANCE // SYS.ACTIVE")
- title: string (ex: "FUND")  
- titleAccent: string (ex: "FLOW")
- badges: Array<{ label, value, color }>
- icon?: ReactNode (icône centrale au lieu de l'orbe par défaut)
- children?: ReactNode (boutons d'action sous les badges)
```

### Modifications par module

**1. `/finance` (Finance.tsx)**
- Remplacer le header flex left-aligned par le ModuleHeader centré
- Titre: `FUND` + accent `FLOW`
- System label: `NEURAL_FINANCE // SYS.ACTIVE`
- Badges: rappelant la finance (Total Income, Total Expenses, Balance)
- Garder le bouton Settings dans `children`
- Icône centrale: icône monnaie/wallet

**2. `/the-call` (TheCall.tsx)**
- Remplacer le header `<header>` existant (bouton RETURN + streak)
- Titre: `THE` + accent `CALL`
- System label: `RITUAL_ENGINE // SYS.ACTIVE`
- Badges: Streak count, Total check-ins
- Garder le bouton retour dans `children`
- TheCall est très spécifique (expérience plein écran) — header plus discret, intégré dans l'état IDLE/LOCKED seulement

**3. `/wishlist` (Wishlist.tsx)**
- Remplacer le header (Back + titre + bouton Add)
- Titre: `WISH` + accent `LIST`
- System label: `ACQUISITION_PLAN // SYS.ACTIVE`
- Badges: Items count, Required total, Optional total
- Garder boutons Back et Add dans `children`

**4. `/health` (Health.tsx)**
- Remplacer le header centré existant (icône Heart + titre gradient)
- Titre: `VITA` + accent `SCAN`
- System label: `HEALTH_MONITOR // SYS.ACTIVE`
- Badges: Health score, Streak
- Conserver la toolbar HUD en dessous

**5. `/todo` (TodoList.tsx)**
- Remplacer le `TodoGamifiedHeader` pour la section titre uniquement (garder les stats en dessous)
- Titre: `TASK` + accent `OPS`
- System label: `QUEST_ENGINE // SYS.ACTIVE`
- Badges: Active quests, Score, Streak

### Détail technique du composant

Le composant répliquera exactement la structure du Journal header:
1. Orbe central avec anneaux tournants (dark only)
2. Ligne système avec dégradés latéraux
3. Titre `font-orbitron font-black` avec `bg-clip-text bg-gradient-to-b from-foreground/95 to-foreground/50` + accent `text-primary` avec drop-shadow
4. HexBadges (importés depuis JournalDecorations)
5. Slot `children` pour les actions spécifiques

### Fichiers modifiés
- **Nouveau**: `src/components/layout/ModuleHeader.tsx`
- **Modifié**: `src/pages/Finance.tsx` — header remplacé
- **Modifié**: `src/pages/TheCall.tsx` — header remplacé (état IDLE/LOCKED)
- **Modifié**: `src/pages/Wishlist.tsx` — header remplacé
- **Modifié**: `src/pages/Health.tsx` — header remplacé
- **Modifié**: `src/pages/TodoList.tsx` — header remplacé
- **Modifié**: `src/components/journal/JournalDecorations.tsx` — exporter HexBadge et RotatingRing pour réutilisation (déjà exportés)

