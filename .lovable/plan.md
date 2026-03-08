
Objectif: corriger définitivement le chevauchement sur `/the-call` (hexagones + cercle “PROTOCOL LOCKED” qui remontent sous le header), sans re-ajuster des marges “au hasard”.

1) Diagnostic confirmé
- Le header est en `absolute` (hors flux).
- Le bloc central (cercle) est centré verticalement dans toute la hauteur disponible, puis compensé avec des `mt-*` statiques.
- Résultat: selon la hauteur viewport, le cercle et les hexagones entrent visuellement dans la zone du header.

2) Plan d’implémentation (robuste)
- Dans `src/pages/TheCall.tsx`, remplacer l’approche “marges fixes” par un espacement dynamique basé sur la vraie hauteur du header:
  - Ajouter un `ref` sur le conteneur header.
  - Mesurer sa hauteur via `ResizeObserver`.
  - Appliquer cette valeur comme `padding-top` du conteneur central du rituel quand le header est visible (IDLE/LOCKED).
- Supprimer les hacks actuels (`pb-14 md:pb-20`, `mt-28 md:mt-32`) pour revenir à un layout propre et stable.
- Conserver le bouton RETURN en position dédiée (top-left), mais sans impacter le calcul du chevauchement.

3) Détails techniques (section dédiée)
- Fichier: `src/pages/TheCall.tsx`
- Ajouts:
  - `const headerRef = useRef<HTMLDivElement>(null)`
  - `const [headerHeight, setHeaderHeight] = useState(0)`
  - `useEffect` + `ResizeObserver` pour recalculer en continu (resize, changement de contenu, responsive).
- Remplacement layout:
  - Header: garde son `absolute top-0 left-0 w-full`.
  - Bloc rituel: `style={{ paddingTop: isHeaderVisible ? headerHeight + GAP : 0 }}` avec `GAP` ~ 16–24px.
- Nettoyage:
  - retirer les classes de compensation verticales ajoutées précédemment.

4) Résultat attendu
- Plus aucun chevauchement entre:
  - le titre “THE CALL”
  - les hexagones STREAK/TOTAL
  - le cercle central / interface du rituel
- Comportement cohérent sur différentes tailles d’écran sans retouche manuelle.

5) Vérification après implémentation
- Tester `/the-call` en desktop et viewport plus petit:
  - état LOCKED (capture actuelle)
  - état IDLE
  - pendant transition (quand le header disparaît) pour vérifier qu’il n’y a pas de saut visuel gênant.
