

# Audit UX/UI/Design — Module /the-call

## Etat visuel constate

**Desktop 991px** : Le header "THE CALL" + orbe + rotating rings occupent ~180px en haut. Le bouton circulaire (288px) est centre verticalement avec un paddingTop dynamique. Le texte "HOLD TO INITIATE" et "Awaiting Input" sont visibles. Le bouton RETURN est bien place. La toolbar dev (Reset/Play/FastForward) est visible en bas a droite.

**Mobile 375px** : Enorme espace vide (~200px) entre le titre "THE CALL" et le bouton. Le bouton est pousse vers le bas, "Awaiting Input" est a peine visible. Le bouton sidebar ">>" chevauche le header. Le bouton RETURN est trop haut, colle au bord.

---

## Tableau Recapitulatif

| # | Zone | Probleme | Impact | Solution | Priorite |
|---|------|----------|--------|----------|----------|
| **LAYOUT** |
| 1 | Mobile — gap enorme header/bouton | ~200px de vide entre le titre et le cercle. Le `paddingTop: headerHeight + 24` + les rotating rings + le `pt-10 pb-8` du ModuleHeader creent un decalage excessif | Le bouton central est pousse trop bas, "Awaiting Input" est presque hors ecran, rompt le centrage rituel | Sur mobile, reduire le padding du ModuleHeader (`pt-4 pb-3`), et reduire le `+ 24` a `+ 8` dans le paddingTop dynamique | 🔴 |
| 2 | Mobile — sidebar toggle chevauche header | Le bouton ">>" de la sidebar se superpose au bouton RETURN et a l'orbe du header | Confusion visuelle, zone de clic conflictuelle | Masquer le bouton sidebar sur /the-call (page rituelle plein ecran), ou le positionner sous le header avec un z-index inferieur | 🟡 |
| 3 | Desktop — bouton trop bas | Le paddingTop dynamique pousse le contenu ~200px sous le header. Le bouton n'est pas visuellement centre dans l'espace disponible restant | Le bouton ne semble pas centre verticalement dans la zone utilisable | Utiliser un vrai centrage flex (`flex-1 flex items-center justify-center`) au lieu du paddingTop fixe | 🟡 |
| 4 | Bouton 288px fixe | Le bouton fait `w-72 h-72` (288px) quelle que soit la taille de l'ecran. Sur mobile 375px, il occupe 77% de la largeur, sur desktop il est relativement petit | Trop gros sur mobile (peu de respiration laterale), trop petit sur grand ecran | Responsive : `w-60 h-60 sm:w-72 sm:h-72` (240px mobile, 288px desktop) | 🟢 |
| **INTERACTION** |
| 5 | "HOLD TO INITIATE" — affordance insuffisante | Le texte est en `text-white/30` (opacite 30%), 12px, et n'apparait que sous l'icone Zap sans aucun indicateur visuel de "appuyer et maintenir" | L'utilisateur ne comprend pas immediatement qu'il faut maintenir le clic. Pas d'icone, pas de pulse, pas d'animation attirant l'attention | Augmenter l'opacite a 50%, ajouter une animation `pulse` subtile sur le texte, et ajouter un petit anneau pulse autour du bouton en idle | 🔴 |
| 6 | Pas de feedback au relachement premature | Quand l'utilisateur relache avant 20s, la progression recule silencieusement (snapBack). Aucun message, aucun feedback visuel | L'utilisateur ne sait pas pourquoi le progres revient a zero. Confusion sur le fonctionnement | Afficher un message ephemere subtil ("Connection lost..." ou "Signal fading...") pendant le snapBack, coherent avec le theme rituel | 🟡 |
| 7 | Countdown "19.98s" — direction confuse | Le timer decompte de 20.00 a 0.00 mais sans contexte. L'utilisateur ne sait pas vers quoi il compte, ni a quoi correspond 0 | Manque de contexte. Ajouter un indicateur de progression visuel (arc de cercle autour du bouton qui se remplit) | Ajouter un cercle SVG de progression (stroke-dashoffset) autour du bouton, en plus du countdown texte | 🟡 |
| 8 | Dev toolbar visible en production | Les 3 boutons Reset/Play/FastForward sont toujours visibles (opacite 20%). En production, n'importe quel utilisateur peut les voir et les utiliser | Fuite d'outils de dev, possibilite de skip le rituel. Les boutons Play/FastForward permettent de bypass la completion sans maintenir | Conditionner l'affichage a `import.meta.env.DEV` : `{import.meta.env.DEV && <div className="fixed...">}` | 🔴 |
| **HIERARCHIE VISUELLE** |
| 9 | Header decoratif trop lourd pour un rituel | Les rotating rings, l'orbe central, le system label "RITUAL_ENGINE // SYS.ACTIVE", les lignes decoratives — tout cela est du bruit visuel qui detourne l'attention du coeur du rituel (le bouton) | Le rituel devrait etre minimaliste et centrer toute l'attention sur l'action centrale. Le header "tech" casse l'ambiance meditative | Simplifier le header : supprimer les rotating rings et l'orbe, garder uniquement le titre "THE CALL" sans fioritures, ou reduire significativement la taille du header | 🟡 |
| 10 | Icone Zap trop grosse (96px) | L'icone `Zap` fait `w-24 h-24` (96px) dans un cercle de 288px. Elle est le seul element visuel en idle, mais son style (stroke seulement, tres dim) ne communique pas "action" | L'icone n'a pas l'air interactive. Un Zap avec juste un stroke a 20% d'opacite ne dit pas "appuyez ici" | Reduire a `w-16 h-16`, augmenter l'opacite du stroke a 40%, ou remplacer par un indicateur plus rituel (cercle pulse, empreinte de main) | 🟡 |
| 11 | "Awaiting Input" en 9px — illisible | Le message de statut fait `text-[9px]` avec `tracking-[0.5em]` et `opacity: 0.3`. C'est physiquement illisible, surtout sur mobile | Information inutile car illisible. Soit la rendre lisible, soit la supprimer | Augmenter a `text-[11px]`, opacite a 0.5, ou integrer dans le cercle central | 🟢 |
| **CONFORT & FEEDBACK** |
| 12 | Phase REVEAL trop longue (5 secondes) | Apres l'explosion blanche, la phase "SOUL CONNECTED" reste affichee 5 secondes fixes avant de passer a LOCKED. C'est statique pendant trop longtemps | L'utilisateur attend passivement pendant 5s sans rien faire. Moment de delight qui devient moment d'attente | Reduire a 3s, ou ajouter une interaction (tap to continue) apres 2s | 🟡 |
| 13 | Etat LOCKED — pas de stats ni de prochaine action | Quand le rituel est complete, on voit juste un Lock vert avec "Protocol Locked". Pas de recap (streak actuel, total calls), pas de CTA (retour dashboard) | L'utilisateur ne recoit aucune gratification chiffree apres le rituel. Pas de renforcement positif | Afficher sous le lock : streak actuel, total calls, et un bouton "Return to Dashboard" | 🟡 |
| 14 | Pas de compteur Streak/Total visible en idle | Le nombre de check-ins et le streak ne sont affiches nulle part. L'utilisateur ne sait pas ou il en est avant de commencer | Pas de contexte motivationnel avant le rituel | Afficher discretement le streak et total sous le titre ou sous le bouton en idle, en petit texte mono | 🟡 |
| **ACCESSIBILITE** |
| 15 | Bouton sans aria-label | Le `<button>` principal n'a pas d'`aria-label`. Un lecteur d'ecran ne peut pas identifier son role | Inaccessible aux technologies d'assistance | Ajouter `aria-label="Hold for 20 seconds to complete daily ritual"` et `role="button"` | 🟡 |
| 16 | Flash blanc plein ecran (EXPLOSION) | La phase EXPLOSION affiche un `bg-white opacity-100` plein ecran pendant ~75ms. C'est un flash photosensible potentiellement dangereux | Risque d'epilepsie photosensible (WCAG 2.3.1) | Respecter `prefers-reduced-motion` : remplacer le flash blanc par un fade-in blanc progressif (500ms) quand active | 🔴 |
| 17 | Screen shake sans reduced-motion | Les secousses de l'ecran (`translate3d`, `rotate`, `blur`) sont intensives et continues pendant toute la progression | Utilisateurs sensibles aux mouvements ne peuvent pas utiliser le module | Verifier `prefers-reduced-motion` : si actif, desactiver shake et reduire les animations a des changements de couleur/opacite uniquement | 🟡 |
| **PERFORMANCE** |
| 18 | 30 particules DOM en inline style | Pendant la progression, 30 divs sont rendues avec des styles inline individuels et des animations CSS. Chaque frame de rAF recalcule les effets cinematiques sur 3 refs DOM | Sur mobile bas de gamme, 30 particules + shake + blur + glow = risque de jank | Reduire a 16 particules. Utiliser `will-change: transform` sur le bouton principal. Conditionner les particules a un check de performance ou de preference | 🟢 |
| 19 | CSS inline dans `<style>` tag | Les keyframes sont dans un `<style>` inline a la fin du composant. Ce CSS est reinjecte a chaque render du composant | Mauvaise pratique, potentiel repaint inutile | Deplacer ces keyframes dans `index.css` ou un fichier CSS module dedie | 🟢 |

---

## Synthese

**🔴 Critique (3)** :
1. Gap mobile enorme entre header et bouton — le rituel n'est pas centre
2. Dev toolbar visible en production — fuite d'outils
3. Flash blanc photosensible sans `prefers-reduced-motion`

**🟡 Majeur (9)** : Affordance "hold" insuffisante, pas de feedback au relachement, sidebar overlap mobile, centrage desktop, header trop lourd, icone Zap trop dim, REVEAL trop long, pas de stats en locked/idle, a11y labels/shake

**🟢 Mineur (4)** : Taille bouton fixe, "Awaiting Input" illisible, particules trop nombreuses, CSS inline

---

## Plan d'implementation

**Phase 1 — Fix critiques**
1. Conditionner la dev toolbar a `import.meta.env.DEV`
2. Reduire le gap mobile : padding header `pt-4 pb-3` sur mobile, paddingTop dynamique `+ 8` au lieu de `+ 24`
3. Ajouter `prefers-reduced-motion` : remplacer le flash blanc par un fade doux, desactiver le screen shake

**Phase 2 — Affordance et feedback**
4. Augmenter la visibilite de "HOLD TO INITIATE" (opacite 50%, animation pulse lente)
5. Ajouter un anneau SVG de progression autour du bouton (stroke-dashoffset base sur `normalizedProgress`)
6. Afficher un message ephemere au relachement premature ("Signal fading...")
7. Ajouter `aria-label` au bouton principal
8. Reduire l'icone Zap a `w-16 h-16`, augmenter le stroke a 40%

**Phase 3 — Confort et gratification**
9. Afficher streak + total calls en idle (sous le bouton, petit texte mono)
10. Enrichir l'etat LOCKED : afficher streak, total, bouton "Return to Dashboard"
11. Reduire REVEAL de 5s a 3s
12. Simplifier le header (supprimer rotating rings sur cette page, ou les reduire)
13. Deplacer les keyframes inline vers `index.css`
14. Reduire les particules de 30 a 16

## Fichiers impactes

| Fichier | Action |
|---------|--------|
| `src/pages/TheCall.tsx` | Tous les changements (layout, a11y, dev toolbar, feedback, stats, keyframes) |
| `src/index.css` | Recevoir les keyframes dedies (pulse-plasma, gravity-well, etc.) |

