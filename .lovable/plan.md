

## Refonte du header Todo : épurer, regrouper, ajouter "Info"

### Constat actuel
La zone au-dessus des tasks comprend :
1. **ModuleHeader** — orbe, anneaux, "TASK OPS", 3 hexagones (ACTIVE, SCORE, STREAK)
2. **TodoGamifiedHeader** — gros panel glassmorphism avec level circle, XP bar segmentée, 4 stat chips (Score, Streak, Best, Active)
3. **QuickTaskInput** — barre de commande rapide
4. **Action bar** — compteur texte + boutons (view toggle, Calendar, History, Stats, New Quest)
5. **TodoFilterSort** — filtres type + tri

Problèmes : doublons d'info (score, streak, active apparaissent 2 fois), hexagones lourds, trop de sections empilées.

### Plan

**Fichier : `src/pages/TodoList.tsx`**

1. **Supprimer le `ModuleHeader`** (orbe, anneaux, hexagones) — remplacer par un titre simple discret : "TASK OPS" en petit avec le system label, style mono épuré
2. **Supprimer le `TodoGamifiedHeader`** complètement — les stats essentielles (LVL, Score, Streak, Active) seront intégrées en une ligne compacte sous le titre
3. **Nouveau header compact** :
   - Ligne 1 : titre "TASK OPS" à gauche (petit, mono), stats inline à droite (LVL 6 · Score 570 · Streak 1 · 8/30)
   - Ligne 2 : XP progress bar fine (2px, pas les segments)
4. **Regrouper la toolbar** en une seule ligne sous le QuickTaskInput :
   - Gauche : view toggle (grid/list) + filtres type (inline chips)
   - Droite : boutons icônes seuls (pas de texte) pour Calendar, History, Stats + bouton **Info** (icône `Info`) qui ouvre un popover/dialog expliquant les commandes rapides (`!high`, `#work`, `@today`)
   - Bouton "+ New" reste à droite, mis en valeur
5. **Supprimer la ligne "8 / 30 active quests"** séparée — déjà visible dans les stats inline

**Fichier : `src/components/todo/TodoCommandInfo.tsx`** (nouveau)
- Petit composant dialog/popover déclenché par le bouton "Info"
- Liste les commandes : `!high/med/low`, `#category`, `@today/tomorrow/nextweek`
- Style terminal mono, compact

### Résultat visuel

```text
TASK OPS                          LVL 6 · Score 570 · 🔥 1 · 8/30
━━━━━━━━━━━━━━━━━━━━━━━━━━ XP 70/100 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[>_ Type task... !high #work @today                              ↵]

[⊞][≡]  All | Flexible | Deadline | Waiting | RDV    [ℹ][📅][📊][🕐] [+ New]

... tasks ...
```

Gain : ~300px de hauteur récupérée, zéro hexagone, info accessible via bouton Info, toolbar unifiée.

