

# Friends + Guild — Polish & Cohérence Alliance Grid

## Problèmes identifiés

| # | Constat | Cause |
|---|---|---|
| 1 | **ModuleHeader Friends** décoratif (rings rotatifs, hexagons) ne raccorde pas avec la coquille HUD tactique en dessous | ModuleHeader générique conçu pour Goals/Journal, pas pour les modules tactiques |
| 2 | **`[ TARGET QUERY ]` coupé visuellement** dans Search | Label flottant `absolute -top-2` mais le parent `DSPanel` n'a pas de marge top, et la coquille `Friends.tsx` a `overflow-hidden` qui clippe |
| 3 | Idem **`[ JACK_IN VIA CODE ]`** dans Guilds | Même cause |
| 4 | **GuildPage** = ancien design (gradient violet/emerald, rounded-2xl, no DS tokens) | Jamais migré lors de la phase Alliance Grid |
| 5 | **GuildHeader** legacy avec gradient `from-violet-600/40 to-violet-900/20`, no brackets, no mono ID, no scan effect | Composant créé avant le DS |
| 6 | **GuildSidebar** rounded-lg primary/15 = pas tactique | Style shadcn vanilla |
| 7 | **GuildOverview** : textarea + `bg-card/50 border-border/50` = pas DS | Pas migré |

## Plan de correctifs

### 1. Fix labels flottants coupés (priorité immédiate)
- `SearchTab.tsx` : remplacer le pattern `<DSPanel>` + `<span absolute -top-2>` par un wrapper flexbox propre :
  - Label `[ TARGET QUERY ]` rendu **au-dessus** de l'Input dans un flex column gap-2 (pas absolute)
  - Idem pour `[ JACK_IN VIA CODE ]` dans `GuildsTab.tsx`
- Bénéfice : zéro clipping, zéro dépendance à l'overflow du parent, lisibilité 100%

### 2. Friends — ModuleHeader tactique dédié
Créer `src/components/friends/AllianceModuleHeader.tsx` (alternative compacte au ModuleHeader décoratif) :
- Pas de rotating rings, pas de hexagons
- Layout horizontal : `[ALLIANCE_GRID // SYS.ACTIVE]` mono à gauche + titre Orbitron `FRIENDS` au centre + 2-3 vital chips compacts à droite
- Padding réduit `py-4` au lieu de `py-10`
- Border-bottom hairline cyan pour fusionner visuellement avec la coquille DS
- Remplace l'usage de `ModuleHeader` dans `Friends.tsx`

### 3. GuildPage — Refonte coquille Alliance Grid
`src/pages/GuildPage.tsx` :
- Wrapper identique à Friends : `min-h-screen + DSDataNoise + max-w-5xl + coquille DS`
- `DSCornerBrackets size={16}` aux 4 coins
- Top hairline cyan
- Garder structure sidebar + content

### 4. `GuildHeader.tsx` — Refonte tactique
- Supprimer gradient violet/emerald → `DSPanel tier="primary"` avec accent dérivé de `guild.color`
- Stripe latéral 3px gauche (couleur guild)
- Header mono `[ FACTION · {guild.id slice 8} ]` en top-left
- Back button HUD style (mono `← /friends`) en top-right
- Icon guild dans cadre carré rounded-sm + glow inset (style GuildNodeCard)
- Titre Orbitron + badges `[OWNER]` `[PUBLIC]` mono cohérents avec GuildNodeCard
- GuildXPBar conservé mais dans DSPanel tier="muted" en bas
- Member count en chip mono `MBR · 12/25`

### 5. `GuildSidebar.tsx` — Tactical Rail vertical
- Reprendre le pattern de `AllianceTabs` mais en **vertical** :
  - `bg-[hsl(var(--ds-surface-2)/0.5)] border border-[hsl(var(--ds-border-default)/0.2)]`
  - Active : `inset 2px 0 0 cyan` + bracket micro top-left/bottom-left + `bg-primary/8`
  - Inactive : opacity-50 hover opacity-100
  - Labels Orbitron 10px tracking-[0.2em] uppercase
  - Icons 16px
  - Section ID `NAV.0X` mono à gauche au survol (optionnel)

### 6. `GuildOverview.tsx` — DSPanel + brackets
- MOTD textarea : wrap dans `DSPanel tier="muted"` avec label flottant `[ POST ANNOUNCEMENT ]` (pattern fixé du #1)
- Annonces : chaque annonce dans `DSPanel tier="secondary" accent="warning"` (Megaphone = warning), header mono `[ AUTHOR · TIME ]`
- Activity log : `DSPanel tier="muted"` wrapper, items en flex avec dot pulse cyan + texte Rajdhani + timestamp mono droite
- Headers de section mono `[ ANNOUNCEMENTS ]` / `[ RECENT ACTIVITY ]` + DSDivider

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/components/friends/SearchTab.tsx` | Fix label clipping (flex column au lieu d'absolute) |
| `src/components/friends/GuildsTab.tsx` | Fix label clipping idem |
| `src/components/friends/AllianceModuleHeader.tsx` | **Créer** — header compact tactique |
| `src/pages/Friends.tsx` | Remplacer ModuleHeader par AllianceModuleHeader |
| `src/pages/GuildPage.tsx` | Wrapper coquille DS + DSDataNoise + brackets |
| `src/components/guild/GuildHeader.tsx` | Refonte DSPanel + tokens DS + back HUD |
| `src/components/guild/GuildSidebar.tsx` | Refonte tactical rail vertical |
| `src/components/guild/GuildOverview.tsx` | DSPanel partout + headers mono + DSDivider |

## Hors scope
- GuildChat, GuildMembersPanel, GuildEventsPanel, GuildLeaderboard, GuildSettingsPage (à faire en passe ultérieure si demandé)
- GuildXPBar (déjà OK visuellement)
- Aucune modif data layer / hooks / RLS

## Bénéfices
- **0 texte coupé** sur tous les labels flottants
- **Cohérence visuelle 1:1** entre `/friends` et `/guild/:id`
- **GuildHeader signature** au lieu de carte gradient générique
- **Sidebar guild = mini-AllianceTabs** = continuité d'interaction

