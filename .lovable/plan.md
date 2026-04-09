

# Audit UX/UI/Design — Module /focus

## Etat visuel actuel (Desktop 991px + Mobile 375px)

Le module est visuellement reussi avec un fort theme cyberpunk coherent. Le timer ring, les ambient effects, et les corner brackets creent une bonne atmosphere immersive. Cependant, plusieurs problemes de confort, hierarchie visuelle et responsivite existent.

---

## Tableau Recapitulatif

| # | Zone | Probleme | Impact | Solution | Priorite |
|---|------|----------|--------|----------|----------|
| **LAYOUT & SPACING** |
| 1 | Mobile — grand espace vide | Entre le header "FOCUS_CORE" et le timer ring, il y a ~120px de vide (visible sur screenshot mobile). Le `mt-8` + le padding du header + les rotating rings creent un gap disproportionne | L'utilisateur doit scroller pour voir la toolbar, le timer ne semble pas centre | Reduire `pt-10 pb-8` du ModuleHeader a `pt-4 pb-2` sur mobile, reduire `mt-8` a `mt-4` sur mobile | 🟡 |
| 2 | Timer ring — taille fixe 320x320 SVG | Le SVG fait 320px fixe. Sur mobile 375px avec padding, ca tient mais laisse peu de marge. Sur desktop 991px, le timer parait petit par rapport a l'espace disponible | Sous-utilisation de l'espace sur desktop, manque de respiration sur mobile | Rendre le timer responsive : `w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]` avec viewBox preserve | 🟢 |
| 3 | Toolbar — coupee en bas | Les 4 boutons toolbar (Config, Spotify, Stats, History) sont partiellement hors ecran sur desktop 991x638 a cause du `pb-20` + gap accumule | L'utilisateur doit scroller pour acceder aux outils | Retirer `pb-20`, utiliser `min-h-screen` avec `justify-center` sur le conteneur flex principal pour centrer verticalement tout le contenu | 🟡 |
| 4 | Mobile — toolbar labels masques | Les labels texte des boutons toolbar ont `hidden sm:inline`, donc sur mobile on ne voit que des icones sans label | L'utilisateur ne sait pas a quoi correspondent les icones (Config vs Stats vs History = icones similaires) | Toujours afficher les labels texte (retirer `hidden sm:inline`), ou ajouter des tooltips sur mobile | 🟡 |
| **INTERACTION & AFFORDANCE** |
| 5 | Timer idle — bouton START invisible | En idle sur desktop, le bouton "INIT SYNC" n'apparait que quand on survole le centre du ring (rayon 130px). Sans hover, on voit juste "25:00" sans affordance de clic | L'utilisateur ne sait pas comment demarrer — aucun CTA visible par defaut | Afficher le bouton "INIT SYNC" par defaut en idle (pas de hover gate), ou ajouter un CTA secondaire visible sous le timer | 🔴 |
| 6 | Mobile — pas de hover = pas de controles inline | Sur mobile, `disableHoverControls=true` desactive les controles dans le ring. Les controles mobiles (`FocusControls`) n'apparaissent que quand `timer.isRunning` | Coherent mais le bouton START idle n'apparait pas non plus sur mobile car le code verifie `(hovered || disableHoverControls)` — OK en fait, ca marche. Mais les controles pendant le run sont eloignes du timer | Verifier que la logique `disableHoverControls` affiche bien le start button en idle sur mobile. Si oui, OK | 🟢 |
| 7 | Goal/Task selectors — affordance faible | Les deux selects "No goal" / "No task" utilisent des `SelectTrigger` tres petits (`h-8 text-xs`) avec des couleurs tres dim (`bg-card/60`) | Les selectors sont presque invisibles, l'utilisateur peut ne pas les remarquer | Augmenter la taille a `h-10`, ajouter une bordure plus visible, et un label "Link to:" au-dessus | 🟡 |
| 8 | Fullscreen button — quasi invisible | Le bouton fullscreen fait 28x28px, positionne dans le coin superieur droit avec opacite 40%, clipPath qui le deforme | Quasiment invisible, l'utilisateur ne le decouvre pas | Augmenter la taille a 36x36px, opacite a 60%, ajouter un tooltip | 🟢 |
| **HIERARCHIE VISUELLE** |
| 9 | Texte decoratif excessif dans le ring | Les side-labels "UPLINK: SECURE // B-R: 0/4" et "VITAL_SYNC: Nominal // N-SYNC 0%" sont ecrits en 7px, illisibles, et dupliquent l'info des side-data du frame parent | Bruit visuel sans valeur informative — double emploi avec les data streams du cadre page | Supprimer les side-labels du ring (lignes 116-125 de FocusTimerRing) — les data streams de la page suffisent | 🟢 |
| 10 | Jitter ":000" — confusion | Le suffixe `:000` en 18px a droite du timer change aleatoirement toutes les 200ms. L'utilisateur pourrait penser que c'est un compteur de millisecondes reel | Confusion sur la precision du timer | Reduire la taille a 12px, ou le remplacer par un indicateur de phase anime plus subtil | 🟢 |
| 11 | Panel container — double frame | Le panel (config/spotify/stats/history) a un `clipPath` + `border border-primary/20` + un inner `bg-black/40` + le composant enfant a aussi un `bg-card/40 border border-border/50`. Resultat = double bordure visible | Redondance visuelle, manque de nettete | Retirer la bordure/bg du composant enfant quand il est dans le panel, ou retirer le cadre du panel wrapper | 🟡 |
| **CONFORT & FEEDBACK** |
| 12 | Pas de feedback visuel au skip | Quand on skip une phase (work→break ou break→work), le flash radial est subtil (0.3 opacity pendant 0.6s) et peut etre manque | L'utilisateur ne sait pas si le skip a fonctionne | Ajouter un toast rapide "Phase skipped" ou un feedback plus marque (border flash sur le ring) | 🟡 |
| 13 | Stats panel — rounded-xl incohérent | `FocusStats` et ses `StatCard` utilisent `rounded-xl` alors que le reste du module utilise des `clipPath` polygonaux. Style mixte (arrondi vs angulaire) | Incoherence de design system — le module hesite entre "cyber angular" et "soft rounded" | Remplacer les `rounded-xl` des stats cards par des `clipPath` polygonaux coherents avec le reste du module, ou a minima utiliser `rounded-sm` | 🟡 |
| 14 | History vide — pas d'empty state | `FocusHistory` retourne `null` quand `sessions.length === 0`. L'utilisateur ouvre l'onglet History et ne voit rien | Confusion, l'utilisateur pense que c'est un bug | Afficher un empty state "No sessions yet. Start your first focus session!" | 🟡 |
| 15 | Spotify — rounded-xl incohérent | Meme probleme que #13 — `SpotifyPlayer` utilise `rounded-xl` partout | Rupture visuelle avec le theme angulaire | Aligner avec le design system cyber | 🟢 |
| **PERFORMANCE** |
| 16 | 20 FloatingParticle composants Framer Motion | Chaque particule est un `motion.div` avec 4 axes animes en boucle infinie. 20 composants = 80 animations Framer simultanées | Potentielle consommation GPU/CPU excessive, surtout sur mobile bas de gamme | Reduire a 10-12 particules, ou utiliser CSS `@keyframes` au lieu de Framer Motion pour les particules (plus performant) | 🟡 |
| 17 | SVG spin 60s infini | Le SVG du ring a une animation `spin 60s linear infinite` qui tourne le SVG entier de 320x320 en continu | Animation GPU continue meme si marginale | OK pour desktop, mais desactiver sur mobile ou quand `prefers-reduced-motion` est actif | 🟢 |
| **ACCESSIBILITE** |
| 18 | Pas d'aria-label sur les controles inline du ring | Les boutons Pause/Skip/End dans le ring hover n'ont pas d'`aria-label` | Lecteurs d'ecran ne peuvent pas identifier les boutons | Ajouter `aria-label="Pause"`, `aria-label="Skip phase"`, `aria-label="End session"` | 🟡 |
| 19 | `prefers-reduced-motion` non respecte | Les ambient effects, particules, scan lines, et pulsing vignettes tournent en permanence sans check de `prefers-reduced-motion` | Les utilisateurs sensibles aux animations sont bombardes | Ajouter un check `useReducedMotion()` de Framer et desactiver les effects si actif | 🟡 |

---

## Synthese

**🔴 Critique (1)** : Le bouton START est cache derriere un hover — aucun CTA visible en idle

**🟡 Majeur (10)** : Espace vide mobile, toolbar coupee, labels masques, selectors dim, double frame panels, pas de feedback skip, stats rounded incoherent, history empty state, 20 particules Framer, aria-labels manquants, reduced-motion

**🟢 Mineur (6)** : Timer taille fixe, fullscreen button invisible, side-labels dupliques, jitter confus, Spotify rounded, SVG spin mobile

---

## Plan d'implementation

**Phase 1 — Fix critique + layout**
1. Afficher le bouton "INIT SYNC" par defaut en idle (supprimer la condition `hovered`) — le timer affiche le CTA, le hover affiche le countdown
2. Reduire le gap mobile entre header et timer (`mt-4` au lieu de `mt-8` sur mobile)
3. Centrer verticalement le contenu et retirer `pb-20` pour eviter le scroll inutile
4. Toujours afficher les labels texte de la toolbar (retirer `hidden sm:inline`)

**Phase 2 — Coherence design**
5. Remplacer tous les `rounded-xl` dans FocusStats, StatCard, FocusConfigPanel et SpotifyPlayer par des `clipPath` polygonaux coherents avec le theme cyber
6. Supprimer les side-labels dupliques dans le ring (lignes 116-125 FocusTimerRing)
7. Retirer le double frame du panel container (simplifier a un seul niveau de bordure)
8. Ajouter un empty state dans FocusHistory quand sessions = 0

**Phase 3 — Confort et accessibilite**
9. Ajouter `aria-label` sur les 3 boutons inline du ring (Pause/Skip/End)
10. Ajouter `useReducedMotion` dans FocusAmbientEffects pour desactiver particules et scan lines
11. Reduire les particules de 20 a 12
12. Ajouter un feedback toast sur skip de phase
13. Augmenter la taille et visibilite du bouton fullscreen (36px, opacite 60%)
14. Augmenter la taille des selectors goal/task (`h-10`)

## Fichiers impactes

| Fichier | Action |
|---------|--------|
| `src/pages/Focus.tsx` | Layout, spacing, pb-20, toolbar visibility |
| `src/components/focus/FocusTimerRing.tsx` | Start button visibility, remove side-labels, aria-labels |
| `src/components/focus/FocusToolbar.tsx` | Show labels always |
| `src/components/focus/FocusStats.tsx` | clipPath cyber style |
| `src/components/focus/FocusConfigPanel.tsx` | clipPath cyber style |
| `src/components/focus/SpotifyPlayer.tsx` | clipPath cyber style |
| `src/components/focus/FocusHistory.tsx` | Empty state |
| `src/components/focus/FocusAmbientEffects.tsx` | Reduce particles, reduced-motion |

