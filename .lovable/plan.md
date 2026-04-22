

# /friends — Audit & Rénovation Cyberpunk "ALLIANCE GRID"

## Audit du design actuel

| Zone | Constat | Verdict |
|---|---|---|
| **ModuleHeader** | Standard Pacte OS — orbital + badges. OK | ✅ Conserver |
| **Background** | 2 orbs floues `blur-[120px]` (primary + violet) | ⚠️ Coût GPU sans signature |
| **Coquille TabsList** | Card `bg-card/80 backdrop-blur-xl rounded-2xl` + filet gradient top | 🔶 Générique, pas signature |
| **Tabs** | Underline border-b-2 + glow blur — propre mais quelconque | 🔶 Manque d'identité HUD |
| **Cards Friend/Request/Search** | Bordure plate, padding uniforme, `rounded-xl`, `bg-card` | ❌ Plat, pas de hiérarchie, aucun bracket cyber |
| **GuildCard** | Gradient + scale 1.02 hover | 🔶 Effet "site marketing", pas tactique |
| **Avatars** | Border-2 + dot status simple | 🔶 Manque ring rotatif / ping |
| **InsightStrip / KPI** | **Absent** — aucun vital sign en haut de page | ❌ Rate l'opportunité de "haute perf" |
| **Empty states** | CyberEmpty générique | ✅ OK |
| **Cohérence DS** | Aucun composant `DSPanel/DSBadge/DSCornerBrackets` utilisé | ❌ Pas aligné Pacte OS |

**Diagnostic global** : design **fonctionnel mais générique** — friends ressemble à n'importe quel module shadcn customisé. Aucune signature mémorable, pas de densité d'information, pas de moment "wow".

---

## Direction — "ALLIANCE GRID" (sous-marque de Pacte OS)

Concept : transformer /friends en **console de surveillance d'alliés**, façon command center de jeu tactique (XCOM × Death Stranding × Edgerunners).

**3 principes** :
1. **Présence > Liste** : chaque allié devient un "node" vivant (status ring, last seen, mutual count, ping latency simulé).
2. **InsightStrip vital** : 4 KPIs en haut de page (Allies online / Pending signals / Guild ops / Network reach).
3. **Hiérarchie tier** : DSPanel primary pour l'active tab, secondary pour les cards, muted pour les sent-requests/historique.

---

## Plan de rénovation

### 1. Page shell — `Friends.tsx`
- Supprimer les 2 orbs flous → remplacer par `<DSDataNoise />` discret (fragments mono opacity-[0.04])
- Ajouter `<DSCornerBrackets size={16} />` aux 4 coins de la coquille principale
- Coquille : `bg-[hsl(var(--ds-surface-1))] border-[hsl(var(--ds-border-default))]` (au lieu de `bg-card/80 backdrop-blur-xl`) → −1 backdrop-blur
- Nouveau bandeau **AllianceInsightStrip** sous le ModuleHeader (sticky `top-0` interne)

### 2. AllianceInsightStrip (nouveau composant)
4 vital signs en grid-cols-4, chacun en `DSPanel tier="muted"` :
```
┌──────────┬──────────┬──────────┬──────────┐
│ ALLIES   │ ONLINE   │ SIGNALS  │ GUILDS   │
│  012     │  ●  03   │   02     │  01      │
│ active   │ live now │ pending  │ joined   │
└──────────┴──────────┴──────────┴──────────┘
```
- Chiffres en Orbitron 25px, label en mono 9px UPPERCASE
- Dot pulse lime sur ONLINE si >0
- Dot pulse magenta sur SIGNALS si pendingCount>0
- Calcul online = `lastSeenMap` filtré <5min (logique existante)

### 3. TabsList — "Tactical Rail"
Refonte des onglets en **rail horizontal HUD** :
- Container `border-y border-[hsl(var(--ds-border-default))] bg-[hsl(var(--ds-surface-2))]`
- Chaque tab : icon 16px + label Orbitron 11px UPPERCASE tracking-[0.2em] + count badge mono
- Active : fond `bg-primary/8` + border-l-2 cyan + bracket micro top-left/bottom-left 6px (au lieu de underline blur)
- Inactive : opacity-50, hover opacity-100
- Indicator latéral cyan `before:` au lieu de underline blur (perf + signature)

### 4. FriendNode (refonte de la card friend)
Remplace le `flex items-center gap-4 p-4 rounded-xl border` actuel par :
```
┌─[ AGT.001 ]──────────────────────────────────┐
│ ◎  Avatar    AGENT_NAME           [msg][rm] │
│ Ring rotat.  ● LIVE · 2m · 12 mutual · LV23 │
└──────────────────────────────────────────────┘
```
- DSPanel tier="secondary" + corner brackets 10px
- Avatar wrapped dans `<div>` avec ring SVG rotatif lent (8s) **uniquement si online** (perf)
- Status dot remplacé par `OnlineStatusPing` enrichi : `● LIVE` (lime) / `◐ IDLE` (amber) / `○ OFFLINE` (gris) en mono 9px
- Métadonnée droite : ID `AGT.{idx}` mono 9px en top-right corner
- Hover : bracket cyan s'éclaire + `translateY(-1px)` (pas de scale, plus tactique)
- Actions (Message / Remove) en variant `hud` au lieu de `ghost`

### 5. RequestNode (refonte card request)
- DSPanel tier="secondary" avec **accent border-l-2 violet** (au lieu de border violet partout)
- Header micro mono : `[ INCOMING SIGNAL · {timeAgo} ]`
- Boutons Accept (lime) / Decline (magenta) selon les nouvelles couleurs accent du DS
- Animation entry : `slide-in-right` 200ms + glow violet 1s puis fade
- Sent requests : DSPanel tier="muted", header mono `[ TRANSMITTED · awaiting response ]`

### 6. SearchTab — "Network Scanner"
- Input : style HUD avec label flottant Orbitron 11px `[ TARGET QUERY ]`, focus border cyan + ring 1px externe
- Button SCAN au lieu de SEARCH (Orbitron, glow cyan), avec icône radar
- Pendant search : skeleton 3 rows en `DSSkeleton` (scan sweep 1.2s) + texte mono `[ SCANNING NETWORK... ]`
- Résultats : FriendNode en mode "discovery" (pas de status ring, badge "MUTUAL × N" cyan, action ADD = Button default cyan)
- Empty initial : `CyberEmpty` avec icône Radar + phrase `// AWAITING TARGET COORDINATES`

### 7. GuildsTab — "Faction Registry"
- Header de section avec divider DSDivider + label `[ ACTIVE FACTIONS ]`
- Bloc "Join via code" : DSPanel tier="muted" avec input mono UPPERCASE + button JACK_IN cyan
- **GuildCard refonte** :
  - DSPanel tier="primary" si owner, tier="secondary" sinon
  - Brackets cyan/violet selon `guild.color`
  - Stripe latéral 3px à gauche (couleur guild)
  - Mini bar de remplissage members/max sous le nom (12px de haut, gradient color)
  - Crown owner remplacée par badge mono `[ OWNER ]` lime
  - Globe public remplacé par badge mono `[ PUBLIC ]` cyan
  - Hover : `translateY(-1px)` + brackets glow (pas de scale 1.02)
- Section "Discover" : header `[ PUBLIC NETWORK ]` cyan, cards en grille 2 cols sur desktop

### 8. FriendAvatar — Enrichissement
Nouveau prop `online?: boolean` :
- Si online + `showStatus` : SVG ring rotatif autour de l'avatar (stroke-dasharray cyan, 8s linear)
- Status dot remplacé par DSBadge micro `LIVE/IDLE/OFFLINE` positionné `-bottom-1 -right-1`

### 9. Background — épuré
- Suppression des 2 orbs blur
- Ajout d'**un seul** `DSScanRay` vertical lent (16s) optionnel, désactivable via `prefers-reduced-motion`
- Ajout de `<DSDataNoise />` global page (bg fragments mono très subtil)

### 10. FriendProfileDrawer (passage en revue)
- DSPanel tier="primary" avec brackets 16px
- Header mono `[ AGENT PROFILE · {ID} ]`
- Stats grid mutual / since / status en DSPanel muted
- (Refonte légère, pas de refactor structurel)

---

## Composants à créer

| Fichier | Rôle |
|---|---|
| `src/components/friends/AllianceInsightStrip.tsx` | 4 KPIs vital signs |
| `src/components/friends/FriendNode.tsx` | Refonte card friend (extraction depuis FriendsTab) |
| `src/components/friends/RequestNode.tsx` | Refonte card request |
| `src/components/friends/GuildNodeCard.tsx` | Refonte GuildCard tactique |
| `src/components/friends/AllianceTabs.tsx` | Rail horizontal HUD (extraction depuis Friends.tsx) |
| `src/components/friends/AvatarPing.tsx` | Ring SVG rotatif + status badge réutilisable |

## Fichiers édités

- `src/pages/Friends.tsx` — coquille DSPanel + InsightStrip + AllianceTabs
- `src/components/friends/FriendsTab.tsx` — utilise FriendNode
- `src/components/friends/RequestsTab.tsx` — utilise RequestNode
- `src/components/friends/SearchTab.tsx` — Network Scanner UI
- `src/components/friends/GuildsTab.tsx` — Faction Registry UI
- `src/components/friends/FriendAvatar.tsx` — intégration AvatarPing

## Conservé intact

Hooks (`useFriends`, `useGuilds`, `useMutualFriends`), logique RLS/blocages, ModuleHeader (déjà canonique), FriendProfileDrawer (refonte légère seulement), GuildCreateModal, BlockConfirmDialog, RemoveFriendDialog, GuildInviteCard (refonte légère), routing `/guild/:id`, i18n (clés réutilisées, pas de nouvelles).

## Hors scope

- Refonte de `/guild/:id` (page séparée, déjà fonctionnelle)
- Système de chat Inbox (déjà refondu)
- Calcul de "ping latency" réel (simulé visuellement uniquement si demandé)
- Refonte de l'avatar frame system

## Bénéfices attendus

- **Identité visuelle Friends signature** (Alliance Grid) cohérente avec Pacte OS
- **−2 backdrop-blur lourds** + ring rotatif uniquement sur online = perf préservée
- **InsightStrip** = lecture instantanée du réseau social en 1 coup d'œil
- **Hiérarchie 3 tiers DSPanel** = différenciation owner/active/historique
- **0 refonte fonctionnelle** = zéro risque de régression métier

